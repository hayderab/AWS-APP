import React, { useState, useEffect, Fragment } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions, ScrollView } from 'react-native';
import { Text, Card, Button, Divider, IconButton, useTheme, ActivityIndicator, Surface, List, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LocalDatabase from '../../services/LocalDatabase';
import ApiService from '../../services/ApiService';
import QuizTypesImport from '../../services/quiz/QuizTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuizHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  useEffect(() => {
    loadQuizHistory();
  }, []);

  const loadQuizHistory = async () => {
    try {
      setLoading(true);
      
      // Add debugging to see what's available
      console.log('LocalDatabase available:', !!LocalDatabase);
      console.log('ApiService available:', !!ApiService);
      
      // Create a fallback history with sample data if needed for testing
      const fallbackHistory = [
        {
          id: 'sample-quiz-1',
          topicId: 'sample-topic-1',
          topicTitle: 'AWS EC2',
          subtopicId: 'sample-subtopic-1',
          subtopicTitle: 'EC2 Instance Types',
          timestamp: new Date().toISOString(),
          score: 80,
          questions: []
        },
        {
          id: 'sample-quiz-2',
          topicId: 'sample-topic-2',
          topicTitle: 'AWS S3',
          subtopicId: 'sample-subtopic-2',
          subtopicTitle: 'S3 Storage Classes',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          score: 70,
          questions: []
        }
      ];
      
      // Try to get quiz history from AsyncStorage first (most reliable source)
      let history = [];
      try {
        const quizHistoryStr = await AsyncStorage.getItem('quizHistory');
        if (quizHistoryStr) {
          const parsedHistory = JSON.parse(quizHistoryStr);
          if (parsedHistory && Array.isArray(parsedHistory)) {
            history = parsedHistory;
            console.log('Got history from AsyncStorage:', history);
          }
        }
      } catch (storageError) {
        console.error('Error getting history from AsyncStorage:', storageError);
      }
      
      // If AsyncStorage fails, try API
      if (history.length === 0) {
        try {
          const response = await ApiService.quiz.getHistory();
          if (response && Array.isArray(response)) {
            history = response;
            console.log('Got history from API:', history);
          }
        } catch (apiError) {
          console.error('Error getting history from API:', apiError);
        }
      }
      
      // If API fails, try LocalDatabase
      if (history.length === 0) {
        try {
          if (LocalDatabase && LocalDatabase.getQuizHistory) {
            const localHistory = await LocalDatabase.getQuizHistory();
            if (localHistory && Array.isArray(localHistory)) {
              history = localHistory;
              console.log('Got history from LocalDatabase:', history);
            }
          }
        } catch (localError) {
          console.error('Error getting history from LocalDatabase:', localError);
        }
      }
      
      // If all sources fail and we're in development, use fallback data
      if (history.length === 0 && __DEV__) {
        console.log('Using fallback quiz history data for development');
        history = fallbackHistory;
      }
      
      // Ensure all history items have required properties
      history = history.map(item => ({
        id: item.id || `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        topicId: item.topicId || 'unknown',
        topicTitle: item.topicTitle || 'Unknown Topic',
        subtopicId: item.subtopicId || 'unknown',
        subtopicTitle: item.subtopicTitle || 'Unknown Subtopic',
        timestamp: item.timestamp || new Date().toISOString(),
        score: item.score || 0,
        questions: item.questions || []
      }));
      
      // Sort by most recent first
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log(`Loaded ${history.length} quiz history items`);
      setQuizHistory(history);
    } catch (error) {
      console.error('Error loading quiz history:', error);
      setQuizHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      setLoading(true);
      
      // Try to clear quiz history directly from the API
      let success = false;
      
      try {
        // Try to clear history directly from the API
        await ApiService.quiz.clearHistory();
        success = true;
      } catch (apiError) {
        console.error('Error clearing history from API:', apiError);
        
        // If API fails, try LocalDatabase
        try {
          if (LocalDatabase && LocalDatabase.clearQuizHistory) {
            await LocalDatabase.clearQuizHistory();
            success = true;
          }
        } catch (localError) {
          console.error('Error clearing history from LocalDatabase:', localError);
        }
        
        // If both fail, clear AsyncStorage directly
        if (!success) {
          try {
            await AsyncStorage.setItem('quizHistory', '[]');
            success = true;
          } catch (storageError) {
            console.error('Error clearing history from AsyncStorage:', storageError);
          }
        }
      }
      
      setQuizHistory([]);
      setSelectedQuiz(null);
    } catch (error) {
      console.error('Error clearing quiz history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeQuiz = (quiz) => {
    try {
      // Debug the quiz data
      console.log('Retaking quiz:', quiz);
      
      // Use the correct property names based on the data structure
      const topicTitle = quiz.topicTitle || quiz.topic || 'Unknown Topic';
      const subtopicTitle = quiz.subtopicTitle || 'Unknown Subtopic';
      
      // Create a topic object for navigation
      const topicData = {
        id: quiz.topicId || 'unknown',
        title: topicTitle,
        subtopics: [{
          id: quiz.subtopicId || 'unknown',
          title: subtopicTitle,
          content: ''  // Add empty content to avoid undefined errors
        }]
      };
      
      // Process the existing questions to ensure they have all required properties
      const existingQuestions = (quiz.questions || []).map(q => {
        // Create a properly structured question object based on its type
        const baseQuestion = {
          type: q.type,
          question: q.question,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
          isAnswered: false, // Reset for retake
          userAnswer: null   // Reset for retake
        };
        
        // Add type-specific properties
        switch (q.type) {
          case 'MultipleChoiceQuestion':
            return {
              ...baseQuestion,
              choices: q.choices || [],
              correctAnswer: q.correctAnswer
            };
          case 'MultipleResponseQuestion':
            return {
              ...baseQuestion,
              choices: q.choices || [],
              correctAnswers: q.correctAnswers || []
            };
          case 'OrderingQuestion':
            return {
              ...baseQuestion,
              items: q.items || [],
              correctOrder: q.correctOrder || []
            };
          case 'MatchingQuestion':
            return {
              ...baseQuestion,
              prompts: q.prompts || [],
              responses: q.responses || [],
              correctPairs: q.correctPairs || {}
            };
          case 'CaseStudyQuestion':
            return {
              ...baseQuestion,
              scenario: q.scenario || '',
              subQuestions: (q.subQuestions || []).map(sq => ({
                type: sq.type || 'MultipleChoiceQuestion',
                question: sq.question || '',
                choices: sq.choices || [],
                correctAnswer: sq.correctAnswer,
                explanation: sq.explanation || ''
              }))
            };
          default:
            return baseQuestion;
        }
      });
      
      // Log the navigation parameters
      console.log('Navigation params:', {
        topic: topicData,
        subtopic: topicData.subtopics[0],
        existingQuestions: existingQuestions.length
      });
      
      // Navigate to the quiz screen with the topic data and existing questions
      navigation.navigate('Quiz', {
        topic: topicData,
        subtopic: topicData.subtopics[0],
        preGeneratedQuestions: existingQuestions,
        isRetake: true // Flag to indicate this is a retake
      });
      
      console.log('Navigated to Quiz screen for retake with existing questions');
    } catch (error) {
      console.error('Error retaking quiz:', error);
      console.error('Error details:', error.stack);
      alert(`Error retaking quiz: ${error.message}`);
    }
  };

  const getQuestionClass = (type) => {
    switch (type) {
      case 'MultipleChoiceQuestion':
        return QuizTypesImport.MultipleChoiceQuestion;
      case 'MultipleResponseQuestion':
        return QuizTypesImport.MultipleResponseQuestion;
      case 'OrderingQuestion':
        return QuizTypesImport.OrderingQuestion;
      case 'MatchingQuestion':
        return QuizTypesImport.MatchingQuestion;
      case 'CaseStudyQuestion':
        return QuizTypesImport.CaseStudyQuestion;
      default:
        throw new Error(`Unknown question type: ${type}`);
    }
  };

  const getConstructorArgs = (questionData) => {
    switch (questionData.type) {
      case 'MultipleChoiceQuestion':
        return [
          questionData.choices || [],
          questionData.correctAnswer || '',
          questionData.explanation || '',
          questionData.difficulty || 'medium'
        ];
      case 'MultipleResponseQuestion':
        return [
          questionData.choices || [],
          questionData.correctAnswers || [],
          questionData.explanation || '',
          questionData.difficulty || 'medium'
        ];
      case 'OrderingQuestion':
        return [
          questionData.items || [],
          questionData.correctOrder || [],
          questionData.explanation || '',
          questionData.difficulty || 'medium'
        ];
      case 'MatchingQuestion':
        return [
          questionData.prompts || [],
          questionData.responses || [],
          questionData.correctPairs || [],
          questionData.explanation || '',
          questionData.difficulty || 'medium'
        ];
      case 'CaseStudyQuestion':
        return [
          questionData.scenario || '',
          questionData.subQuestions || [],
          questionData.explanation || '',
          questionData.difficulty || 'medium'
        ];
      default:
        throw new Error(`Unknown question type: ${questionData.type}`);
    }
  };

  const mapQuestionType = (questionType) => {
    // Handle both formats of question types
    switch (questionType) {
      case 'MultipleChoiceQuestion':
      case 'Multiple Choice':
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'MultipleResponseQuestion':
      case 'Multiple Response':
      case 'multiple_response':
        return 'Multiple Response';
      case 'OrderingQuestion':
      case 'Ordering':
      case 'ordering':
        return 'Ordering';
      case 'MatchingQuestion':
      case 'Matching':
      case 'matching':
        return 'Matching';
      case 'CaseStudyQuestion':
      case 'Case Study':
      case 'case_study':
        return 'Case Study';
      default:
        return questionType || 'Multiple Choice';
    }
  };

  const mapQuestionData = (q, questionType) => {
    // Create a properly formatted question object based on the question type
    const baseQuestion = {
      type: questionType,
      question: q.question_text || q.question || '',
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium'
    };

    switch (questionType) {
      case 'MultipleChoiceQuestion':
        return {
          ...baseQuestion,
          // Transform options array to choices array expected by the constructor
          choices: q.options ? q.options.map(opt => opt.text || opt) : [],
          correctAnswer: q.correct_answer || ''
        };
      case 'MultipleResponseQuestion':
        return {
          ...baseQuestion,
          // Transform options array to choices array expected by the constructor
          choices: q.options ? q.options.map(opt => opt.text || opt) : [],
          correctAnswers: q.correct_answers || []
        };
      case 'OrderingQuestion':
        return {
          ...baseQuestion,
          // Transform items_to_order array to items array expected by the constructor
          items: q.items_to_order ? q.items_to_order.map(item => item.text || item) : [],
          correctOrder: q.correct_order ? q.correct_order.map(id => {
            // Find the corresponding item text for this ID
            const item = q.items_to_order?.find(i => i.id === id);
            return item ? (item.text || item) : id;
          }) : []
        };
      case 'MatchingQuestion':
        return {
          ...baseQuestion,
          // Transform prompts and responses arrays
          prompts: q.prompts ? q.prompts.map(p => p.text || p) : [],
          responses: q.responses ? q.responses.map(r => r.text || r) : [],
          correctPairs: q.correct_matches ? q.correct_matches.map(match => ({
            prompt: findTextById(q.prompts, match.prompt_id),
            response: findTextById(q.responses, match.response_id)
          })) : []
        };
      case 'CaseStudyQuestion':
        // For case study, map the sub-questions
        const subQuestions = (q.questions || []).map(subQ => {
          const subType = 'MultipleChoiceQuestion';
          const subQuestionObj = new QuizTypesImport.MultipleChoiceQuestion(
            subQ.question_text || '',
            subQ.options ? subQ.options.map(opt => opt.text || opt) : [],
            subQ.correct_answer || '',
            subQ.explanation || '',
            'medium'
          );
          return subQuestionObj;
        });
        
        return {
          ...baseQuestion,
          scenario: q.scenario || '',
          subQuestions: subQuestions
        };
      default:
        return baseQuestion;
    }
  };

  const findTextById = (array, id) => {
    if (!array || !Array.isArray(array)) return id;
    const item = array.find(i => i.id === id);
    return item ? (item.text || item) : id;
  };

  const renderQuizItem = ({ item }) => {
    const isSelected = selectedQuiz && selectedQuiz.id === item.id;
    // Handle both timestamp formats (string date or number)
    const timestamp = typeof item.timestamp === 'number' ? item.timestamp : new Date(item.timestamp).getTime();
    const formattedDate = new Date(timestamp).toLocaleString();
    
    // Use the correct property names based on the data structure
    const topicTitle = item.topicTitle || item.topic || 'Unknown Topic';
    const subtopicTitle = item.subtopicTitle || 'Unknown Subtopic';
    
    return (
      <Surface 
        style={[
          styles.quizItem, 
          isSelected && { backgroundColor: theme.colors.primaryContainer }
        ]}
        elevation={1}
      >
        <List.Item
          title={topicTitle}
          description={`${subtopicTitle} • ${formattedDate}`}
          left={props => <List.Icon {...props} icon="clipboard-list" />}
          right={props => (
            <IconButton
              {...props}
              icon="refresh"
              onPress={() => handleRetakeQuiz(item)}
              tooltip="Retake Quiz"
            />
          )}
          onPress={() => setSelectedQuiz(item)}
        />
      </Surface>
    );
  };

  const renderQuizDetails = () => {
    if (!selectedQuiz) {
      return (
        <View style={styles.emptyDetailsContainer}>
          <MaterialCommunityIcons 
            name="clipboard-text-outline" 
            size={64} 
            color={theme.colors.outline} 
          />
          <Text style={styles.emptyDetailsText}>
            Select a quiz from the list to view details
          </Text>
        </View>
      );
    }
    
    // Handle both timestamp formats (string date or number)
    const timestamp = typeof selectedQuiz.timestamp === 'number' 
      ? selectedQuiz.timestamp 
      : new Date(selectedQuiz.timestamp).getTime();
    const formattedDate = new Date(timestamp).toLocaleString();
    
    // Use the correct property names based on the data structure
    const topicTitle = selectedQuiz.topicTitle || selectedQuiz.topic || 'Unknown Topic';
    const subtopicTitle = selectedQuiz.subtopicTitle || 'Unknown Subtopic';
    const score = selectedQuiz.score || 0;
    const correctCount = selectedQuiz.correctCount || 0;
    const totalQuestions = selectedQuiz.totalQuestions || (selectedQuiz.questions ? selectedQuiz.questions.length : 0);
    
    return (
      <ScrollView 
        contentContainerStyle={styles.detailsContainer}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleLarge">{topicTitle}</Text>
            <Text variant="titleMedium">{subtopicTitle}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
            
            <Text variant="titleMedium">Score: {score}%</Text>
            <Text>Correct: {correctCount} / {totalQuestions}</Text>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Questions</Text>
            
            {selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
              selectedQuiz.questions.map((question, index) => {
                // Get question text, handling different formats
                const questionText = question.question_text || question.question || `Question ${index + 1}`;
                // Get question type, handling different formats
                const questionType = question.question_type || question.type || 'Unknown';
                
                return (
                  <View key={index} style={styles.questionItem}>
                    <Text style={styles.questionType}>
                      {mapQuestionType(questionType)}
                    </Text>
                    <Text style={styles.questionText}>
                      {questionText.length > 100 
                        ? questionText.substring(0, 100) + '...' 
                        : questionText}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No question details available</Text>
            )}
          </Card.Content>
        </Card>
        
        <Button 
          mode="contained" 
          icon="refresh" 
          onPress={() => handleRetakeQuiz(selectedQuiz)}
          style={styles.button}
        >
          Retake Quiz
        </Button>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading quiz history...</Text>
      </View>
    );
  }

  // For tablets, use a split view layout
  if (isTablet) {
    console.log('Rendering tablet layout with', quizHistory.length, 'history items');
    return (
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading quiz history...</Text>
          </View>
        ) : (
          <View style={styles.splitContainer}>
            <View style={styles.listContainer}>
              <View style={styles.headerContainer}>
                <Text variant="titleLarge" style={styles.headerTitle}>Quiz History</Text>
                {quizHistory.length > 0 && (
                  <Button 
                    mode="text" 
                    onPress={handleClearHistory}
                    icon="delete"
                  >
                    Clear History
                  </Button>
                )}
              </View>
              
              {quizHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="history" size={64} color={theme.colors.outline} />
                  <Text style={styles.emptyText}>No quiz history found</Text>
                </View>
              ) : (
                <FlatList
                  data={quizHistory}
                  renderItem={renderQuizItem}
                  keyExtractor={item => item.id || item._id || `quiz-${Math.random()}`}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={true}
                  scrollEnabled={true}
                  style={{flex: 1}}
                />
              )}
            </View>
            
            <View style={styles.detailsWrapper}>
              {renderQuizDetails()}
            </View>
          </View>
        )}
      </View>
    );
  }

  // For phones, use a stacked layout
  console.log('Rendering phone layout with', quizHistory.length, 'history items');
  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading quiz history...</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text variant="titleLarge" style={styles.headerTitle}>Quiz History</Text>
            {quizHistory.length > 0 && (
              <Button 
                mode="text" 
                onPress={handleClearHistory}
                icon="delete"
              >
                Clear History
              </Button>
            )}
          </View>
          
          {quizHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={64} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No quiz history found</Text>
            </View>
          ) : (
            <>
              {selectedQuiz ? (
                <>
                  {renderQuizDetails()}
                  <FAB
                    style={styles.fab}
                    icon="arrow-left"
                    onPress={() => setSelectedQuiz(null)}
                  >
                    Back
                  </FAB>
                </>
              ) : (
                <FlatList
                  data={quizHistory}
                  renderItem={renderQuizItem}
                  keyExtractor={item => item.id || item._id || `quiz-${Math.random()}`}
                  contentContainerStyle={styles.listContent}
                />
              )}
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  listContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    backgroundColor: '#fff',
    overflow: 'hidden', // Ensure content doesn't overflow container
  },
  detailsWrapper: {
    flex: 2,
    backgroundColor: '#fff',
    overflow: 'hidden', // Ensure content doesn't overflow container
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1, // Allow content to grow but still be scrollable
  },
  quizItem: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1, // Allow content to grow but still be scrollable
  },
  detailsCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  dateText: {
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questionItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  questionType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 16,
  },
  emptyDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  emptyDetailsText: {
    fontSize: 16,
    marginTop: 16,
    color: '#888',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default QuizHistoryScreen;
