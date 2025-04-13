// Import models directly
const User = require('../models/User');
const Certification = require('../models/Certification');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');

// Import AsyncStorage with ES module syntax for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize database
const initialize = async () => {
  console.log('MongoDatabase initialized');
  // In a real app, this would connect to MongoDB
  // For now, we'll just use AsyncStorage
};

// Call initialize
initialize();

// User Management
const userService = {
  register: async (email, password, displayName) => {
    try {
      // For now, fall back to AsyncStorage
      const usersJson = await AsyncStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      const existingUser = users.find(u => u.email === email);
      if (existingUser) throw new Error('User already exists');
      
      const newUser = {
        _id: Date.now().toString(),
        email,
        password,
        displayName,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      return newUser;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },
  
  login: async (email, password) => {
    try {
      // For now, fall back to AsyncStorage
      const usersJson = await AsyncStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) throw new Error('Invalid credentials');
      
      return user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },
  
  getUserById: async (id) => {
    try {
      // For now, fall back to AsyncStorage
      const usersJson = await AsyncStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      return users.find(u => u._id === id);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
};

// Certification Management
const certification = {
  addCertification: async (certData) => {
    try {
      // For now, fall back to AsyncStorage
      const certsJson = await AsyncStorage.getItem('certifications');
      const certs = certsJson ? JSON.parse(certsJson) : [];
      
      const newCert = {
        _id: Date.now().toString(),
        ...certData,
        createdAt: new Date().toISOString()
      };
      
      certs.push(newCert);
      await AsyncStorage.setItem('certifications', JSON.stringify(certs));
      
      return newCert;
    } catch (error) {
      console.error('Error adding certification:', error);
      throw error;
    }
  },
  
  getCertificationsByUser: async (userId) => {
    try {
      // For now, fall back to AsyncStorage
      const certsJson = await AsyncStorage.getItem('certifications');
      const certs = certsJson ? JSON.parse(certsJson) : [];
      
      return certs.filter(cert => cert.userId === userId);
    } catch (error) {
      console.error('Error getting certifications by user:', error);
      throw error;
    }
  },
  
  getCertificationById: async (id) => {
    try {
      // For now, fall back to AsyncStorage
      const certsJson = await AsyncStorage.getItem('certifications');
      const certs = certsJson ? JSON.parse(certsJson) : [];
      
      return certs.find(cert => cert._id === id);
    } catch (error) {
      console.error('Error getting certification by ID:', error);
      throw error;
    }
  },
  
  updateCertificationProgress: async (id, progress) => {
    try {
      // For now, fall back to AsyncStorage
      const certsJson = await AsyncStorage.getItem('certifications');
      const certs = certsJson ? JSON.parse(certsJson) : [];
      
      const certIndex = certs.findIndex(cert => cert._id === id);
      
      if (certIndex !== -1) {
        certs[certIndex].progress = progress;
        await AsyncStorage.setItem('certifications', JSON.stringify(certs));
        return certs[certIndex];
      }
      
      throw new Error('Certification not found');
    } catch (error) {
      console.error('Error updating certification progress:', error);
      throw error;
    }
  },
  
  deleteCertification: async (id) => {
    try {
      // For now, fall back to AsyncStorage
      const certsJson = await AsyncStorage.getItem('certifications');
      const certs = certsJson ? JSON.parse(certsJson) : [];
      
      const certIndex = certs.findIndex(cert => cert._id === id);
      
      if (certIndex !== -1) {
        const deletedCert = certs[certIndex];
        certs.splice(certIndex, 1);
        await AsyncStorage.setItem('certifications', JSON.stringify(certs));
        return deletedCert;
      }
      
      throw new Error('Certification not found');
    } catch (error) {
      console.error('Error deleting certification:', error);
      throw error;
    }
  }
};

// Topic Management
const topic = {
  addTopic: async (topicData) => {
    try {
      // For now, fall back to AsyncStorage
      const topicsJson = await AsyncStorage.getItem('topics');
      const topics = topicsJson ? JSON.parse(topicsJson) : [];
      
      const newTopic = {
        _id: Date.now().toString(),
        ...topicData,
        createdAt: new Date().toISOString()
      };
      
      topics.push(newTopic);
      await AsyncStorage.setItem('topics', JSON.stringify(topics));
      
      return newTopic;
    } catch (error) {
      console.error('Error adding topic:', error);
      throw error;
    }
  },
  
  getTopicsByCertification: async (certId) => {
    try {
      // For now, fall back to AsyncStorage
      const topicsJson = await AsyncStorage.getItem('topics');
      const topics = topicsJson ? JSON.parse(topicsJson) : [];
      
      return topics.filter(topic => topic.certificationId === certId).sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error getting topics by certification:', error);
      throw error;
    }
  },
  
  updateTopicProgress: async (id, progress) => {
    try {
      // For now, fall back to AsyncStorage
      const topicsJson = await AsyncStorage.getItem('topics');
      const topics = topicsJson ? JSON.parse(topicsJson) : [];
      
      const topicIndex = topics.findIndex(topic => topic._id === id);
      
      if (topicIndex !== -1) {
        topics[topicIndex].progress = progress;
        await AsyncStorage.setItem('topics', JSON.stringify(topics));
        return topics[topicIndex];
      }
      
      throw new Error('Topic not found');
    } catch (error) {
      console.error('Error updating topic progress:', error);
      throw error;
    }
  }
};

// Subtopic Management
const subtopic = {
  addSubtopic: async (subtopicData) => {
    try {
      // For now, fall back to AsyncStorage
      const subtopicsJson = await AsyncStorage.getItem('subtopics');
      const subtopics = subtopicsJson ? JSON.parse(subtopicsJson) : [];
      
      const newSubtopic = {
        _id: Date.now().toString(),
        ...subtopicData,
        createdAt: new Date().toISOString()
      };
      
      subtopics.push(newSubtopic);
      await AsyncStorage.setItem('subtopics', JSON.stringify(subtopics));
      
      return newSubtopic;
    } catch (error) {
      console.error('Error adding subtopic:', error);
      throw error;
    }
  },
  
  getSubtopicsByTopic: async (topicId) => {
    try {
      // For now, fall back to AsyncStorage
      const subtopicsJson = await AsyncStorage.getItem('subtopics');
      const subtopics = subtopicsJson ? JSON.parse(subtopicsJson) : [];
      
      return subtopics.filter(subtopic => subtopic.topicId === topicId).sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error getting subtopics by topic:', error);
      throw error;
    }
  }
};

// Note Management
const note = {
  addNote: async (noteData) => {
    try {
      // For now, fall back to AsyncStorage
      const notesJson = await AsyncStorage.getItem(`notes_${noteData.topicId}`);
      const notes = notesJson ? JSON.parse(notesJson) : [];
      
      const newNote = {
        _id: Date.now().toString(),
        ...noteData,
        timestamp: noteData.timestamp || new Date().toISOString()
      };
      
      notes.push(newNote);
      await AsyncStorage.setItem(`notes_${noteData.topicId}`, JSON.stringify(notes));
      
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },
  
  getNotesByTopic: async (topicId) => {
    try {
      // For now, fall back to AsyncStorage
      const notesJson = await AsyncStorage.getItem(`notes_${topicId}`);
      return notesJson ? JSON.parse(notesJson) : [];
    } catch (error) {
      console.error('Error getting notes by topic:', error);
      throw error;
    }
  },
  
  getNotesBySubtopic: async (subtopicId) => {
    try {
      // For now, fall back to AsyncStorage
      // This is inefficient but works for now
      const keys = await AsyncStorage.getAllKeys();
      const noteKeys = keys.filter(key => key.startsWith('notes_'));
      
      let allNotes = [];
      for (const key of noteKeys) {
        const notesJson = await AsyncStorage.getItem(key);
        if (notesJson) {
          const notes = JSON.parse(notesJson);
          allNotes = [...allNotes, ...notes.filter(note => note.subtopicId === subtopicId)];
        }
      }
      
      return allNotes;
    } catch (error) {
      console.error('Error getting notes by subtopic:', error);
      throw error;
    }
  },
  
  getAllNotes: async () => {
    try {
      // For now, fall back to AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const noteKeys = keys.filter(key => key.startsWith('notes_'));
      
      let allNotes = [];
      for (const key of noteKeys) {
        const notesJson = await AsyncStorage.getItem(key);
        if (notesJson) {
          allNotes = [...allNotes, ...JSON.parse(notesJson)];
        }
      }
      
      return allNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  },
  
  updateNote: async (id, content) => {
    try {
      // For now, fall back to AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const noteKeys = keys.filter(key => key.startsWith('notes_'));
      
      for (const key of noteKeys) {
        const notesJson = await AsyncStorage.getItem(key);
        if (notesJson) {
          let notes = JSON.parse(notesJson);
          const noteIndex = notes.findIndex(note => note._id === id);
          
          if (noteIndex !== -1) {
            // If content is an object, use it directly
            if (typeof content === 'object') {
              notes[noteIndex] = {
                ...notes[noteIndex],
                ...content,
                timestamp: new Date().toISOString()
              };
            } else {
              // If content is a string, update the text field
              notes[noteIndex] = {
                ...notes[noteIndex],
                text: content,
                content: content,
                timestamp: new Date().toISOString()
              };
            }
            
            await AsyncStorage.setItem(key, JSON.stringify(notes));
            return notes[noteIndex];
          }
        }
      }
      
      throw new Error('Note not found');
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },
  
  deleteNote: async (id) => {
    try {
      // For now, fall back to AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const noteKeys = keys.filter(key => key.startsWith('notes_'));
      
      for (const key of noteKeys) {
        const notesJson = await AsyncStorage.getItem(key);
        if (notesJson) {
          let notes = JSON.parse(notesJson);
          const noteIndex = notes.findIndex(note => note._id === id);
          
          if (noteIndex !== -1) {
            const deletedNote = notes[noteIndex];
            notes.splice(noteIndex, 1);
            await AsyncStorage.setItem(key, JSON.stringify(notes));
            return deletedNote;
          }
        }
      }
      
      throw new Error('Note not found');
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }
};

// Quiz Management
const quizService = {
  createQuiz: async (quizData) => {
    try {
      // For now, fall back to AsyncStorage
      const quizzesJson = await AsyncStorage.getItem('quizzes');
      const quizzes = quizzesJson ? JSON.parse(quizzesJson) : [];
      
      const newQuiz = {
        _id: Date.now().toString(),
        ...quizData,
        createdAt: new Date().toISOString()
      };
      
      quizzes.push(newQuiz);
      await AsyncStorage.setItem('quizzes', JSON.stringify(quizzes));
      
      return newQuiz;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },
  
  getQuizzesBySubtopic: async (subtopicId) => {
    try {
      // For now, fall back to AsyncStorage
      const quizzesJson = await AsyncStorage.getItem('quizzes');
      const quizzes = quizzesJson ? JSON.parse(quizzesJson) : [];
      
      return quizzes.filter(quiz => quiz.subtopicId === subtopicId);
    } catch (error) {
      console.error('Error getting quizzes by subtopic:', error);
      throw error;
    }
  },
  
  saveQuizResult: async (resultData) => {
    try {
      // For now, fall back to AsyncStorage
      const resultsJson = await AsyncStorage.getItem('quiz_results');
      const results = resultsJson ? JSON.parse(resultsJson) : [];
      
      const newResult = {
        _id: Date.now().toString(),
        ...resultData,
        createdAt: new Date().toISOString()
      };
      
      results.push(newResult);
      await AsyncStorage.setItem('quiz_results', JSON.stringify(results));
      
      return newResult;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  },
  
  getQuizResultsByUser: async (userId) => {
    try {
      // For now, fall back to AsyncStorage
      const resultsJson = await AsyncStorage.getItem('quiz_results');
      const results = resultsJson ? JSON.parse(resultsJson) : [];
      
      return results.filter(result => result.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting quiz results by user:', error);
      throw error;
    }
  },
  
  saveQuizToHistory: async (quizData) => {
    try {
      // For now, fall back to AsyncStorage
      const historyJson = await AsyncStorage.getItem('quiz_history');
      const history = historyJson ? JSON.parse(historyJson) : [];
      
      const newQuiz = {
        _id: Date.now().toString(),
        ...quizData,
        isHistory: true,
        createdAt: new Date().toISOString()
      };
      
      history.push(newQuiz);
      await AsyncStorage.setItem('quiz_history', JSON.stringify(history));
      
      return newQuiz;
    } catch (error) {
      console.error('Error saving quiz to history:', error);
      throw error;
    }
  },
  
  getQuizHistory: async () => {
    try {
      // For now, fall back to AsyncStorage
      const historyJson = await AsyncStorage.getItem('quiz_history');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting quiz history:', error);
      throw error;
    }
  },
  
  clearQuizHistory: async () => {
    try {
      // For now, fall back to AsyncStorage
      await AsyncStorage.setItem('quiz_history', JSON.stringify([]));
      return true;
    } catch (error) {
      console.error('Error clearing quiz history:', error);
      throw error;
    }
  }
};

// Export as both default and named export for compatibility
const MongoDatabase = {
  initialize,
  userService,
  certification,
  topic,
  subtopic,
  note,
  quizService
};

export { MongoDatabase };
export default MongoDatabase;