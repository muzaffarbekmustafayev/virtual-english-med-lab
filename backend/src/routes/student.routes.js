const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/student.controller');

const isStudent = [authenticate, requireRole('student')];

router.get('/dashboard',                        isStudent, c.getDashboard);
router.get('/modules',                          isStudent, c.getModules);
router.get('/modules/:id',                      isStudent, c.getModuleById);
router.get('/modules/:id/progress',             isStudent, c.getModuleProgress);
router.get('/modules/:id/vocabulary',           isStudent, c.getVocabulary);
router.get('/modules/:id/phrasebook',           isStudent, c.getPhrasebook);
router.post('/modules/:id/conversation',        isStudent, c.startConversation);
router.get('/modules/:id/tests',                isStudent, c.getTests);
router.post('/modules/:id/tests/submit',        isStudent, c.submitTest);
router.post('/conversation/:id/message',        isStudent, c.sendMessage);
router.post('/conversation/:id/finalize',       isStudent, c.finalizeConversation);
router.get('/conversation/:id/feedback',        isStudent, c.getFeedback);
router.get('/conversation/:id/messages',        isStudent, c.getMessages);
router.post('/grammar-check',                   isStudent, c.grammarCheck);

module.exports = router;
