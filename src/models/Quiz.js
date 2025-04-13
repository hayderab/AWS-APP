/**
 * Quiz model for AWS Certification Tutor
 * Represents quizzes for testing knowledge on topics
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuestionSchema = new Schema({
  question: {
    type: String,
    required: [true, 'Please provide a question']
  },
  options: [{
    type: String,
    required: [true, 'Please provide options']
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Please provide the correct answer index']
  },
  explanation: {
    type: String
  }
});

const QuizSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a quiz title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
  },
  topicId: {
    type: Schema.Types.ObjectId,
    ref: 'Topic'
  },
  subtopicId: {
    type: Schema.Types.ObjectId,
    ref: 'Subtopic'
  },
  questions: [QuestionSchema],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  timeLimit: {
    type: Number,
    default: 0 // 0 means no time limit
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model from the schema
let Quiz;

try {
  // Check if the model is already defined to prevent overwriting
  Quiz = mongoose.model('Quiz');
} catch (error) {
  Quiz = mongoose.model('Quiz', QuizSchema);
}

module.exports = Quiz;
