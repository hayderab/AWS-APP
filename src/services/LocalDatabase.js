import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple UUID generator that doesn't rely on crypto
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Storage keys
const STORAGE_KEYS = {
  USERS: 'aws_tutor_users',
  CURRENT_USER: 'aws_tutor_current_user',
  CERTIFICATIONS: 'aws_tutor_certifications',
  TOPICS: 'aws_tutor_topics',
  SUBTOPICS: 'aws_tutor_subtopics',
  NOTES: 'aws_tutor_notes',
  QUIZZES: 'aws_tutor_quizzes',
  QUIZ_RESULTS: 'aws_tutor_quiz_results',
  QUIZ_HISTORY: 'aws_tutor_quiz_history',
};

// Initialize the database with default values if not already set
const initializeDatabase = async () => {
  try {
    // Check if database is already initialized
    const isInitialized = await AsyncStorage.getItem('db_initialized');
    
    if (!isInitialized) {
      // Set empty arrays for all collections
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.CERTIFICATIONS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.SUBTOPICS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify([]));
      
      // Mark as initialized
      await AsyncStorage.setItem('db_initialized', 'true');
      
      console.log('Local database initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// User Management
const userService = {
  // Register a new user
  register: async (email, password, displayName) => {
    try {
      const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
      
      // Check if user already exists
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser = {
        id: generateUUID(),
        email,
        password, // In a real app, this should be hashed
        displayName,
        createdAt: new Date().toISOString(),
      };
      
      // Add to users array
      users.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Set as current user (logged in)
      const userInfo = { ...newUser };
      delete userInfo.password; // Don't store password in current user
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userInfo));
      
      return userInfo;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },
  
  // Login user
  login: async (email, password) => {
    try {
      const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
      
      // Find user
      const user = users.find(user => user.email === email && user.password === password);
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Set as current user
      const userInfo = { ...user };
      delete userInfo.password; // Don't store password in current user
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userInfo));
      
      return userInfo;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  // Reset password (simplified version)
  resetPassword: async (email) => {
    try {
      const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
      
      // Find user
      const userIndex = users.findIndex(user => user.email === email);
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      // In a real app, you would send an email with a reset link
      // For this demo, we'll just reset to a default password
      users[userIndex].password = 'resetpassword123';
      
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      return { success: true, message: 'Password has been reset' };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },
};

// Certification Management
const certificationService = {
  // Add a new certification
  addCertification: async (certificationData) => {
    try {
      const certifications = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CERTIFICATIONS)) || [];
      
      const newCertification = {
        id: generateUUID(),
        ...certificationData,
        createdAt: new Date().toISOString(),
        userId: (await userService.getCurrentUser())?.id,
      };
      
      certifications.push(newCertification);
      await AsyncStorage.setItem(STORAGE_KEYS.CERTIFICATIONS, JSON.stringify(certifications));
      
      return newCertification;
    } catch (error) {
      console.error('Error adding certification:', error);
      throw error;
    }
  },
  
  // Get all certifications for current user
  getCertifications: async () => {
    try {
      const certifications = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CERTIFICATIONS)) || [];
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) return [];
      
      return certifications.filter(cert => cert.userId === currentUser.id);
    } catch (error) {
      console.error('Error getting certifications:', error);
      return [];
    }
  },
  
  // Get a specific certification
  getCertification: async (certificationId) => {
    try {
      const certifications = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CERTIFICATIONS)) || [];
      return certifications.find(cert => cert.id === certificationId);
    } catch (error) {
      console.error('Error getting certification:', error);
      return null;
    }
  },
  
  // Delete a certification
  deleteCertification: async (certificationId) => {
    try {
      const certifications = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CERTIFICATIONS)) || [];
      const updatedCertifications = certifications.filter(cert => cert.id !== certificationId);
      
      await AsyncStorage.setItem(STORAGE_KEYS.CERTIFICATIONS, JSON.stringify(updatedCertifications));
      
      // Also delete related topics, subtopics, notes, quizzes
      await topicService.deleteTopicsByCertification(certificationId);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting certification:', error);
      throw error;
    }
  },
};

// Topic Management
const topicService = {
  // Add a new topic
  addTopic: async (topicData) => {
    try {
      const topics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.TOPICS)) || [];
      
      const newTopic = {
        id: generateUUID(),
        ...topicData,
        createdAt: new Date().toISOString(),
      };
      
      topics.push(newTopic);
      await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
      
      return newTopic;
    } catch (error) {
      console.error('Error adding topic:', error);
      throw error;
    }
  },
  
  // Get topics for a certification
  getTopicsByCertification: async (certificationId) => {
    try {
      const topics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.TOPICS)) || [];
      const subtopics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.SUBTOPICS)) || [];
      
      // Get topics for this certification
      const certificationTopics = topics.filter(topic => topic.certificationId === certificationId);
      
      // For each topic, get its subtopics
      const topicsWithSubtopics = certificationTopics.map(topic => ({
        ...topic,
        subtopics: subtopics.filter(subtopic => subtopic.topicId === topic.id)
      }));
      
      return topicsWithSubtopics;
    } catch (error) {
      console.error('Error getting topics:', error);
      return [];
    }
  },
  
  // Get a specific topic
  getTopic: async (topicId) => {
    try {
      const topics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.TOPICS)) || [];
      return topics.find(topic => topic.id === topicId);
    } catch (error) {
      console.error('Error getting topic:', error);
      return null;
    }
  },
  
  // Delete topics for a certification
  deleteTopicsByCertification: async (certificationId) => {
    try {
      const topics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.TOPICS)) || [];
      const topicsToDelete = topics.filter(topic => topic.certificationId === certificationId);
      const updatedTopics = topics.filter(topic => topic.certificationId !== certificationId);
      
      await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(updatedTopics));
      
      // Delete related subtopics, notes, quizzes
      for (const topic of topicsToDelete) {
        await subtopicService.deleteSubtopicsByTopic(topic.id);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting topics:', error);
      throw error;
    }
  },
};

// Subtopic Management
const subtopicService = {
  // Add a new subtopic
  addSubtopic: async (subtopicData) => {
    try {
      const subtopics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.SUBTOPICS)) || [];
      
      const newSubtopic = {
        id: generateUUID(),
        ...subtopicData,
        createdAt: new Date().toISOString(),
      };
      
      subtopics.push(newSubtopic);
      await AsyncStorage.setItem(STORAGE_KEYS.SUBTOPICS, JSON.stringify(subtopics));
      
      return newSubtopic;
    } catch (error) {
      console.error('Error adding subtopic:', error);
      throw error;
    }
  },
  
  // Get subtopics for a topic
  getSubtopicsByTopic: async (topicId) => {
    try {
      const subtopics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.SUBTOPICS)) || [];
      return subtopics.filter(subtopic => subtopic.topicId === topicId);
    } catch (error) {
      console.error('Error getting subtopics:', error);
      return [];
    }
  },
  
  // Get a specific subtopic
  getSubtopic: async (subtopicId) => {
    try {
      const subtopics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.SUBTOPICS)) || [];
      return subtopics.find(subtopic => subtopic.id === subtopicId);
    } catch (error) {
      console.error('Error getting subtopic:', error);
      return null;
    }
  },
  
  // Delete subtopics for a topic
  deleteSubtopicsByTopic: async (topicId) => {
    try {
      const subtopics = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.SUBTOPICS)) || [];
      const subtopicsToDelete = subtopics.filter(subtopic => subtopic.topicId === topicId);
      const updatedSubtopics = subtopics.filter(subtopic => subtopic.topicId !== topicId);
      
      await AsyncStorage.setItem(STORAGE_KEYS.SUBTOPICS, JSON.stringify(updatedSubtopics));
      
      // Delete related notes, quizzes
      for (const subtopic of subtopicsToDelete) {
        await noteService.deleteNotesBySubtopic(subtopic.id);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting subtopics:', error);
      throw error;
    }
  },
};

// Notes Management
const noteService = {
  // Add a new note
  addNote: async (noteData) => {
    try {
      const notes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTES)) || [];
      
      const newNote = {
        id: generateUUID(),
        ...noteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: (await userService.getCurrentUser())?.id,
      };
      
      notes.push(newNote);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      
      return newNote;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },
  
  // Update a note
  updateNote: async (noteId, noteData) => {
    try {
      const notes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTES)) || [];
      const noteIndex = notes.findIndex(note => note.id === noteId);
      
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      notes[noteIndex] = {
        ...notes[noteIndex],
        ...noteData,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      
      return notes[noteIndex];
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },
  
  // Get notes for a subtopic
  getNotesBySubtopic: async (subtopicId) => {
    try {
      const notes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTES)) || [];
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) return [];
      
      return notes.filter(note => 
        note.subtopicId === subtopicId && note.userId === currentUser.id
      );
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  },
  
  // Get notes for a topic
  getNotesByTopic: async (topicId) => {
    try {
      const notes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTES)) || [];
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) return [];
      
      return notes.filter(note => 
        note.topicId === topicId && note.userId === currentUser.id
      );
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  },
  
  // Get all notes for current user
  getAllNotes: async () => {
    try {
      const notes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTES)) || [];
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) return [];
      
      return notes.filter(note => note.userId === currentUser.id);
    } catch (error) {
      console.error('Error getting all notes:', error);
      return [];
    }
  },
  
  // Delete a note
  deleteNote: async (noteId) => {
    try {
      const notes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTES)) || [];
      const updatedNotes = notes.filter(note => note.id !== noteId);
      
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },
  
  // Delete notes for a subtopic
  deleteNotesBySubtopic: async (subtopicId) => {
    try {
      const notes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTES)) || [];
      const updatedNotes = notes.filter(note => note.subtopicId !== subtopicId);
      
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting notes by subtopic:', error);
      throw error;
    }
  },
};

// Quiz Management
const quizService = {
  // Add a new quiz
  addQuiz: async (quizData) => {
    try {
      const quizzes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.QUIZZES)) || [];
      
      const newQuiz = {
        id: generateUUID(),
        ...quizData,
        createdAt: new Date().toISOString(),
      };
      
      quizzes.push(newQuiz);
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
      
      return newQuiz;
    } catch (error) {
      console.error('Error adding quiz:', error);
      throw error;
    }
  },
  
  // Get quizzes for a topic
  getQuizzesByTopic: async (topicId) => {
    try {
      const quizzes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.QUIZZES)) || [];
      return quizzes.filter(quiz => quiz.topicId === topicId);
    } catch (error) {
      console.error('Error getting quizzes:', error);
      return [];
    }
  },
  
  // Get a specific quiz
  getQuiz: async (quizId) => {
    try {
      const quizzes = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.QUIZZES)) || [];
      return quizzes.find(quiz => quiz.id === quizId);
    } catch (error) {
      console.error('Error getting quiz:', error);
      return null;
    }
  },
  
  // Save quiz result
  saveQuizResult: async (resultData) => {
    try {
      const results = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS)) || [];
      
      const newResult = {
        id: generateUUID(),
        ...resultData,
        timestamp: new Date().toISOString(),
        userId: (await userService.getCurrentUser())?.id,
      };
      
      results.push(newResult);
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
      
      return newResult;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  },
  
  // Get quiz results for current user
  getQuizResults: async () => {
    try {
      const results = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS)) || [];
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) return [];
      
      return results.filter(result => result.userId === currentUser.id);
    } catch (error) {
      console.error('Error getting quiz results:', error);
      return [];
    }
  },
  
  // Save a quiz to history
  saveQuizToHistory: async (quiz) => {
    try {
      const quizHistory = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)) || [];
      
      // Add timestamp and ID to the quiz
      const quizWithMeta = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        ...quiz
      };
      
      // Add to the beginning of the array (most recent first)
      quizHistory.unshift(quizWithMeta);
      
      // Limit history to 20 quizzes to avoid storage issues
      const limitedHistory = quizHistory.slice(0, 20);
      
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(limitedHistory));
      
      return quizWithMeta;
    } catch (error) {
      console.error('Error saving quiz to history:', error);
      throw error;
    }
  },
  
  // Get quiz history
  getQuizHistory: async () => {
    try {
      const quizHistory = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)) || [];
      return quizHistory;
    } catch (error) {
      console.error('Error getting quiz history:', error);
      throw error;
    }
  },
  
  // Clear quiz history
  clearQuizHistory: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.QUIZ_HISTORY);
      return { success: true };
    } catch (error) {
      console.error('Error clearing quiz history:', error);
      throw error;
    }
  }
};

// Export the database service
const LocalDatabase = {
  initialize: initializeDatabase,
  user: userService,
  certification: certificationService,
  topic: topicService,
  subtopic: subtopicService,
  note: noteService,
  quiz: quizService,
  quizService: quizService, // Add both formats for backward compatibility
};

export default LocalDatabase;
