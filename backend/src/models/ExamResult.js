const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExamResult = sequelize.define('ExamResult', {
  id:                  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  student_id:          { type: DataTypes.INTEGER, allowNull: false },
  specialty_id:        { type: DataTypes.INTEGER, allowNull: false },
  exam_type:           { type: DataTypes.STRING(50), allowNull: false }, // 'midterm', 'midterm_1', 'midterm_2', 'final'
  quiz_score:          { type: DataTypes.INTEGER, defaultValue: 0 },
  chat_score:          { type: DataTypes.INTEGER, defaultValue: 0 },
  overall_score:       { type: DataTypes.INTEGER, defaultValue: 0 },
  grammar_score:       { type: DataTypes.INTEGER, defaultValue: 0 },
  vocab_score:         { type: DataTypes.INTEGER, defaultValue: 0 },
  fluency_score:       { type: DataTypes.INTEGER, defaultValue: 0 },
  pronunciation_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  clinical_score:      { type: DataTypes.INTEGER, defaultValue: 0 },
  is_passed:           { type: DataTypes.BOOLEAN, defaultValue: false },
  attempts_count:      { type: DataTypes.INTEGER, defaultValue: 0 },
  quiz_details:        { type: DataTypes.JSON, allowNull: true },
  evaluation:          { type: DataTypes.JSON, allowNull: true },
  conversation_id:     { type: DataTypes.INTEGER, allowNull: true },
  last_attempt_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'exam_results',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ExamResult;
