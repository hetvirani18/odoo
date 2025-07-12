const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Answer content is required'],
      trim: true,
      minlength: [20, 'Answer must be at least 20 characters long'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isAccepted: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, 'Comment cannot exceed 500 characters'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for vote count
answerSchema.virtual('voteCount').get(function () {
  const upvotesCount = this.upvotes ? this.upvotes.length : 0;
  const downvotesCount = this.downvotes ? this.downvotes.length : 0;
  return upvotesCount - downvotesCount;
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;
