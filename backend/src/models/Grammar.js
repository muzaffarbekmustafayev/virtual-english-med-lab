const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Grammar = sequelize.define('Grammar', {
  id:                  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  module_id:           { type: DataTypes.INTEGER, allowNull: false },
  title:               { type: DataTypes.STRING(150), allowNull: false },
  title_uz:            { type: DataTypes.STRING(150), allowNull: true },
  title_ru:            { type: DataTypes.STRING(150), allowNull: true },
  title_en:            { type: DataTypes.STRING(150), allowNull: true },
  rule_explanation:    { type: DataTypes.TEXT, allowNull: true },
  rule_explanation_uz: { type: DataTypes.TEXT, allowNull: true },
  rule_explanation_ru: { type: DataTypes.TEXT, allowNull: true },
  rule_explanation_en: { type: DataTypes.TEXT, allowNull: true },
  structure_pattern:   { type: DataTypes.STRING(255), allowNull: true },
  structure_pattern_uz:{ type: DataTypes.STRING(255), allowNull: true },
  structure_pattern_ru:{ type: DataTypes.STRING(255), allowNull: true },
  structure_pattern_en:{ type: DataTypes.STRING(255), allowNull: true },
  examples:            { type: DataTypes.JSON, allowNull: true },
  common_mistakes:     { type: DataTypes.JSON, allowNull: true },
  step_order:          { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'grammars',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Grammar;
