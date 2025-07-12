const express = require('express');
const { getTags, getTag, followTag } = require('../controllers/tagController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getTags);
router.get('/:name', getTag);

// Protected routes
router.post('/:id/follow', protect, followTag);

module.exports = router;
