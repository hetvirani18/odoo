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
    // Validate input parameters
    console.log('Getting questions with params:', req.query);
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
      try {
        // Handle comma-separated tags
        const tagNames = tag.split(',').map(t => t.trim().toLowerCase());
        
        if (tagNames.length === 1) {
          // Single tag
          const tagDoc = await Tag.findOne({ name: tagNames[0] });
          if (tagDoc) {
            query.tags = tagDoc._id;
          }
        } else {
          // Multiple tags - find questions containing any of these tags
          const tagDocs = await Tag.find({ name: { $in: tagNames } });
          if (tagDocs && tagDocs.length > 0) {
            const tagIds = tagDocs.map(t => t._id);
            query.tags = { $in: tagIds };
          }
        }
      } catch (err) {
        console.error('Error processing tag parameter:', err);
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
    let useAggregation = false;
    
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'most_voted':
        useAggregation = true;
        break;
      case 'most_viewed':
        sortOption = { views: -1 };
        break;
      case 'most_answered':
        useAggregation = true;
        break;
      case 'trending':
        // For trending, we want questions with most activity in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: oneDayAgo };
        sortOption = { views: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let questions;
    let total;

    // Use aggregation for sorting by array lengths or regular find for simple sorts
    if (useAggregation) {
      const aggregationPipeline = [
        { $match: query },
        {
          $addFields: {
            upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
            answerCount: { $size: { $ifNull: ["$answers", []] } }
          }
        }
      ];
      
      if (sort === 'most_voted') {
        aggregationPipeline.push({ $sort: { upvoteCount: -1, createdAt: -1 } });
      } else if (sort === 'most_answered') {
        aggregationPipeline.push({ $sort: { answerCount: -1, createdAt: -1 } });
      }
      
      aggregationPipeline.push(
        { $skip: skip },
        { $limit: parseInt(limit) }
      );
      
      // Add lookups for author and tags
      aggregationPipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDetails'
          }
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tagDetails'
          }
        },
        {
          $addFields: {
            author: { $arrayElemAt: ["$authorDetails", 0] },
            tags: "$tagDetails"
          }
        },
        {
          $project: {
            authorDetails: 0,
            tagDetails: 0,
            "author.password": 0,
            "author.email": 0
          }
        }
      );
      
      questions = await Question.aggregate(aggregationPipeline);
      
      // Get total count using aggregation
      const countPipeline = [
        { $match: query },
        { $count: "total" }
      ];
      
      const countResult = await Question.aggregate(countPipeline);
      total = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      // Use regular find query for simple sorts
      questions = await Question.find(query)
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
      total = await Question.countDocuments(query);
    }

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
    console.error('Error getting questions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving questions',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    // Convert to POJO to add custom fields
    const questionObj = question.toObject();

    // Add isUpvoted and isDownvoted flags if user is logged in
    if (req.user) {
      questionObj.isUpvoted = question.upvotes.some(
        (id) => id.toString() === req.user.id
      );
      questionObj.isDownvoted = question.downvotes.some(
        (id) => id.toString() === req.user.id
      );

      // Check if user has bookmarked this question
      const user = await User.findById(req.user.id);
      questionObj.isBookmarked = user.bookmarks.some(
        (id) => id.toString() === question._id.toString()
      );

      // Add isUpvoted and isDownvoted flags to answers
      if (questionObj.answers) {
        questionObj.answers = questionObj.answers.map((answer) => {
          answer.isUpvoted = answer.upvotes?.some(
            (id) => id.toString() === req.user.id
          );
          answer.isDownvoted = answer.downvotes?.some(
            (id) => id.toString() === req.user.id
          );
          return answer;
        });
      }
    }

    res.status(200).json({
      success: true,
      question: questionObj,
    });
  } catch (error) {
    console.error('Error getting question:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving question',
    });
  }
};

// Update a question
exports.updateQuestion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Check if user is the author
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this question',
      });
    }

    // Process tags if provided
    let tagIds = question.tags;
    if (tags && tags.length > 0) {
      tagIds = [];
      for (const tagName of tags) {
        // Find tag or create if doesn't exist
        let tag = await Tag.findOne({ name: tagName.toLowerCase() });
        if (!tag) {
          tag = await Tag.create({ name: tagName.toLowerCase() });
        }
        tagIds.push(tag._id);
      }

      // Update tags with new question
      await Tag.updateMany(
        { questions: question._id },
        { $pull: { questions: question._id } }
      );
      await Tag.updateMany(
        { _id: { $in: tagIds } },
        { $addToSet: { questions: question._id } }
      );
    }

    // Update question
    question.title = title || question.title;
    question.description = description || question.description;
    question.tags = tagIds;

    await question.save();

    // Populate author and tags for response
    const populatedQuestion = await Question.findById(question._id)
      .populate('author', 'username avatar')
      .populate('tags', 'name');

    res.status(200).json({
      success: true,
      question: populatedQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating question',
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

    // Check if user is the author or admin
    if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this question',
      });
    }

    // Remove question from tags
    await Tag.updateMany(
      { questions: question._id },
      { $pull: { questions: question._id } }
    );

    // Delete question
    await Question.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting question',
    });
  }
};

// Vote on a question (upvote or downvote)
exports.voteQuestion = async (req, res) => {
  try {
    const { voteType } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Check if user is trying to vote on their own question
    if (question.author.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own question',
      });
    }

    // Handle upvote
    const isUpvoted = question.upvotes.includes(req.user.id);
    const isDownvoted = question.downvotes.includes(req.user.id);

    if (voteType === 'upvote') {
      if (isUpvoted) {
        // Remove upvote (toggle off)
        question.upvotes = question.upvotes.filter(
          (id) => id.toString() !== req.user.id
        );
      } else {
        // Add upvote and remove downvote if exists
        question.upvotes.push(req.user.id);
        if (isDownvoted) {
          question.downvotes = question.downvotes.filter(
            (id) => id.toString() !== req.user.id
          );
        }

        // Create notification for question author if it's a new upvote
        if (question.author.toString() !== req.user.id) {
          await Notification.create({
            recipient: question.author,
            sender: req.user.id,
            type: 'question_upvote',
            question: question._id,
          });
        }
      }
    } else if (voteType === 'downvote') {
      if (isDownvoted) {
        // Remove downvote (toggle off)
        question.downvotes = question.downvotes.filter(
          (id) => id.toString() !== req.user.id
        );
      } else {
        // Add downvote and remove upvote if exists
        question.downvotes.push(req.user.id);
        if (isUpvoted) {
          question.upvotes = question.upvotes.filter(
            (id) => id.toString() !== req.user.id
          );
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type',
      });
    }

    await question.save();

    // Update user reputation
    const questionAuthor = await User.findById(question.author);
    const voteValue = voteType === 'upvote' ? 10 : -2;
    const reputationChange = isUpvoted || isDownvoted ? 0 : voteValue;
    
    questionAuthor.reputation += reputationChange;
    await questionAuthor.save();

    res.status(200).json({
      success: true,
      isUpvoted: question.upvotes.includes(req.user.id),
      isDownvoted: question.downvotes.includes(req.user.id),
      upvotes: question.upvotes.length,
      downvotes: question.downvotes.length,
    });
  } catch (error) {
    console.error('Error voting on question:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error voting on question',
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

    // Get user and check if question is already bookmarked
    const user = await User.findById(req.user.id);
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
    console.error('Error bookmarking question:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error bookmarking question',
    });
  }
};
