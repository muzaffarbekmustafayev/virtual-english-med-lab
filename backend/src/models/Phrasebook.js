const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Phrasebook = sequelize.define('Phrasebook', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  module_id:  { type: DataTypes.INTEGER, allowNull: false },
  category:   { type: DataTypes.STRING(100), allowNull: false },
  phrase:         { type: DataTypes.STRING(255), allowNull: false },
  hint_uz:        { type: DataTypes.TEXT, allowNull: true },
  hint_ru:        { type: DataTypes.TEXT, allowNull: true },
  hint_en:        { type: DataTypes.TEXT, allowNull: true },
  translation_uz: { type: DataTypes.STRING(255), allowNull: true },
  translation_ru: { type: DataTypes.STRING(255), allowNull: true },
  translation_en: { type: DataTypes.STRING(255), allowNull: true },
  step_order:     { type: DataTypes.INTEGER, defaultValue: 1 },
}, { tableName: 'phrasebook', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Phrasebook;
