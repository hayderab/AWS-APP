import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';

// Default user ID for demo purposes - in a real app, this would come from authentication
const DEFAULT_USER_ID = '65f9c8f7e4b0a4f9c8f7e4b0';

// Flag to determine if we should use local storage fallback when API fails
const USE_LOCAL_FALLBACK = true;

// Initialize MongoDB connection
const initialize = async () => {
  try {
    // Check if we have a user ID stored
    const userId = await AsyncStorage.getItem('userId') || DEFAULT_USER_ID;
    if (!userId) {
      console.warn('No user ID found, using default');
    }
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

// Helper function to handle API errors with local storage fallback
const apiWithFallback = async (apiCall, fallbackKey, fallbackData = []) => {
  try {
    // Try API call first
    const result = await apiCall();
    
    // If successful, update local cache
    if (result && USE_LOCAL_FALLBACK) {
      await AsyncStorage.setItem(fallbackKey, JSON.stringify(result));
    }
    
    return result;
  } catch (error) {
    console.error(`API Error - ${fallbackKey}:`, error);
    
    // If API fails and fallback is enabled, try local storage
    if (USE_LOCAL_FALLBACK) {
      console.log(`Falling back to local storage for ${fallbackKey}`);
      const cachedData = await AsyncStorage.getItem(fallbackKey);
      return cachedData ? JSON.parse(cachedData) : fallbackData;
    }
    
    // If no fallback or fallback fails, return empty result
    return fallbackData;
  }
};

// Helper function to save data with fallback
const saveWithFallback = async (apiCall, fallbackKey, data, idField = '_id') => {
  try {
    // Try API call first
    const result = await apiCall();
    
    // If successful and fallback is enabled, update local cache
    if (result && USE_LOCAL_FALLBACK) {
      // Get existing data
      const cachedDataStr = await AsyncStorage.getItem(fallbackKey);
      const cachedData = cachedDataStr ? JSON.parse(cachedDataStr) : [];
      
      // Add or update the item in the cache
      if (result[idField]) {
        const index = cachedData.findIndex(item => item[idField] === result[idField]);
        if (index >= 0) {
          cachedData[index] = result;
        } else {
          cachedData.unshift(result);
        }
        await AsyncStorage.setItem(fallbackKey, JSON.stringify(cachedData));
      }
    }
    
    return result;
  } catch (error) {
    console.error(`API Error - Saving ${fallbackKey}:`, error);
    
    // If API fails and fallback is enabled, save to local storage
    if (USE_LOCAL_FALLBACK) {
      console.log(`Falling back to local storage for saving ${fallbackKey}`);
      
      try {
        // Generate a temporary ID if needed
        if (!data[idField]) {
          data[idField] = `temp_${Date.now()}`;
        }
        
        // Get existing data
        const cachedDataStr = await AsyncStorage.getItem(fallbackKey);
        const cachedData = cachedDataStr ? JSON.parse(cachedDataStr) : [];
        
        // Add or update the item
        const index = cachedData.findIndex(item => item[idField] === data[idField]);
        if (index >= 0) {
          cachedData[index] = data;
        } else {
          cachedData.unshift(data);
        }
        
        await AsyncStorage.setItem(fallbackKey, JSON.stringify(cachedData));
        return data;
      } catch (fallbackError) {
        console.error(`Fallback Error - Saving ${fallbackKey}:`, fallbackError);
        return null;
      }
    }
    
    return null;
  }
};

// Helper function to delete data with fallback
const deleteWithFallback = async (apiCall, fallbackKey, id, idField = '_id') => {
  try {
    // Try API call first
    const result = await apiCall();
    
    // If successful and fallback is enabled, update local cache
    if (result && USE_LOCAL_FALLBACK) {
      const cachedDataStr = await AsyncStorage.getItem(fallbackKey);
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        const updatedData = cachedData.filter(item => item[idField] !== id);
        await AsyncStorage.setItem(fallbackKey, JSON.stringify(updatedData));
      }
    }
    
    return result;
  } catch (error) {
    console.error(`API Error - Deleting from ${fallbackKey}:`, error);
    
    // If API fails and fallback is enabled, delete from local storage
    if (USE_LOCAL_FALLBACK) {
      console.log(`Falling back to local storage for deleting from ${fallbackKey}`);
      
      try {
        const cachedDataStr = await AsyncStorage.getItem(fallbackKey);
        if (cachedDataStr) {
          const cachedData = JSON.parse(cachedDataStr);
          const updatedData = cachedData.filter(item => item[idField] !== id);
          await AsyncStorage.setItem(fallbackKey, JSON.stringify(updatedData));
          return true;
        }
      } catch (fallbackError) {
        console.error(`Fallback Error - Deleting from ${fallbackKey}:`, fallbackError);
      }
    }
    
    return false;
  }
};

// User Management
const user = {
  getCurrentUser: async () => {
    try {
      const userId = await AsyncStorage.getItem('userId') || DEFAULT_USER_ID;
      if (!userId) return null;
      
      return await apiWithFallback(
        () => ApiService.user.getById(userId),
        'current_user'
      );
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  login: async (email, password) => {
    try {
      const user = await ApiService.user.login({ email, password });
      if (user && user._id) {
        await AsyncStorage.setItem('userId', user._id);
        await AsyncStorage.setItem('current_user', JSON.stringify(user));
        
        // Store the JWT token separately for API requests
        if (user.token) {
          await AsyncStorage.setItem('token', user.token);
        } else {
          console.warn('No token received from login response');
        }
        
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error logging in:', error);
      return null;
    }
  },
  
  register: async (userData) => {
    try {
      const user = await ApiService.user.register(userData);
      if (user && user._id) {
        await AsyncStorage.setItem('userId', user._id);
        await AsyncStorage.setItem('current_user', JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error registering user:', error);
      return null;
    }
  }
};

// Certification Management
const certification = {
  getAllCertifications: async () => {
    try {
      const userId = await AsyncStorage.getItem('userId') || DEFAULT_USER_ID;
      return await apiWithFallback(
        () => ApiService.certification.getByUser(userId),
        'certifications'
      );
    } catch (error) {
      console.error('Error getting certifications:', error);
      return [];
    }
  },
  
  getCertificationById: async (id) => {
    try {
      return await apiWithFallback(
        () => ApiService.certification.getById(id),
        `certification_${id}`
      );
    } catch (error) {
      console.error('Error getting certification:', error);
      return null;
    }
  },
  
  addCertification: async (certificationData) => {
    try {
      const userId = await AsyncStorage.getItem('userId') || DEFAULT_USER_ID;
      const data = {
        ...certificationData,
        userId
      };
      
      return await saveWithFallback(
        () => ApiService.certification.create(data),
        'certifications',
        data
      );
    } catch (error) {
      console.error('Error adding certification:', error);
      return null;
    }
  },
  
  updateCertification: async (id, updateData) => {
    try {
      return await saveWithFallback(
        () => ApiService.certification.update(id, updateData),
        'certifications',
        { _id: id, ...updateData }
      );
    } catch (error) {
      console.error('Error updating certification:', error);
      return null;
    }
  },
  
  deleteCertification: async (id) => {
    try {
      return await deleteWithFallback(
        () => ApiService.certification.delete(id),
        'certifications',
        id
      );
    } catch (error) {
      console.error('Error deleting certification:', error);
      return false;
    }
  }
};

// Topic Management
const topic = {
  getTopicsByCertification: async (certificationId) => {
    try {
      return await apiWithFallback(
        () => ApiService.topic.getByCertification(certificationId),
        `topics_${certificationId}`
      );
    } catch (error) {
      console.error('Error getting topics:', error);
      return [];
    }
  },
  
  getTopicById: async (id) => {
    try {
      return await apiWithFallback(
        () => ApiService.topic.getById(id),
        `topic_${id}`
      );
    } catch (error) {
      console.error('Error getting topic:', error);
      return null;
    }
  },
  
  addTopic: async (topicData) => {
    try {
      return await saveWithFallback(
        () => ApiService.topic.create(topicData),
        `topics_${topicData.certificationId}`,
        topicData
      );
    } catch (error) {
      console.error('Error adding topic:', error);
      return null;
    }
  },
  
  updateTopic: async (id, updateData) => {
    try {
      const topic = await MongoDatabase.topic.getTopicById(id);
      const certificationId = topic?.certificationId || updateData.certificationId;
      
      return await saveWithFallback(
        () => ApiService.topic.update(id, updateData),
        `topics_${certificationId}`,
        { _id: id, ...updateData }
      );
    } catch (error) {
      console.error('Error updating topic:', error);
      return null;
    }
  },
  
  deleteTopic: async (id) => {
    try {
      const topic = await MongoDatabase.topic.getTopicById(id);
      const certificationId = topic?.certificationId;
      
      return await deleteWithFallback(
        () => ApiService.topic.delete(id),
        `topics_${certificationId}`,
        id
      );
    } catch (error) {
      console.error('Error deleting topic:', error);
      return false;
    }
  }
};

// Subtopic Management
const subtopic = {
  getSubtopicsByTopic: async (topicId) => {
    try {
      return await apiWithFallback(
        () => ApiService.subtopic.getByTopic(topicId),
        `subtopics_${topicId}`
      );
    } catch (error) {
      console.error('Error getting subtopics:', error);
      return [];
    }
  },
  
  getSubtopicById: async (id) => {
    try {
      return await apiWithFallback(
        () => ApiService.subtopic.getById(id),
        `subtopic_${id}`
      );
    } catch (error) {
      console.error('Error getting subtopic:', error);
      return null;
    }
  },
  
  addSubtopic: async (subtopicData) => {
    try {
      return await saveWithFallback(
        () => ApiService.subtopic.create(subtopicData),
        `subtopics_${subtopicData.topicId}`,
        subtopicData
      );
    } catch (error) {
      console.error('Error adding subtopic:', error);
      return null;
    }
  },
  
  updateSubtopic: async (id, updateData) => {
    try {
      const subtopic = await MongoDatabase.subtopic.getSubtopicById(id);
      const topicId = subtopic?.topicId || updateData.topicId;
      
      return await saveWithFallback(
        () => ApiService.subtopic.update(id, updateData),
        `subtopics_${topicId}`,
        { _id: id, ...updateData }
      );
    } catch (error) {
      console.error('Error updating subtopic:', error);
      return null;
    }
  },
  
  deleteSubtopic: async (id) => {
    try {
      const subtopic = await MongoDatabase.subtopic.getSubtopicById(id);
      const topicId = subtopic?.topicId;
      
      return await deleteWithFallback(
        () => ApiService.subtopic.delete(id),
        `subtopics_${topicId}`,
        id
      );
    } catch (error) {
      console.error('Error deleting subtopic:', error);
      return false;
    }
  }
};

// Note Management
const note = {
  getAllNotes: async () => {
    try {
      const userId = await AsyncStorage.getItem('userId') || DEFAULT_USER_ID;
      return await apiWithFallback(
        () => ApiService.note.getByUser(userId),
        'notes'
      );
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  },
  
  getNotesByTopic: async (topicId) => {
    try {
      return await apiWithFallback(
        () => ApiService.note.getByTopic(topicId),
        `notes_topic_${topicId}`
      );
    } catch (error) {
      console.error('Error getting notes by topic:', error);
      return [];
    }
  },
  
  getNotesBySubtopic: async (subtopicId) => {
    try {
      return await apiWithFallback(
        () => ApiService.note.getBySubtopic(subtopicId),
        `notes_subtopic_${subtopicId}`
      );
    } catch (error) {
      console.error('Error getting notes by subtopic:', error);
      return [];
    }
  },
  
  getNoteById: async (id) => {
    try {
      return await apiWithFallback(
        () => ApiService.note.getById(id),
        `note_${id}`
      );
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  },
  
  addNote: async (noteData) => {
    try {
      const userId = await AsyncStorage.getItem('userId') || DEFAULT_USER_ID;
      const data = {
        ...noteData,
        userId
      };
      
      return await saveWithFallback(
        () => ApiService.note.create(data),
        noteData.topicId ? `notes_topic_${noteData.topicId}` : 'notes',
        data
      );
    } catch (error) {
      console.error('Error adding note:', error);
      return null;
    }
  },
  
  updateNote: async (id, updateData) => {
    try {
      const note = await MongoDatabase.note.getNoteById(id);
      const storageKey = note?.topicId ? `notes_topic_${note.topicId}` : 'notes';
      
      return await saveWithFallback(
        () => ApiService.note.update(id, updateData),
        storageKey,
        { _id: id, ...updateData }
      );
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  },
  
  deleteNote: async (id) => {
    try {
      const note = await MongoDatabase.note.getNoteById(id);
      const storageKey = note?.topicId ? `notes_topic_${note.topicId}` : 'notes';
      
      return await deleteWithFallback(
        () => ApiService.note.delete(id),
        storageKey,
        id
      );
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }
};

// Quiz Management
const quiz = {
  getQuizzesByTopic: async (topicId) => {
    try {
      return await apiWithFallback(
        () => ApiService.quiz.getByTopic(topicId),
        `quizzes_topic_${topicId}`
      );
    } catch (error) {
      console.error('Error getting quizzes by topic:', error);
      return [];
    }
  },
  
  getQuizzesBySubtopic: async (subtopicId) => {
    try {
      return await apiWithFallback(
        () => ApiService.quiz.getBySubtopic(subtopicId),
        `quizzes_subtopic_${subtopicId}`
      );
    } catch (error) {
      console.error('Error getting quizzes by subtopic:', error);
      return [];
    }
  },
  
  getQuizById: async (id) => {
    try {
      return await apiWithFallback(
        () => ApiService.quiz.getById(id),
        `quiz_${id}`
      );
    } catch (error) {
      console.error('Error getting quiz:', error);
      return null;
    }
  },
  
  addQuiz: async (quizData) => {
    try {
      return await saveWithFallback(
        () => ApiService.quiz.create(quizData),
        quizData.topicId ? `quizzes_topic_${quizData.topicId}` : 'quizzes',
        quizData
      );
    } catch (error) {
      console.error('Error adding quiz:', error);
      return null;
    }
  },
  
  saveQuizToHistory: async (quizData) => {
    try {
      return await saveWithFallback(
        () => ApiService.quiz.saveToHistory(quizData),
        'quiz_history',
        quizData
      );
    } catch (error) {
      console.error('Error saving quiz to history:', error);
      return null;
    }
  },
  
  getQuizHistory: async () => {
    try {
      return await apiWithFallback(
        () => ApiService.quiz.getHistory(),
        'quiz_history'
      );
    } catch (error) {
      console.error('Error getting quiz history:', error);
      return [];
    }
  },
  
  clearQuizHistory: async () => {
    try {
      const result = await ApiService.quiz.clearHistory();
      if (result) {
        await AsyncStorage.setItem('quiz_history', JSON.stringify([]));
      }
      return result;
    } catch (error) {
      console.error('Error clearing quiz history:', error);
      // Try local fallback
      if (USE_LOCAL_FALLBACK) {
        await AsyncStorage.setItem('quiz_history', JSON.stringify([]));
        return true;
      }
      return false;
    }
  }
};

// Quiz Result Management
const quizResult = {
  saveQuizResult: async (resultData) => {
    try {
      const userId = await AsyncStorage.getItem('userId') || DEFAULT_USER_ID;
      const data = {
        ...resultData,
        userId
      };
      
      return await saveWithFallback(
        () => ApiService.quizResult.save(data),
        'quiz_results',
        data
      );
    } catch (error) {
      console.error('Error saving quiz result:', error);
      return null;
    }
  },
  
  getQuizResultsByUser: async () => {
    try {
      const userId = await AsyncStorage.getItem('userId') || DEFAULT_USER_ID;
      return await apiWithFallback(
        () => ApiService.quizResult.getByUser(userId),
        'quiz_results'
      );
    } catch (error) {
      console.error('Error getting quiz results by user:', error);
      return [];
    }
  },
  
  getQuizResultsByQuiz: async (quizId) => {
    try {
      return await apiWithFallback(
        () => ApiService.quizResult.getByQuiz(quizId),
        `quiz_results_${quizId}`
      );
    } catch (error) {
      console.error('Error getting quiz results by quiz:', error);
      return [];
    }
  }
};

// Export all services
const MongoDatabase = {
  initialize,
  user,
  certification,
  topic,
  subtopic,
  note,
  quiz,
  quizService: quiz, // Add alias for backward compatibility
  quizResult
};

export default MongoDatabase;