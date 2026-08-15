const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Module = sequelize.define('Module', {
  id:                      { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  specialty_id:            { type: DataTypes.INTEGER, allowNull: false },
  title:                   { type: DataTypes.STRING(150), allowNull: false },
  title_uz:                { type: DataTypes.STRING(150), allowNull: true },
  title_ru:                { type: DataTypes.STRING(150), allowNull: true },
  title_en:                { type: DataTypes.STRING(150), allowNull: true },
  description:             { type: DataTypes.TEXT, allowNull: true },
  description_uz:          { type: DataTypes.TEXT, allowNull: true },
  description_ru:          { type: DataTypes.TEXT, allowNull: true },
  description_en:          { type: DataTypes.TEXT, allowNull: true },
  patient_context:         { type: DataTypes.TEXT, allowNull: false },
  final_challenge_context: { type: DataTypes.TEXT, allowNull: false },
  order_index:             { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'modules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Module;
