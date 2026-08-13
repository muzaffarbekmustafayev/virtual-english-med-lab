const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  conversation_id: { type: DataTypes.INTEGER, allowNull: false },
  sender:          { type: DataTypes.ENUM('student', 'patient'), allowNull: false },
  text_content:    { type: DataTypes.TEXT, allowNull: false },
  audio_url:       { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'messages', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Message;
