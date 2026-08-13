const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentGroup = sequelize.define('StudentGroup', {
  id:   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
}, { tableName: 'student_groups', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = StudentGroup;
