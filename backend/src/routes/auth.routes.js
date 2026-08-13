const router = require('express').Router();
const { register, login, getMe, updateProfile, changePassword, getSpecialties, getGroups } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/register',    register);
router.post('/login',       login);
router.get('/me',           authenticate, getMe);
router.put('/profile',      authenticate, updateProfile);
router.put('/password',     authenticate, changePassword);
router.get('/specialties',  getSpecialties);
router.get('/groups',       getGroups);

module.exports = router;
