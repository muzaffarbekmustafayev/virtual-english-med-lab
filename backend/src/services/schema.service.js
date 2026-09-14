const { sequelize } = require('../config/database');

/**
 * Additive schema migrations.
 *
 * `sequelize.sync()` only creates missing TABLES; it never adds columns to
 * existing ones, and `sync({ alter: true })` is unsafe on MySQL (it re-adds
 * unique indexes on every run). So the handful of columns introduced after the
 * first production deploy are added here explicitly — safe to call on every boot.
 */
const REQUIRED_COLUMNS = () => {
  const { DataTypes } = sequelize.Sequelize;
  return [
    ['specialties', 'code',               DataTypes.STRING(30)],
    ['specialties', 'icon',               DataTypes.STRING(10)],
    ['specialties', 'student_role',       DataTypes.STRING(20)],
    ['modules',     'grammar_focus',      DataTypes.STRING(255)],
    ['modules',     'reference_dialogue', DataTypes.JSON],
    ['vocabulary',  'pronunciation',      DataTypes.STRING(255)],
    ['phrasebook',  'pronunciation',      DataTypes.STRING(255)],
    ['phrasebook',  'patient_response',    DataTypes.TEXT],
    ['phrasebook',  'patient_response_uz', DataTypes.TEXT],
    ['phrasebook',  'patient_response_ru', DataTypes.TEXT],
  ];
};

/**
 * @param {{checkOnly?: boolean, log?: (msg: string) => void}} opts
 * @returns {Promise<number>} number of columns added (or missing, when checkOnly)
 */
async function ensureColumns({ checkOnly = false, log = () => {} } = {}) {
  const qi = sequelize.getQueryInterface();
  const described = {};
  let count = 0;
  for (const [table, column, type] of REQUIRED_COLUMNS()) {
    if (!(table in described)) {
      try { described[table] = await qi.describeTable(table); } catch (_) { described[table] = null; }
    }
    if (!described[table] || described[table][column]) continue;
    count++;
    if (checkOnly) { log(`   (kerak) ${table}.${column}`); continue; }
    await qi.addColumn(table, column, { type, allowNull: true });
    log(`   + ${table}.${column}`);
  }
  return count;
}

module.exports = { ensureColumns };
