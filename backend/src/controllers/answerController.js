const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create a new answer
exports.createAnswer = async (req, res) => {
  try {
    const { content } = req.body;
    const { questionId } = req.params;

    // Enhanced logging to debug request
    console.log('Create answer request received:', { 
      questionId, 
      content: content ? `${content.slice(0, 20)}... (${content.length} chars)` : 'undefined/null',
      user: req.user ? req.user.id : 'No user'
    });

    // Basic content validation
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide answer content',
      });
    }

    // Validate content type
    if (typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Content must be a string',
      });
    }

    // Validate content length
    if (content.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Answer must be at least 20 characters long',
      });
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Ensure user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Create answer
    const answer = await Answer.create({
      content: content.trim(),
      author: req.user.id,
      question: questionId,
    });

    // Add answer to question
    question.answers.push(answer._id);
    await question.save();

    // Create notification for question author
    if (question.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: question.author,
        sender: req.user.id,
        type: 'question_answer',
        question: questionId,
        answer: answer._id,
      });
    }

    // Populate author for response
    const populatedAnswer = await Answer.findById(answer._id).populate(
      'author',
      'username avatar reputation'
    );

    console.log('Answer created successfully:', { answerId: answer._id });

    res.status(201).json({
      success: true,
      answer: populatedAnswer,
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    
    // More specific error messages based on the error type
    if (error.name === 'ValidationError') {
      // Handle Mongoose validation errors
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    } else if (error.name === 'CastError') {
      // Handle invalid ObjectId errors
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating answer',
    });
  }
};

// Get all answers for a question
exports.getAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { sort = 'votes' } = req.query;

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Get answers
    let answers;
    if (sort === 'votes') {
      // Sort by vote count (we need to use aggregation for this)
      answers = await Answer.aggregate([
        { $match: { question: question._id } },
        {
          $addFields: {
            voteCount: { $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] },
          },
        },
        { $sort: { isAccepted: -1, voteCount: -1, createdAt: -1 } },
      ]);

      // Populate author
      await Answer.populate(answers, {
        path: 'author',
        select: 'username avatar reputation',
      });
    } else if (sort === 'newest') {
      // Sort by creation date
      answers = await Answer.find({ question: questionId })
        .sort({ isAccepted: -1, createdAt: -1 })
        .populate('author', 'username avatar reputation');
    } else if (sort === 'oldest') {
      // Sort by creation date ascending
      answers = await Answer.find({ question: questionId })
        .sort({ isAccepted: -1, createdAt: 1 })
        .populate('author', 'username avatar reputation');
    } else {
      // Default sorting
      answers = await Answer.find({ question: questionId })
        .sort({ isAccepted: -1, createdAt: -1 })
        .populate('author', 'username avatar reputation');
    }

    res.status(200).json({
      success: true,
      count: answers.length,
      answers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single answer
exports.getAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate(
      'author',
      'username avatar reputation'
    );

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    res.status(200).json({
      success: true,
      answer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update an answer
exports.updateAnswer = async (req, res) => {
  try {
    const { content } = req.body;

    let answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    // Check if user is authorized
    if (answer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this answer',
      });
    }

    // Update content
    if (content) answer.content = content;

    // Save answer
    await answer.save();

    // Populate for response
    const updatedAnswer = await Answer.findById(answer._id).populate(
      'author',
      'username avatar reputation'
    );

    res.status(200).json({
      success: true,
      answer: updatedAnswer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete an answer
exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    // Check if user is authorized
    if (answer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this answer',
      });
    }

    // Remove answer from question
    await Question.findByIdAndUpdate(answer.question, {
      $pull: { answers: answer._id },
    });

    // Delete related notifications
    await Notification.deleteMany({ answer: answer._id });

    // Delete answer
    await answer.remove();

    res.status(200).json({
      success: true,
      message: 'Answer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Accept an answer
exports.acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    // Get question
    const question = await Question.findById(answer.question);

    // Check if user is the question author
    if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the question author can accept an answer',
      });
    }

    // If there was a previously accepted answer, unaccept it
    if (question.acceptedAnswer) {
      await Answer.findByIdAndUpdate(question.acceptedAnswer, {
        isAccepted: false,
      });
    }

    // Accept the new answer
    answer.isAccepted = true;
    await answer.save();

    // Update question
    question.acceptedAnswer = answer._id;
    question.isResolved = true;
    await question.save();

    // Create notification for answer author
    if (answer.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: answer.author,
        sender: req.user.id,
        type: 'answer_accepted',
        question: question._id,
        answer: answer._id,
      });
    }

    // Add reputation to answer author
    await User.findByIdAndUpdate(answer.author, {
      $inc: { reputation: 15 },
    });

    res.status(200).json({
      success: true,
      message: 'Answer accepted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Vote on an answer
exports.voteAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type',
      });
    }

    const answer = await Answer.findById(id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    // Check if user is the author
    if (answer.author.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own answer',
      });
    }

    const upvoted = answer.upvotes.includes(req.user.id);
    const downvoted = answer.downvotes.includes(req.user.id);

    // Handle upvote
    if (voteType === 'upvote') {
      if (upvoted) {
        // Remove upvote if already upvoted
        answer.upvotes = answer.upvotes.filter(
          (id) => id.toString() !== req.user.id
        );
      } else {
        // Add upvote and remove downvote if exists
        answer.upvotes.push(req.user.id);
        answer.downvotes = answer.downvotes.filter(
          (id) => id.toString() !== req.user.id
        );

        // Increment author reputation if not previously upvoted
        if (!upvoted) {
          await User.findByIdAndUpdate(answer.author, {
            $inc: { reputation: 10 },
          });
        }
      }
    }

    // Handle downvote
    if (voteType === 'downvote') {
      if (downvoted) {
        // Remove downvote if already downvoted
        answer.downvotes = answer.downvotes.filter(
          (id) => id.toString() !== req.user.id
        );
      } else {
        // Add downvote and remove upvote if exists
        answer.downvotes.push(req.user.id);
        answer.upvotes = answer.upvotes.filter(
          (id) => id.toString() !== req.user.id
        );

        // Decrement author reputation if not previously downvoted
        if (!downvoted) {
          await User.findByIdAndUpdate(answer.author, {
            $inc: { reputation: -2 },
          });
        }
      }
    }

    await answer.save();

    res.status(200).json({
      success: true,
      voteCount: answer.upvotes.length - answer.downvotes.length,
      upvoted: answer.upvotes.includes(req.user.id),
      downvoted: answer.downvotes.includes(req.user.id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add a comment to an answer
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { id } = req.params;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide comment content',
      });
    }

    const answer = await Answer.findById(id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found',
      });
    }

    // Create comment
    const comment = {
      author: req.user.id,
      content,
      createdAt: Date.now(),
    };

    // Add comment to answer
    answer.comments.push(comment);
    await answer.save();

    // Create notification for answer author
    if (answer.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: answer.author,
        sender: req.user.id,
        type: 'answer_comment',
        question: answer.question,
        answer: answer._id,
        comment: content,
      });
    }

    // Check for mentions in comment and create notifications
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);

    if (mentions) {
      for (const mention of mentions) {
        const username = mention.substring(1);
        const mentionedUser = await User.findOne({ username });

        if (
          mentionedUser &&
          mentionedUser._id.toString() !== req.user.id &&
          mentionedUser._id.toString() !== answer.author.toString()
        ) {
          await Notification.create({
            recipient: mentionedUser._id,
            sender: req.user.id,
            type: 'mention',
            question: answer.question,
            answer: answer._id,
            comment: content,
          });
        }
      }
    }

    // Populate for response
    const populatedAnswer = await Answer.findById(id)
      .populate('author', 'username avatar reputation')
      .populate({
        path: 'comments.author',
        select: 'username avatar',
      });

    res.status(201).json({
      success: true,
      comments: populatedAnswer.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
