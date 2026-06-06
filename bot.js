const TelegramBot = require('node-telegram-bot-api');

// ⚙️ TOKEN ni shu yerga qo'ying
const TOKEN = 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(TOKEN, { polling: true });

// 🎮 O'yin tanlovlari
const CHOICES = {
  '🪨 Tosh':    'tosh',
  '✂️ Qaychi':  'qaychi',
  '📄 Qog\'oz': 'qogoz',
};

// 🏆 G'alaba mantiq
// wins[A][B] = true => A yutadi B ni
const wins = {
  tosh:   { qaychi: true },
  qaychi: { qogoz:  true },
  qogoz:  { tosh:   true },
};

// Emoji lar
const EMOJI = {
  tosh:   '🪨',
  qaychi: '✂️',
  qogoz:  '📄',
};

// Foydalanuvchi statistikasi
const stats = {};

function getStats(userId) {
  if (!stats[userId]) stats[userId] = { wins: 0, losses: 0, draws: 0 };
  return stats[userId];
}

// Bot tanlovini random olish
function botChoice() {
  const keys = Object.keys(wins);
  return keys[Math.floor(Math.random() * keys.length)];
}

// Natija aniqlash
function getResult(player, bot_) {
  if (player === bot_)          return 'draw';
  if (wins[player]?.[bot_])     return 'win';
  return 'loss';
}

// Natija matni
function resultText(result) {
  if (result === 'win')  return '🎉 Siz yutdingiz!';
  if (result === 'loss') return '😢 Bot yutdi!';
  return '🤝 Durrang!';
}

// O'yin klaviaturasi
function gameKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['🪨 Tosh', '✂️ Qaychi', '📄 Qog\'oz'],
        ['📊 Statistika', '❓ Yordam'],
      ],
      resize_keyboard: true,
    }
  };
}

// ───────────────────────────────────────────
// /start
// ───────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || 'Do\'st';
  bot.sendMessage(msg.chat.id,
`👋 Salom, *${name}*\\! 

🎮 *Tosh — Qaychi — Qog\\'oz* o\\'yiniga xush kelibsiz\\!

Quyidagi tugmalardan birini tanlang va bot bilan o\\'ynang\\:

🪨 *Tosh* — Qaychini yutadi
✂️ *Qaychi* — Qog\\'ozni yutadi  
📄 *Qog\\'oz* — Toshni yutadi

Omad\\! 🍀`,
    { parse_mode: 'MarkdownV2', ...gameKeyboard() }
  );
});

// ───────────────────────────────────────────
// /help
// ───────────────────────────────────────────
bot.onText(/\/help/, (msg) => sendHelp(msg.chat.id));
bot.onText(/❓ Yordam/, (msg) => sendHelp(msg.chat.id));

function sendHelp(chatId) {
  bot.sendMessage(chatId,
`📖 *Yordam*

🎮 *Qanday o\\'ynash:*
Klaviaturadan 🪨 Tosh, ✂️ Qaychi yoki 📄 Qog\\'oz ni tanlang\\.

📜 *Qoidalar:*
• 🪨 Tosh ✂️ Qaychini yutadi
• ✂️ Qaychi 📄 Qog\\'ozni yutadi
• 📄 Qog\\'oz 🪨 Toshni yutadi

📊 Statistikani ko\\'rish uchun: /stats

🔄 O\\'yinni qayta boshlash: /start`,
    { parse_mode: 'MarkdownV2', ...gameKeyboard() }
  );
}

// ───────────────────────────────────────────
// Statistika
// ───────────────────────────────────────────
bot.onText(/\/stats/, (msg) => sendStats(msg));
bot.onText(/📊 Statistika/, (msg) => sendStats(msg));

function sendStats(msg) {
  const s = getStats(msg.from.id);
  const total = s.wins + s.losses + s.draws;
  const winRate = total > 0 ? Math.round((s.wins / total) * 100) : 0;

  bot.sendMessage(msg.chat.id,
`📊 *Sizning statistikangiz*

🏆 G\\'alabalar\\:  *${s.wins}*
💀 Mag\\'lubiyat\\: *${s.losses}*
🤝 Durranglar\\:  *${s.draws}*
📈 Jami o\\'yinlar\\: *${total}*

⚡ G\\'alaba foizi\\: *${winRate}%*

${winRate >= 60 ? '🔥 Zo\'r natija! Davom eting!' : winRate >= 40 ? '💪 Yaxshi, lekin yaxshiroq bo\'lishi mumkin!' : '😅 Mashq qilish kerak!'}`,
    { parse_mode: 'MarkdownV2', ...gameKeyboard() }
  );
}

// ───────────────────────────────────────────
// 🎮 O'YIN — asosiy mantiq
// ───────────────────────────────────────────
bot.on('message', (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Buyruq yoki tugma bo'lmasa chiqib ket
  const playerKey = Object.keys(CHOICES).find(k => text === k);
  if (!playerKey) return;

  const playerChoice = CHOICES[playerKey];
  const botPick      = botChoice();
  const result       = getResult(playerChoice, botPick);
  const s            = getStats(userId);

  // Statistika yangilash
  if (result === 'win')  s.wins++;
  if (result === 'loss') s.losses++;
  if (result === 'draw') s.draws++;

  // Animatsiya matni
  const countdown = `3️⃣  2️⃣  1️⃣  🎲`;

  // Natija xabari
  const lines = [
    countdown,
    '',
    `👤 Siz:  *${EMOJI[playerChoice]} ${playerChoice.toUpperCase()}*`,
    `🤖 Bot:  *${EMOJI[botPick]} ${botPick.toUpperCase()}*`,
    '',
    '━━━━━━━━━━━━━━━━━',
    `*${resultText(result)}*`,
    '━━━━━━━━━━━━━━━━━',
    '',
    `🏆 ${s.wins}  💀 ${s.losses}  🤝 ${s.draws}`,
  ];

  // Escape MarkdownV2
  function escMD(str) {
    return str.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }

  const safeLines = lines.map(l => escMD(l));

  bot.sendMessage(chatId, safeLines.join('\n'), {
    parse_mode: 'MarkdownV2',
    ...gameKeyboard()
  });
});

console.log('🤖 Bot ishga tushdi!');
