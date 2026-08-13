require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Konfiguratsiya ───────────────────────────────────────────
const TOKEN        = process.env.BOT_TOKEN;
const ADMIN_ID     = process.env.ADMIN_CHAT_ID;
const MAX_OUTPUT   = 3500;
const CMD_TIMEOUT  = parseInt(process.env.CMD_TIMEOUT_MS || '30000'); // 30 sek

if (!TOKEN || !ADMIN_ID) {
  console.error("❌ BOT_TOKEN va ADMIN_CHAT_ID .env da bo'lishi shart!");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// ── Holat ────────────────────────────────────────────────────
let cwd           = process.env.DEFAULT_CWD || process.cwd();
const cmdHistory  = [];       // oxirgi 20 ta buyruq
const pending     = new Map(); // messageId → { command, chatId }
let runningProc   = null;     // joriy ishlab turgan jarayon

// ── Yordamchi funksiyalar ────────────────────────────────────
const isAdmin = (id) => id.toString() === ADMIN_ID.toString();

const escape = (text) => text.replace(/[`*_[\]()~>#+=|{}.!\\-]/g, '\\$&');

const shortPath = (p) => p.replace(os.homedir(), '~');

const truncate = (text) => {
  if (text.length > MAX_OUTPUT) {
    return text.substring(0, MAX_OUTPUT) + '\n\n⚠️ [Natija juda uzun — qisqartirildi]';
  }
  return text;
};

const send = (chatId, text, options = {}) => {
  return bot.sendMessage(chatId, text, {
    parse_mode: 'MarkdownV2',
    ...options
  }).catch(() => {
    // Agar Markdown format xato bersa — oddiy matn sifatida yuboramiz
    return bot.sendMessage(chatId, text.replace(/[*_`[\]()~>#+=|{}.!\\-]/g, ''), options);
  });
};

const editMsg = (chatId, msgId, text) => {
  return bot.editMessageText(text, {
    chat_id: chatId,
    message_id: msgId,
    parse_mode: 'MarkdownV2'
  }).catch(() => {});
};

// ── Yordam menyusi ────────────────────────────────────────────
const HELP_TEXT = `
🤖 *Antigravity Remote Terminal Bot*

*Maxsus buyruqlar:*
\`/start\` — Botni boshlash va holat
\`/help\` — Shu menyu
\`/pwd\` — Hozirgi papka
\`/ls\` — Papka mazmuni
\`/history\` — Oxirgi 20 ta buyruq
\`/kill\` — Ishlayotgan jarayonni to'xtatish
\`/sys\` — Tizim ma'lumotlari (CPU, RAM, disk)
\`/cd <yo'l>\` — Papkani o'zgartirish

*Har qanday terminal buyrug'ingizni yuboring ✅/❌ bilan tasdiqlaysiz*
`;

// ── /start ─────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.chat.id)) return bot.sendMessage(msg.chat.id, '⛔ Ruxsat yo\'q.');
  const statusLine = `
🟢 *Bot Faol*
📂 Papka: \`${escape(shortPath(cwd))}\`
💻 Tizim: \`${escape(os.type())} ${escape(os.release())}\`
🧠 RAM: \`${Math.round(os.freemem() / 1e6)} MB bo'sh / ${Math.round(os.totalmem() / 1e6)} MB jami\`
⏱ Uptime: \`${Math.round(process.uptime())} sek\`
`;
  send(msg.chat.id, statusLine, {
    reply_markup: {
      keyboard: [
        [{ text: '/ls' }, { text: '/pwd' }, { text: '/sys' }],
        [{ text: '/history' }, { text: '/kill' }, { text: '/help' }],
      ],
      resize_keyboard: true,
      persistent: true
    }
  });
});

// ── /help ──────────────────────────────────────────────────────
bot.onText(/\/help/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  send(msg.chat.id, HELP_TEXT);
});

// ── /pwd ──────────────────────────────────────────────────────
bot.onText(/\/pwd/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  send(msg.chat.id, `📂 *Hozirgi papka:*\n\`${escape(cwd)}\``);
});

// ── /ls ───────────────────────────────────────────────────────
bot.onText(/\/ls/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  try {
    const items = fs.readdirSync(cwd, { withFileTypes: true });
    const dirs  = items.filter(i => i.isDirectory()).map(i => `📁 ${i.name}`);
    const files = items.filter(i => !i.isDirectory()).map(i => `📄 ${i.name}`);
    const all   = [...dirs, ...files].join('\n');
    send(msg.chat.id, `📂 *${escape(shortPath(cwd))}*\n\n${escape(all) || '_(bo\'sh)_'}`);
  } catch (e) {
    send(msg.chat.id, `❌ \`${escape(e.message)}\``);
  }
});

// ── /sys ──────────────────────────────────────────────────────
bot.onText(/\/sys/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  const cpus = os.cpus();
  const text = `
💻 *Tizim Ma'lumotlari*
🖥 OS: \`${escape(os.type())} ${escape(os.release())}\`
⚙️ CPU: \`${escape(cpus[0].model)}\` \\(${cpus.length} yadroli\\)
🧠 RAM: \`${Math.round(os.freemem() / 1e6)} MB bo'sh / ${Math.round(os.totalmem() / 1e6)} MB jami\`
👤 Foydalanuvchi: \`${escape(os.userInfo().username)}\`
🏠 Home: \`${escape(os.homedir())}\`
⏱ Tizim uptime: \`${Math.round(os.uptime() / 60)} daqiqa\`
`;
  send(msg.chat.id, text);
});

// ── /history ─────────────────────────────────────────────────
bot.onText(/\/history/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  if (cmdHistory.length === 0) return send(msg.chat.id, '📋 Tarix bo\'sh.');
  const list = cmdHistory.slice(-20).map((c, i) => `${i + 1}\\. \`${escape(c)}\``).join('\n');
  send(msg.chat.id, `📋 *Oxirgi buyruqlar:*\n\n${list}`);
});

// ── /kill ─────────────────────────────────────────────────────
bot.onText(/\/kill/, (msg) => {
  if (!isAdmin(msg.chat.id)) return;
  if (!runningProc) return send(msg.chat.id, '⚠️ Hozir ishlayotgan jarayon yo\'q\\.');
  try {
    process.kill(-runningProc.pid);
    runningProc = null;
    send(msg.chat.id, '🛑 Jarayon to\'xtatildi\\.');
  } catch (e) {
    send(msg.chat.id, `❌ To'xtatib bo'lmadi: \`${escape(e.message)}\``);
  }
});

// ── AI bilan buyruqni tarjima qilish (Natural Language to CLI) ──
const translateWithAI = async (text, dir) => {
  // Backend'dagi .env dan GEMINI kalitini o'qiymiz (agar bo'lsa)
  const backendEnv = path.resolve(__dirname, '../backend/.env');
  if (fs.existsSync(backendEnv)) require('dotenv').config({ path: backendEnv });
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return text;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are a smart remote terminal assistant for a Windows machine. The current working directory is: ${dir}.
The user input is: "${text}"

If the input is already a valid terminal command (like 'npm run dev', 'dir', 'ls'), return it exactly as is.
If it is natural language in Uzbek or English (e.g. "loyihani githubga push qil", "start the server"), convert it into the correct Windows terminal command (e.g. 'git add . && git commit -m "update" && git push').
Return ONLY the raw command string. No markdown formatting (\`\`\`), no explanations, nothing else.`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    });
    const data = await res.json();
    if (data.error) {
       console.error("API Xatoligi:", data.error.message);
    }
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
  } catch (err) {
    console.error("AI xatosi:", err);
  }
  return text;
};

// ── Asosiy xabarlar (terminal buyruqlari) ────────────────────
bot.on('message', async (msg) => {
  const chatId = msg.chat.id.toString();

  if (!isAdmin(chatId)) {
    return bot.sendMessage(chatId, '⛔ Kechirasiz, siz bu botdan foydalana olmaysiz.');
  }

  const text = (msg.text || '').trim();
  if (!text || text.startsWith('/')) return;

  // cd → ichki holat o'zgarishi
  if (text.startsWith('cd ')) {
    const target   = text.substring(3).trim();
    const resolved = path.resolve(cwd, target);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      cwd = resolved;
      send(chatId, `📂 Papka o'zgardi:\n\`${escape(cwd)}\``);
    } else {
      send(chatId, `❌ Papka topilmadi:\n\`${escape(resolved)}\``);
    }
    return;
  }

  // Foydalanuvchiga kuttirish xabarini beramiz
  const waitMsg = await bot.sendMessage(chatId, '⏳ _Tahlil qilinmoqda..._', { parse_mode: 'Markdown' });

  // 1. AI orqali haqiqiy buyruqqa aylantiramiz
  const finalCommand = await translateWithAI(text, cwd);

  // Tasdiqlash tizimi
  const key = msg.message_id.toString();
  pending.set(key, { text, command: finalCommand, chatId });

  bot.deleteMessage(chatId, waitMsg.message_id).catch(()=>{});

  let warning = text !== finalCommand ? `🤖 *AI taklifi:*\n` : '';

  bot.sendMessage(chatId,
    `⚠️ *Harakatni tanlang:*\n\n📂 \`${escape(shortPath(cwd))}\`\n\nSiz yozdingiz:\n\`\`\`text\n${escape(text)}\n\`\`\`\n${warning}${text !== finalCommand ? `\`\`\`bash\n${escape(finalCommand)}\n\`\`\`` : ''}`,
    {
      parse_mode: 'MarkdownV2',
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ CLI da bajarish', callback_data: `cli_${key}` }],
          [{ text: '🤖 Antigravity (AGY) ga yuborish', callback_data: `agy_${key}` }],
          [{ text: '❌ Bekor qilish', callback_data: `reject_${key}` }]
        ]
      }
    }
  );
});

// ── Callback tugmalar (Accept / Reject / AGY) ──────────────────────
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id.toString();
  if (!isAdmin(chatId)) {
    return bot.answerCallbackQuery(query.id, { text: 'Ruxsat yo\'q!', show_alert: true });
  }

  const [action, key] = query.data.split('_');
  if (!pending.has(key)) {
    return bot.answerCallbackQuery(query.id, { text: 'Eskirgan yoki topilmadi.', show_alert: true });
  }

  const { text: originalText, command: cliCommand } = pending.get(key);
  pending.delete(key);
  bot.answerCallbackQuery(query.id);

  if (action === 'reject') {
    return editMsg(chatId, query.message.message_id,
      `❌ *Bekor qilindi:*\n\`\`\`bash\n${escape(originalText)}\n\`\`\``
    );
  }

  let execCommand = cliCommand;
  let statusText = `⏳ *CLI da bajarilmoqda\\.\\.\\.*\n\`\`\`bash\n${escape(cliCommand)}\n\`\`\``;

  if (action === 'agy') {
    // AGY orqali ishga tushirish (xavfsizlik so'rovlarisiz, avvalgi sessiyani davom ettirgan holda)
    execCommand = `agy -c --dangerously-skip-permissions --print-timeout 15m -p "${originalText.replace(/"/g, '\\"')}"`;
    statusText = `🤖 *Antigravity o'ylamoqda va bajarmoqda\\.\\.\\.*\n_(Bu jarayon bir necha daqiqa olishi mumkin)_\n\nSo'rov:\n\`\`\`text\n${escape(originalText)}\n\`\`\``;
  }

  editMsg(chatId, query.message.message_id, statusText);

  cmdHistory.push(action === 'agy' ? `AGY: ${originalText}` : cliCommand);
  if (cmdHistory.length > 50) cmdHistory.shift();

  const child = exec(execCommand, {
    cwd,
    timeout: action === 'agy' ? 900000 : CMD_TIMEOUT, // AGY uchun 15 daqiqa
    detached: true
  }, (error, stdout, stderr) => {
    runningProc = null;

    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += (stdout ? '\n⚠️ STDERR:\n' : '') + stderr;
    if (!output && error) output = `Exit code: ${error.code || '?'}`;
    if (!output) output = '✅ Bajarildi (natija qaytmadi).';

    output = truncate(output);

    const reply = `✅ *Natija:*\n\`\`\`\n${escape(output)}\n\`\`\``;
    send(chatId, reply).catch(() =>
      bot.sendMessage(chatId, '⚠️ Natijani formatlashda xato. Oddiy matn:\n\n' + output.substring(0, 3500))
    );
  });

  if (child && child.pid) runningProc = child;
});

// ── Global xatolik ushlash ────────────────────────────────────
process.on('uncaughtException', (err) => console.error("💥 UncaughtException:", err));
process.on('unhandledRejection', (err) => console.error("💥 UnhandledRejection:", err));

console.log(`🤖 Antigravity Bot ishga tushdi`);
console.log(`👤 Admin ID: ${ADMIN_ID}`);
console.log(`📂 Boshlang'ich papka: ${cwd}`);
console.log(`⏱ Buyruq timeout: ${CMD_TIMEOUT}ms`);
