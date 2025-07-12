const express = require('express');
const { generateDescription } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/draft', protect, generateDescription);

module.exports = router;
