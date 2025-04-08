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
}

// Multiple Choice Question (one correct answer out of four options)
export class MultipleChoiceQuestion extends QuizQuestion {
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

export const QuizTypes = {
  MULTIPLE_CHOICE: 'MultipleChoiceQuestion',
  MULTIPLE_RESPONSE: 'MultipleResponseQuestion',
  ORDERING: 'OrderingQuestion',
  MATCHING: 'MatchingQuestion',
  CASE_STUDY: 'CaseStudyQuestion'
};

export default {
  MultipleChoiceQuestion,
  MultipleResponseQuestion,
  OrderingQuestion,
  MatchingQuestion,
  CaseStudyQuestion,
  QuizTypes
};
