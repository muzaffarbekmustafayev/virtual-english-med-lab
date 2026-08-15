const { sequelize } = require('./src/config/database');

async function syncMultilingualColumns() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const queries = [
      // Vocabularies
      "ALTER TABLE vocabularies ADD COLUMN translation_uz VARCHAR(255) NULL;",
      "ALTER TABLE vocabularies ADD COLUMN translation_ru VARCHAR(255) NULL;",
      "ALTER TABLE vocabularies ADD COLUMN translation_en VARCHAR(255) NULL;",
      "ALTER TABLE vocabularies ADD COLUMN definition_uz TEXT NULL;",
      "ALTER TABLE vocabularies ADD COLUMN definition_ru TEXT NULL;",
      "ALTER TABLE vocabularies ADD COLUMN definition_en TEXT NULL;",

      // Phrasebooks
      "ALTER TABLE phrasebooks ADD COLUMN translation_uz VARCHAR(255) NULL;",
      "ALTER TABLE phrasebooks ADD COLUMN translation_ru VARCHAR(255) NULL;",
      "ALTER TABLE phrasebooks ADD COLUMN translation_en VARCHAR(255) NULL;",
      "ALTER TABLE phrasebooks ADD COLUMN hint_uz TEXT NULL;",
      "ALTER TABLE phrasebooks ADD COLUMN hint_ru TEXT NULL;",
      "ALTER TABLE phrasebooks ADD COLUMN hint_en TEXT NULL;",

      // Modules
      "ALTER TABLE modules ADD COLUMN title_uz VARCHAR(150) NULL;",
      "ALTER TABLE modules ADD COLUMN title_ru VARCHAR(150) NULL;",
      "ALTER TABLE modules ADD COLUMN title_en VARCHAR(150) NULL;",
      "ALTER TABLE modules ADD COLUMN description_uz TEXT NULL;",
      "ALTER TABLE modules ADD COLUMN description_ru TEXT NULL;",
      "ALTER TABLE modules ADD COLUMN description_en TEXT NULL;",

      // Specialties
      "ALTER TABLE specialties ADD COLUMN name_uz VARCHAR(100) NULL;",
      "ALTER TABLE specialties ADD COLUMN name_ru VARCHAR(100) NULL;",
      "ALTER TABLE specialties ADD COLUMN name_en VARCHAR(100) NULL;"
    ];

    for (const q of queries) {
      try {
        await sequelize.query(q);
        console.log('Executed:', q);
      } catch (e) {
        if (e.original && e.original.errno === 1060) {
          console.log('Column already exists, skipping.');
        } else {
          console.warn('Query info:', e.message);
        }
      }
    }

    console.log('Schema sync completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

syncMultilingualColumns();
