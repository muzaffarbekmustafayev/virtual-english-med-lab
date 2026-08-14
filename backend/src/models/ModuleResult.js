const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ModuleResult = sequelize.define('ModuleResult', {
  id:                 { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  student_id:         { type: DataTypes.INTEGER, allowNull: false },
  module_id:          { type: DataTypes.INTEGER, allowNull: false },
  best_chat_score:    { type: DataTypes.INTEGER, defaultValue: 0 },
  best_quiz_score:    { type: DataTypes.INTEGER, defaultValue: 0 },
  combined_score:     { type: DataTypes.INTEGER, defaultValue: 0 },
  best_grammar:       { type: DataTypes.INTEGER, defaultValue: 0 },
  best_vocab:         { type: DataTypes.INTEGER, defaultValue: 0 },
  best_fluency:       { type: DataTypes.INTEGER, defaultValue: 0 },
  best_pronunciation: { type: DataTypes.INTEGER, defaultValue: 0 },
  best_clinical:      { type: DataTypes.INTEGER, defaultValue: 0 },
  attempts_count:     { type: DataTypes.INTEGER, defaultValue: 0 },
  is_completed:       { type: DataTypes.BOOLEAN, defaultValue: false },
  last_attempt_at:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'module_results',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ModuleResult;
