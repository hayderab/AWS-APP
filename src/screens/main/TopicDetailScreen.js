import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import { Text, Card, Divider, Button, useTheme, Surface, IconButton, ActivityIndicator, List, Portal, Dialog, Alert } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocalDatabase from '../../services/LocalDatabase';
import QuizGenerator from '../../services/quiz/QuizGenerator';

const TopicDetailScreen = ({ route, navigation }) => {
  const { topic } = route.params || {};
  const theme = useTheme();
  const [expanded, setExpanded] = useState({});
  const [notes, setNotes] = useState([]);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [loading, setLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizLoadingProgress, setQuizLoadingProgress] = useState('');
  const [quizLoadingVisible, setQuizLoadingVisible] = useState(false);

  useEffect(() => {
    // Load notes for this topic
    const loadNotes = async () => {
      try {
        setLoading(true);
        const topicNotes = await LocalDatabase.note.getNotesByTopic(topic.id);
        setNotes(topicNotes || []);
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [topic]);

  const toggleAccordion = (id) => {
    setExpanded({
      ...expanded,
      [id]: !expanded[id]
    });
  };

  const handlePracticeQuiz = async () => {
    try {
      // Check if topic has subtopics
      if (!topic.subtopics || topic.subtopics.length === 0) {
        alert('This topic has no subtopics. Please add subtopics before creating a quiz.');
        return;
      }

      // Show loading dialog
      setQuizLoadingVisible(true);
      setGeneratingQuiz(true);
      setQuizLoadingProgress('Initializing quiz generator...');
      
      // Small delay to ensure the dialog is visible
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate questions for the first subtopic
      setQuizLoadingProgress('Generating multiple choice questions...');
      let attempts = 0;
      let generatedQuestions = null;
      
      // Try up to 3 times to generate questions
      while (attempts < 3 && (!generatedQuestions || generatedQuestions.length < 5)) {
        attempts++;
        try {
          setQuizLoadingProgress(`Generating quiz (attempt ${attempts}/3)...`);
          generatedQuestions = await QuizGenerator.generateQuiz(
            topic,
            topic.subtopics[0],
            5
          );
          
          // Verify we have all question types
          const types = new Set(generatedQuestions.map(q => q.type));
          if (types.size < 5) {
            setQuizLoadingProgress(`Missing some question types. Retrying (${attempts}/3)...`);
            generatedQuestions = null; // Force retry
          } else {
            // Log the question types we're passing to the quiz screen
            console.log('Question types being passed to quiz screen:', 
              generatedQuestions.map(q => ({type: q.type, question: q.question.substring(0, 30) + '...'}))
            );
          }
        } catch (error) {
          console.error(`Error on attempt ${attempts}:`, error);
          
          // Only retry for specific error types that indicate a Gemini API issue
          // Don't retry for parsing errors or other client-side issues
          if (error.message && (
              error.message.includes('API request failed') || 
              error.message.includes('network error') ||
              error.message.includes('timeout') ||
              error.message.includes('rate limit') ||
              error.message.includes('Missing question types') ||
              error.message.includes('Not enough questions generated')
          )) {
            setQuizLoadingProgress(`API error. Retrying (${attempts}/3)...`);
          } else {
            // For parsing errors or other client-side issues, show error and stop retrying
            setQuizLoadingProgress(`Error: ${error.message}`);
            throw error; // Re-throw to exit the loop
          }
        }
      }
      
      setQuizLoadingProgress('Quiz ready! Launching quiz...');
      
      // Hide loading dialog
      setQuizLoadingVisible(false);
      setGeneratingQuiz(false);
      
      // If we have questions, navigate to the quiz screen
      if (generatedQuestions && generatedQuestions.length > 0) {
        // Log the question types one more time before navigation
        console.log('Final question types before navigation:', 
          generatedQuestions.map(q => ({
            type: q.type, 
            question: q.question.substring(0, 30) + '...',
            constructor: q.constructor ? q.constructor.name : 'Unknown'
          }))
        );
        
        // Navigate to the quiz screen with the generated questions
        navigation.navigate('Quiz', {
          topic,
          preGeneratedQuestions: generatedQuestions
        });
      } else {
        // Show error if we couldn't generate questions
        Alert.alert(
          'Quiz Generation Failed',
          'Unable to generate quiz questions after multiple attempts. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setQuizLoadingVisible(false);
      setGeneratingQuiz(false);
      Alert.alert(
        'Quiz Generation Error',
        `An error occurred while generating the quiz: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  if (!topic) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading topic...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.topicCard} elevation={1}>
          <View style={styles.topicHeader}>
            <Text variant="headlineSmall" style={styles.topicTitle}>{topic.title}</Text>
          </View>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.topicDescription}>
            {topic.description || 'No description available for this topic.'}
          </Text>
        </Surface>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Subtopics ({topic.subtopics?.length || 0})</Text>
          
          {topic.subtopics && topic.subtopics.length > 0 ? (
            topic.subtopics.map((subtopic, index) => (
              <Surface key={`${subtopic.id || 'subtopic'}-${index}`} style={styles.subtopicCard} elevation={1}>
                <List.Accordion
                  title={subtopic.title}
                  description={subtopic.content ? subtopic.content.substring(0, 60) + '...' : 'No content available'}
                  expanded={expanded[subtopic.id]}
                  onPress={() => toggleAccordion(subtopic.id)}
                  titleStyle={styles.accordionTitle}
                  style={styles.accordion}
                  left={props => <List.Icon {...props} icon="book-open-variant" />}
                >
                  <View style={styles.subtopicContent}>
                    <Text variant="bodyLarge" style={styles.contentText}>
                      {subtopic.content || 'No content available for this subtopic.'}
                    </Text>

                    {subtopic.examples && subtopic.examples.length > 0 && (
                      <View style={styles.examplesSection}>
                        <Text variant="titleMedium" style={styles.sectionSubtitle}>Examples</Text>
                        {subtopic.examples.map((example, idx) => (
                          <Surface key={`example-${idx}`} style={styles.exampleCard} elevation={1}>
                            <Text variant="bodyMedium">{example}</Text>
                          </Surface>
                        ))}
                      </View>
                    )}

                    {subtopic.resources && subtopic.resources.length > 0 && (
                      <View style={styles.resourcesSection}>
                        <Text variant="titleMedium" style={styles.sectionSubtitle}>Resources</Text>
                        {subtopic.resources.map((resource, idx) => (
                          <TouchableOpacity 
                            key={`resource-${idx}`} 
                            style={styles.resourceItem}
                            onPress={() => {
                              if (resource.url) {
                                Linking.openURL(resource.url).catch(err => 
                                  console.error('Error opening resource URL:', err)
                                );
                              }
                            }}
                          >
                            <MaterialCommunityIcons name="link" size={20} color={theme.colors.primary} />
                            <Text 
                              variant="bodyMedium" 
                              style={styles.resourceText}
                              numberOfLines={1}
                            >
                              {resource.name || resource.title || 'Resource'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {subtopic.videoLinks && subtopic.videoLinks.length > 0 && (
                      <View style={styles.resourcesSection}>
                        <Text variant="titleMedium" style={styles.sectionSubtitle}>Video Tutorials</Text>
                        {subtopic.videoLinks.map((video, idx) => (
                          <TouchableOpacity 
                            key={`video-${idx}`} 
                            style={styles.resourceItem}
                            onPress={() => {
                              if (video.url) {
                                Linking.openURL(video.url).catch(err => 
                                  console.error('Error opening video URL:', err)
                                );
                              }
                            }}
                          >
                            <MaterialCommunityIcons name="youtube" size={20} color="#FF0000" />
                            <Text 
                              variant="bodyMedium" 
                              style={styles.resourceText}
                              numberOfLines={1}
                            >
                              {video.name || video.title || 'Video Tutorial'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {notes.filter(note => note.subtopicId === subtopic.id).length > 0 && (
                      <View style={styles.notesSection}>
                        <Text variant="titleMedium" style={styles.sectionSubtitle}>Your Notes</Text>
                        {notes.filter(note => note.subtopicId === subtopic.id).map((note) => (
                          <Surface key={note.id} style={styles.noteCard} elevation={1}>
                            <Text variant="titleSmall" style={styles.noteTitle}>{note.title}</Text>
                            <Text variant="bodyMedium">{note.content}</Text>
                          </Surface>
                        ))}
                      </View>
                    )}

                    <View style={styles.actionButtons}>
                      <Button 
                        mode="contained" 
                        icon="notebook-plus" 
                        onPress={() => navigation.navigate('AddNote', { 
                          topicId: topic.id, 
                          subtopicId: subtopic.id,
                          subtopicTitle: subtopic.title
                        })}
                        style={styles.actionButton}
                      >
                        Add Note
                      </Button>
                      
                      <Button 
                        mode="outlined" 
                        icon="share-variant"
                        onPress={() => {
                          /* Share functionality would go here */
                          alert('Share functionality coming soon!');
                        }}
                        style={styles.actionButton}
                      >
                        Share
                      </Button>
                    </View>
                  </View>
                </List.Accordion>
              </Surface>
            ))
          ) : (
            <Text style={styles.emptyText}>No subtopics available for this topic.</Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            icon="help-circle" 
            onPress={handlePracticeQuiz}
            style={[styles.footerButton, { backgroundColor: theme.colors.primary }]}
            disabled={generatingQuiz}
          >
            {generatingQuiz ? 'Generating Quiz...' : 'Practice Quiz'}
          </Button>
          
          <Button 
            mode="outlined" 
            icon="history" 
            onPress={() => navigation.navigate('QuizHistory')}
            style={styles.footerButton}
          >
            Quiz History
          </Button>
          
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Notes', { topic })}
            style={styles.footerButton}
          >
            View Notes
          </Button>
        </View>
      </ScrollView>
      <Portal>
        <Dialog visible={quizLoadingVisible} dismissable={false}>
          <Dialog.Title>Loading Quiz...</Dialog.Title>
          <Dialog.Content>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 16 }}>{quizLoadingProgress}</Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  topicCard: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  topicHeader: {
    padding: 16,
  },
  topicTitle: {
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
  },
  topicDescription: {
    padding: 16,
    color: '#555',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtopicCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordion: {
    padding: 0,
  },
  accordionTitle: {
    fontWeight: 'bold',
  },
  subtopicContent: {
    padding: 16,
    paddingTop: 0,
  },
  contentText: {
    marginBottom: 16,
    lineHeight: 24,
  },
  examplesSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  exampleCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resourcesSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  resourceText: {
    marginLeft: 8,
    color: '#0073BB',
    flex: 1,
  },
  notesSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  noteCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 0.48,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerButton: {
    flex: 0.48,
  },
});

export default TopicDetailScreen;
