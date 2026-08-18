const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Test = sequelize.define('Test', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  module_id:      { type: DataTypes.INTEGER, allowNull: false },
  
  // Multilingual Question
  question:       { type: DataTypes.TEXT, allowNull: false },
  question_uz:    { type: DataTypes.TEXT, allowNull: true },
  question_ru:    { type: DataTypes.TEXT, allowNull: true },
  question_en:    { type: DataTypes.TEXT, allowNull: true },
  
  // Multilingual Option A
  option_a:       { type: DataTypes.STRING(255), allowNull: false },
  option_a_uz:    { type: DataTypes.STRING(255), allowNull: true },
  option_a_ru:    { type: DataTypes.STRING(255), allowNull: true },
  option_a_en:    { type: DataTypes.STRING(255), allowNull: true },

  // Multilingual Option B
  option_b:       { type: DataTypes.STRING(255), allowNull: false },
  option_b_uz:    { type: DataTypes.STRING(255), allowNull: true },
  option_b_ru:    { type: DataTypes.STRING(255), allowNull: true },
  option_b_en:    { type: DataTypes.STRING(255), allowNull: true },

  // Multilingual Option C
  option_c:       { type: DataTypes.STRING(255), allowNull: false },
  option_c_uz:    { type: DataTypes.STRING(255), allowNull: true },
  option_c_ru:    { type: DataTypes.STRING(255), allowNull: true },
  option_c_en:    { type: DataTypes.STRING(255), allowNull: true },

  // Multilingual Option D
  option_d:       { type: DataTypes.STRING(255), allowNull: false },
  option_d_uz:    { type: DataTypes.STRING(255), allowNull: true },
  option_d_ru:    { type: DataTypes.STRING(255), allowNull: true },
  option_d_en:    { type: DataTypes.STRING(255), allowNull: true },

  correct_option: { type: DataTypes.CHAR(1), allowNull: false },

  // Multilingual Explanation
  explanation:    { type: DataTypes.TEXT, allowNull: true },
  explanation_uz: { type: DataTypes.TEXT, allowNull: true },
  explanation_ru: { type: DataTypes.TEXT, allowNull: true },
  explanation_en: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'tests', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Test;
