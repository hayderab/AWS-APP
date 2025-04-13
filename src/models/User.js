/**
 * User model for AWS Certification Tutor
 * Represents users of the application
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password should be at least 6 characters long']
    // In production, this should be hashed before saving
  },
  displayName: {
    type: String,
    required: [true, 'Please provide a display name']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Create the model from the schema
let User;

try {
  // Check if the model is already defined to prevent overwriting
  User = mongoose.model('User');
} catch (error) {
  User = mongoose.model('User', UserSchema);
}

module.exports = User;
