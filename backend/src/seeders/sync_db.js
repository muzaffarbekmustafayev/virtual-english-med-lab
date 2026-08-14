const { sequelize } = require('../config/database');
const models = require('../models');

async function sync() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced with alter: true successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
}

sync();
