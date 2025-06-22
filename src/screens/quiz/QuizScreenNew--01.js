import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert, Platform, TouchableOpacity } from 'react-native';
import { Text, Button, Card, RadioButton, Checkbox, ProgressBar, IconButton, Dialog, Portal, ActivityIndicator, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QuizGenerator from '../../services/quiz/QuizGenerator';
import { QuizTypes } from '../../services/quiz/QuizTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../services/ApiService';
import { useAuth } from '../../context/AuthContext';

const QuizScreen = ({ route, navigation }) => {
  const { topic, preGeneratedQuestions, isRetake } = route.params || {};
  const { user } = useAuth(); // Get the current user from AuthContext
  
  // States for quiz management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState(preGeneratedQuestions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(new Array(preGeneratedQuestions?.length || 0).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [confirmSubmitVisible, setConfirmSubmitVisible] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  
  // States for specific question types
  const [orderItems, setOrderItems] = useState([]);
  const [matchingPairs, setMatchingPairs] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showResponseSelector, setShowResponseSelector] = useState(false);

  // Load questions when component mounts
  useEffect(() => {
    if (!preGeneratedQuestions || preGeneratedQuestions.length === 0) {
      loadQuestions();
    } else {
      console.log('Received pre-generated questions:', 
        preGeneratedQuestions.map(q => ({
          type: q.type, 
          question: q.question ? q.question.substring(0, 30) + '...' : 'No question text',
          constructor: q.constructor ? q.constructor.name : 'Unknown'
        }))
      );
      
      // Set the questions from the pre-generated ones
      setQuestions(preGeneratedQuestions);
      
      // Initialize user answers array
      setUserAnswers(new Array(preGeneratedQuestions.length).fill(null));
      
      // Initialize state for first question based on its type
      if (preGeneratedQuestions[0]) {
        initializeQuestionState(preGeneratedQuestions[0]);
      }
      
      setLoading(false);
    }
    
    // Add this to see the current question when it changes
    return () => {
      console.log('QuizScreen unmounting');
    };
  }, []);

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= 0) {
      const currentQuestion = questions[currentQuestionIndex];
      console.log(`Rendering question ${currentQuestionIndex + 1}/${questions.length}:`, {
        type: currentQuestion.type,
        question: currentQuestion.question ? currentQuestion.question.substring(0, 30) + '...' : 'No question text'
      });
      
      // Initialize state for the current question
      initializeQuestionState(currentQuestion);
    }
  }, [currentQuestionIndex, questions]);

  useEffect(() => {
    // Check if all questions have been answered
    const allAnswered = userAnswers.every(answer => answer !== null);
    setAllQuestionsAnswered(allAnswered);
    
    // Log the state for debugging
    console.log('Questions answered state:', {
      allAnswered,
      currentIndex: currentQuestionIndex,
      totalQuestions: questions.length,
      currentAnswered: userAnswers[currentQuestionIndex] !== null
    });
    
    // Also check if we're on the last question
    if (currentQuestionIndex === questions.length - 1 && userAnswers[currentQuestionIndex] !== null) {
      // Enable the Submit All button in the header
      console.log('Last question answered, enabling Submit All button');
    }
  }, [userAnswers, currentQuestionIndex, questions.length]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeSpent(timeSpent + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeSpent]);

  // Initialize state based on question type
  const initializeQuestionState = (question) => {
    if (!question) return;
    
    if (question.type === 'OrderingQuestion') {
      setOrderItems([...question.items].sort(() => Math.random() - 0.5));
    } else if (question.type === 'MatchingQuestion') {
      setMatchingPairs([]);
    } else if (question.type === 'CaseStudyQuestion') {
      const caseStudyAnswers = new Array(question.subQuestions.length).fill(null);
      handleAnswer(caseStudyAnswers);
    }
  };

  // Generate quiz questions
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate topic and subtopics
      if (!topic) {
        throw new Error('No topic provided');
      }
      
      if (!topic.subtopics || topic.subtopics.length === 0) {
        throw new Error('This topic has no subtopics. Please add subtopics before creating a quiz.');
      }
      
      // Generate questions for the first subtopic
      const generatedQuestions = await QuizGenerator.generateQuiz(
        topic,
        topic.subtopics[0],
        5
      );
      
      // Validate questions
      if (!generatedQuestions || !Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error('No questions could be generated. Please try again.');
      }
      
      console.log(`Generated ${generatedQuestions.length} questions`);
      
      // Update state with generated questions
      setQuestions(generatedQuestions);
      setUserAnswers(new Array(generatedQuestions.length).fill(null));
      setCurrentQuestionIndex(0);
      
      // Initialize state for first question
      initializeQuestionState(generatedQuestions[0]);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError(error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle user answers
  const handleAnswer = (answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Handle reordering for ordering questions
  const handleReorder = (item, direction) => {
    const currentIndex = orderItems.indexOf(item);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === orderItems.length - 1)
    ) {
      return; // Can't move further in this direction
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newOrderItems = [...orderItems];
    
    // Swap items
    [newOrderItems[currentIndex], newOrderItems[newIndex]] = 
    [newOrderItems[newIndex], newOrderItems[currentIndex]];
    
    setOrderItems(newOrderItems);
    handleAnswer(newOrderItems);
  };

  // Handle matching selections
  const handleMatchingSelection = (prompt, response) => {
    // First, remove any existing pair with this prompt
    const updatedPairs = matchingPairs.filter(pair => pair.prompt !== prompt);
    
    // Also remove any pair that already has this response to ensure 1:1 mapping
    const filteredPairs = updatedPairs.filter(pair => pair.response !== response);
    
    // Add the new pair
    const newPairs = [...filteredPairs, { prompt, response }];
    setMatchingPairs(newPairs);
    
    // If all prompts have been matched, update the user answer
    if (newPairs.length === currentQuestion.prompts.length) {
      handleAnswer(newPairs);
    }
  };

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  // Render multiple choice question
  const renderMultipleChoice = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = userAnswers[currentQuestionIndex];
    
    return (
      <RadioButton.Group
        onValueChange={handleAnswer}
        value={currentAnswer}
      >
        {currentQuestion.choices.map((choice, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionContainer, 
              currentAnswer === choice ? styles.selectedOption : null
            ]}
            onPress={() => handleAnswer(choice)}
          >
            <RadioButton value={choice} />
            <Text style={styles.optionText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </RadioButton.Group>
    );
  };

  // Render multiple response question
  const renderMultipleResponse = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswers = userAnswers[currentQuestionIndex] || [];
    
    const toggleAnswer = (choice) => {
      const newAnswers = [...currentAnswers];
      const index = newAnswers.indexOf(choice);
      
      if (index === -1) {
        newAnswers.push(choice);
      } else {
        newAnswers.splice(index, 1);
      }
      
      handleAnswer(newAnswers);
    };
    
    return (
      <View>
        {currentQuestion.choices.map((choice, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionContainer, 
              styles.multipleResponseOption,
              currentAnswers.includes(choice) ? styles.selectedOption : null
            ]}
            onPress={() => toggleAnswer(choice)}
          >
            <Checkbox
              status={currentAnswers.includes(choice) ? 'checked' : 'unchecked'}
              onPress={() => toggleAnswer(choice)}
            />
            <Text style={styles.optionText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render ordering question
  const renderOrdering = () => (
    <View style={styles.orderingContainer}>
      <Text style={styles.orderingInstructions}>
        Arrange the items in the correct order by dragging them up or down.
      </Text>
      
      {orderItems.map((item, index) => (
        <Surface 
          key={index} 
          style={[
            styles.orderingItem,
            { borderLeftWidth: 4, borderLeftColor: '#4285f4' }
          ]}
        >
          <View style={styles.orderingItemContent}>
            <Text style={styles.orderingNumber}>{index + 1}</Text>
            <Text style={styles.orderingText}>{item}</Text>
          </View>
          
          <View style={styles.orderingButtons}>
            <IconButton
              icon="arrow-up"
              size={24}
              mode="contained"
              containerColor="#e8f0fe"
              iconColor="#4285f4"
              disabled={index === 0}
              onPress={() => handleReorder(item, 'up')}
            />
            <IconButton
              icon="arrow-down"
              size={24}
              mode="contained"
              containerColor="#e8f0fe"
              iconColor="#4285f4"
              disabled={index === orderItems.length - 1}
              onPress={() => handleReorder(item, 'down')}
            />
          </View>
        </Surface>
      ))}
      
      {/* Reset order button */}
      <Button 
        mode="outlined" 
        onPress={() => {
          // Reset to random order
          setOrderItems([...currentQuestion.items].sort(() => Math.random() - 0.5));
          handleAnswer(null);
        }}
        style={styles.resetOrderButton}
      >
        Reset Order
      </Button>
    </View>
  );

  // Render matching question
  const renderMatching = () => (
    <View style={styles.matchingContainer}>
      <Text style={styles.matchingInstructions}>Match each item with its correct option by selecting from the dropdown.</Text>
      
      {currentQuestion.prompts.map((prompt, index) => (
        <Surface key={index} style={styles.matchingItemContainer}>
          <Text style={styles.matchingPrompt}>{prompt}</Text>
          
          <View style={styles.matchingDropdownContainer}>
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedResponse(null);
                setSelectedPrompt(prompt);
                setShowResponseSelector(true);
              }}
              style={styles.matchDropdownButton}
            >
              {matchingPairs.find(pair => pair.prompt === prompt)?.response || "Select an option"}
            </Button>
            
            {matchingPairs.find(pair => pair.prompt === prompt) && (
              <IconButton
                icon="close"
                size={20}
                onPress={() => {
                  const updatedPairs = matchingPairs.filter(pair => pair.prompt !== prompt);
                  setMatchingPairs(updatedPairs);
                  handleAnswer(updatedPairs.length === currentQuestion.prompts.length ? updatedPairs : null);
                }}
              />
            )}
          </View>
        </Surface>
      ))}
      
      {/* Response selector modal */}
      <Portal>
        <Dialog
          visible={showResponseSelector}
          onDismiss={() => setShowResponseSelector(false)}
        >
          <Dialog.Title>Select the matching option</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.responseScrollView}>
              {currentQuestion.responses.map((response, index) => {
                // Check if this response is already matched to another prompt
                const matchedPrompt = matchingPairs.find(pair => pair.response === response)?.prompt;
                const isDisabled = matchedPrompt && matchedPrompt !== selectedPrompt;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.responseOption,
                      isDisabled && styles.disabledResponseOption
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        handleMatchingSelection(selectedPrompt, response);
                        setShowResponseSelector(false);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text style={styles.responseOptionText}>{response}</Text>
                    {isDisabled && (
                      <Text style={styles.alreadyMatchedText}>
                        Already matched with: {matchedPrompt}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResponseSelector(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Clear all matches button */}
      {matchingPairs.length > 0 && (
        <Button 
          mode="text" 
          onPress={() => {
            setMatchingPairs([]);
            handleAnswer(null);
          }}
          style={styles.clearMatchesButton}
        >
          Clear All Matches
        </Button>
      )}
    </View>
  );

  // Render case study question
  const renderCaseStudy = () => (
    <View style={styles.caseStudyContainer}>
      <View style={styles.scenarioCard}>
        <Text style={styles.scenarioTitle}>Scenario:</Text>
        <Text style={styles.scenarioContent}>{currentQuestion.scenario}</Text>
      </View>
      
      {currentQuestion.subQuestions.map((subQuestion, subIndex) => (
        <View key={subIndex} style={styles.subQuestionCard}>
          <Text style={styles.subQuestionTitle}>Question {subIndex + 1}:</Text>
          <Text style={styles.subQuestionText}>{subQuestion.question}</Text>
          
          {subQuestion.type === 'MultipleChoiceQuestion' && (
            <RadioButton.Group
              onValueChange={value => {
                const newAnswers = [...(userAnswers[currentQuestionIndex] || [])];
                newAnswers[subIndex] = value;
                handleAnswer(newAnswers);
              }}
              value={userAnswers[currentQuestionIndex]?.[subIndex]}
            >
              {subQuestion.choices.map((choice, choiceIndex) => (
                <View key={choiceIndex} style={styles.subChoiceContainer}>
                  <RadioButton.Item
                    label={choice}
                    value={choice}
                    position="leading"
                  />
                </View>
              ))}
            </RadioButton.Group>
          )}
          
          {subQuestion.type === 'MultipleResponseQuestion' && (
            <View>
              {subQuestion.choices.map((choice, choiceIndex) => (
                <View key={choiceIndex} style={styles.subChoiceContainer}>
                  <Checkbox.Item
                    label={choice}
                    status={
                      userAnswers[currentQuestionIndex]?.[subIndex]?.includes(choice)
                        ? 'checked'
                        : 'unchecked'
                    }
                    position="leading"
                    onPress={() => {
                      const newAnswers = [...(userAnswers[currentQuestionIndex] || [])];
                      const currentSubAnswers = newAnswers[subIndex] || [];
                      
                      if (currentSubAnswers.includes(choice)) {
                        newAnswers[subIndex] = currentSubAnswers.filter(c => c !== choice);
                      } else {
                        newAnswers[subIndex] = [...currentSubAnswers, choice];
                      }
                      
                      handleAnswer(newAnswers);
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  // Render question content based on type
  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'MultipleChoiceQuestion':
        return renderMultipleChoice();
      case 'MultipleResponseQuestion':
        return renderMultipleResponse();
      case 'OrderingQuestion':
        return renderOrdering();
      case 'MatchingQuestion':
        return renderMatching();
      case 'CaseStudyQuestion':
        return renderCaseStudy();
      default:
        return <Text>Unsupported question type: {currentQuestion.type}</Text>;
    }
  };

  // Render answer result
  const renderResult = () => {
    if (!showResult || !currentQuestion) return null;

    const result = currentQuestion.checkAnswer(userAnswers[currentQuestionIndex]);
    return (
      <Card style={styles.resultCard}>
        <Card.Content>
          <Text style={[
            styles.resultText,
            { color: result.isCorrect ? 'green' : 'red' }
          ]}>
            {result.isCorrect ? 'Correct!' : 'Incorrect'}
          </Text>
          <Text style={styles.explanationText}>{result.explanation}</Text>
          
          {!result.isCorrect && (
            <View style={styles.correctAnswerContainer}>
              <Text style={styles.correctAnswerTitle}>Correct Answer:</Text>
              {renderCorrectAnswer(result)}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render correct answer based on question type
  const renderCorrectAnswer = (result) => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.type) {
      case 'MultipleChoiceQuestion':
        return <Text>{result.correctAnswer}</Text>;
      case 'MultipleResponseQuestion':
        return (
          <View>
            {result.correctAnswer.map((answer, index) => (
              <Text key={index} style={styles.correctAnswerItem}>• {answer}</Text>
            ))}
          </View>
        );
      case 'OrderingQuestion':
        return (
          <View>
            {result.correctAnswer.map((item, index) => (
              <Text key={index} style={styles.correctAnswerItem}>{index + 1}. {item}</Text>
            ))}
          </View>
        );
      case 'MatchingQuestion':
        return (
          <View>
            {result.correctAnswer.map((pair, index) => (
              <Text key={index} style={styles.correctAnswerItem}>{pair.prompt}: {pair.response}</Text>
            ))}
          </View>
        );
      case 'CaseStudyQuestion':
        return (
          <View>
            {result.results.map((subResult, index) => (
              <View key={index} style={styles.subQuestionResult}>
                <Text style={styles.subQuestionResultTitle}>
                  Question {index + 1}: {subResult.isCorrect ? 'Correct' : 'Incorrect'}
                </Text>
                {!subResult.isCorrect && (
                  <View>
                    <Text style={styles.correctAnswerItem}>
                      Correct answer: {Array.isArray(subResult.correctAnswer) 
                        ? subResult.correctAnswer.join(', ') 
                        : subResult.correctAnswer}
                    </Text>
                  </View>
                )}
                <Text style={styles.subQuestionExplanation}>{subResult.explanation}</Text>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  // Custom function to check answers for retaken quizzes
  const checkQuestionAnswer = (question, answer) => {
    let isCorrect = false;
    let correctAnswer = null;
    let explanation = question.explanation || 'No explanation available.';
    
    try {
      // If the original checkAnswer method exists, use it
      if (typeof question.checkAnswer === 'function') {
        return question.checkAnswer(answer);
      }
      
      // Otherwise, implement our own answer checking logic based on question type
      switch (question.type) {
        case 'MultipleChoiceQuestion':
          correctAnswer = question.correctAnswer;
          isCorrect = answer === correctAnswer;
          break;
          
        case 'MultipleResponseQuestion':
          correctAnswer = question.correctAnswers || [];
          // For multiple response, check if arrays have the same elements
          if (Array.isArray(answer) && Array.isArray(correctAnswer)) {
            isCorrect = answer.length === correctAnswer.length && 
                       answer.every(item => correctAnswer.includes(item));
          }
          break;
          
        case 'OrderingQuestion':
          correctAnswer = question.correctOrder || [];
          // For ordering, check if arrays have the same elements in the same order
          if (Array.isArray(answer) && Array.isArray(correctAnswer)) {
            isCorrect = answer.length === correctAnswer.length &&
                       answer.every((item, i) => item === correctAnswer[i]);
          }
          break;
          
        case 'MatchingQuestion':
          correctAnswer = question.correctPairs || {};
          // For matching, check if objects have the same key-value pairs
          if (answer && typeof answer === 'object') {
            const correctPairsEntries = Object.entries(correctAnswer);
            const answerPairsEntries = Object.entries(answer);
            isCorrect = correctPairsEntries.length === answerPairsEntries.length &&
                       correctPairsEntries.every(([key, value]) => answer[key] === value);
          }
          break;
          
        case 'CaseStudyQuestion':
          // For case study, we need to check each subquestion
          if (question.subQuestions && Array.isArray(answer)) {
            const subResults = question.subQuestions.map((subQ, i) => {
              const subAnswer = answer[i];
              return subAnswer === subQ.correctAnswer;
            });
            isCorrect = subResults.every(result => result === true);
            correctAnswer = question.subQuestions.map(sq => sq.correctAnswer);
          }
          break;
          
        default:
          console.warn(`Unknown question type: ${question.type}`);
          break;
      }
      
      return {
        isCorrect,
        correctAnswer,
        explanation
      };
    } catch (error) {
      console.error('Error checking answer:', error);
      return {
        isCorrect: false,
        correctAnswer: null,
        explanation: 'Error checking answer.'
      };
    }
  };
  
  // Calculate final quiz results
  const calculateQuizResults = () => {
    const results = questions.map((question, index) => {
      const answer = userAnswers[index];
      const result = checkQuestionAnswer(question, answer);
      
      return {
        question: question.question,
        type: question.type,
        userAnswer: answer,
        correctAnswer: result.correctAnswer,
        isCorrect: result.isCorrect,
        explanation: result.explanation
      };
    });

    const correctCount = results.filter(result => result.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);

    return {
      results,
      score,
      correctCount,
      totalQuestions: questions.length
    };
  };

  // Submit all answers and show results
  const handleSubmitAll = async () => {
    try {
      console.log('Submitting all answers...', isRetake ? '(Retake)' : '(New Quiz)');
      const results = calculateQuizResults();
      setQuizResults(results);
      setQuizCompleted(true);
      
      // For retakes, we don't save to history again, just update the analytics
      if (isRetake) {
        console.log('This is a retake - only saving results for analytics, not adding to history');
        
        try {
          // Only save the quiz result for analytics
          if (user?._id) {
            // Get topic and subtopic IDs from route params
            const topicId = route.params?.topic?.id;
            const subtopicId = route.params?.subtopic?.id;
            
            console.log('Saving quiz result with topic info:', { 
              topicId, 
              topicTitle: route.params?.topic?.title,
              subtopicId,
              subtopicTitle: route.params?.subtopic?.title
            });
            
            // Ensure the topicId is a valid MongoDB ObjectId format
            // MongoDB ObjectIds are 24-character hex strings
            const isValidObjectId = (id) => {
              return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
            };
            
            const quizResultData = {
              quizId: `retake-${Date.now()}`, // Generate a unique ID for the retake
              userId: user._id,
              score: results.score,
              answers: results.results.map(result => ({
                questionId: result.question.substring(0, 20),
                userAnswer: result.userAnswer,
                isCorrect: result.isCorrect
              })),
              timeSpent: timeSpent,
              // Ensure topicId is properly formatted
              topicId: isValidObjectId(topicId) ? topicId : undefined,
              // Include topic title for reference
              topicTitle: route.params?.topic?.title || 'Unknown Topic',
              // Ensure subtopicId is properly formatted
              subtopicId: isValidObjectId(subtopicId) ? subtopicId : undefined,
              // Include subtopic title for reference
              subtopicTitle: route.params?.subtopic?.title || 'Unknown Subtopic',
              isRetake: true // Mark as a retake for analytics
            };
            
            await ApiService.quizResult.save(quizResultData);
            console.log('Retake quiz result saved for analytics only', {
              score: quizResultData.score,
              topicId: quizResultData.topicId
            });
          }
        } catch (error) {
          console.error('Error saving retake results:', error);
          // Continue showing results even if saving fails
        }
        
        return; // Exit early, don't save to history
      }
      
      // For new quizzes, save results to history
      try {
        const quizHistory = await AsyncStorage.getItem('quizHistory') || '[]';
        const history = JSON.parse(quizHistory);
        
        // Prepare questions data for storage
        const questionsData = questions.map(q => {
          // Create a serializable version of each question
          const baseData = {
            type: q.type,
            question: q.question,
            explanation: q.explanation,
            difficulty: q.difficulty
          };
          
          // Add type-specific properties
          switch (q.type) {
            case 'MultipleChoiceQuestion':
              return {
                ...baseData,
                choices: q.choices,
                correctAnswer: q.correctAnswer
              };
            case 'MultipleResponseQuestion':
              return {
                ...baseData,
                choices: q.choices,
                correctAnswers: q.correctAnswers
              };
            case 'OrderingQuestion':
              return {
                ...baseData,
                items: q.items,
                correctOrder: q.correctOrder
              };
            case 'MatchingQuestion':
              return {
                ...baseData,
                prompts: q.prompts,
                responses: q.responses,
                correctPairs: q.correctPairs
              };
            case 'CaseStudyQuestion':
              return {
                ...baseData,
                scenario: q.scenario,
                subQuestions: q.subQuestions.map(sq => ({
                  type: sq.type,
                  question: sq.question,
                  choices: sq.choices,
                  correctAnswer: sq.correctAnswer,
                  explanation: sq.explanation
                }))
              };
            default:
              return baseData;
          }
        });
        
        // Create quiz history object
        const quizHistoryObject = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          topic: topic?.title || 'AWS Quiz',
          topicId: topic?.id || 'unknown',
          topicTitle: topic?.title || 'AWS Quiz',
          subtopicId: topic?.subtopics?.[0]?.id || 'unknown',
          subtopicTitle: topic?.subtopics?.[0]?.title || 'General',
          score: results.score,
          correctCount: results.correctCount,
          totalQuestions: results.totalQuestions,
          questions: questionsData,
          timestamp: Date.now()
        };
        
        // Save to local AsyncStorage
        history.push(quizHistoryObject);
        await AsyncStorage.setItem('quizHistory', JSON.stringify(history));
        console.log('Quiz history saved successfully to AsyncStorage');
        
        // Save to MongoDB using ApiService
        try {
          // Save quiz to history
          await ApiService.quiz.saveToHistory(quizHistoryObject);
          console.log('Quiz history saved successfully to MongoDB');
          
          // Get topic and subtopic IDs directly from route params
          const topicId = route.params?.topic?.id;
          const subtopicId = route.params?.subtopic?.id;
          
          console.log('Saving new quiz result with topic info:', { 
            topicId, 
            topicTitle: route.params?.topic?.title,
            subtopicId,
            subtopicTitle: route.params?.subtopic?.title
          });
          
          // Ensure the topicId is a valid MongoDB ObjectId format
          // MongoDB ObjectIds are 24-character hex strings
          const isValidObjectId = (id) => {
            return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
          };
          
          // Save quiz result
          const quizResultData = {
            quizId: quizHistoryObject.id,
            userId: user?._id, // Add user ID from AuthContext
            score: results.score,
            answers: results.results.map(result => ({
              questionId: result.question.substring(0, 20), // Use part of the question as ID
              userAnswer: result.userAnswer,
              isCorrect: result.isCorrect
            })),
            timeSpent: timeSpent,
            // Ensure topicId is properly formatted
            topicId: isValidObjectId(topicId) ? topicId : undefined,
            // Include topic title for reference
            topicTitle: route.params?.topic?.title || 'Unknown Topic',
            // Ensure subtopicId is properly formatted
            subtopicId: isValidObjectId(subtopicId) ? subtopicId : undefined,
            // Include subtopic title for reference
            subtopicTitle: route.params?.subtopic?.title || 'Unknown Subtopic'
          };
          
          await ApiService.quizResult.save(quizResultData);
          console.log('Quiz result saved successfully to MongoDB', {
            quizId: quizResultData.quizId,
            userId: quizResultData.userId,
            topicId: quizResultData.topicId,
            score: quizResultData.score
          });
        } catch (dbError) {
          console.error('Error saving to MongoDB:', dbError);
          // Continue execution even if MongoDB save fails
        }
      } catch (error) {
        console.error('Error saving quiz history:', error);
        // Still show results even if saving fails
      }
    } catch (error) {
      console.error('Error in handleSubmitAll:', error);
      // Show an alert to the user
      Alert.alert(
        'Error',
        'There was a problem submitting your quiz. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Render quiz results screen
  const renderQuizResults = () => {
    if (!quizResults) return null;
    
    return (
      <ScrollView contentContainerStyle={styles.resultsContainer}>
        <Card style={styles.resultsCard}>
          <Card.Content>
            <Text style={styles.resultsTitle}>Quiz Results</Text>
            <Text style={styles.scoreText}>
              Score: {quizResults.score}%
            </Text>
            <Text style={styles.scoreDetails}>
              {quizResults.correctCount} correct out of {quizResults.totalQuestions} questions
            </Text>
            
            <View style={styles.resultsSummary}>
              {quizResults.score >= 80 ? (
                <Text style={[styles.resultMessage, styles.passMessage]}>
                  Great job! You're well prepared for the AWS certification exam.
                </Text>
              ) : quizResults.score >= 60 ? (
                <Text style={[styles.resultMessage, styles.warningMessage]}>
                  Good effort! Review the topics you missed to improve your knowledge.
                </Text>
              ) : (
                <Text style={[styles.resultMessage, styles.failMessage]}>
                  You need more practice. Focus on understanding the concepts you missed.
                </Text>
              )}
            </View>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate('QuizHistory')}
              style={styles.button}
            >
              <Text>View Quiz History</Text>
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              <Text>Back to Topic</Text>
            </Button>
          </Card.Content>
        </Card>
        
        <Card style={styles.questionsReviewCard}>
          <Card.Title title="Questions Review" />
          <Card.Content>
            {quizResults.results.map((result, index) => (
              <Surface key={index} style={[styles.reviewItem, result.isCorrect ? styles.correctReviewItem : styles.incorrectReviewItem]}>
                <Text style={styles.reviewQuestion}>
                  Question {index + 1}: {result.question}
                </Text>
                <Text style={result.isCorrect ? styles.correctText : styles.incorrectText}>
                  {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </Text>
                
                {/* Show question-specific details */}
                {result.type === 'MultipleChoiceQuestion' && (
                  <View style={styles.reviewDetails}>
                    <Text style={styles.reviewSubtitle}>Your answer:</Text>
                    <Text style={styles.reviewAnswer}>{result.userAnswer}</Text>
                    
                    {!result.isCorrect && (
                      <>
                        <Text style={styles.reviewSubtitle}>Correct answer:</Text>
                        <Text style={styles.correctAnswerText}>{result.correctAnswer}</Text>
                      </>
                    )}
                  </View>
                )}
                
                {result.type === 'MultipleResponseQuestion' && (
                  <View style={styles.reviewDetails}>
                    <Text style={styles.reviewSubtitle}>Your answers:</Text>
                    {result.userAnswer && result.userAnswer.length > 0 ? (
                      result.userAnswer.map((answer, i) => (
                        <Text key={i} style={styles.reviewAnswer}>• {answer}</Text>
                      ))
                    ) : (
                      <Text style={styles.reviewAnswer}>No answers selected</Text>
                    )}
                    
                    {!result.isCorrect && (
                      <>
                        <Text style={styles.reviewSubtitle}>Correct answers:</Text>
                        {result.correctAnswer.map((answer, i) => (
                          <Text key={i} style={styles.correctAnswerText}>• {answer}</Text>
                        ))}
                      </>
                    )}
                  </View>
                )}
                
                {result.type === 'OrderingQuestion' && (
                  <View style={styles.reviewDetails}>
                    <Text style={styles.reviewSubtitle}>Your order:</Text>
                    {result.userAnswer && result.userAnswer.map((item, i) => (
                      <Text key={i} style={styles.reviewAnswer}>{i + 1}. {item}</Text>
                    ))}
                    
                    {!result.isCorrect && (
                      <>
                        <Text style={styles.reviewSubtitle}>Correct order:</Text>
                        {result.correctAnswer.map((item, i) => (
                          <Text key={i} style={styles.correctAnswerText}>{i + 1}. {item}</Text>
                        ))}
                      </>
                    )}
                  </View>
                )}
                
                {result.type === 'MatchingQuestion' && (
                  <View style={styles.reviewDetails}>
                    <Text style={styles.reviewSubtitle}>Your matches:</Text>
                    {result.userAnswer && result.userAnswer.map((pair, i) => (
                      <Text key={i} style={styles.reviewAnswer}>• {pair.prompt} → {pair.response}</Text>
                    ))}
                    
                    {!result.isCorrect && (
                      <>
                        <Text style={styles.reviewSubtitle}>Correct matches:</Text>
                        {result.correctAnswer.map((pair, i) => (
                          <Text key={i} style={styles.correctAnswerText}>• {pair.prompt} → {pair.response}</Text>
                        ))}
                      </>
                    )}
                  </View>
                )}
                
                {result.type === 'CaseStudyQuestion' && (
                  <View style={styles.reviewDetails}>
                    <Text style={styles.reviewSubtitle}>Scenario:</Text>
                    <Text style={styles.scenarioText}>{questions[index].scenario}</Text>
                    
                    <Text style={styles.reviewSubtitle}>Sub-questions:</Text>
                    {result.userAnswer && result.userAnswer.map((answer, i) => {
                      const subQuestion = questions[index].subQuestions[i];
                      const subResult = subQuestion.checkAnswer(answer);
                      
                      return (
                        <View key={i} style={styles.subQuestionReview}>
                          <Text style={styles.subQuestionText}>{i + 1}. {subQuestion.question}</Text>
                          <Text style={subResult.isCorrect ? styles.correctText : styles.incorrectText}>
                            {subResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </Text>
                          <Text style={styles.reviewAnswer}>Your answer: {answer}</Text>
                          {!subResult.isCorrect && (
                            <Text style={styles.correctAnswerText}>Correct answer: {subResult.correctAnswer}</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
                
                <Text style={styles.reviewSubtitle}>Explanation:</Text>
                <Text style={styles.reviewExplanation}>{result.explanation}</Text>
              </Surface>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  // Loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Generating AWS practice questions...</Text>
      </View>
    );
  }

  // Error screen
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorTitle}>Error Loading Quiz</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Button 
          mode="contained" 
          onPress={() => {
            setError(null);
            loadQuestions();
          }}
          style={styles.button}
        >
          Try Again
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Back to Topic
        </Button>
      </View>
    );
  }

  // Quiz results screen
  if (quizCompleted) {
    return renderQuizResults();
  }

  // No questions available screen
  if (!questions.length) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>No Questions Available</Text>
        <Text style={styles.errorText}>Click the button below to generate quiz questions.</Text>
        <Button 
          mode="contained" 
          onPress={loadQuestions}
          style={styles.button}
        >
          Generate Quiz
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Back to Topic
        </Button>
      </View>
    );
  }

  // Main quiz screen
  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round((currentQuestionIndex + 1) / questions.length * 100)}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.questionCard}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.questionText}>
              {currentQuestion?.question || "No question available"}
            </Text>
            {renderQuestionContent()}
          </Card.Content>
        </Card>

        {renderResult()}

        <View style={styles.navigationContainer}>
          <Button
            mode="outlined"
            onPress={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            style={styles.navButton}
            contentStyle={styles.prevButtonContent}
            labelStyle={styles.buttonLabel}
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="chevron-left" size={size} color={color} />
            )}
          >
            Previous
          </Button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              mode="contained"
              onPress={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={userAnswers[currentQuestionIndex] === null || userAnswers[currentQuestionIndex] === undefined}
              style={styles.navButton}
              contentStyle={styles.nextButtonContent}
              labelStyle={styles.buttonLabel}
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="chevron-right" size={size} color={color} style={{ marginLeft: 8 }} />
              )}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => {
                console.log('Submit button pressed', isRetake ? '(Retake)' : '(New Quiz)');
                // For retakes, submit directly without confirmation
                if (isRetake) {
                  handleSubmitAll();
                } else {
                  // Show confirmation dialog for new quizzes
                  setConfirmSubmitVisible(true);
                }
              }}
              disabled={!allQuestionsAnswered}
              style={[styles.navButton, styles.submitButton]}
              contentStyle={styles.nextButtonContent}
              labelStyle={styles.buttonLabel}
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="check" size={size} color={color} style={{ marginLeft: 8 }} />
              )}
            >
              Submit
            </Button>
          )}
        </View>
      </ScrollView>
      <Portal>
        <Dialog
          visible={confirmSubmitVisible}
          onDismiss={() => setConfirmSubmitVisible(false)}
        >
          <Dialog.Title>Confirm Submission</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to submit all answers?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmSubmitVisible(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button onPress={handleSubmitAll}>
              <Text>Submit</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 15,
    color: '#555555',
  },
  progressPercentage: {
    fontSize: 15,
    color: '#4285f4',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#eeeeee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#4285f4',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  cardContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333333',
    lineHeight: 26,
  },
  choiceContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultCard: {
    marginBottom: 16,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 4,
  },
  prevButtonContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  nextButtonContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  submitButton: {
    backgroundColor: '#4285f4',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  scoreText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  orderingContainer: {
    marginBottom: 16,
  },
  orderingItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  orderingNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007bff',
    color: 'white',
    textAlign: 'center',
    lineHeight: 30,
    marginRight: 8,
  },
  orderingText: {
    flex: 1,
    alignSelf: 'center',
  },
  orderingButtonContainer: {
    flexDirection: 'row',
  },
  matchingContainer: {
    marginBottom: 16,
  },
  matchingInstructions: {
    fontSize: 16,
    marginBottom: 16,
  },
  matchingItemContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 16,
  },
  matchingPrompt: {
    fontSize: 16,
    marginBottom: 8,
  },
  matchingDropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchDropdownButton: {
    flex: 1,
    marginRight: 8,
  },
  responseScrollView: {
    maxHeight: 200,
  },
  responseOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  disabledResponseOption: {
    backgroundColor: '#eeeeee',
    opacity: 0.5,
  },
  responseOptionText: {
    fontSize: 16,
  },
  alreadyMatchedText: {
    fontSize: 14,
    color: '#666666',
  },
  clearMatchesButton: {
    marginTop: 16,
  },
  scenarioCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  scenarioTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scenarioContent: {
    fontStyle: 'italic',
  },
  subQuestionCard: {
    marginBottom: 16,
    padding: 16,
  },
  subQuestionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subQuestionText: {
    marginBottom: 16,
  },
  correctAnswerContainer: {
    marginTop: 16,
  },
  correctAnswerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctAnswerItem: {
    fontSize: 16,
    lineHeight: 24,
  },
  subQuestionResult: {
    marginBottom: 16,
  },
  subQuestionResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subQuestionExplanation: {
    fontSize: 16,
    lineHeight: 24,
  },
  resultsContainer: {
    padding: 16,
  },
  resultsCard: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreDetails: {
    fontSize: 16,
    marginBottom: 16,
  },
  resultsSummary: {
    marginBottom: 16,
  },
  resultMessage: {
    fontSize: 16,
    marginBottom: 8,
  },
  passMessage: {
    color: 'green',
  },
  warningMessage: {
    color: 'orange',
  },
  failMessage: {
    color: 'red',
  },
  questionsReviewCard: {
    marginBottom: 16,
  },
  reviewItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 16,
  },
  reviewQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctText: {
    fontSize: 16,
    color: 'green',
  },
  incorrectText: {
    fontSize: 16,
    color: 'red',
  },
  reviewExplanation: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  caseStudyContainer: {
    marginBottom: 16,
  },
  orderingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 80,
  },
  promptText: {
    fontSize: 16,
    marginBottom: 8,
  },
  reviewDetails: {
    marginTop: 16,
  },
  reviewSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reviewAnswer: {
    fontSize: 16,
    lineHeight: 24,
  },
  correctAnswerText: {
    fontSize: 16,
    color: 'green',
    lineHeight: 24,
  },
  scenarioText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  subQuestionReview: {
    marginBottom: 16,
  },
  subQuestionText: {
    fontSize: 16,
    marginBottom: 8,
  },
  correctReviewItem: {
    backgroundColor: '#e6ffed',
  },
  incorrectReviewItem: {
    backgroundColor: '#ffe6e6',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  selectedOption: {
    backgroundColor: '#e8f0fe',
    borderColor: '#4285f4',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
    color: '#333333',
  },
  orderingItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderingInstructions: {
    fontSize: 16,
    marginBottom: 16,
  },
  resetOrderButton: {
    marginTop: 16,
  },
  promptOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  promptOptionText: {
    fontSize: 16,
  },
  matchedPromptOption: {
    backgroundColor: '#e6ffed',
  },
  alreadyMatchedText: {
    fontSize: 14,
    color: '#666666',
  },
  clearMatchesButton: {
    marginTop: 16,
  },
});

export default QuizScreen;
