const express = require('express');
const { register, login, getMe, refreshToken, logout } = require('../controllers/authControllerNew');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
