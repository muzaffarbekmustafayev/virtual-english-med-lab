const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ForumMessage = sequelize.define('ForumMessage', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sender_id:    { type: DataTypes.INTEGER, allowNull: false },
  message_text: { type: DataTypes.TEXT, allowNull: true },
  channel:      { type: DataTypes.STRING, defaultValue: 'general' },
  reply_to_id:  { type: DataTypes.INTEGER, allowNull: true },
  file_url:     { type: DataTypes.STRING, allowNull: true },
  audio_url:    { type: DataTypes.STRING, allowNull: true },
  is_pinned:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'forum_messages', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = ForumMessage;
