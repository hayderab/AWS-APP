/**
 * Certification model for AWS Certification Tutor
 * Represents AWS certification exams
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const CertificationSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a certification title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
  },
  level: {
    type: String,
    enum: ['foundational', 'associate', 'professional', 'specialty'],
    default: 'associate'
  },
  examCode: {
    type: String
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  targetDate: {
    type: Date
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});

// Create the model from the schema
let Certification;

try {
  // Check if the model is already defined to prevent overwriting
  Certification = mongoose.model('Certification');
} catch (error) {
  Certification = mongoose.model('Certification', CertificationSchema);
}

module.exports = Certification;
