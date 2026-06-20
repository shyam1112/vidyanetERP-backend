const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, changePassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', protect, changePassword);
router.patch('/profile', protect, updateProfile);

module.exports = router;
