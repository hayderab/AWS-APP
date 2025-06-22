import { useState, useEffect } from 'react';
import { quizTypeRegistry } from '../services/quiz/QuizTypes';

// Custom hook to manage state for different question types
export const useQuestionState = (question, onAnswerChange) => {
  // Common state
  const [answer, setAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  // Specific state for different question types
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [matchingPairs, setMatchingPairs] = useState([]);
  const [subQuestionAnswers, setSubQuestionAnswers] = useState([]);
  
  // Selected elements for matching questions
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  // Reset state when question changes
  useEffect(() => {
    if (!question) return;
    
    setAnswer(null);
    setIsAnswered(false);
    
    // Initialize state based on question type
    switch (question.type) {
      case 'MultipleChoiceQuestion':
        setSelectedOption(null);
        break;
        
      case 'MultipleResponseQuestion':
        setSelectedOptions([]);
        break;
        
      case 'OrderingQuestion':
        // Initialize order items from question
        setOrderItems([...(question.items || [])]);
        break;
        
      case 'MatchingQuestion':
        // Initialize empty matching pairs
        setMatchingPairs([]);
        setSelectedPrompt(null);
        setSelectedResponse(null);
        break;
        
      case 'CaseStudyQuestion':
        // Initialize sub-question answers
        setSubQuestionAnswers(
          new Array(question.subQuestions?.length || 0).fill(null)
        );
        break;
        
      default:
        // For custom question types, try to get initialization from registry
        try {
          const questionClass = quizTypeRegistry.getQuestionClass(question.type);
          if (questionClass && questionClass.initializeState) {
            const initialState = questionClass.initializeState(question);
            // Apply any custom state initialization
            Object.keys(initialState).forEach(key => {
              if (typeof initialState[key] !== 'undefined') {
                // This is a bit of a hack since we can't dynamically set state hooks
                // In a real implementation, you might want to use a reducer pattern instead
                switch (key) {
                  case 'selectedOption': setSelectedOption(initialState[key]); break;
                  case 'selectedOptions': setSelectedOptions(initialState[key]); break;
                  case 'orderItems': setOrderItems(initialState[key]); break;
                  case 'matchingPairs': setMatchingPairs(initialState[key]); break;
                  case 'subQuestionAnswers': setSubQuestionAnswers(initialState[key]); break;
                  default: break;
                }
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to initialize state for question type ${question.type}:`, error);
        }
        break;
    }
  }, [question]);
  
  // Handle answer changes for different question types
  const handleAnswerChange = (newValue, questionType = question?.type) => {
    switch (questionType) {
      case 'MultipleChoiceQuestion':
        setSelectedOption(newValue);
        setAnswer(newValue);
        setIsAnswered(!!newValue);
        break;
        
      case 'MultipleResponseQuestion':
        setSelectedOptions(newValue);
        setAnswer(newValue);
        setIsAnswered(newValue && newValue.length > 0);
        break;
        
      case 'OrderingQuestion':
        setOrderItems(newValue);
        setAnswer(newValue);
        setIsAnswered(true); // Always considered answered once reordered
        break;
        
      case 'MatchingQuestion':
        setMatchingPairs(newValue);
        setAnswer(newValue);
        setIsAnswered(newValue && newValue.length === question.prompts.length);
        break;
        
      case 'CaseStudyQuestion':
        setSubQuestionAnswers(newValue);
        setAnswer(newValue);
        setIsAnswered(newValue && newValue.every(a => a !== null));
        break;
        
      default:
        // For custom question types
        setAnswer(newValue);
        setIsAnswered(!!newValue);
        break;
    }
    
    // Notify parent component
    if (onAnswerChange) {
      onAnswerChange(newValue);
    }
  };
  
  // Helper functions for specific question types
  
  // Multiple Choice
  const handleOptionSelect = (option) => {
    handleAnswerChange(option);
  };
  
  // Multiple Response
  const toggleOption = (option) => {
    const newOptions = [...selectedOptions];
    const index = newOptions.indexOf(option);
    
    if (index === -1) {
      newOptions.push(option);
    } else {
      newOptions.splice(index, 1);
    }
    
    handleAnswerChange(newOptions);
  };
  
  // Ordering
  const handleReorder = (itemIndex, direction) => {
    const newItems = [...orderItems];
    
    if (direction === 'up' && itemIndex > 0) {
      // Swap with the item above
      [newItems[itemIndex], newItems[itemIndex - 1]] = [newItems[itemIndex - 1], newItems[itemIndex]];
    } else if (direction === 'down' && itemIndex < newItems.length - 1) {
      // Swap with the item below
      [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
    }
    
    handleAnswerChange(newItems);
  };
  
  const resetOrder = () => {
    if (question && question.items) {
      setOrderItems([...question.items]);
      handleAnswerChange([...question.items]);
    }
  };
  
  // Matching
  const selectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    
    // If response is already selected, create a pair
    if (selectedResponse) {
      addMatchingPair(prompt, selectedResponse);
    }
  };
  
  const selectResponse = (response) => {
    setSelectedResponse(response);
    
    // If prompt is already selected, create a pair
    if (selectedPrompt) {
      addMatchingPair(selectedPrompt, response);
    }
  };
  
  const addMatchingPair = (prompt, response) => {
    // Check if this prompt already has a pair
    const newPairs = matchingPairs.filter(pair => pair.prompt !== prompt);
    
    // Add the new pair
    newPairs.push({ prompt, response });
    
    // Reset selections
    setSelectedPrompt(null);
    setSelectedResponse(null);
    
    // Update state
    setMatchingPairs(newPairs);
    handleAnswerChange(newPairs);
  };
  
  const removeMatchingPair = (prompt) => {
    const newPairs = matchingPairs.filter(pair => pair.prompt !== prompt);
    setMatchingPairs(newPairs);
    handleAnswerChange(newPairs);
  };
  
  const clearAllMatches = () => {
    setMatchingPairs([]);
    setSelectedPrompt(null);
    setSelectedResponse(null);
    handleAnswerChange([]);
  };
  
  // Case Study
  const updateSubQuestionAnswer = (index, subAnswer) => {
    const newAnswers = [...subQuestionAnswers];
    newAnswers[index] = subAnswer;
    setSubQuestionAnswers(newAnswers);
    handleAnswerChange(newAnswers);
  };
  
  return {
    // Common state
    answer,
    isAnswered,
    
    // Multiple Choice
    selectedOption,
    handleOptionSelect,
    
    // Multiple Response
    selectedOptions,
    toggleOption,
    
    // Ordering
    orderItems,
    handleReorder,
    resetOrder,
    
    // Matching
    matchingPairs,
    selectedPrompt,
    selectedResponse,
    selectPrompt,
    selectResponse,
    removeMatchingPair,
    clearAllMatches,
    
    // Case Study
    subQuestionAnswers,
    updateSubQuestionAnswer,
    
    // Generic handler
    handleAnswerChange
  };
};

export default useQuestionState;
