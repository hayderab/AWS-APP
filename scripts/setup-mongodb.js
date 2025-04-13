/**
 * MongoDB Setup Script
 * 
 * This script sets up the MongoDB collections and indexes for the AWS Certification Tutor app.
 * Run this script directly with Node.js to create the database structure without going through the app.
 * 
 * Usage:
 * node scripts/setup-mongodb.js <your_mongodb_password>
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://h4d3rdevelopment:<db_password>@cluster0.ivok04x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Schema definitions
const UserSchema = new mongoose.Schema({
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

const CertificationSchema = new mongoose.Schema({
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

const TopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a topic title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
  },
  certificationId: {
    type: mongoose.Schema.Types.ObjectId,
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

const SubtopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a subtopic title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic ID is required']
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});

const NoteSchema = new mongoose.Schema({
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
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  },
  subtopicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subtopic'
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
  }
});

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide a question']
  },
  options: [{
    type: String,
    required: [true, 'Please provide options']
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Please provide the correct answer index']
  },
  explanation: {
    type: String
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a quiz title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  },
  subtopicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subtopic'
  },
  questions: [QuestionSchema],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  timeLimit: {
    type: Number,
    default: 0 // 0 means no time limit
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const QuizResultSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required']
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
    max: 100
  },
  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean
  }],
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Get MongoDB password from command line
const password = process.argv[2];

if (!password) {
  console.error('Error: MongoDB password is required');
  console.log('Usage: node scripts/setup-mongodb.js <your_mongodb_password>');
  process.exit(1);
}

// Connect to MongoDB
const connectionString = MONGODB_URI.replace('<db_password>', password);

mongoose.connect(connectionString)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    return setupCollections();
  })
  .then(() => {
    console.log('MongoDB setup completed successfully');
    mongoose.disconnect();
  })
  .catch((error) => {
    console.error('MongoDB setup error:', error);
    process.exit(1);
  });

// Setup collections and indexes
async function setupCollections() {
  try {
    // Create models
    const User = mongoose.model('User', UserSchema);
    const Certification = mongoose.model('Certification', CertificationSchema);
    const Topic = mongoose.model('Topic', TopicSchema);
    const Subtopic = mongoose.model('Subtopic', SubtopicSchema);
    const Note = mongoose.model('Note', NoteSchema);
    const Quiz = mongoose.model('Quiz', QuizSchema);
    const QuizResult = mongoose.model('QuizResult', QuizResultSchema);
    
    // Create indexes
    await User.createIndexes();
    await Certification.createIndexes();
    await Topic.createIndexes();
    await Subtopic.createIndexes();
    await Note.createIndexes();
    await Quiz.createIndexes();
    await QuizResult.createIndexes();
    
    console.log('Collections and indexes created successfully');
    
    // Create sample data if needed
    const createSampleData = process.argv.includes('--with-sample-data');
    
    if (createSampleData) {
      await createSampleDataSets();
      console.log('Sample data created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up collections:', error);
    throw error;
  }
}

// Create sample data
async function createSampleDataSets() {
  try {
    const User = mongoose.model('User');
    const Certification = mongoose.model('Certification');
    const Topic = mongoose.model('Topic');
    const Subtopic = mongoose.model('Subtopic');
    const Note = mongoose.model('Note');
    
    // Create a sample user
    const user = new User({
      email: 'sample@example.com',
      password: 'password123',
      displayName: 'Sample User'
    });
    
    await user.save();
    
    // Create a sample certification
    const certification = new Certification({
      title: 'AWS Certified Solutions Architect - Associate',
      description: 'The AWS Certified Solutions Architect - Associate examination is intended for individuals who perform a solutions architect role.',
      level: 'associate',
      examCode: 'SAA-C03',
      userId: user._id.toString(),
      progress: 25
    });
    
    await certification.save();
    
    // Create sample topics
    const topic1 = new Topic({
      title: 'Design Resilient Architectures',
      description: 'Design resilient and highly available architecture.',
      certificationId: certification._id,
      order: 1,
      progress: 40
    });
    
    const topic2 = new Topic({
      title: 'Design High-Performing Architectures',
      description: 'Design high-performance and scalable architecture.',
      certificationId: certification._id,
      order: 2,
      progress: 20
    });
    
    await topic1.save();
    await topic2.save();
    
    // Create sample subtopics
    const subtopic1 = new Subtopic({
      title: 'Design a multi-tier architecture solution',
      description: 'Learn how to design multi-tier architecture solutions.',
      topicId: topic1._id,
      order: 1,
      content: 'Multi-tier architectures separate applications into multiple tiers, typically consisting of presentation, application, and data tiers.',
      progress: 60
    });
    
    const subtopic2 = new Subtopic({
      title: 'Design highly available and/or fault-tolerant architectures',
      description: 'Learn how to design highly available architectures.',
      topicId: topic1._id,
      order: 2,
      content: 'Highly available architectures are designed to operate continuously without failure for a long time.',
      progress: 30
    });
    
    await subtopic1.save();
    await subtopic2.save();
    
    // Create sample notes
    const note1 = new Note({
      title: 'Multi-tier Architecture Best Practices',
      content: 'When designing multi-tier architectures, consider the following best practices:\n\n1. Use Auto Scaling for each tier\n2. Implement load balancing between tiers\n3. Use security groups to control traffic between tiers\n4. Consider data caching strategies',
      category: 'study',
      tags: ['architecture', 'best-practices'],
      userId: user._id.toString(),
      topicId: topic1._id,
      subtopicId: subtopic1._id,
      isPinned: true
    });
    
    const note2 = new Note({
      title: 'Career Path: Solutions Architect',
      content: 'Steps to become an AWS Solutions Architect:\n\n1. Learn AWS fundamentals\n2. Get hands-on experience with core services\n3. Study for and pass the SAA-C03 exam\n4. Build portfolio projects\n5. Apply for entry-level positions',
      category: 'career',
      tags: ['career', 'job-search'],
      userId: user._id.toString()
    });
    
    await note1.save();
    await note2.save();
    
    console.log('Sample data created successfully');
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
  }
}
