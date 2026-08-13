const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TestResult = sequelize.define('TestResult', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  module_id:  { type: DataTypes.INTEGER, allowNull: false },
  score:      { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'test_results', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = TestResult;
