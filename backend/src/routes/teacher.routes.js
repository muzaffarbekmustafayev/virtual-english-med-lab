const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const c = require('../controllers/teacher.controller');

const isTeacherOrAdmin = [authenticate, requireRole('teacher', 'admin')];
const isAuthenticated  = [authenticate];

// Teacher routes
router.get('/dashboard',                         isTeacherOrAdmin, c.getDashboard);
router.get('/groups',                            isTeacherOrAdmin, c.getGroups);
router.get('/reports',                           isTeacherOrAdmin, c.getReports);
router.get('/groups/:groupId/students',          isTeacherOrAdmin, c.getGroupStudents);
router.get('/students/:studentId/progress',      isTeacherOrAdmin, c.getStudentProgress);
router.get('/conversations/:id/transcript',      isTeacherOrAdmin, c.getTranscript);

// Forum (barcha foydalanuvchilar uchun)
router.get('/forum/channels',                    isAuthenticated,              c.getForumChannels);
router.get('/forum/messages',                    isAuthenticated,              c.getForumMessages);
// Frontend ovozli xabarni `voice`, faylni `file` maydonida yuboradi — ikkalasi ham qabul qilinadi
router.post('/forum/messages',                   [...isAuthenticated, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'voice', maxCount: 1 }])], c.postForumMessage);
router.put('/forum/messages/:id/pin',            isTeacherOrAdmin,             c.togglePinMessage);

module.exports = router;
