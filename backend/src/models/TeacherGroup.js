const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeacherGroup = sequelize.define('TeacherGroup', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  group_id:   { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'teacher_groups', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = TeacherGroup;
