const { sequelize } = require('./src/config/database');
const Grammar = require('./src/models/Grammar');
const Vocabulary = require('./src/models/Vocabulary');
const Phrasebook = require('./src/models/Phrasebook');

async function sync() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // Alter tables safely
    await sequelize.sync({ alter: true });
    console.log('Tables synced with 3-language schema successfully!');

    // Populate translation_uz, translation_ru, translation_en where empty
    await sequelize.query(`
      UPDATE vocabulary 
      SET 
        translation_uz = COALESCE(translation_uz, translation),
        translation_ru = COALESCE(translation_ru, 
          CASE 
            WHEN word = 'Odontalgia' THEN 'Зубная боль'
            WHEN word = 'Hypersensitivity' THEN 'Гиперчувствительность зубов'
            WHEN word = 'Pulpitis' THEN 'Пульпит'
            WHEN word = 'Reversible Pulpitis' THEN 'Обратимый пульпит'
            WHEN word = 'Irreversible Pulpitis' THEN 'Необратимый пульпит'
            WHEN word = 'Thermal Stimulus' THEN 'Термический раздражитель'
            WHEN word = 'Percussion' THEN 'Перкуссия'
            WHEN word = 'Radiating Pain' THEN 'Иррадиирующая боль'
            WHEN word = 'Analgesic' THEN 'Обезболивающее'
            WHEN word = 'Enamel Erosion' THEN 'Эрозия эмали'
            ELSE translation
          END
        ),
        translation_en = COALESCE(translation_en, word),
        definition_uz = COALESCE(definition_uz, definition),
        definition_en = COALESCE(definition_en, definition)
      WHERE translation_uz IS NULL OR translation_ru IS NULL;
    `);

    await sequelize.query(`
      UPDATE phrasebook
      SET
        hint_ru = COALESCE(hint_ru,
          CASE
            WHEN hint_uz LIKE '%qachon%' THEN 'Спросите о начале и длительности боли'
            WHEN hint_uz LIKE '%qayer%' OR hint_uz LIKE '%joy%' THEN 'Локализация и иррадиация боли'
            WHEN hint_uz LIKE '%daraja%' OR hint_uz LIKE '%shkala%' THEN 'Оценка интенсивности боли по шкале 1-10'
            WHEN hint_uz LIKE '%sovuq%' OR hint_uz LIKE '%issi%' THEN 'Реакция на горячее или холодное'
            WHEN hint_uz LIKE '%kechasi%' OR hint_uz LIKE '%uxlash%' THEN 'Ночная боль и сон'
            ELSE hint_uz
          END
        ),
        hint_en = COALESCE(hint_en, 'Clinical consultation inquiry')
      WHERE hint_ru IS NULL;
    `);

    console.log('Sample translations populated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
}

sync();
