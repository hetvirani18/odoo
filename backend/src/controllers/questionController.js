const Question = require('../models/Question');
const Tag = require('../models/Tag');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    if (!title || !description || !tags || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and at least one tag',
      });
    }

    // Process tags
    const tagIds = [];
    for (const tagName of tags) {
      // Find tag or create if doesn't exist
      let tag = await Tag.findOne({ name: tagName.toLowerCase() });
      if (!tag) {
        tag = await Tag.create({ name: tagName.toLowerCase() });
      }
      tagIds.push(tag._id);
    }

    // Create question
    const question = await Question.create({
      title,
      description,
      tags: tagIds,
      author: req.user.id,
    });

    // Update tags with new question
    await Tag.updateMany(
      { _id: { $in: tagIds } },
      { $addToSet: { questions: question._id } }
    );

    // Populate author and tags for response
    const populatedQuestion = await Question.findById(question._id)
      .populate('author', 'username avatar')
      .populate('tags', 'name');

    res.status(201).json({
      success: true,
      question: populatedQuestion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all questions with filters and pagination
exports.getQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'newest',
      tag,
      search,
      author,
      feed = 'all',
    } = req.query;

    // Base query
    const query = {};

    // Add tag filter
    if (tag) {
      const tagDoc = await Tag.findOne({ name: tag.toLowerCase() });
      if (tagDoc) {
        query.tags = tagDoc._id;
      }
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Add author filter
    if (author) {
      const authorDoc = await User.findOne({ username: author });
      if (authorDoc) {
        query.author = authorDoc._id;
      }
    }

    // Handle feed type for logged-in users
    if (feed === 'following' && req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        // Get questions from followed users and tags
        const followedUsers = user.following;
        const followedTags = user.tags;
        
        query.$or = [
          { author: { $in: followedUsers } },
          { tags: { $in: followedTags } },
        ];
      }
    }

    // Handle sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'most_voted':
        // For this we'd need to use aggregation, but keeping it simple
        sortOption = { 'upvotes.length': -1 };
        break;
      case 'most_viewed':
        sortOption = { views: -1 };
        break;
      case 'most_answered':
        sortOption = { 'answers.length': -1 };
        break;
      case 'trending':
        // For trending, we want questions with most activity in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: oneDayAgo };
        sortOption = { views: -1, 'upvotes.length': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const questions = await Question.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatar')
      .populate('tags', 'name')
      .populate({
        path: 'answers',
        select: '_id',
      });

    // Get total count
    const total = await Question.countDocuments(query);

    res.status(200).json({
      success: true,
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single question
exports.getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'username avatar reputation')
      .populate('tags', 'name')
      .populate({
        path: 'answers',
        populate: {
          path: 'author',
          select: 'username avatar reputation',
        },
      })
      .populate('acceptedAnswer');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Increment view count
    question.views += 1;
    await question.save();

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a question
exports.updateQuestion = async (req, res) => {
  try {
    let question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Check if user is authorized
    if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question',
      });
    }

    const { title, description, tags } = req.body;

    // Process tags if provided
    if (tags && tags.length > 0) {
      // Remove question from old tags
      await Tag.updateMany(
        { _id: { $in: question.tags } },
        { $pull: { questions: question._id } }
      );

      // Process new tags
      const tagIds = [];
      for (const tagName of tags) {
        let tag = await Tag.findOne({ name: tagName.toLowerCase() });
        if (!tag) {
          tag = await Tag.create({ name: tagName.toLowerCase() });
        }
        tagIds.push(tag._id);
      }

      // Update tags with question
      await Tag.updateMany(
        { _id: { $in: tagIds } },
        { $addToSet: { questions: question._id } }
      );

      // Update question tags
      question.tags = tagIds;
    }

    // Update fields
    if (title) question.title = title;
    if (description) question.description = description;

    // Save question
    await question.save();

    // Populate for response
    const updatedQuestion = await Question.findById(question._id)
      .populate('author', 'username avatar')
      .populate('tags', 'name');

    res.status(200).json({
      success: true,
      question: updatedQuestion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Check if user is authorized
    if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question',
      });
    }

    // Remove question from tags
    await Tag.updateMany(
      { _id: { $in: question.tags } },
      { $pull: { questions: question._id } }
    );

    // Remove question from user bookmarks
    await User.updateMany(
      { bookmarks: question._id },
      { $pull: { bookmarks: question._id } }
    );

    // Delete related notifications
    await Notification.deleteMany({ question: question._id });

    // Delete question
    await question.remove();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Vote on a question
exports.voteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type',
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Check if user is the author
    if (question.author.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own question',
      });
    }

    const upvoted = question.upvotes.includes(req.user.id);
    const downvoted = question.downvotes.includes(req.user.id);

    // Handle upvote
    if (voteType === 'upvote') {
      if (upvoted) {
        // Remove upvote if already upvoted
        question.upvotes = question.upvotes.filter(
          (id) => id.toString() !== req.user.id
        );
      } else {
        // Add upvote and remove downvote if exists
        question.upvotes.push(req.user.id);
        question.downvotes = question.downvotes.filter(
          (id) => id.toString() !== req.user.id
        );

        // Increment author reputation if not previously upvoted
        if (!upvoted) {
          await User.findByIdAndUpdate(question.author, {
            $inc: { reputation: 10 },
          });
        }
      }
    }

    // Handle downvote
    if (voteType === 'downvote') {
      if (downvoted) {
        // Remove downvote if already downvoted
        question.downvotes = question.downvotes.filter(
          (id) => id.toString() !== req.user.id
        );
      } else {
        // Add downvote and remove upvote if exists
        question.downvotes.push(req.user.id);
        question.upvotes = question.upvotes.filter(
          (id) => id.toString() !== req.user.id
        );

        // Decrement author reputation if not previously downvoted
        if (!downvoted) {
          await User.findByIdAndUpdate(question.author, {
            $inc: { reputation: -2 },
          });
        }
      }
    }

    await question.save();

    res.status(200).json({
      success: true,
      voteCount: question.upvotes.length - question.downvotes.length,
      upvoted: question.upvotes.includes(req.user.id),
      downvoted: question.downvotes.includes(req.user.id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Bookmark a question
exports.bookmarkQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already bookmarked
    const isBookmarked = user.bookmarks.includes(question._id);

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarks = user.bookmarks.filter(
        (id) => id.toString() !== question._id.toString()
      );
    } else {
      // Add bookmark
      user.bookmarks.push(question._id);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isBookmarked: !isBookmarked,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
