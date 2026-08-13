const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/teacher.controller');

const isTeacherOrAdmin = [authenticate, requireRole('teacher', 'admin')];
const isAuthenticated  = [authenticate];

// Teacher routes
router.get('/dashboard',                         isTeacherOrAdmin, c.getDashboard);
router.get('/groups',                            isTeacherOrAdmin, c.getGroups);
router.get('/groups/:groupId/students',          isTeacherOrAdmin, c.getGroupStudents);
router.get('/students/:studentId/progress',      isTeacherOrAdmin, c.getStudentProgress);
router.get('/conversations/:id/transcript',      isTeacherOrAdmin, c.getTranscript);

// Forum (barcha foydalanuvchilar uchun)
router.get('/forum/messages',                    isAuthenticated,  c.getForumMessages);
router.post('/forum/messages',                   isAuthenticated,  c.postForumMessage);

module.exports = router;
