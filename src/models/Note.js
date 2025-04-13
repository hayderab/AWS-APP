/**
 * Note model for AWS Certification Tutor
 * Handles notes created by users in the Career Hub and study sections
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Don't try to connect here - connection will be handled elsewhere
// React Native doesn't support direct mongoose connections well

const NoteSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this note'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide content for this note']
  },
  category: {
    type: String,
    enum: ['career', 'study', 'exam', 'lab', 'general'],
    default: 'general'
  },
  tags: [{
    type: String
  }],
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  // Add fields for MongoDatabase compatibility
  topicId: {
    type: String
  },
  subtopicId: {
    type: String
  },
  subtopicTitle: {
    type: String
  },
  text: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field on save
NoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create the model from the schema
let Note;

try {
  // Check if the model is already defined to prevent overwriting
  Note = mongoose.model('Note');
} catch (error) {
  Note = mongoose.model('Note', NoteSchema);
}

module.exports = Note;
