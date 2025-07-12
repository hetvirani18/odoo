const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'question_answer',    // When someone answers a question
        'answer_comment',     // When someone comments on an answer
        'mention',            // When someone mentions a user
        'answer_accepted',    // When an answer is accepted
        'question_upvote'     // When someone upvotes a question
      ],
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
    },
    comment: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
