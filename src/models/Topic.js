/**
 * Topic model for AWS Certification Tutor
 * Represents main topics within a certification
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const TopicSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a topic title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
  },
  certificationId: {
    type: Schema.Types.ObjectId,
    ref: 'Certification',
    required: [true, 'Certification ID is required']
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});

// Create the model from the schema
let Topic;

try {
  // Check if the model is already defined to prevent overwriting
  Topic = mongoose.model('Topic');
} catch (error) {
  Topic = mongoose.model('Topic', TopicSchema);
}

module.exports = Topic;
