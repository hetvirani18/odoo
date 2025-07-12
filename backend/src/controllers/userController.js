const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

// Get user profile by username
exports.getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('tags', 'name')
      .populate('following', 'username avatar')
      .populate('followers', 'username avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's questions
    const questions = await Question.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('tags', 'name');

    // Get user's answers
    const answers = await Answer.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'question',
        select: 'title',
      });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
        role: user.role,
        tags: user.tags,
        following: user.following,
        followers: user.followers,
        createdAt: user.createdAt,
      },
      questions,
      answers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { avatar, bio } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (avatar) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    // Make sure user is not following themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Unfollow user
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== userToFollow._id.toString()
      );
      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Follow user
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's questions
exports.getUserQuestions = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const questions = await Question.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate('tags', 'name');

    res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's answers
exports.getUserAnswers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const answers = await Answer.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate({
        path: 'question',
        select: 'title',
      });

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

// Get user's bookmarks
exports.getUserBookmarks = async (req, res) => {
  try {
    // Make sure user is only getting their own bookmarks
    if (req.params.username !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user\'s bookmarks',
      });
    }

    const user = await User.findById(req.user.id).populate({
      path: 'bookmarks',
      populate: [
        { path: 'author', select: 'username avatar' },
        { path: 'tags', select: 'name' },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      count: user.bookmarks.length,
      bookmarks: user.bookmarks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
