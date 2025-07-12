const express = require('express');
const {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
  bookmarkQuestion,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getQuestions);
router.get('/:id', getQuestion);

// Protected routes
router.post('/', protect, createQuestion);
router.put('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);
router.post('/:id/vote', protect, voteQuestion);
router.post('/:id/bookmark', protect, bookmarkQuestion);

module.exports = router;
