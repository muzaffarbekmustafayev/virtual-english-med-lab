const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id:                  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  student_id:          { type: DataTypes.INTEGER, allowNull: false },
  module_id:           { type: DataTypes.INTEGER, allowNull: false },
  attempt_type:        { type: DataTypes.ENUM('first_attempt', 'retry', 'final_challenge'), allowNull: false },
  status:              { type: DataTypes.ENUM('active', 'completed'), defaultValue: 'active' },
  grammar_score:       { type: DataTypes.INTEGER, defaultValue: 0 },
  vocabulary_score:    { type: DataTypes.INTEGER, defaultValue: 0 },
  fluency_score:       { type: DataTypes.INTEGER, defaultValue: 0 },
  pronunciation_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  clinical_score:      { type: DataTypes.INTEGER, defaultValue: 0 },
  overall_score:       { type: DataTypes.INTEGER, defaultValue: 0 },
  general_feedback:    { type: DataTypes.TEXT, allowNull: true },
  dynamic_scenario:    { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Conversation;
