const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  full_name:     { type: DataTypes.STRING(150), allowNull: false },
  email:         { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role:          { type: DataTypes.ENUM('student', 'teacher', 'admin'), defaultValue: 'student' },
  specialty_id:  { type: DataTypes.INTEGER, allowNull: true },
  group_id:      { type: DataTypes.INTEGER, allowNull: true },
  current_level: { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = User;
