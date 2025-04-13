/**
 * QuizResult model for AWS Certification Tutor
 * Represents results of quizzes taken by users
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const QuizResultSchema = new Schema({
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required']
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
    max: 100
  },
  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean
  }],
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create the model from the schema
let QuizResult;

try {
  // Check if the model is already defined to prevent overwriting
  QuizResult = mongoose.model('QuizResult');
} catch (error) {
  QuizResult = mongoose.model('QuizResult', QuizResultSchema);
}

module.exports = QuizResult;
