const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Specialty = sequelize.define('Specialty', {
  id:   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
}, { tableName: 'specialties', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Specialty;
