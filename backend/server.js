require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL ulanish muvaffaqiyatli');

    // Sync all models (alter: true - mavjud jadvallarni o'zgartirmaydi, faqat yangilarini qo'shadi)
    await sequelize.sync();
    console.log('✅ Barcha jadvallar sinxronlashtirildi');

    // Auto-seed admin@gmail.com / admin123 and base host data
    const { ensureDefaultSeedData } = require('./src/services/initDb.service');
    await ensureDefaultSeedData();

    const { WebSocketServer } = require('ws');
    const { setupLiveAudioWebSocket } = require('./src/services/liveAudio.service');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
      console.log(`📋 Muhit: ${process.env.NODE_ENV || 'development'}`);
    });

    const wss = new WebSocketServer({ server });
    setupLiveAudioWebSocket(wss);
    console.log('🔌 WebSocket server tayyor');
  } catch (error) {
    console.error('❌ Server ishga tushmadi:', error.message || error);
    if (error.original) console.error('  Asl xato:', error.original.message || error.original);
    process.exit(1);
  }
}

startServer();
