require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Konfiguratsiya ───────────────────────────────────────────────────────────
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_CHAT_ID;
const MAX_OUTPUT = 3500;
const DEFAULT_CWD = process.env.DEFAULT_CWD || process.cwd();

if (!TOKEN || !ADMIN_ID) {
  console.error("❌ BOT_TOKEN va ADMIN_CHAT_ID .env da bo'lishi shart!");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// ─── Sessiyalar ───────────────────────────────────────────────────────────────
// sessions: Map<sessionId, { name, cwd, agy_conv_id, history[], proc, createdAt }>
const sessions = new Map();
let sessionCounter = 0;

// Har bir user uchun aktiv sessiya
const activeSession = new Map(); // chatId -> sessionId

const createSession = (name = null) => {
  sessionCounter++;
  const id = `s${sessionCounter}`;
  const session = {
    id,
    name: name || `Sessiya ${sessionCounter}`,
    cwd: DEFAULT_CWD,
    history: [],
    proc: null,
    isNewConv: true,         // birinchi ishga tushirishda yangi sessiya
    createdAt: new Date()
  };
  sessions.set(id, session);
  return session;
};

// ─── Yordamchi funksiyalar ─────────────────────────────────────────────────────
const isAdmin = (id) => id.toString() === ADMIN_ID.toString();

const escape = (text) => String(text).replace(/[`*_[\]()~>#+=|{}.!\\-]/g, '\\$&');

const shortPath = (p) => String(p).replace(os.homedir(), '~');

const truncate = (text) => {
  if (text.length > MAX_OUTPUT) {
    return text.substring(0, MAX_OUTPUT) + '\n\n⚠️ [Natija qisqartirildi]';
  }
  return text;
};

const send = (chatId, text, options = {}) => {
  return bot.sendMessage(chatId, text, {
    parse_mode: 'MarkdownV2',
    ...options
  }).catch(() => {
    return bot.sendMessage(chatId, text.replace(/[*_`[\]()~>#+=|{}.!\\-]/g, ''), options);
  });
};

const editMsg = (chatId, msgId, text, options = {}) => {
  return bot.editMessageText(text, {
    chat_id: chatId,
    message_id: msgId,
    parse_mode: 'MarkdownV2',
    ...options
  }).catch(() => { });
};

// ─── Sessiya tugmalari ─────────────────────────────────────────────────────────
const buildSessionKeyboard = (chatId) => {
  const activeSid = activeSession.get(chatId.toString());
  const buttons = [];

  for (const [sid, sess] of sessions) {
    const isActive = sid === activeSid;
    const label = `${isActive ? '✅ ' : ''}${sess.name}`;
    buttons.push([
      { text: label, callback_data: `sel_${sid}` },
      { text: '✖ Yopish', callback_data: `close_${sid}` }
    ]);
  }

  buttons.push([{ text: '➕ Yangi sessiya', callback_data: 'new_session' }]);
  return { inline_keyboard: buttons };
};

const sessionsText = (chatId) => {
  const activeSid = activeSession.get(chatId.toString());
  if (sessions.size === 0) {
    return `📋 *Sessiyalar yo'q*\n\nYangi sessiya yaratish uchun ➕ tugmani bosing\\.`;
  }
  const lines = [];
  for (const [sid, sess] of sessions) {
    const isActive = sid === activeSid;
    const status = isActive ? '✅ *aktiv*' : '💤 kutmoqda';
    const running = sess.proc ? ' ⚙️ _ishlayapti_' : '';
    lines.push(`${status} — \`${escape(sess.name)}\`${running}`);
  }
  return `📋 *Mavjud sessiyalar:*\n\n${lines.join('\n')}`;
};

// ─── /start ───────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.chat.id)) return bot.sendMessage(msg.chat.id, '🚫 Ruxsat yo\'q.');

  // Agar hech sessiya yo'q bo'lsa — bitta yaratib activ qilamiz
  if (sessions.size === 0) {
    const sess = createSession('Asosiy sessiya');
    activeSession.set(msg.chat.id.toString(), sess.id);
  }

  const statusLine = `
🤖 *Antigravity Bot Faol*
📁 Jild: \`${escape(shortPath(DEFAULT_CWD))}\`
💻 Tizim: \`${escape(os.type())} ${escape(os.release())}\`
📊 RAM: \`${Math.round(os.freemem() / 1e6)} MB / ${Math.round(os.totalmem() / 1e6)} MB\`
⏱ Uptime: \`${Math.round(process.uptime())} sek\`
`;

  send(msg.chat.id, statusLine, {
    reply_markup: {
      keyboard: [
        [{ text: '/sessions' }, { text: '/kill' }, { text: '/help' }],
        [{ text: '/ls' }, { text: '/pwd' }, { text: '/sys' }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  });
});

// ─── /sessions ─────────────────────────────────────────────────────────────────
bot.onText(/\/sessions/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  bot.sendMessage(chatId, sessionsText(chatId), {
    parse_mode: 'MarkdownV2',
    reply_markup: buildSessionKeyboard(chatId)
  });
});

// ─── /help ────────────────────────────────────────────────────────────────────
bot.onText(/\/help/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const help = `
🚀 *Antigravity Remote Terminal Bot*

*Buyruqlar:*
\`/start\` — Botni boshlash
\`/sessions\` — Sessiyalar ro'yxati va boshqaruv
\`/pwd\` — Hozirgi papka \\(aktiv sessiya\\)
\`/ls\` — Papka mazmuni
\`/history\` — So'nggi buyruqlar
\`/kill\` — Aktiv sessiya jarayonini to'xtatish
\`/sys\` — Tizim ma'lumotlari
\`/cd <yo'l>\` — Papkani o'zgartirish

*Xabar yuborsangiz, aktiv sessiyaga AGY orqali yuboriladi*
`;
  send(msg.chat.id, help);
});

// ─── /pwd ─────────────────────────────────────────────────────────────────────
bot.onText(/\/pwd/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const sid = activeSession.get(chatId);
  const sess = sessions.get(sid);
  if (!sess) return send(chatId, '⚠️ Aktiv sessiya yo\'q\\. /sessions orqali tanlang\\.');
  send(chatId, `📁 *${escape(sess.name)}* papkasi:\n\`${escape(sess.cwd)}\``);
});

// ─── /ls ──────────────────────────────────────────────────────────────────────
bot.onText(/\/ls/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const sid = activeSession.get(chatId);
  const sess = sessions.get(sid);
  if (!sess) return send(chatId, '⚠️ Aktiv sessiya yo\'q\\. /sessions orqali tanlang\\.');
  try {
    const items = fs.readdirSync(sess.cwd, { withFileTypes: true });
    const dirs = items.filter(i => i.isDirectory()).map(i => `📁 ${i.name}`);
    const files = items.filter(i => !i.isDirectory()).map(i => `📄 ${i.name}`);
    const all = [...dirs, ...files].join('\n');
    send(chatId, `📁 *${escape(shortPath(sess.cwd))}*\n\n${escape(all) || '_(bo\'sh)_'}`);
  } catch (e) {
    send(chatId, `❌ \`${escape(e.message)}\``);
  }
});

// ─── /sys ─────────────────────────────────────────────────────────────────────
bot.onText(/\/sys/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const cpus = os.cpus();
  const text = `
⚙️ *Tizim Ma'lumotlari*
🖥 OS: \`${escape(os.type())} ${escape(os.release())}\`
🧠 CPU: \`${escape(cpus[0].model)}\` \\(${cpus.length} yadroli\\)
📊 RAM: \`${Math.round(os.freemem() / 1e6)} MB bo'sh / ${Math.round(os.totalmem() / 1e6)} MB jami\`
👤 Foydalanuvchi: \`${escape(os.userInfo().username)}\`
🏠 Home: \`${escape(os.homedir())}\`
⏱ Tizim uptime: \`${Math.round(os.uptime() / 60)} daqiqa\`
`;
  send(msg.chat.id, text);
});

// ─── /history ─────────────────────────────────────────────────────────────────
bot.onText(/\/history/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const sid = activeSession.get(chatId);
  const sess = sessions.get(sid);
  if (!sess) return send(chatId, '⚠️ Aktiv sessiya yo\'q\\.');
  if (sess.history.length === 0) return send(chatId, `📜 *${escape(sess.name)}*: tarix bo'sh\\.`);
  const list = sess.history.slice(-20).map((c, i) => `${i + 1}\\. \`${escape(c)}\``).join('\n');
  send(chatId, `📜 *${escape(sess.name)} — So'nggi buyruqlar:*\n\n${list}`);
});

// ─── /kill ────────────────────────────────────────────────────────────────────
bot.onText(/\/kill/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const chatId = msg.chat.id.toString();
  const sid = activeSession.get(chatId);
  const sess = sessions.get(sid);
  if (!sess) return send(chatId, '⚠️ Aktiv sessiya yo\'q\\.');
  if (!sess.proc) return send(chatId, `⚠️ *${escape(sess.name)}*: ishlayotgan jarayon yo'q\\.`);
  try {
    process.kill(-sess.proc.pid);
    sess.proc = null;
    send(chatId, `🛑 *${escape(sess.name)}*: jarayon to'xtatildi\\.`);
  } catch (e) {
    send(chatId, `❌ To'xtatib bo'lmadi: \`${escape(e.message)}\``);
  }
});

// ─── Asosiy xabarlar ──────────────────────────────────────────────────────────
bot.on('message', async (msg) => {
  const chatId = msg.chat.id.toString();
  if (!isAdmin(chatId)) {
    return bot.sendMessage(chatId, '🚫 Kechirasiz, siz bu botdan foydalana olmaysiz.');
  }

  const text = (msg.text || '').trim();
  if (!text || text.startsWith('/')) return;

  // Aktiv sessiyani olamiz
  let sid = activeSession.get(chatId);
  let sess = sessions.get(sid);

  if (!sess) {
    // Sessiya yo'q — yangi yaratamiz
    sess = createSession('Asosiy sessiya');
    activeSession.set(chatId, sess.id);
    sid = sess.id;
  }

  // cd — ichki yo'nalish o'zgarishi
  if (text.startsWith('cd ')) {
    const target = text.substring(3).trim();
    const resolved = path.resolve(sess.cwd, target);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      sess.cwd = resolved;
      send(chatId, `📁 *${escape(sess.name)}*: papka o'zgardi\n\`${escape(sess.cwd)}\``);
    } else {
      send(chatId, `❌ Papka topilmadi:\n\`${escape(resolved)}\``);
    }
    return;
  }

  // AGY buyrug'i
  const systemPrompt = `[TIZIM BUYRUG'I: Hozirgi ishchi jild - ${sess.cwd}. Foydalanuvchi so'roviga ko'ra BARCHA turdagi fayllar (kod, matn, rasm, konfiguratsiya, md, json, yaml, env, csv va boshqalar) bilan ishlash, o'qish, yozish, o'zgartirish mumkin. Hech qanday fayl turiga cheklov yo'q. Zarur bo'lsa boshqa jildlarga ham kira olasiz. Vazifani darhol bajaring, savol va tasdiqlash so'ramang. Qisqa hisobot bering.]\n\nFoydalanuvchi: `;

  const agyContinue = !sess.isNewConv;
  sess.isNewConv = false;
  const execCommand = `agy ${agyContinue ? '-c ' : ''}--dangerously-skip-permissions --mode accept-edits --print-timeout 15m -p "MUHIM: Faqat AMAL qil. Reja tuzma, hisobot berma, tayyorligingni e'lon qilma. Birinchi qadam - to'g'ridan-to'g'ri vazifani bajar. Ishchi jild: ${sess.cwd.replace(/\\/g, '/')}. Foydalanuvchi buyrug'i: ${text.replace(/"/g, '\\"')}"`;


  const statusText = `⏳ *${escape(sess.name)}: bajarilmoqda\\.\\.\\.*`;

  bot.sendMessage(chatId, statusText, {
    parse_mode: 'MarkdownV2',
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛑 To\'xtatish', callback_data: `kill_${sid}` }]
      ]
    }
  }).then(sentMsg => {
    sess.history.push(text);
    if (sess.history.length > 50) sess.history.shift();

    const child = exec(execCommand, {
      cwd: sess.cwd,
      timeout: 900000,
      detached: true
    }, (error, stdout, stderr) => {
      sess.proc = null;

      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += (stdout ? '\n⚠️ STDERR:\n' : '') + stderr;
      if (!output && error) output = `Exit code: ${error.code || '?'}`;
      if (!output) output = '✅ Bajarildi (natija qaytmadi).';

      output = truncate(output);

      // Status xabarini yangilaymiz (tugmasiz)
      editMsg(chatId, sentMsg.message_id, statusText);

      const reply = `✅ *${escape(sess.name)} — Natija:*\n\`\`\`\n${escape(output)}\n\`\`\``;
      send(chatId, reply, { reply_to_message_id: msg.message_id }).catch(() =>
        bot.sendMessage(chatId, `⚠️ Natijani formatlashda xato:\n\n${output.substring(0, 3500)}`)
      );
    });

    if (child && child.pid) sess.proc = child;
  }).catch(e => console.error("Xabar yuborishda xato:", e));
});

// ─── Callback tugmalar ────────────────────────────────────────────────────────
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id.toString();
  if (!isAdmin(chatId)) {
    return bot.answerCallbackQuery(query.id, { text: 'Ruxsat yo\'q!', show_alert: true });
  }

  const data = query.data;

  // ── Yangi sessiya ──
  if (data === 'new_session') {
    const sess = createSession();
    activeSession.set(chatId, sess.id);
    bot.answerCallbackQuery(query.id, { text: `✅ ${sess.name} yaratildi va tanlandi!` });
    return bot.editMessageText(sessionsText(chatId), {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'MarkdownV2',
      reply_markup: buildSessionKeyboard(chatId)
    }).catch(() => {});
  }

  // ── Sessiya tanlash ──
  if (data.startsWith('sel_')) {
    const sid = data.substring(4);
    if (!sessions.has(sid)) {
      return bot.answerCallbackQuery(query.id, { text: 'Sessiya topilmadi!', show_alert: true });
    }
    activeSession.set(chatId, sid);
    const sess = sessions.get(sid);
    bot.answerCallbackQuery(query.id, { text: `✅ ${sess.name} tanlandi` });
    return bot.editMessageText(sessionsText(chatId), {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'MarkdownV2',
      reply_markup: buildSessionKeyboard(chatId)
    }).catch(() => {});
  }

  // ── Sessiyani yopish ──
  if (data.startsWith('close_')) {
    const sid = data.substring(6);
    const sess = sessions.get(sid);
    if (!sess) {
      return bot.answerCallbackQuery(query.id, { text: 'Sessiya topilmadi!', show_alert: true });
    }
    // Jarayonni to'xtatamiz
    if (sess.proc) {
      try { process.kill(-sess.proc.pid); } catch (_) {}
    }
    const closedName = sess.name;
    sessions.delete(sid);

    // Agar aktiv sessiya bu bo'lsa — birinchi mavjudni tanlaymiz
    if (activeSession.get(chatId) === sid) {
      const first = sessions.keys().next().value;
      if (first) {
        activeSession.set(chatId, first);
      } else {
        activeSession.delete(chatId);
      }
    }

    bot.answerCallbackQuery(query.id, { text: `🗑 ${closedName} yopildi` });
    return bot.editMessageText(sessionsText(chatId), {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'MarkdownV2',
      reply_markup: buildSessionKeyboard(chatId)
    }).catch(() => {});
  }

  // ── Jarayonni to'xtatish (xabar tugmasi) ──
  if (data.startsWith('kill_')) {
    const sid = data.substring(5);
    const sess = sessions.get(sid);
    if (!sess) {
      return bot.answerCallbackQuery(query.id, { text: 'Sessiya topilmadi!', show_alert: true });
    }
    if (!sess.proc) {
      return bot.answerCallbackQuery(query.id, { text: 'Jarayon allaqachon tugagan.', show_alert: true });
    }
    try {
      process.kill(-sess.proc.pid);
      sess.proc = null;
      bot.answerCallbackQuery(query.id, { text: '🛑 Jarayon to\'xtatildi!' });
      editMsg(chatId, query.message.message_id,
        query.message.text + '\n\n🛑 *JARAYON TO\'XTATILDI*'
      );
    } catch (e) {
      bot.answerCallbackQuery(query.id, { text: `❌ Xato: ${e.message}`, show_alert: true });
    }
  }
});

// ─── Global xatolik ───────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => console.error("⚙️ UncaughtException:", err));
process.on('unhandledRejection', (err) => console.error("⚙️ UnhandledRejection:", err));

console.log(`🚀 Antigravity Multi-Session Bot ishga tushdi`);
console.log(`👤 Admin ID: ${ADMIN_ID}`);
console.log(`📁 Default jild: ${DEFAULT_CWD}`);
