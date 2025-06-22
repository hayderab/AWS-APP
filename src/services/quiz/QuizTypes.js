// Base class for all quiz types
class QuizQuestion {
  constructor(question, explanation, difficulty = 'medium') {
    this.id = Math.random().toString(36).substr(2, 9);
    this.question = question;
    this.explanation = explanation;
    this.difficulty = difficulty;
    this.type = this.constructor.name;
  }

  validate() {
    throw new Error('Validate method must be implemented by child classes');
  }

  checkAnswer() {
    throw new Error('CheckAnswer method must be implemented by child classes');
  }

  // Metadata about the question type - can be overridden by subclasses
  static getMetadata() {
    return {
      name: this.name,
      displayName: this.name.replace(/Question$/, ''),
      description: 'Base question type',
      contentTypes: ['text'], // What content types this question works well with
      difficultyLevels: ['easy', 'medium', 'hard'],
      requiresSpecialUI: false
    };
  }
}

// Multiple Choice Question (one correct answer out of four options)
export class MultipleChoiceQuestion extends QuizQuestion {
  static getMetadata() {
    return {
      ...super.getMetadata(),
      description: 'One correct answer out of four options',
      contentTypes: ['text', 'code', 'diagram'],
      difficultyLevels: ['easy', 'medium', 'hard'],
      requiresSpecialUI: false
    };
  }
  constructor(question, choices, correctAnswer, explanation, difficulty = 'medium') {
    super(question, explanation, difficulty);
    this.choices = choices;
    this.correctAnswer = correctAnswer;
  }

  validate() {
    if (!Array.isArray(this.choices) || this.choices.length !== 4) {
      throw new Error('Multiple choice questions must have exactly 4 choices (1 correct, 3 distractors)');
    }
    if (!this.choices.includes(this.correctAnswer)) {
      throw new Error('Correct answer must be one of the choices');
    }
    return true;
  }

  checkAnswer(userAnswer) {
    return {
      isCorrect: userAnswer === this.correctAnswer,
      correctAnswer: this.correctAnswer,
      explanation: this.explanation
    };
  }
}

// Multiple Response Question (two or more correct answers out of five or more options)
export class MultipleResponseQuestion extends QuizQuestion {
  static getMetadata() {
    return {
      ...super.getMetadata(),
      description: 'Two or more correct answers out of five or more options',
      contentTypes: ['text', 'code', 'list'],
      difficultyLevels: ['medium', 'hard'],
      requiresSpecialUI: false
    };
  }
  constructor(question, choices, correctAnswers, explanation, difficulty = 'medium') {
    super(question, explanation, difficulty);
    this.choices = choices;
    this.correctAnswers = correctAnswers;
  }

  validate() {
    if (!Array.isArray(this.choices) || this.choices.length < 5) {
      throw new Error('Multiple response questions must have at least 5 choices');
    }
    if (!Array.isArray(this.correctAnswers) || this.correctAnswers.length < 2) {
      throw new Error('Multiple response questions must have at least 2 correct answers');
    }
    for (const answer of this.correctAnswers) {
      if (!this.choices.includes(answer)) {
        throw new Error('All correct answers must be in choices');
      }
    }
    return true;
  }

  checkAnswer(userAnswers) {
    if (!Array.isArray(userAnswers)) return { isCorrect: false, correctAnswer: this.correctAnswers, explanation: this.explanation };
    
    const correct = userAnswers.length === this.correctAnswers.length &&
      userAnswers.every(answer => this.correctAnswers.includes(answer)) &&
      this.correctAnswers.every(answer => userAnswers.includes(answer));

    return {
      isCorrect: correct,
      correctAnswer: this.correctAnswers,
      explanation: this.explanation
    };
  }
}

// Ordering Question (3-5 responses that must be placed in correct order)
export class OrderingQuestion extends QuizQuestion {
  static getMetadata() {
    return {
      ...super.getMetadata(),
      description: '3-5 responses that must be placed in correct order',
      contentTypes: ['process', 'sequence', 'steps'],
      difficultyLevels: ['medium', 'hard'],
      requiresSpecialUI: true
    };
  }
  constructor(question, items, correctOrder, explanation, difficulty = 'medium') {
    super(question, explanation, difficulty);
    this.items = items;
    this.correctOrder = correctOrder;
  }

  validate() {
    if (!Array.isArray(this.items) || this.items.length < 3 || this.items.length > 5) {
      throw new Error('Ordering questions must have 3-5 items');
    }
    if (!Array.isArray(this.correctOrder) || this.correctOrder.length !== this.items.length) {
      throw new Error('Correct order must match number of items');
    }
    if (!this.correctOrder.every(item => this.items.includes(item))) {
      throw new Error('All items in correct order must be in the items list');
    }
    return true;
  }

  checkAnswer(userOrder) {
    if (!Array.isArray(userOrder) || userOrder.length !== this.correctOrder.length) {
      return { isCorrect: false, correctAnswer: this.correctOrder, explanation: this.explanation };
    }

    const isCorrect = userOrder.every((item, index) => item === this.correctOrder[index]);

    return {
      isCorrect,
      correctAnswer: this.correctOrder,
      explanation: this.explanation
    };
  }
}

// Matching Question (matching responses with 3-7 prompts)
export class MatchingQuestion extends QuizQuestion {
  static getMetadata() {
    return {
      ...super.getMetadata(),
      description: 'Matching responses with 3-7 prompts',
      contentTypes: ['terms', 'definitions', 'relationships'],
      difficultyLevels: ['medium', 'hard'],
      requiresSpecialUI: true
    };
  }
  constructor(question, prompts, responses, correctPairs, explanation, difficulty = 'medium') {
    super(question, explanation, difficulty);
    this.prompts = prompts;
    this.responses = responses;
    this.correctPairs = correctPairs; // Array of {prompt, response}
  }

  validate() {
    if (!Array.isArray(this.prompts) || this.prompts.length < 3 || this.prompts.length > 7) {
      throw new Error('Matching questions must have 3-7 prompts');
    }
    if (!Array.isArray(this.responses) || this.responses.length < this.prompts.length) {
      throw new Error('Must have at least as many responses as prompts');
    }
    if (!Array.isArray(this.correctPairs) || this.correctPairs.length !== this.prompts.length) {
      throw new Error('Must have one correct pair for each prompt');
    }
    return true;
  }

  checkAnswer(userPairs) {
    if (!Array.isArray(userPairs) || userPairs.length !== this.correctPairs.length) {
      return { isCorrect: false, correctAnswer: this.correctPairs, explanation: this.explanation };
    }

    const isCorrect = userPairs.every(pair => {
      const correctPair = this.correctPairs.find(cp => cp.prompt === pair.prompt);
      return correctPair && correctPair.response === pair.response;
    });

    return {
      isCorrect,
      correctAnswer: this.correctPairs,
      explanation: this.explanation
    };
  }
}

// Case Study Question (scenario with multiple questions)
export class CaseStudyQuestion extends QuizQuestion {
  static getMetadata() {
    return {
      ...super.getMetadata(),
      description: 'Scenario with multiple questions',
      contentTypes: ['scenario', 'case study', 'complex problem'],
      difficultyLevels: ['hard'],
      requiresSpecialUI: true
    };
  }
  constructor(question, scenario, subQuestions, explanation, difficulty = 'medium') {
    super(question, explanation, difficulty);
    this.scenario = scenario;
    this.subQuestions = subQuestions; // Array of other question types
  }

  validate() {
    if (!this.scenario) {
      throw new Error('Case study must have a scenario');
    }
    if (!Array.isArray(this.subQuestions) || this.subQuestions.length < 2) {
      throw new Error('Case study must have at least 2 questions');
    }
    // Validate all sub-questions
    this.subQuestions.forEach(q => q.validate());
    return true;
  }

  checkAnswer(userAnswers) {
    if (!Array.isArray(userAnswers) || userAnswers.length !== this.subQuestions.length) {
      return {
        isCorrect: false,
        results: this.subQuestions.map(() => ({ isCorrect: false })),
        explanation: this.explanation
      };
    }

    const results = this.subQuestions.map((q, i) => q.checkAnswer(userAnswers[i]));

    return {
      isCorrect: results.every(r => r.isCorrect),
      results: results,
      explanation: this.explanation
    };
  }
}

// Registry to manage quiz types
class QuizTypeRegistry {
  constructor() {
    this.types = new Map();
    this.typeConstants = {};
  }

  // Register a question type
  register(questionClass) {
    const typeName = questionClass.name;
    this.types.set(typeName, questionClass);
    
    // Create a constant for this type
    const constantName = typeName.replace(/Question$/, '').toUpperCase();
    this.typeConstants[constantName] = typeName;
    
    console.log(`Registered quiz type: ${typeName}`);
    return this; // For chaining
  }

  // Unregister a question type
  unregister(typeName) {
    if (this.types.has(typeName)) {
      this.types.delete(typeName);
      
      // Remove the constant
      Object.keys(this.typeConstants).forEach(key => {
        if (this.typeConstants[key] === typeName) {
          delete this.typeConstants[key];
        }
      });
      
      console.log(`Unregistered quiz type: ${typeName}`);
    }
    return this; // For chaining
  }

  // Get a question class by type name
  getQuestionClass(typeName) {
    if (!this.types.has(typeName)) {
      throw new Error(`Quiz type not registered: ${typeName}`);
    }
    return this.types.get(typeName);
  }

  // Create a new question instance
  createQuestion(typeName, ...args) {
    const QuestionClass = this.getQuestionClass(typeName);
    return new QuestionClass(...args);
  }

  // Get all registered question types
  getAllTypes() {
    return Array.from(this.types.keys());
  }

  // Get metadata for all registered question types
  getAllMetadata() {
    const metadata = {};
    this.types.forEach((questionClass, typeName) => {
      metadata[typeName] = questionClass.getMetadata();
    });
    return metadata;
  }

  // Get metadata for a specific question type
  getMetadata(typeName) {
    const QuestionClass = this.getQuestionClass(typeName);
    return QuestionClass.getMetadata();
  }
}

// Create and export the registry
export const quizTypeRegistry = new QuizTypeRegistry();

// Register all the built-in question types
quizTypeRegistry
  .register(MultipleChoiceQuestion)
  .register(MultipleResponseQuestion)
  .register(OrderingQuestion)
  .register(MatchingQuestion)
  .register(CaseStudyQuestion);

// Export the type constants for convenience
export const QuizTypes = quizTypeRegistry.typeConstants;

// Export all question types and the registry
export default {
  QuizQuestion,
  MultipleChoiceQuestion,
  MultipleResponseQuestion,
  OrderingQuestion,
  MatchingQuestion,
  CaseStudyQuestion,
  quizTypeRegistry,
  QuizTypes
};
