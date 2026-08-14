const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/admin.controller');

const isAdmin = [authenticate, requireRole('admin')];

// Overview
router.get('/overview',                  isAdmin, c.getOverview);

// Users CRUD
router.get('/users',                     isAdmin, c.getUsers);
router.post('/users',                    isAdmin, c.createUser);
router.put('/users/:id',                 isAdmin, c.updateUser);
router.delete('/users/:id',              isAdmin, c.deleteUser);

// Specialties
router.get('/specialties',               isAdmin, c.getSpecialties);
router.post('/specialties',              isAdmin, c.createSpecialty);
router.put('/specialties/:id',           isAdmin, c.updateSpecialty);
router.delete('/specialties/:id',        isAdmin, c.deleteSpecialty);

// Groups & Assignments
router.get('/groups',                    isAdmin, c.getGroups);
router.post('/groups',                   isAdmin, c.createGroup);
router.put('/groups/:id',                isAdmin, c.updateGroup);
router.delete('/groups/:id',             isAdmin, c.deleteGroup);
router.post('/teacher-groups',           isAdmin, c.assignTeacherGroup);
router.delete('/teacher-groups',         isAdmin, c.removeTeacherGroup);
router.post('/student-groups',           isAdmin, c.assignStudentGroup);

// Modules
router.get('/modules',                   isAdmin, c.getModules);
router.post('/modules',                  isAdmin, c.createModule);
router.put('/modules/:id',               isAdmin, c.updateModule);
router.delete('/modules/:id',            isAdmin, c.deleteModule);

// Vocabulary
router.get('/vocabulary',                isAdmin, c.getVocabulary);
router.post('/vocabulary',               isAdmin, c.createVocabulary);
router.put('/vocabulary/:id',            isAdmin, c.updateVocabulary);
router.delete('/vocabulary/:id',         isAdmin, c.deleteVocabulary);

// Phrasebook
router.get('/phrasebook',                isAdmin, c.getPhrasebook);
router.post('/phrasebook',               isAdmin, c.createPhrase);
router.put('/phrasebook/:id',            isAdmin, c.updatePhrase);
router.delete('/phrasebook/:id',         isAdmin, c.deletePhrase);

// Tests / Quizzes
router.get('/tests',                     isAdmin, c.getTests);
router.post('/tests',                    isAdmin, c.createTest);
router.put('/tests/:id',                 isAdmin, c.updateTest);
router.delete('/tests/:id',              isAdmin, c.deleteTest);

module.exports = router;
