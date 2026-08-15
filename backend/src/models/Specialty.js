const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Specialty = sequelize.define('Specialty', {
  id:      { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:    { type: DataTypes.STRING(100), allowNull: false },
  name_uz: { type: DataTypes.STRING(100), allowNull: true },
  name_ru: { type: DataTypes.STRING(100), allowNull: true },
  name_en: { type: DataTypes.STRING(100), allowNull: true },
}, { tableName: 'specialties', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Specialty;
