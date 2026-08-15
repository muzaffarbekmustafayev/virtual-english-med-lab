require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { exec }    = require('child_process');
const fs          = require('fs');
const path        = require('path');
const os          = require('os');
const http        = require('http');

// ─── Konfiguratsiya ───────────────────────────────────────────────────────────
const TOKEN          = process.env.BOT_TOKEN;
const ADMIN_ID       = process.env.ADMIN_CHAT_ID;
const MAX_OUTPUT     = 3500;
const LOCAL_API_PORT = parseInt(process.env.LOCAL_API_PORT || '7799');
let   currentDefaultCwd = process.env.DEFAULT_CWD || null;
let   autoConfirm       = process.env.AUTO_CONFIRM !== 'false'; // true: to'g'ridan-to'g'ri bajarish, false: accept/reject

if (!TOKEN || !ADMIN_ID) {
  console.error("BOT_TOKEN va ADMIN_CHAT_ID .env da bo'lishi shart!");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// ─── Mavjud AGY modellari ─────────────────────────────────────────────────────
const AVAILABLE_MODELS = [
  { id: 'gemini-3.7-flash',   label: 'Gemini 3.7 Flash',   emoji: '⚡',    desc: 'Tez va aqlli (default)', effort: 'high' },
  { id: 'gemini-3.7-pro',     label: 'Gemini 3.7 Pro',     emoji: '🚀', desc: 'Eng kuchli (yangi)',       effort: 'high' },
  { id: 'gemini-3.6-flash',   label: 'Gemini 3.6 Flash',   emoji: '🔥', desc: 'Oldingi avlod, tez',       effort: 'high' },
  { id: 'gemini-3.1-pro',     label: 'Gemini 3.1 Pro',     emoji: '🧠', desc: 'Eng kuchli model',        effort: 'high' },
  { id: 'claude-sonnet-4.6',  label: 'Claude Sonnet 4.6',  emoji: '🤖', desc: 'Anthropic Thinking',      effort: 'high' },
  { id: 'claude-opus-4.6',    label: 'Claude Opus 4.6',    emoji: '🦾', desc: 'Anthropic Opus Thinking', effort: 'high' },
  { id: 'gpt-oss-120b',       label: 'GPT-OSS 120B',       emoji: '🟢', desc: 'Open Source 120B',       effort: 'medium' },
];

const MODEL_LIMITS = {
  'gemini-3.7-flash':  { rpm: 15,  rpd: 1500, tpm: '1,000,000' },
  'gemini-3.6-flash':  { rpm: 15,  rpd: 1500, tpm: '1,000,000' },
  'gemini-3.1-pro':    { rpm: 5,   rpd: 50,   tpm: '128,000'   },
  'claude-sonnet-4.6': { rpm: 5,   rpd: 100,  tpm: '64,000'    },
  'claude-opus-4.6':   { rpm: 2,   rpd: 20,   tpm: '32,000'    },
  'gpt-oss-120b':      { rpm: 10,  rpd: 200,  tpm: '128,000'   },
};

const DEFAULT_MODEL = 'gemini-3.7-flash';
let   globalModel   = process.env.DEFAULT_MODEL || DEFAULT_MODEL;

// ─── Sessiyalar ───────────────────────────────────────────────────────────────
const sessions       = new Map();
let   sessionCounter = 0;
const activeSession  = new Map(); // chatId -> sessionId
const pendingCommands = new Map(); // msgId -> { text, cwd, model }

const createSession = (name) => {
  sessionCounter++;
  const id = 's' + sessionCounter;
  const session = {
    id,
    name:      name || ('Sessiya ' + sessionCounter),
    cwd:       currentDefaultCwd || process.cwd(),
    history:   [],
    proc:      null,
    model:     globalModel,
    isNewConv: true,
    createdAt: new Date(),
  };
  sessions.set(id, session);
  return session;
};

// ─── Yordamchi funksiyalar ────────────────────────────────────────────────────
const isAdmin  = (id)   => String(id) === String(ADMIN_ID);
const escape   = (text) => String(text || '').replace(/[`*_[\]()~>#+=|{}.!\\-]/g, '\\$&');
const shortPath = (p)   => String(p || '').replace(os.homedir(), '~');
const BT = '`';

const truncate = (text) => {
  if (!text) return '';
  if (text.length > MAX_OUTPUT)
    return text.substring(0, MAX_OUTPUT) + '\n\n[Natija qisqartirildi...]';
  return text;
};

const send = (chatId, text, options = {}) =>
  bot.sendMessage(chatId, text, Object.assign({ parse_mode: 'MarkdownV2' }, options))
    .catch(() => bot.sendMessage(chatId, text.replace(/[*_`[\]()~>#+=|{}.!\\-]/g, ''), options));

const editMsg = (chatId, msgId, text, options = {}) =>
  bot.editMessageText(text, Object.assign({
    chat_id: chatId, message_id: msgId, parse_mode: 'MarkdownV2'
  }, options)).catch(() => {});

// Windows & Linux moslashuvchan process killer
const killProcessTree = (childProc) => {
  if (!childProc || !childProc.pid) return Promise.resolve();
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${childProc.pid} /T /F`, () => resolve());
    } else {
      try {
        process.kill(-childProc.pid, 'SIGKILL');
      } catch (_) {
        try { childProc.kill('SIGKILL'); } catch (__) {}
      }
      resolve();
    }
  });
};

const isImage = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
};

// ─── Asosiy klaviatura ────────────────────────────────────────────────────────
const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '/start'    }, { text: '/sessions' }, { text: '/model'  }],
    [{ text: '/limit'    }, { text: '/screen'   }, { text: '/pwd'    }],
    [{ text: '/kill'     }, { text: '/history'  }, { text: '/sys'    }],
    [{ text: '/setcwd'   }, { text: '/get'      }, { text: '/help'   }],
  ],
  resize_keyboard: true,
  persistent: true,
};

const getModelInfo = (modelId) =>
  AVAILABLE_MODELS.find(m => m.id === modelId) ||
  { id: modelId, label: modelId, emoji: '🤖', desc: 'Maxsus model', effort: 'high' };

// ─── Sessiya klaviaturasi ─────────────────────────────────────────────────────
const buildSessionKeyboard = (chatId) => {
  const activeSid = activeSession.get(chatId.toString());
  const buttons   = [];
  for (const [sid, sess] of sessions) {
    const isAct = sid === activeSid;
    const mInfo = getModelInfo(sess.model);
    const label = (isAct ? '✅ ' : '') + sess.name + ' [' + mInfo.emoji + ' ' + mInfo.label + ']';
    buttons.push([
      { text: label,           callback_data: 'sel_' + sid   },
      { text: '✖ Yopish',     callback_data: 'close_' + sid }
    ]);
  }
  buttons.push([{ text: '➕ Yangi sessiya', callback_data: 'new_session' }]);
  return { inline_keyboard: buttons };
};

const sessionsText = (chatId) => {
  const activeSid = activeSession.get(chatId.toString());
  if (sessions.size === 0)
    return '📋 *Sessiyalar yo\'q*\n\nYangi sessiya yaratish uchun ➕ tugmani bosing\\.';
  const lines = [];
  for (const [sid, sess] of sessions) {
    const isAct  = sid === activeSid;
    const status = isAct ? '✅ *aktiv*' : '💤 kutmoqda';
    const mInfo  = getModelInfo(sess.model);
    const run    = sess.proc ? ' ⚙️ _ishlayapti_' : '';
    lines.push(status + ' — ' + BT + escape(sess.name) + BT + ' 🤖 _' + escape(mInfo.emoji + ' ' + mInfo.label) + '_' + run);
  }
  return '📋 *Mavjud sessiyalar:*\n\n' + lines.join('\n');
};

// ─── Model klaviaturasi ───────────────────────────────────────────────────────
const buildModelKeyboard = (currentModel) => {
  const rows = [];
  for (let i = 0; i < AVAILABLE_MODELS.length; i += 2) {
    const row = [];
    for (let j = i; j < Math.min(i + 2, AVAILABLE_MODELS.length); j++) {
      const m   = AVAILABLE_MODELS[j];
      const isA = m.id === currentModel;
      row.push({
        text:          (isA ? '✅ ' : '') + m.emoji + ' ' + m.label,
        callback_data: 'setmodel_' + m.id
      });
    }
    rows.push(row);
  }
  rows.push([{ text: '❌ Yopish', callback_data: 'model_close' }]);
  return { inline_keyboard: rows };
};

const modelText = (sess) => {
  const m = getModelInfo(sess.model);
  const lines = AVAILABLE_MODELS.map(x => {
    const active = x.id === sess.model ? ' ✅' : '';
    return '• *' + escape(x.emoji + ' ' + x.label) + '*' + active + ' — _' + escape(x.desc) + '_';
  });
  return (
    '🤖 *Model Tanlash*\n\n' +
    '*Hozirgi sessiya:* ' + BT + escape(sess.name) + BT + '\n' +
    '*Faol model:* ' + escape(m.emoji + ' ' + m.label) + ' — _' + escape(m.desc) + '_\n\n' +
    '*Barcha modellar:*\n' +
    lines.join('\n') + '\n\n' +
    '_Tanlash uchun tugmani bosing:_'
  );
};

// ─── Limit matni ──────────────────────────────────────────────────────────────
const buildLimitText = (chatId) => {
  const sid  = activeSession.get(chatId);
  const sess = sessions.get(sid);
  const mid  = sess ? sess.model : globalModel;
  const m    = getModelInfo(mid);
  const lim  = MODEL_LIMITS[mid] || { rpm: '?', rpd: '?', tpm: '?' };

  let totalCmds = 0;
  const sessLines = [];
  for (const [, s] of sessions) {
    totalCmds += s.history.length;
    const sm = getModelInfo(s.model);
    sessLines.push('• ' + BT + escape(s.name) + BT + ': ' + s.history.length + ' buyruq — ' + escape(sm.emoji + ' ' + sm.label));
  }

  const usedPct = typeof lim.rpd === 'number'
    ? Math.min(100, Math.round((totalCmds / lim.rpd) * 100)) : 0;
  const filled  = Math.floor(usedPct / 10);
  const bar     = '█'.repeat(filled) + '░'.repeat(10 - filled) + ' ' + usedPct + '%';

  return (
    '📊 *AGY Limit \\& Statistika*\n' +
    '━'.repeat(22) + '\n' +
    '🤖 *Model:* ' + escape(m.emoji + ' ' + m.label) + '\n' +
    '_' + escape(m.desc) + '_\n\n' +
    '📈 *Taxminiy Limitlar \\(' + escape(mid) + '\\):*\n' +
    '⚡ RPM: ' + BT + String(lim.rpm) + BT + ' so\'rov/daqiqa\n' +
    '📅 RPD: ' + BT + String(lim.rpd) + BT + ' so\'rov/kun\n' +
    '🔤 TPM: ' + BT + String(lim.tpm) + BT + ' token/daqiqa\n\n' +
    '📊 *Bugungi Ishlatish:*\n' +
    '🔢 Jami buyruqlar: ' + BT + String(totalCmds) + BT + '\n' +
    '🧮 Taxminiy tokenlar: ' + BT + '~' + String(totalCmds * 500) + BT + '\n' +
    '📉 Limit: ' + BT + '[' + bar + ']' + BT + '\n\n' +
    '💻 *Sessiyalar:*\n' +
    (sessLines.length > 0 ? sessLines.join('\n') : '_Sessiya yo\'q_') + '\n\n' +
    '⚠️ _Limitlar taxminiy\\. Haqiqiy limitlar Google/Anthropic tomonidan belgilanadi_\n' +
    '━'.repeat(22) + '\n' +
    '💡 Model o\'zgartirish: /model'
  );
};

// ─── BUYRUQLARNI BAJARISH LOGIKASI ───────────────────────────────────────────
const executeAgyCommand = (chatId, text, sess, originalMsgId = null) => {
  const currentModel = sess.model || globalModel;
  const mInfo        = getModelInfo(currentModel);
  const effortVal    = mInfo.effort || 'high';
  const modelFlag    = '--model "' + currentModel + '" --effort ' + effortVal;

  const agyContinue  = !sess.isNewConv;
  sess.isNewConv     = false;

  const safeText    = text.replace(/\\/g, '/').replace(/"/g, '\\"');
  const safeCwd     = sess.cwd.replace(/\\/g, '/');
  const execCommand = (
    'agy ' + (agyContinue ? '-c ' : '') +
    modelFlag +
    ' --dangerously-skip-permissions --mode accept-edits --print-timeout 15m' +
    ' -p "MUHIM: Faqat AMAL qil. Reja tuzma. Ishchi jild: ' + safeCwd + '.' +
    ' TELEGRAM API: curl.exe -s \\"http://127.0.0.1:' + LOCAL_API_PORT + '/send-file\\"' +
    ' -G --data-urlencode \\"file=TO\'LIQ_YO\'L\\".' +
    ' Xabar: curl.exe -s \\"http://127.0.0.1:' + LOCAL_API_PORT + '/send-msg\\"' +
    ' -G --data-urlencode \\"text=XABAR\\".' +
    ' Foydalanuvchi: ' + safeText + '"'
  );

  const modelBadge = escape(mInfo.emoji + ' ' + mInfo.label);
  const statusText = '⏳ *' + escape(sess.name) + '* \\[' + modelBadge + '\\]: bajarilmoqda\\.\\.\\.';

  const sendPromise = originalMsgId
    ? bot.sendMessage(chatId, statusText, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: originalMsgId,
        reply_markup: {
          inline_keyboard: [[
            { text: '🛑 To\'xtatish', callback_data: 'kill_' + sess.id },
            { text: '🤖 Model',      callback_data: 'open_models'    },
            { text: '📊 Limit',      callback_data: 'refresh_limit'  },
          ]]
        }
      })
    : bot.sendMessage(chatId, statusText, { parse_mode: 'MarkdownV2' });

  sendPromise.then(sentMsg => {
    sess.history.push(text);
    if (sess.history.length > 50) sess.history.shift();

    const child = exec(execCommand, {
      cwd:     sess.cwd,
      timeout: 900000,
      detached: process.platform !== 'win32'
    }, (error, stdout, stderr) => {
      sess.proc = null;

      let output = '';
      if (stdout)           output += stdout;
      if (stderr)           output += (stdout ? '\nSTDERR:\n' : '') + stderr;
      if (!output && error) output  = 'Exit code: ' + (error.code || '?');
      if (!output)          output  = 'Bajarildi (javob matni bo\'sh).';

      output = truncate(output);
      editMsg(chatId, sentMsg.message_id, '✅ *' + escape(sess.name) + '* \\[' + modelBadge + '\\]: yakunlandi\\.');

      const reply = '✅ *' + escape(sess.name) + ' \\[' + modelBadge + '\\] — Natija:*\n```\n' + escape(output) + '\n```';
      send(chatId, reply, originalMsgId ? { reply_to_message_id: originalMsgId } : {}).catch(() =>
        bot.sendMessage(chatId, 'Natija:\n\n' + output.substring(0, 3500))
      );
    });

    if (child && child.pid) sess.proc = child;
  }).catch(e => console.error('Xabar yuborishda xato:', e));
};

// ─── Direct Shell Execution (!cmd) ───────────────────────────────────────────
const executeRawShell = (chatId, cmdText, sess, msgId) => {
  const statusText = '⚙️ *Shell buyrug\'i bajarilmoqda:* ' + BT + escape(cmdText) + BT;
  bot.sendMessage(chatId, statusText, { parse_mode: 'MarkdownV2', reply_to_message_id: msgId })
    .then(sentMsg => {
      const child = exec(cmdText, { cwd: sess.cwd, timeout: 60000 }, (err, stdout, stderr) => {
        sess.proc = null;
        let out = stdout || '';
        if (stderr) out += (out ? '\nSTDERR:\n' : '') + stderr;
        if (err && !out) out = 'Error code: ' + err.code + '\n' + err.message;
        if (!out) out = '(Chiqish yo\'q - buyruq muvaffaqiyatli bajarildi)';

        out = truncate(out);
        editMsg(chatId, sentMsg.message_id, '✅ *Shell:* ' + BT + escape(cmdText) + BT + ' yakunlandi\\.');
        const reply = '💻 *Shell Chiqishi:*\n```\n' + escape(out) + '\n```';
        send(chatId, reply, { reply_to_message_id: msgId });
      });
      if (child && child.pid) sess.proc = child;
    });
};

// ─── /start ───────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.chat.id)) return bot.sendMessage(msg.chat.id, 'Ruxsat yo\'q.');

  if (!currentDefaultCwd) {
    return send(msg.chat.id,
      '🤖 *Antigravity Bot ishga tushdi\\!*\n\n⚠️ Ishchi jild belgilanmagan\\.\n/setcwd buyrug\'idan foydalaning:\n\n' +
      BT + '/setcwd C:\\\\Users\\\\muzaf\\\\Desktop\\\\virtual-english-med-lab' + BT
    );
  }

  if (sessions.size === 0) {
    const sess = createSession('Asosiy sessiya');
    activeSession.set(msg.chat.id.toString(), sess.id);
  }

  const sid   = activeSession.get(msg.chat.id.toString());
  const sess  = sessions.get(sid);
  const mInfo = getModelInfo(sess ? sess.model : globalModel);

  const statusLine = (
    '\n🤖 *Antigravity Remote Terminal Control*\n' +
    '━'.repeat(22) + '\n' +
    '📁 Jild: ' + BT + escape(shortPath(currentDefaultCwd)) + BT + '\n' +
    '🤖 Model: ' + BT + escape(mInfo.emoji + ' ' + mInfo.label) + BT + '\n' +
    '🛡️ Tasdiqlash: ' + BT + (autoConfirm ? 'Avto (Tezkor)' : 'Qo\'lda (Accept/Reject)') + BT + '\n' +
    '💻 OS: ' + BT + escape(os.type()) + ' ' + escape(os.release()) + BT + '\n' +
    '📊 RAM: ' + BT + Math.round(os.freemem() / 1e6) + ' MB / ' + Math.round(os.totalmem() / 1e6) + ' MB' + BT + '\n' +
    '⏱ Uptime: ' + BT + Math.round(process.uptime()) + ' sek' + BT + '\n' +
    '━'.repeat(22) + '\n'
  );

  send(msg.chat.id, statusLine, { reply_markup: MAIN_KEYBOARD });
});

// ─── /sessions ────────────────────────────────────────────────────────────────
bot.onText(/\/sessions/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  bot.sendMessage(chatId, sessionsText(chatId), {
    parse_mode:   'MarkdownV2',
    reply_markup: buildSessionKeyboard(chatId)
  });
});

// ─── /model ───────────────────────────────────────────────────────────────────
bot.onText(/\/model/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  let sid  = activeSession.get(chatId);
  let sess = sessions.get(sid);
  if (!sess) {
    sess = createSession('Asosiy sessiya');
    activeSession.set(chatId, sess.id);
  }
  bot.sendMessage(chatId, modelText(sess), {
    parse_mode:   'MarkdownV2',
    reply_markup: buildModelKeyboard(sess.model)
  });
});

// ─── /limit ───────────────────────────────────────────────────────────────────
bot.onText(/\/limit/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  send(chatId, buildLimitText(chatId), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔄 Yangilash',     callback_data: 'refresh_limit' },
          { text: '🤖 Model tanlash', callback_data: 'open_models'   },
        ]
      ]
    }
  });
});

// ─── /confirm (Toggle auto-confirm vs Accept/Reject) ──────────────────────────
bot.onText(/\/confirm/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  autoConfirm = !autoConfirm;
  send(msg.chat.id,
    '🛡️ *Buyruq bajarish rejimi:* ' +
    BT + (autoConfirm ? 'To\'g\'ridan-to\'g\'ri (Auto)' : 'Tasdiqlash bilan (Accept/Reject)') + BT +
    '\n\n_Rejimni o\'zgartirish uchun yana /confirm buyrug\'ini yuboring\\._'
  );
});

// ─── /screen (Take Puppeteer Browser Screenshot) ──────────────────────────────
bot.onText(/^\/screen(.*)$/, async (msg, match) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  let targetUrl = (match[1] || '').trim() || 'http://127.0.0.1:5173';

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'http://' + targetUrl;
  }

  const waitMsg = await bot.sendMessage(chatId, '📸 *Skrinshot olinmoqda:* ' + BT + escape(targetUrl) + BT + '\\.\\.\\.', { parse_mode: 'MarkdownV2' });

  try {
    const puppeteer = require('puppeteer-core');
    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      process.env.CHROME_PATH
    ].filter(Boolean);

    const edgePath = edgePaths.find(p => fs.existsSync(p));
    if (!edgePath) throw new Error('Microsoft Edge yoki Chrome browser topilmadi');

    const browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: true,
      defaultViewport: { width: 1440, height: 950, deviceScaleFactor: 2 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1000));

    const outPath = path.join(os.tmpdir(), `screen_${Date.now()}.png`);
    await page.screenshot({ path: outPath });
    await browser.close();

    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
    await bot.sendPhoto(chatId, outPath, {
      caption: '📸 *Screen:* ' + BT + escape(targetUrl) + BT,
      parse_mode: 'MarkdownV2'
    });
  } catch (err) {
    editMsg(chatId, waitMsg.message_id, '❌ *Skrinshot xatosi:* ' + BT + escape(err.message) + BT);
  }
});

// ─── /help ────────────────────────────────────────────────────────────────────
bot.onText(/\/help/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const help = (
    '🚀 *Antigravity Remote Terminal Bot*\n\n' +
    '*Asosiy buyruqlar:*\n' +
    BT + '/start' + BT + '    — Bot holati va menyu\n' +
    BT + '/sessions' + BT + ' — Sessiyalarni boshqarish\n' +
    BT + '/model' + BT + '    — AI modelni almashtirish ⭐\n' +
    BT + '/limit' + BT + '    — Limitlar va statistika 📊\n' +
    BT + '/screen' + BT + '   — Brauzerdan skrinshot olish 📸\n' +
    BT + '/confirm' + BT + '  — Accept/Reject rejimini yoqish/o\'chirish\n' +
    BT + '/setcwd' + BT + '   — Ishchi jildni o\'zgartirish\n' +
    BT + '/get' + BT + '      — Faylni Telegram orqali yuklab olish\n\n' +
    '*Terminal buyruqlari:*\n' +
    BT + '!buyruq' + BT + '   — Shell buyrug\'ini to\'g\'ridan-to\'g\'ri bajarish \\(masalan: !dir, !git status\\)\n' +
    BT + '/pwd' + BT + '      — Hozirgi jild yo\'li\n' +
    BT + '/ls' + BT + '       — Jild tarkibi\n' +
    BT + '/history' + BT + '  — Buyruqlar tarixi\n' +
    BT + '/kill' + BT + '     — Ishlayotgan jarayonni to\'xtatish\n' +
    BT + '/sys' + BT + '      — CPU, RAM va tizim holati\n\n' +
    '_Matn yuborsangiz, aktiv sessiyaga Antigravity AI orqali yuboriladi\\._'
  );
  send(msg.chat.id, help);
});

// ─── /setcwd ──────────────────────────────────────────────────────────────────
bot.onText(/^\/setcwd(.*)$/, (msg, match) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const arg    = (match[1] || '').trim();

  if (!arg) {
    return send(chatId,
      '📁 *Hozirgi default jild:*\n' + BT + escape(currentDefaultCwd || '(belgilanmagan)') + BT + '\n\n_O\'zgartirish uchun: /setcwd <yangi yo\'l>_'
    );
  }

  const resolved = path.resolve(arg);
  if (!fs.existsSync(resolved))
    return send(chatId, '❌ Papka topilmadi:\n' + BT + escape(resolved) + BT);
  if (!fs.statSync(resolved).isDirectory())
    return send(chatId, '❌ Bu papka emas:\n' + BT + escape(resolved) + BT);

  const old         = currentDefaultCwd;
  currentDefaultCwd = resolved;

  // .env faylga saqlab qo'yish
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('DEFAULT_CWD=')) {
        envContent = envContent.replace(/DEFAULT_CWD=.*/g, `DEFAULT_CWD=${resolved}`);
      } else {
        envContent += `\nDEFAULT_CWD=${resolved}`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    }
  } catch (_) {}

  send(chatId,
    '✅ *Default jild o\'zgartirildi va saqlandi\\!*\n\n' +
    '📁 Eski: ' + BT + escape(shortPath(old || '?')) + BT + '\n' +
    '📁 Yangi: ' + BT + escape(shortPath(currentDefaultCwd)) + BT
  );
});

// ─── /pwd ─────────────────────────────────────────────────────────────────────
bot.onText(/\/pwd/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const sess   = sessions.get(activeSession.get(chatId));
  if (!sess) return send(chatId, '⚠️ Aktiv sessiya yo\'q\\. /sessions orqali tanlang\\.');
  send(chatId, '📁 *' + escape(sess.name) + '* papkasi:\n' + BT + escape(sess.cwd) + BT);
});

// ─── /ls ──────────────────────────────────────────────────────────────────────
bot.onText(/\/ls/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const sess   = sessions.get(activeSession.get(chatId));
  if (!sess) return send(chatId, '⚠️ Aktiv sessiya yo\'q\\. /sessions orqali tanlang\\.');
  try {
    const items = fs.readdirSync(sess.cwd, { withFileTypes: true });
    const dirs  = items.filter(i => i.isDirectory()).map(i => '📁 ' + i.name);
    const files = items.filter(i => !i.isDirectory()).map(i => '📄 ' + i.name);
    const all   = [...dirs, ...files].join('\n');
    send(chatId, '📁 *' + escape(shortPath(sess.cwd)) + '*\n\n' + escape(all || '(bo\'sh)'));
  } catch (e) {
    send(chatId, '❌ ' + BT + escape(e.message) + BT);
  }
});

// ─── /sys ─────────────────────────────────────────────────────────────────────
bot.onText(/\/sys/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const cpus = os.cpus();
  send(msg.chat.id,
    '⚙️ *Tizim Ma\'lumotlari*\n' +
    '🖥 OS: ' + BT + escape(os.type()) + ' ' + escape(os.release()) + BT + '\n' +
    '🧠 CPU: ' + BT + escape(cpus[0].model) + BT + ' \\(' + cpus.length + ' yadroli\\)\n' +
    '📊 RAM: ' + BT + Math.round(os.freemem() / 1e6) + ' MB bo\'sh / ' + Math.round(os.totalmem() / 1e6) + ' MB jami' + BT + '\n' +
    '👤 User: ' + BT + escape(os.userInfo().username) + BT + '\n' +
    '🏠 Home: ' + BT + escape(os.homedir()) + BT + '\n' +
    '⏱ Uptime: ' + BT + Math.round(os.uptime() / 60) + ' daqiqa' + BT
  );
});

// ─── /history ─────────────────────────────────────────────────────────────────
bot.onText(/\/history/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const sess   = sessions.get(activeSession.get(chatId));
  if (!sess) return send(chatId, '⚠️ Aktiv sessiya yo\'q\\.');
  if (!sess.history.length) return send(chatId, '📜 *' + escape(sess.name) + '*: tarix bo\'sh\\.');
  const list = sess.history.slice(-20).map((c, i) => (i + 1) + '\\. ' + BT + escape(c) + BT).join('\n');
  send(chatId, '📜 *' + escape(sess.name) + ' — So\'nggi buyruqlar:*\n\n' + list);
});

// ─── /kill ────────────────────────────────────────────────────────────────────
bot.onText(/\/kill/, async (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const sess   = sessions.get(activeSession.get(chatId));
  if (!sess)      return send(chatId, '⚠️ Aktiv sessiya yo\'q\\.');
  if (!sess.proc) return send(chatId, '⚠️ *' + escape(sess.name) + '*: ishlayotgan jarayon yo\'q\\.');
  
  await killProcessTree(sess.proc);
  sess.proc = null;
  send(chatId, '🛑 *' + escape(sess.name) + '*: jarayon to\'xtatildi\\.');
});

// ─── /get ─────────────────────────────────────────────────────────────────────
bot.onText(/^\/get(.*)$/, async (msg, match) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const arg    = (match[1] || '').trim();

  if (!arg) {
    const base = currentDefaultCwd ? shortPath(currentDefaultCwd) : '~';
    return send(chatId,
      '📤 *Fayl yuklab olish:*\n\n' + BT + '/get <fayl yo\'li>' + BT +
      '\n\n_Nisbiy yo\'l uchun asos: ' + BT + escape(base) + BT + '_'
    );
  }

  const sid     = activeSession.get(chatId);
  const sess    = sessions.get(sid);
  const baseCwd = (sess && sess.cwd) || currentDefaultCwd || process.cwd();
  const filePath = path.isAbsolute(arg) ? arg : path.resolve(baseCwd, arg);

  if (!fs.existsSync(filePath))
    return send(chatId, '❌ Fayl topilmadi:\n' + BT + escape(filePath) + BT);
  if (fs.statSync(filePath).isDirectory())
    return send(chatId, '❌ Bu papka, fayl emas:\n' + BT + escape(filePath) + BT);

  const size = fs.statSync(filePath).size;
  if (size > 50 * 1024 * 1024)
    return send(chatId, '❌ Fayl juda katta \\(' + Math.round(size / 1024 / 1024) + ' MB\\)\\. Telegram 50MB gacha ruxsat beradi\\.');

  try {
    if (isImage(filePath) && size < 10 * 1024 * 1024) {
      await bot.sendPhoto(chatId, filePath, {
        caption: '📸 ' + BT + escape(path.basename(filePath)) + BT,
        parse_mode: 'MarkdownV2'
      });
    } else {
      await bot.sendDocument(chatId, filePath, {
        caption: '📄 ' + BT + escape(path.basename(filePath)) + BT,
        parse_mode: 'MarkdownV2'
      });
    }
  } catch (e) {
    send(chatId, '❌ Yuborishda xato: ' + BT + escape(e.message) + BT);
  }
});

// ─── Asosiy xabarlar (Message Listener) ───────────────────────────────────────
bot.on('message', async (msg) => {
  const chatId = msg.chat.id.toString();
  if (!isAdmin(chatId))
    return bot.sendMessage(chatId, 'Kechirasiz, siz bu botdan foydalana olmaysiz.');

  const text = (msg.text || '').trim();
  if (!text || text.startsWith('/')) return;

  let sid  = activeSession.get(chatId);
  let sess = sessions.get(sid);

  if (!sess) {
    sess = createSession('Asosiy sessiya');
    activeSession.set(chatId, sess.id);
    sid = sess.id;
  }

  if (!currentDefaultCwd)
    return send(chatId, '⚠️ Ishchi jild belgilanmagan\\. /setcwd buyrug\'ini ishlating\\.');

  // Direct shell command (!dir, !npm test)
  if (text.startsWith('!') || text.startsWith('$')) {
    const rawCmd = text.substring(1).trim();
    return executeRawShell(chatId, rawCmd, sess, msg.message_id);
  }

  // cd directory change
  if (text.startsWith('cd ')) {
    const target   = text.substring(3).trim();
    const resolved = path.resolve(sess.cwd, target);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      sess.cwd = resolved;
      send(chatId, '📁 *' + escape(sess.name) + '*: papka o\'zgardi\n' + BT + escape(sess.cwd) + BT);
    } else {
      send(chatId, '❌ Papka topilmadi:\n' + BT + escape(resolved) + BT);
    }
    return;
  }

  // Agar qo'lda tasdiqlash yoqilgan bo'lsa (Accept / Reject)
  if (!autoConfirm) {
    const cmdId = 'cmd_' + Date.now();
    pendingCommands.set(cmdId, { text, sess, originalMsgId: msg.message_id });

    return bot.sendMessage(chatId,
      '🛡️ *Buyruq tasdiqlash uchun kutilmoqda:*\n```\n' + escape(text) + '\n```\n' +
      '📁 Jild: ' + BT + escape(shortPath(sess.cwd)) + BT,
      {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Accept (Bajarish)',   callback_data: 'accept_' + cmdId },
            { text: '❌ Reject (Bekor qilish)', callback_data: 'reject_' + cmdId },
          ]]
        }
      }
    );
  }

  // To'g'ridan-to'g'ri bajarish
  executeAgyCommand(chatId, text, sess, msg.message_id);
});

// ─── Callback tugmalar ────────────────────────────────────────────────────────
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id.toString();
  if (!isAdmin(chatId))
    return bot.answerCallbackQuery(query.id, { text: 'Ruxsat yo\'q!', show_alert: true });

  const data = query.data;

  // Accept buyrug'i
  if (data.startsWith('accept_')) {
    const cmdId = data.substring(7);
    const pending = pendingCommands.get(cmdId);
    if (!pending) {
      return bot.answerCallbackQuery(query.id, { text: 'Buyruq muddati o\'tgan!', show_alert: true });
    }
    pendingCommands.delete(cmdId);
    bot.answerCallbackQuery(query.id, { text: 'Bajarilmoqda...' });
    bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
    return executeAgyCommand(chatId, pending.text, pending.sess, pending.originalMsgId);
  }

  // Reject buyrug'i
  if (data.startsWith('reject_')) {
    const cmdId = data.substring(7);
    pendingCommands.delete(cmdId);
    bot.answerCallbackQuery(query.id, { text: 'Buyruq bekor qilindi!' });
    return bot.editMessageText('❌ *Buyruq bekor qilindi\\.*', {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'MarkdownV2'
    }).catch(() => {});
  }

  // Yangi sessiya
  if (data === 'new_session') {
    const sess = createSession();
    activeSession.set(chatId, sess.id);
    bot.answerCallbackQuery(query.id, { text: sess.name + ' yaratildi!' });
    return bot.editMessageText(sessionsText(chatId), {
      chat_id: chatId, message_id: query.message.message_id,
      parse_mode: 'MarkdownV2', reply_markup: buildSessionKeyboard(chatId)
    }).catch(() => {});
  }

  // Sessiya tanlash
  if (data.startsWith('sel_')) {
    const sid = data.substring(4);
    if (!sessions.has(sid))
      return bot.answerCallbackQuery(query.id, { text: 'Sessiya topilmadi!', show_alert: true });
    activeSession.set(chatId, sid);
    const sess = sessions.get(sid);
    bot.answerCallbackQuery(query.id, { text: sess.name + ' tanlandi' });
    return bot.editMessageText(sessionsText(chatId), {
      chat_id: chatId, message_id: query.message.message_id,
      parse_mode: 'MarkdownV2', reply_markup: buildSessionKeyboard(chatId)
    }).catch(() => {});
  }

  // Sessiyani yopish
  if (data.startsWith('close_')) {
    const sid  = data.substring(6);
    const sess = sessions.get(sid);
    if (!sess)
      return bot.answerCallbackQuery(query.id, { text: 'Sessiya topilmadi!', show_alert: true });
    if (sess.proc) { await killProcessTree(sess.proc); }
    const name = sess.name;
    sessions.delete(sid);
    if (activeSession.get(chatId) === sid) {
      const first = sessions.keys().next().value;
      first ? activeSession.set(chatId, first) : activeSession.delete(chatId);
    }
    bot.answerCallbackQuery(query.id, { text: name + ' yopildi' });
    return bot.editMessageText(sessionsText(chatId), {
      chat_id: chatId, message_id: query.message.message_id,
      parse_mode: 'MarkdownV2', reply_markup: buildSessionKeyboard(chatId)
    }).catch(() => {});
  }

  // Jarayonni to'xtatish
  if (data.startsWith('kill_')) {
    const sid  = data.substring(5);
    const sess = sessions.get(sid);
    if (!sess)
      return bot.answerCallbackQuery(query.id, { text: 'Sessiya topilmadi!', show_alert: true });
    if (!sess.proc)
      return bot.answerCallbackQuery(query.id, { text: 'Jarayon tugagan.', show_alert: true });
    
    await killProcessTree(sess.proc);
    sess.proc = null;
    bot.answerCallbackQuery(query.id, { text: 'Jarayon to\'xtatildi!' });
    editMsg(chatId, query.message.message_id,
      (query.message.text || '') + '\n\n🛑 JARAYON TO\'XTATILDI'
    );
    return;
  }

  // Model oynasini ochish
  if (data === 'open_models') {
    let sid  = activeSession.get(chatId);
    let sess = sessions.get(sid);
    if (!sess) {
      sess = createSession('Asosiy sessiya');
      activeSession.set(chatId, sess.id);
    }
    bot.answerCallbackQuery(query.id);
    return bot.sendMessage(chatId, modelText(sess), {
      parse_mode:   'MarkdownV2',
      reply_markup: buildModelKeyboard(sess.model)
    });
  }

  // Model o'rnatish
  if (data.startsWith('setmodel_')) {
    const modelId = data.substring(9);
    const mInfo   = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (!mInfo)
      return bot.answerCallbackQuery(query.id, { text: 'Model topilmadi!', show_alert: true });

    let sid  = activeSession.get(chatId);
    let sess = sessions.get(sid);
    if (!sess) {
      sess = createSession('Asosiy sessiya');
      activeSession.set(chatId, sess.id);
    }

    sess.model  = modelId;
    globalModel = modelId;

    bot.answerCallbackQuery(query.id, { text: mInfo.emoji + ' ' + mInfo.label + ' tanlandi!' });
    return bot.editMessageText(modelText(sess), {
      chat_id:      chatId,
      message_id:   query.message.message_id,
      parse_mode:   'MarkdownV2',
      reply_markup: buildModelKeyboard(sess.model)
    }).catch(() => {
      send(chatId, '✅ *Model o\'zgartirildi\\!*\n' + escape(mInfo.emoji + ' ' + mInfo.label) + ' — _' + escape(mInfo.desc) + '_');
    });
  }

  // Model yopish
  if (data === 'model_close') {
    bot.answerCallbackQuery(query.id);
    return bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
  }

  // Limit yangilash
  if (data === 'refresh_limit') {
    bot.answerCallbackQuery(query.id, { text: 'Yangilanmoqda...' });
    return bot.editMessageText(buildLimitText(chatId), {
      chat_id:    chatId,
      message_id: query.message.message_id,
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Yangilash',     callback_data: 'refresh_limit' },
          { text: '🤖 Model tanlash', callback_data: 'open_models'   },
        ]]
      }
    }).catch(() => {});
  }
});

// ─── Global xatoliklar ────────────────────────────────────────────────────────
process.on('uncaughtException',  (e) => console.error('UncaughtException:',  e));
process.on('unhandledRejection', (e) => console.error('UnhandledRejection:', e));

// ─── Local HTTP API (POST & GET, JSON & URLENCODED) ───────────────────────────
const parseRequestBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (_) {
        try {
          resolve(Object.fromEntries(new URLSearchParams(body)));
        } catch (__) {
          resolve({});
        }
      }
    });
    req.on('error', () => resolve({}));
  });
};

const localApiServer = http.createServer(async (req, res) => {
  const parsed   = new URL(req.url, 'http://127.0.0.1:' + LOCAL_API_PORT);
  const endpoint = parsed.pathname;
  const queryParams = Object.fromEntries(parsed.searchParams);
  const bodyParams  = await parseRequestBody(req);
  const params      = Object.assign({}, queryParams, bodyParams);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (endpoint === '/send-file') {
    const filePath = params.file;
    if (!filePath) { res.writeHead(400); return res.end(JSON.stringify({ ok: false, error: 'file parametri yo\'q' })); }
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(currentDefaultCwd || process.cwd(), filePath);
    if (!fs.existsSync(absPath)) { res.writeHead(404); return res.end(JSON.stringify({ ok: false, error: 'Fayl topilmadi: ' + absPath })); }
    
    try {
      const caption = params.caption || path.basename(absPath);
      const stats   = fs.statSync(absPath);

      if (isImage(absPath) && stats.size < 10 * 1024 * 1024) {
        await bot.sendPhoto(ADMIN_ID, absPath, { caption });
      } else {
        await bot.sendDocument(ADMIN_ID, absPath, { caption });
      }
      res.writeHead(200); res.end(JSON.stringify({ ok: true, sent: absPath }));
    } catch (e) {
      res.writeHead(500); res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  if (endpoint === '/send-msg') {
    const text = params.text || '(xabar yo\'q)';
    try {
      await bot.sendMessage(ADMIN_ID, text);
      res.writeHead(200); res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(500); res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  res.writeHead(404); res.end(JSON.stringify({ ok: false, error: 'Noma\'lum endpoint' }));
});

localApiServer.listen(LOCAL_API_PORT, '127.0.0.1', () =>
  console.log('Local API: http://127.0.0.1:' + LOCAL_API_PORT)
);

console.log('Antigravity Multi-Session Bot ishga tushdi');
console.log('Admin ID: ' + ADMIN_ID);
console.log('Default model: ' + globalModel);
console.log('Default jild: ' + (currentDefaultCwd || '(belgilanmagan)'));
