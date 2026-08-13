// ── Model imports ────────────────────────────────────────────
const Specialty    = require('./Specialty');
const StudentGroup = require('./StudentGroup');
const User         = require('./User');
const TeacherGroup = require('./TeacherGroup');
const Module       = require('./Module');
const Vocabulary   = require('./Vocabulary');
const Phrasebook   = require('./Phrasebook');
const Conversation = require('./Conversation');
const Message      = require('./Message');
const Test         = require('./Test');
const TestResult   = require('./TestResult');
const ForumMessage = require('./ForumMessage');

// ── Associations (Foreign Key relationships) ─────────────────

// User ↔ Specialty / Group
User.belongsTo(Specialty,    { foreignKey: 'specialty_id', as: 'specialty' });
User.belongsTo(StudentGroup, { foreignKey: 'group_id',     as: 'group'     });
Specialty.hasMany(User,      { foreignKey: 'specialty_id'                  });
StudentGroup.hasMany(User,   { foreignKey: 'group_id'                      });

// TeacherGroup (pivot)
User.belongsToMany(StudentGroup, { through: TeacherGroup, foreignKey: 'teacher_id', as: 'teacherGroups' });
StudentGroup.belongsToMany(User, { through: TeacherGroup, foreignKey: 'group_id',   as: 'teachers'      });

// Module ↔ Specialty
Module.belongsTo(Specialty, { foreignKey: 'specialty_id', as: 'specialty' });
Specialty.hasMany(Module,   { foreignKey: 'specialty_id'                  });

// Vocabulary ↔ Module
Vocabulary.belongsTo(Module, { foreignKey: 'module_id' });
Module.hasMany(Vocabulary,   { foreignKey: 'module_id', as: 'vocabularies' });

// Phrasebook ↔ Module
Phrasebook.belongsTo(Module, { foreignKey: 'module_id' });
Module.hasMany(Phrasebook,   { foreignKey: 'module_id', as: 'phrases' });

// Test ↔ Module
Test.belongsTo(Module, { foreignKey: 'module_id' });
Module.hasMany(Test,   { foreignKey: 'module_id', as: 'tests' });

// Conversation ↔ User + Module
Conversation.belongsTo(User,   { foreignKey: 'student_id', as: 'student' });
Conversation.belongsTo(Module, { foreignKey: 'module_id',  as: 'module'  });
User.hasMany(Conversation,     { foreignKey: 'student_id'                });
Module.hasMany(Conversation,   { foreignKey: 'module_id'                 });

// Message ↔ Conversation
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });
Conversation.hasMany(Message,   { foreignKey: 'conversation_id', as: 'messages' });

// TestResult ↔ User + Module
TestResult.belongsTo(User,   { foreignKey: 'student_id' });
TestResult.belongsTo(Module, { foreignKey: 'module_id'  });
User.hasMany(TestResult,     { foreignKey: 'student_id' });
Module.hasMany(TestResult,   { foreignKey: 'module_id'  });

// ForumMessage ↔ User & Self (Reply)
ForumMessage.belongsTo(User,         { foreignKey: 'sender_id',   as: 'sender' });
ForumMessage.belongsTo(ForumMessage, { foreignKey: 'reply_to_id', as: 'parent' });
User.hasMany(ForumMessage,           { foreignKey: 'sender_id'                });

// ── Exports ──────────────────────────────────────────────────
module.exports = {
  Specialty,
  StudentGroup,
  User,
  TeacherGroup,
  Module,
  Vocabulary,
  Phrasebook,
  Conversation,
  Message,
  Test,
  TestResult,
  ForumMessage,
};
