const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ForumMessage = sequelize.define('ForumMessage', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sender_id:    { type: DataTypes.INTEGER, allowNull: false },
  message_text: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'forum_messages', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = ForumMessage;
