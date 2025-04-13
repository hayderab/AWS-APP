/**
 * Migration Utility for AWS Certification Tutor
 * Helps migrate data from AsyncStorage to MongoDB
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectToDatabase, disconnectFromDatabase, storeDbPassword } from '../config/mongodb';

// Models
import User from '../models/User';
import Certification from '../models/Certification';
import Topic from '../models/Topic';
import Subtopic from '../models/Subtopic';
import Note from '../models/Note';
import Quiz from '../models/Quiz';
import QuizResult from '../models/QuizResult';

// Storage keys from LocalDatabase
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

class MigrationUtility {
  /**
   * Initialize the migration utility
   * @param {string} dbPassword - MongoDB password
   * @returns {Promise<boolean>} - Connection success status
   */
  static async initialize(dbPassword) {
    try {
      // Store the password for future use
      await storeDbPassword(dbPassword);
      
      // Connect to MongoDB
      return await connectToDatabase(dbPassword);
    } catch (error) {
      console.error('Migration initialization error:', error);
      return false;
    }
  }

  /**
   * Close the database connection
   * @returns {Promise<boolean>} - Disconnection success status
   */
  static async close() {
    return await disconnectFromDatabase();
  }

  /**
   * Migrate all data from AsyncStorage to MongoDB
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateAllData() {
    try {
      const results = {
        users: await this.migrateUsers(),
        certifications: await this.migrateCertifications(),
        topics: await this.migrateTopics(),
        subtopics: await this.migrateSubtopics(),
        notes: await this.migrateNotes(),
        quizzes: await this.migrateQuizzes(),
        quizResults: await this.migrateQuizResults(),
      };

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Migration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Migrate users from AsyncStorage to MongoDB
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateUsers() {
    try {
      // Get users from AsyncStorage
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      if (users.length === 0) {
        return { migrated: 0, message: 'No users to migrate' };
      }
      
      // Map local IDs to MongoDB IDs
      const idMap = {};
      let migratedCount = 0;
      
      // Migrate each user
      for (const user of users) {
        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({ email: user.email });
        
        if (existingUser) {
          // Map the local ID to the MongoDB ID
          idMap[user.id] = existingUser._id.toString();
          continue;
        }
        
        // Create new user in MongoDB
        const newUser = new User({
          email: user.email,
          password: user.password, // In production, should be hashed
          displayName: user.displayName,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date()
        });
        
        await newUser.save();
        
        // Map the local ID to the MongoDB ID
        idMap[user.id] = newUser._id.toString();
        migratedCount++;
      }
      
      // Store the ID mapping for reference in other migrations
      await AsyncStorage.setItem('user_id_map', JSON.stringify(idMap));
      
      return {
        migrated: migratedCount,
        total: users.length,
        idMap
      };
    } catch (error) {
      console.error('User migration error:', error);
      return {
        migrated: 0,
        error: error.message
      };
    }
  }

  /**
   * Migrate certifications from AsyncStorage to MongoDB
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateCertifications() {
    try {
      // Get certifications from AsyncStorage
      const certificationsJson = await AsyncStorage.getItem(STORAGE_KEYS.CERTIFICATIONS);
      const certifications = certificationsJson ? JSON.parse(certificationsJson) : [];
      
      if (certifications.length === 0) {
        return { migrated: 0, message: 'No certifications to migrate' };
      }
      
      // Get user ID mapping
      const userIdMapJson = await AsyncStorage.getItem('user_id_map');
      const userIdMap = userIdMapJson ? JSON.parse(userIdMapJson) : {};
      
      // Map local IDs to MongoDB IDs
      const idMap = {};
      let migratedCount = 0;
      
      // Migrate each certification
      for (const cert of certifications) {
        // Map the user ID if available
        const userId = cert.userId && userIdMap[cert.userId] 
          ? userIdMap[cert.userId] 
          : cert.userId;
        
        // Create new certification in MongoDB
        const newCert = new Certification({
          title: cert.title,
          description: cert.description,
          level: cert.level || 'associate',
          examCode: cert.examCode,
          userId: userId,
          createdAt: cert.createdAt ? new Date(cert.createdAt) : new Date(),
          targetDate: cert.targetDate ? new Date(cert.targetDate) : null,
          progress: cert.progress || 0
        });
        
        await newCert.save();
        
        // Map the local ID to the MongoDB ID
        idMap[cert.id] = newCert._id.toString();
        migratedCount++;
      }
      
      // Store the ID mapping for reference in other migrations
      await AsyncStorage.setItem('certification_id_map', JSON.stringify(idMap));
      
      return {
        migrated: migratedCount,
        total: certifications.length,
        idMap
      };
    } catch (error) {
      console.error('Certification migration error:', error);
      return {
        migrated: 0,
        error: error.message
      };
    }
  }

  /**
   * Migrate topics from AsyncStorage to MongoDB
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateTopics() {
    try {
      // Get topics from AsyncStorage
      const topicsJson = await AsyncStorage.getItem(STORAGE_KEYS.TOPICS);
      const topics = topicsJson ? JSON.parse(topicsJson) : [];
      
      if (topics.length === 0) {
        return { migrated: 0, message: 'No topics to migrate' };
      }
      
      // Get certification ID mapping
      const certIdMapJson = await AsyncStorage.getItem('certification_id_map');
      const certIdMap = certIdMapJson ? JSON.parse(certIdMapJson) : {};
      
      // Map local IDs to MongoDB IDs
      const idMap = {};
      let migratedCount = 0;
      
      // Migrate each topic
      for (const topic of topics) {
        // Map the certification ID if available
        const certificationId = topic.certificationId && certIdMap[topic.certificationId] 
          ? certIdMap[topic.certificationId] 
          : topic.certificationId;
        
        // Create new topic in MongoDB
        const newTopic = new Topic({
          title: topic.title,
          description: topic.description,
          certificationId: certificationId,
          order: topic.order || 0,
          createdAt: topic.createdAt ? new Date(topic.createdAt) : new Date(),
          progress: topic.progress || 0
        });
        
        await newTopic.save();
        
        // Map the local ID to the MongoDB ID
        idMap[topic.id] = newTopic._id.toString();
        migratedCount++;
      }
      
      // Store the ID mapping for reference in other migrations
      await AsyncStorage.setItem('topic_id_map', JSON.stringify(idMap));
      
      return {
        migrated: migratedCount,
        total: topics.length,
        idMap
      };
    } catch (error) {
      console.error('Topic migration error:', error);
      return {
        migrated: 0,
        error: error.message
      };
    }
  }

  /**
   * Migrate subtopics from AsyncStorage to MongoDB
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateSubtopics() {
    try {
      // Get subtopics from AsyncStorage
      const subtopicsJson = await AsyncStorage.getItem(STORAGE_KEYS.SUBTOPICS);
      const subtopics = subtopicsJson ? JSON.parse(subtopicsJson) : [];
      
      if (subtopics.length === 0) {
        return { migrated: 0, message: 'No subtopics to migrate' };
      }
      
      // Get topic ID mapping
      const topicIdMapJson = await AsyncStorage.getItem('topic_id_map');
      const topicIdMap = topicIdMapJson ? JSON.parse(topicIdMapJson) : {};
      
      // Map local IDs to MongoDB IDs
      const idMap = {};
      let migratedCount = 0;
      
      // Migrate each subtopic
      for (const subtopic of subtopics) {
        // Map the topic ID if available
        const topicId = subtopic.topicId && topicIdMap[subtopic.topicId] 
          ? topicIdMap[subtopic.topicId] 
          : subtopic.topicId;
        
        // Create new subtopic in MongoDB
        const newSubtopic = new Subtopic({
          title: subtopic.title,
          description: subtopic.description,
          topicId: topicId,
          order: subtopic.order || 0,
          createdAt: subtopic.createdAt ? new Date(subtopic.createdAt) : new Date(),
          content: subtopic.content,
          progress: subtopic.progress || 0
        });
        
        await newSubtopic.save();
        
        // Map the local ID to the MongoDB ID
        idMap[subtopic.id] = newSubtopic._id.toString();
        migratedCount++;
      }
      
      // Store the ID mapping for reference in other migrations
      await AsyncStorage.setItem('subtopic_id_map', JSON.stringify(idMap));
      
      return {
        migrated: migratedCount,
        total: subtopics.length,
        idMap
      };
    } catch (error) {
      console.error('Subtopic migration error:', error);
      return {
        migrated: 0,
        error: error.message
      };
    }
  }

  /**
   * Migrate notes from AsyncStorage to MongoDB
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateNotes() {
    try {
      // Get notes from AsyncStorage
      const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      const notes = notesJson ? JSON.parse(notesJson) : [];
      
      if (notes.length === 0) {
        return { migrated: 0, message: 'No notes to migrate' };
      }
      
      // Get ID mappings
      const userIdMapJson = await AsyncStorage.getItem('user_id_map');
      const userIdMap = userIdMapJson ? JSON.parse(userIdMapJson) : {};
      
      const topicIdMapJson = await AsyncStorage.getItem('topic_id_map');
      const topicIdMap = topicIdMapJson ? JSON.parse(topicIdMapJson) : {};
      
      const subtopicIdMapJson = await AsyncStorage.getItem('subtopic_id_map');
      const subtopicIdMap = subtopicIdMapJson ? JSON.parse(subtopicIdMapJson) : {};
      
      // Map local IDs to MongoDB IDs
      const idMap = {};
      let migratedCount = 0;
      
      // Migrate each note
      for (const note of notes) {
        // Map IDs if available
        const userId = note.userId && userIdMap[note.userId] 
          ? userIdMap[note.userId] 
          : note.userId;
          
        const topicId = note.topicId && topicIdMap[note.topicId] 
          ? topicIdMap[note.topicId] 
          : note.topicId;
          
        const subtopicId = note.subtopicId && subtopicIdMap[note.subtopicId] 
          ? subtopicIdMap[note.subtopicId] 
          : note.subtopicId;
        
        // Determine category based on available data
        let category = note.category || 'general';
        if (subtopicId && !note.category) {
          category = 'study';
        }
        
        // Create new note in MongoDB
        const newNote = new Note({
          title: note.title,
          content: note.content,
          category: category,
          tags: note.tags || [],
          userId: userId,
          topicId: topicId,
          subtopicId: subtopicId,
          createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
          updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
          isPinned: note.isPinned || false
        });
        
        await newNote.save();
        
        // Map the local ID to the MongoDB ID
        idMap[note.id] = newNote._id.toString();
        migratedCount++;
      }
      
      // Store the ID mapping for reference
      await AsyncStorage.setItem('note_id_map', JSON.stringify(idMap));
      
      return {
        migrated: migratedCount,
        total: notes.length,
        idMap
      };
    } catch (error) {
      console.error('Note migration error:', error);
      return {
        migrated: 0,
        error: error.message
      };
    }
  }

  /**
   * Migrate quizzes from AsyncStorage to MongoDB
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateQuizzes() {
    try {
      // Get quizzes from AsyncStorage
      const quizzesJson = await AsyncStorage.getItem(STORAGE_KEYS.QUIZZES);
      const quizzes = quizzesJson ? JSON.parse(quizzesJson) : [];
      
      if (quizzes.length === 0) {
        return { migrated: 0, message: 'No quizzes to migrate' };
      }
      
      // Get ID mappings
      const topicIdMapJson = await AsyncStorage.getItem('topic_id_map');
      const topicIdMap = topicIdMapJson ? JSON.parse(topicIdMapJson) : {};
      
      const subtopicIdMapJson = await AsyncStorage.getItem('subtopic_id_map');
      const subtopicIdMap = subtopicIdMapJson ? JSON.parse(subtopicIdMapJson) : {};
      
      // Map local IDs to MongoDB IDs
      const idMap = {};
      let migratedCount = 0;
      
      // Migrate each quiz
      for (const quiz of quizzes) {
        // Map IDs if available
        const topicId = quiz.topicId && topicIdMap[quiz.topicId] 
          ? topicIdMap[quiz.topicId] 
          : quiz.topicId;
          
        const subtopicId = quiz.subtopicId && subtopicIdMap[quiz.subtopicId] 
          ? subtopicIdMap[quiz.subtopicId] 
          : quiz.subtopicId;
        
        // Create new quiz in MongoDB
        const newQuiz = new Quiz({
          title: quiz.title,
          description: quiz.description,
          topicId: topicId,
          subtopicId: subtopicId,
          questions: quiz.questions || [],
          difficulty: quiz.difficulty || 'medium',
          timeLimit: quiz.timeLimit || 0,
          createdAt: quiz.createdAt ? new Date(quiz.createdAt) : new Date()
        });
        
        await newQuiz.save();
        
        // Map the local ID to the MongoDB ID
        idMap[quiz.id] = newQuiz._id.toString();
        migratedCount++;
      }
      
      // Store the ID mapping for reference
      await AsyncStorage.setItem('quiz_id_map', JSON.stringify(idMap));
      
      return {
        migrated: migratedCount,
        total: quizzes.length,
        idMap
      };
    } catch (error) {
      console.error('Quiz migration error:', error);
      return {
        migrated: 0,
        error: error.message
      };
    }
  }

  /**
   * Migrate quiz results from AsyncStorage to MongoDB
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateQuizResults() {
    try {
      // Get quiz results from AsyncStorage
      const resultsJson = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
      const results = resultsJson ? JSON.parse(resultsJson) : [];
      
      if (results.length === 0) {
        return { migrated: 0, message: 'No quiz results to migrate' };
      }
      
      // Get ID mappings
      const userIdMapJson = await AsyncStorage.getItem('user_id_map');
      const userIdMap = userIdMapJson ? JSON.parse(userIdMapJson) : {};
      
      const quizIdMapJson = await AsyncStorage.getItem('quiz_id_map');
      const quizIdMap = quizIdMapJson ? JSON.parse(quizIdMapJson) : {};
      
      let migratedCount = 0;
      
      // Migrate each quiz result
      for (const result of results) {
        // Map IDs if available
        const userId = result.userId && userIdMap[result.userId] 
          ? userIdMap[result.userId] 
          : result.userId;
          
        const quizId = result.quizId && quizIdMap[result.quizId] 
          ? quizIdMap[result.quizId] 
          : result.quizId;
        
        // Create new quiz result in MongoDB
        const newResult = new QuizResult({
          quizId: quizId,
          userId: userId,
          score: result.score,
          answers: result.answers || [],
          timeSpent: result.timeSpent || 0,
          timestamp: result.timestamp ? new Date(result.timestamp) : new Date()
        });
        
        await newResult.save();
        migratedCount++;
      }
      
      return {
        migrated: migratedCount,
        total: results.length
      };
    } catch (error) {
      console.error('Quiz result migration error:', error);
      return {
        migrated: 0,
        error: error.message
      };
    }
  }

  /**
   * Create a migration report
   * @param {Object} results - Migration results
   * @returns {string} - Formatted report
   */
  static createMigrationReport(results) {
    if (!results || !results.success) {
      return `Migration failed: ${results?.error || 'Unknown error'}`;
    }
    
    let report = '=== AWS Certification Tutor Migration Report ===\n\n';
    
    // Users
    report += `Users: ${results.results.users.migrated}/${results.results.users.total} migrated\n`;
    if (results.results.users.error) {
      report += `  Error: ${results.results.users.error}\n`;
    }
    
    // Certifications
    report += `Certifications: ${results.results.certifications.migrated}/${results.results.certifications.total} migrated\n`;
    if (results.results.certifications.error) {
      report += `  Error: ${results.results.certifications.error}\n`;
    }
    
    // Topics
    report += `Topics: ${results.results.topics.migrated}/${results.results.topics.total} migrated\n`;
    if (results.results.topics.error) {
      report += `  Error: ${results.results.topics.error}\n`;
    }
    
    // Subtopics
    report += `Subtopics: ${results.results.subtopics.migrated}/${results.results.subtopics.total} migrated\n`;
    if (results.results.subtopics.error) {
      report += `  Error: ${results.results.subtopics.error}\n`;
    }
    
    // Notes
    report += `Notes: ${results.results.notes.migrated}/${results.results.notes.total} migrated\n`;
    if (results.results.notes.error) {
      report += `  Error: ${results.results.notes.error}\n`;
    }
    
    // Quizzes
    report += `Quizzes: ${results.results.quizzes.migrated}/${results.results.quizzes.total} migrated\n`;
    if (results.results.quizzes.error) {
      report += `  Error: ${results.results.quizzes.error}\n`;
    }
    
    // Quiz Results
    report += `Quiz Results: ${results.results.quizResults.migrated}/${results.results.quizResults.total} migrated\n`;
    if (results.results.quizResults.error) {
      report += `  Error: ${results.results.quizResults.error}\n`;
    }
    
    report += '\nMigration completed successfully!';
    
    return report;
  }
}

export default MigrationUtility;
