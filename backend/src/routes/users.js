const express = require('express');
const {
  getUserByUsername,
  updateProfile,
  followUser,
  getUserQuestions,
  getUserAnswers,
  getUserBookmarks,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:username', getUserByUsername);
router.get('/:username/questions', getUserQuestions);
router.get('/:username/answers', getUserAnswers);

// Protected routes
router.put('/profile', protect, updateProfile);
router.post('/:id/follow', protect, followUser);
router.get('/:username/bookmarks', protect, getUserBookmarks);

module.exports = router;
