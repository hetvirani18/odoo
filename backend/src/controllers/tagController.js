const Tag = require('../models/Tag');
const User = require('../models/User');

// Get all tags
exports.getTags = async (req, res) => {
  try {
    const { search, sort = 'popular', limit = 20 } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Handle sorting
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { 'questions.length': -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { 'questions.length': -1 };
    }

    // Get tags
    const tags = await Tag.find(query)
      .sort(sortOption)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: tags.length,
      tags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single tag
exports.getTag = async (req, res) => {
  try {
    const tag = await Tag.findOne({ name: req.params.name.toLowerCase() })
      .populate({
        path: 'questions',
        select: 'title createdAt',
        options: { sort: { createdAt: -1 }, limit: 10 },
      });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    res.status(200).json({
      success: true,
      tag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Follow a tag
exports.followTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already following
    const isFollowing = user.tags.includes(tag._id);

    if (isFollowing) {
      // Unfollow tag
      user.tags = user.tags.filter(
        (id) => id.toString() !== tag._id.toString()
      );
      tag.followers = tag.followers.filter(
        (id) => id.toString() !== user._id.toString()
      );
    } else {
      // Follow tag
      user.tags.push(tag._id);
      tag.followers.push(user._id);
    }

    await user.save();
    await tag.save();

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
