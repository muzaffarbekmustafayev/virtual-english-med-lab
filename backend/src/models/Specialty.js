const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Specialty = sequelize.define('Specialty', {
  id:      { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:    { type: DataTypes.STRING(100), allowNull: false },
  name_uz: { type: DataTypes.STRING(100), allowNull: true },
  name_ru: { type: DataTypes.STRING(100), allowNull: true },
  name_en: { type: DataTypes.STRING(100), allowNull: true },
  code:    { type: DataTypes.STRING(30),  allowNull: true },   // GEN_MED | STOM | PED | NURSING | FIRST_AID (datas.json kaliti)
  icon:    { type: DataTypes.STRING(10),  allowNull: true },   // emoji, UI uchun
  student_role: { type: DataTypes.STRING(20), allowNull: true }, // doctor | dentist | nurse — virtual bemor simulyatsiyasida talaba roli
}, { tableName: 'specialties', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Specialty;
