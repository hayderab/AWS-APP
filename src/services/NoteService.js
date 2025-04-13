/**
 * Note Service for AWS Certification Tutor
 * Provides methods to interact with the MongoDB database for notes
 */

import Note from '../models/Note';
import { connectToDatabase, disconnectFromDatabase } from '../config/mongodb';

class NoteService {
  /**
   * Initialize the database connection
   * @param {string} password - Optional database password
   * @returns {Promise<boolean>} - Connection success status
   */
  static async initialize(password) {
    return await connectToDatabase(password);
  }

  /**
   * Close the database connection
   * @returns {Promise<boolean>} - Disconnection success status
   */
  static async close() {
    return await disconnectFromDatabase();
  }

  /**
   * Create a new note
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} - Created note
   */
  static async createNote(noteData) {
    try {
      const note = new Note(noteData);
      await note.save();
      return { success: true, data: note };
    } catch (error) {
      console.error('Error creating note:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all notes for a user
   * @param {string} userId - User ID
   * @param {string} category - Optional category filter
   * @returns {Promise<Array>} - Array of notes
   */
  static async getNotes(userId, category = null) {
    try {
      const query = { userId };
      
      if (category) {
        query.category = category;
      }
      
      const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });
      return { success: true, data: notes };
    } catch (error) {
      console.error('Error fetching notes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a note by ID
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID for verification
   * @returns {Promise<Object>} - Note object
   */
  static async getNoteById(noteId, userId) {
    try {
      const note = await Note.findOne({ _id: noteId, userId });
      
      if (!note) {
        return { success: false, error: 'Note not found' };
      }
      
      return { success: true, data: note };
    } catch (error) {
      console.error('Error fetching note:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a note
   * @param {string} noteId - Note ID
   * @param {Object} updateData - Data to update
   * @param {string} userId - User ID for verification
   * @returns {Promise<Object>} - Updated note
   */
  static async updateNote(noteId, updateData, userId) {
    try {
      const note = await Note.findOneAndUpdate(
        { _id: noteId, userId },
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
      
      if (!note) {
        return { success: false, error: 'Note not found or unauthorized' };
      }
      
      return { success: true, data: note };
    } catch (error) {
      console.error('Error updating note:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a note
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID for verification
   * @returns {Promise<boolean>} - Deletion success status
   */
  static async deleteNote(noteId, userId) {
    try {
      const result = await Note.findOneAndDelete({ _id: noteId, userId });
      
      if (!result) {
        return { success: false, error: 'Note not found or unauthorized' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting note:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle pin status of a note
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID for verification
   * @returns {Promise<Object>} - Updated note
   */
  static async togglePinNote(noteId, userId) {
    try {
      const note = await Note.findOne({ _id: noteId, userId });
      
      if (!note) {
        return { success: false, error: 'Note not found or unauthorized' };
      }
      
      note.isPinned = !note.isPinned;
      await note.save();
      
      return { success: true, data: note };
    } catch (error) {
      console.error('Error toggling pin status:', error);
      return { success: false, error: error.message };
    }
  }
}

export default NoteService;
