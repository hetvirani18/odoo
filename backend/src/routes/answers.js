const express = require('express');
const {
  createAnswer,
  getAnswers,
  getAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  voteAnswer,
  addComment,
} = require('../controllers/answerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all answers for a question
router.get('/question/:questionId', getAnswers);

// Get a single answer
router.get('/:id', getAnswer);

// Protected routes
router.post('/question/:questionId', protect, createAnswer);
router.put('/:id', protect, updateAnswer);
router.delete('/:id', protect, deleteAnswer);
router.post('/:id/accept', protect, acceptAnswer);
router.post('/:id/vote', protect, voteAnswer);
router.post('/:id/comment', protect, addComment);

module.exports = router;
