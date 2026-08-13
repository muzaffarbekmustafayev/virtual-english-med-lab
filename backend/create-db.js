// Bu script MySQL'da database yaratadi, keyin o'chirib yuborishingiz mumkin
require('dotenv').config();
const mysql2 = require('mysql2/promise');

async function createDatabase() {
  let connection;
  try {
    // DB_NAME siz ulanish
    connection = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });

    const dbName = process.env.DB_NAME || 'virtual_patient_db';
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database "${dbName}" muvaffaqiyatli yaratildi`);
    console.log('Endi "npm run seed" buyrug\'ini ishlatishingiz mumkin');
  } catch (err) {
    console.error('❌ Xato:', err.message);
    console.log('\nEhtimol MySQL server ishlamayapti yoki parol noto\'g\'ri.');
    console.log('XAMPP da MySQL ni ishga tushirib, .env faylini to\'ldirib qayta urining.');
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

createDatabase();
