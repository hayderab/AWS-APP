/**
 * MongoDB connection configuration
 * 
 * IMPORTANT: This file contains a placeholder for the MongoDB connection string.
 * For security, replace the <db_password> with your actual password in a .env file,
 * not directly in this file.
 */

// Using require for CommonJS compatibility
const mongoose = require('mongoose');
const AsyncStorage = require('@react-native-async-storage/async-storage');

// Connection string with password already included
const MONGODB_URI = 'mongodb+srv://h4d3rdevelopment:X0185JzYqcAzvy2k@cluster0.ivok04x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Store your actual password in AsyncStorage for development
// In production, use proper environment variables or a secure vault
const storeDbPassword = async (password) => {
  try {
    await AsyncStorage.setItem('mongodb_password', password);
    return true;
  } catch (error) {
    console.error('Error storing database password:', error);
    return false;
  }
};

// Get the stored password
const getDbPassword = async () => {
  try {
    return await AsyncStorage.getItem('mongodb_password');
  } catch (error) {
    console.error('Error retrieving database password:', error);
    return null;
  }
};

// Connect to MongoDB
const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      mongoose.connect(MONGODB_URI)
        .then(() => {
          console.log('Connected to MongoDB successfully');
          resolve(true);
        })
        .catch(err => {
          console.error('MongoDB connection error:', err);
          reject(err);
        });
    } catch (error) {
      console.error('MongoDB connection setup error:', error);
      reject(error);
    }
  });
};

// Disconnect from MongoDB
const disconnectFromDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    return true;
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    return false;
  }
};

module.exports = { 
  connectToDatabase,
  disconnectFromDatabase,
  storeDbPassword,
  getDbPassword,
  mongoose
};
