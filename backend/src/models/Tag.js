const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Tag must be at least 2 characters long'],
      maxlength: [25, 'Tag cannot exceed 25 characters'],
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for follower count
tagSchema.virtual('followerCount').get(function () {
  return this.followers.length;
});

// Virtual for question count
tagSchema.virtual('questionCount').get(function () {
  return this.questions.length;
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
