const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters long'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Question description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters long'],
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
        required: [true, 'At least one tag is required'],
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    views: {
      type: Number,
      default: 0,
    },
    answers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer',
      },
    ],
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      default: null,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for vote count
questionSchema.virtual('voteCount').get(function () {
  const upvotesCount = this.upvotes ? this.upvotes.length : 0;
  const downvotesCount = this.downvotes ? this.downvotes.length : 0;
  return upvotesCount - downvotesCount;
});

// Virtual for answer count
questionSchema.virtual('answerCount').get(function () {
  return this.answers ? this.answers.length : 0;
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
