import React, { useState, useEffect, Fragment } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { Text, Card, Button, Divider, IconButton, useTheme, ActivityIndicator, Surface, List, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LocalDatabase from '../../services/LocalDatabase';
import MongoDatabase from '../../services/MongoDatabase';
import QuizTypesImport from '../../services/quiz/QuizTypes';

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
      const history = await MongoDatabase.quizService.getQuizHistory();
      setQuizHistory(history);
    } catch (error) {
      console.error('Error loading quiz history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      setLoading(true);
      await MongoDatabase.quizService.clearQuizHistory();
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
      console.log('Retaking quiz:', JSON.stringify(quiz, null, 2));
      
      // Check if quiz has questions
      if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        console.error('No questions found in quiz history');
        alert('This quiz has no questions to retake. Please try another quiz.');
        return;
      }
      
      // Create a topic object for navigation
      const topicData = {
        id: quiz.topicId || 'unknown',
        title: quiz.topicTitle || 'Quiz Retake',
        subtopics: [{
          id: quiz.subtopicId || 'unknown',
          title: quiz.subtopicTitle || 'Retake',
          content: ''  // Add empty content to avoid undefined errors
        }]
      };
      
      // Navigate to the quiz screen with the topic data
      // This will use the same quiz generation mechanism as the initial quiz
      navigation.navigate('Quiz', {
        topic: topicData,
        subtopic: topicData.subtopics[0]
      });
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
    // Map from question_type string to the internal type name
    switch (questionType) {
      case 'Multiple Choice':
        return 'MultipleChoiceQuestion';
      case 'Multiple Response':
        return 'MultipleResponseQuestion';
      case 'Ordering':
        return 'OrderingQuestion';
      case 'Matching':
        return 'MatchingQuestion';
      case 'Case Study':
        return 'CaseStudyQuestion';
      default:
        throw new Error(`Unknown question_type: ${questionType}`);
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
    const formattedDate = new Date(item.timestamp).toLocaleString();
    
    return (
      <Surface 
        style={[
          styles.quizItem, 
          isSelected && { backgroundColor: theme.colors.primaryContainer }
        ]}
        elevation={1}
      >
        <List.Item
          title={item.topicTitle}
          description={`${item.subtopicTitle} • ${formattedDate}`}
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

    return (
      <View style={styles.detailsContainer}>
        <Card style={styles.detailsCard}>
          <Card.Title 
            title={selectedQuiz.topicTitle} 
            subtitle={selectedQuiz.subtopicTitle}
          />
          <Card.Content>
            <Text style={styles.dateText}>
              Generated: {new Date(selectedQuiz.timestamp).toLocaleString()}
            </Text>
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Questions:</Text>
            {selectedQuiz.questions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <Text style={styles.questionType}>{question.type}</Text>
                <Text style={styles.questionText}>{question.question}</Text>
              </View>
            ))}
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={() => handleRetakeQuiz(selectedQuiz)}
            >
              <Text>Retake Quiz</Text>
            </Button>
          </Card.Actions>
        </Card>
      </View>
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

  // For tablets, use a split-view layout
  if (isTablet) {
    return (
      <View style={styles.container}>
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
                  <Text>Clear History</Text>
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
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
          
          <View style={styles.detailsWrapper}>
            {renderQuizDetails()}
          </View>
        </View>
      </View>
    );
  }

  // For phones, use a stacked layout
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="titleLarge" style={styles.headerTitle}>Quiz History</Text>
        {quizHistory.length > 0 && (
          <Button 
            mode="text" 
            onPress={handleClearHistory}
            icon="delete"
          >
            <Text>Clear History</Text>
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
                <Text>Back</Text>
              </FAB>
            </>
          ) : (
            <FlatList
              data={quizHistory}
              renderItem={renderQuizItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
            />
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
  },
  detailsWrapper: {
    flex: 2,
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
  },
  quizItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  detailsCard: {
    marginBottom: 16,
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
