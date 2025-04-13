/**
 * Subtopic model for AWS Certification Tutor
 * Represents subtopics within a main topic
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubtopicSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a subtopic title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
  },
  topicId: {
    type: Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic ID is required']
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});

// Create the model from the schema
let Subtopic;

try {
  // Check if the model is already defined to prevent overwriting
  Subtopic = mongoose.model('Subtopic');
} catch (error) {
  Subtopic = mongoose.model('Subtopic', SubtopicSchema);
}

module.exports = Subtopic;
