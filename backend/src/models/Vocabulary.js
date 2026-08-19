const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vocabulary = sequelize.define('Vocabulary', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  module_id:   { type: DataTypes.INTEGER, allowNull: false },
  word:           { type: DataTypes.TEXT, allowNull: false },
  translation:    { type: DataTypes.TEXT, allowNull: true },
  translation_uz: { type: DataTypes.TEXT, allowNull: true },
  translation_ru: { type: DataTypes.TEXT, allowNull: true },
  translation_en: { type: DataTypes.TEXT, allowNull: true },
  definition:     { type: DataTypes.TEXT, allowNull: true },
  definition_uz:  { type: DataTypes.TEXT, allowNull: true },
  definition_ru:  { type: DataTypes.TEXT, allowNull: true },
  definition_en:  { type: DataTypes.TEXT, allowNull: true },
  example:        { type: DataTypes.TEXT, allowNull: true },
  audio_url:      { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'vocabulary', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Vocabulary;
