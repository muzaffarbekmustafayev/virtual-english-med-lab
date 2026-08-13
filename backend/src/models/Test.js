const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Test = sequelize.define('Test', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  module_id:      { type: DataTypes.INTEGER, allowNull: false },
  question:       { type: DataTypes.TEXT, allowNull: false },
  option_a:       { type: DataTypes.STRING(255), allowNull: false },
  option_b:       { type: DataTypes.STRING(255), allowNull: false },
  option_c:       { type: DataTypes.STRING(255), allowNull: false },
  option_d:       { type: DataTypes.STRING(255), allowNull: false },
  correct_option: { type: DataTypes.CHAR(1), allowNull: false },
}, { tableName: 'tests', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Test;
