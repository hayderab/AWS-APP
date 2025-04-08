import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, useWindowDimensions, ActivityIndicator, Animated } from 'react-native';
import { Text, Card, Divider, Button, useTheme, Surface, IconButton, List, Portal, Dialog, Alert, Chip, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocalDatabase from '../../services/LocalDatabase';
import QuizGenerator from '../../services/quiz/QuizGenerator';
import GeminiService from '../../services/GeminiService';

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
  
  // AI learning enhancement states
  const [aiContent, setAiContent] = useState({});
  const [aiContentType, setAiContentType] = useState({});
  const [isLoadingAiContent, setIsLoadingAiContent] = useState({});

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
    
    // Load cached AI content
    loadCachedAiContent();
  }, [topic]);
  
  // Load cached AI content from AsyncStorage
  const loadCachedAiContent = async () => {
    try {
      const cachedContent = await AsyncStorage.getItem(`ai_content_${topic.id}`);
      if (cachedContent) {
        const parsedContent = JSON.parse(cachedContent);
        setAiContent(parsedContent.content || {});
        setAiContentType(parsedContent.contentTypes || {});
        console.log('Loaded cached AI content');
      }
    } catch (error) {
      console.error('Error loading cached AI content:', error);
    }
  };
  
  // Save AI content to AsyncStorage
  const saveAiContentToCache = async (subtopicId, contentType, content) => {
    try {
      // Update local state first
      const updatedContent = {
        ...aiContent,
        [subtopicId]: {
          ...(aiContent[subtopicId] || {}),
          [contentType]: content
        }
      };
      
      const updatedContentTypes = {
        ...aiContentType,
        [subtopicId]: contentType
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(`ai_content_${topic.id}`, JSON.stringify({
        content: updatedContent,
        contentTypes: updatedContentTypes,
        timestamp: new Date().toISOString()
      }));
      
      console.log('Saved AI content to cache');
    } catch (error) {
      console.error('Error saving AI content to cache:', error);
    }
  };

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

  // Function to generate AI-powered learning enhancements
  const generateAiContent = async (subtopicId, contentType) => {
    // Update loading state for this specific subtopic and content type
    setIsLoadingAiContent(prev => ({
      ...prev,
      [subtopicId]: {
        ...(prev[subtopicId] || {}),
        [contentType]: true
      }
    }));
    
    try {
      // Find the subtopic
      const subtopic = topic.subtopics.find(s => s.id === subtopicId);
      if (!subtopic) throw new Error('Subtopic not found');
      
      // Check if content already exists
      if (aiContent[subtopicId]?.[contentType]) {
        // If content already exists, just update the content type
        setAiContentType(prev => ({
          ...prev,
          [subtopicId]: contentType
        }));
      } else {
        // Use Gemini API to generate content
        const response = await GeminiService.generateLearningContent(contentType, subtopic, topic.title);
        
        // Store the generated content
        setAiContent(prev => ({
          ...prev,
          [subtopicId]: {
            ...(prev[subtopicId] || {}),
            [contentType]: response
          }
        }));
        
        // Update content type for this subtopic
        setAiContentType(prev => ({
          ...prev,
          [subtopicId]: contentType
        }));
        
        // Save to cache
        saveAiContentToCache(subtopicId, contentType, response);
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      Alert.alert('Error', 'Failed to generate content. Please try again.');
    } finally {
      // Update loading state
      setIsLoadingAiContent(prev => ({
        ...prev,
        [subtopicId]: {
          ...(prev[subtopicId] || {}),
          [contentType]: false
        }
      }));
    }
  };
  
  // Render AI content section
  const renderAiContent = (subtopicId) => {
    const subtopicAiContentObj = aiContent[subtopicId];
    const currentContentType = aiContentType[subtopicId];
    
    if (!currentContentType && !Object.values(isLoadingAiContent[subtopicId] || {}).some(v => v)) {
      return null;
    }
    
    const subtopicAiContent = subtopicAiContentObj?.[currentContentType];
    const isLoading = isLoadingAiContent[subtopicId]?.[currentContentType];
    
    // Get available content types for this subtopic
    const availableContentTypes = subtopicAiContentObj ? Object.keys(subtopicAiContentObj) : [];
    
    // Determine if we should show the segmented control
    const showSegmentedControl = availableContentTypes.length > 1;
    
    // Prepare segment data for the control
    const segments = [
      { value: 'tips', label: 'Tips & Tricks', icon: 'lightbulb-on' },
      { value: 'explanation', label: 'Explanation', icon: 'book-open-variant' },
      { value: 'analogies', label: 'Analogies', icon: 'compare' }
    ].filter(segment => 
      // Only show segments for content types that are already generated or currently loading
      availableContentTypes.includes(segment.value) || 
      isLoadingAiContent[subtopicId]?.[segment.value]
    );
    
    let title = '';
    let icon = '';
    
    switch (currentContentType) {
      case 'tips':
        title = 'Tips & Tricks';
        icon = 'lightbulb-on';
        break;
      case 'explanation':
        title = 'Concept Explanation';
        icon = 'book-open-variant';
        break;
      case 'analogies':
        title = 'Helpful Analogies';
        icon = 'compare';
        break;
      default:
        title = 'AI-Generated Content';
        icon = 'robot';
    }
    
    // Render content based on the content type
    const renderStructuredContent = () => {
      if (!subtopicAiContent) {
        return <Text style={styles.aiContentText}>No content available. Please try again.</Text>;
      }
      
      // Handle raw content (fallback for parsing errors)
      if (subtopicAiContent.rawContent) {
        return (
          <View style={styles.aiContentTextContainer}>
            <Text style={styles.aiContentText}>{subtopicAiContent.rawContent}</Text>
          </View>
        );
      }
      
      // Render Tips & Tricks content
      if (currentContentType === 'tips' && subtopicAiContent.tips) {
        return (
          <View style={styles.aiContentTextContainer}>
            {subtopicAiContent.tips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipHeading}>{tip.heading}</Text>
                </View>
                <Text style={styles.tipContent}>{tip.content}</Text>
              </View>
            ))}
          </View>
        );
      }
      
      // Render Explanation content
      if (currentContentType === 'explanation' && subtopicAiContent.sections) {
        return (
          <View style={styles.aiContentTextContainer}>
            {subtopicAiContent.sections.map((section, index) => (
              <View key={index} style={styles.explanationSection}>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                <Text style={styles.sectionContent}>{section.content}</Text>
                
                {section.steps && (
                  <View style={styles.stepsList}>
                    {section.steps.map((step, stepIndex) => (
                      <View key={stepIndex} style={styles.stepItem}>
                        <Text style={styles.stepNumber}>{stepIndex + 1}.</Text>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {section.components && (
                  <View style={styles.componentsList}>
                    {section.components.map((component, compIndex) => (
                      <View key={compIndex} style={styles.componentItem}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.componentText}>{component}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      }
      
      // Render Analogies content
      if (currentContentType === 'analogies' && subtopicAiContent.analogies) {
        return (
          <View style={styles.aiContentTextContainer}>
            {subtopicAiContent.analogies.map((analogy, index) => (
              <View key={index} style={styles.analogyCard}>
                <Text style={styles.analogyDomain}>{analogy.domain}</Text>
                <Text style={styles.analogyContent}>{analogy.analogy}</Text>
              </View>
            ))}
          </View>
        );
      }
      
      // Fallback for legacy or unexpected format
      if (typeof subtopicAiContent === 'string') {
        return (
          <View style={styles.aiContentTextContainer}>
            {subtopicAiContent.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                // It's a header
                return (
                  <Text key={index} variant="titleMedium" style={styles.aiContentHeader}>
                    {paragraph.replace('## ', '')}
                  </Text>
                );
              } else if (paragraph.startsWith('- ')) {
                // It's a bullet point
                return (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{paragraph.replace('- ', '')}</Text>
                  </View>
                );
              } else if (paragraph.match(/^\d+\. /)) {
                // It's a numbered list item
                const number = paragraph.match(/^\d+/)[0];
                const text = paragraph.replace(/^\d+\. /, '');
                return (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bulletNumber}>{number}.</Text>
                    <Text style={styles.bulletText}>{text}</Text>
                  </View>
                );
              } else if (paragraph.startsWith('**')) {
                // It's a bold section
                const parts = paragraph.split('**');
                return (
                  <View key={index} style={styles.aiParagraph}>
                    <Text style={styles.aiContentText}>
                      <Text style={styles.aiBoldText}>{parts[1]}</Text>
                      {parts[2]}
                    </Text>
                  </View>
                );
              } else {
                // Regular paragraph
                return (
                  <Text key={index} style={styles.aiContentText}>{paragraph}</Text>
                );
              }
            })}
          </View>
        );
      }
      
      // Default fallback
      return <Text style={styles.aiContentText}>Content format not recognized.</Text>;
    };
    
    // Helper function to get icon for analogy domain
    const getAnalogyIcon = (domain) => {
      let iconName = 'domain';
      
      switch (domain.toLowerCase()) {
        case 'restaurant':
          iconName = 'food-fork-drink';
          break;
        case 'transportation':
          iconName = 'car';
          break;
        case 'building':
          iconName = 'office-building';
          break;
        case 'team sports':
          iconName = 'soccer';
          break;
      }
      
      return <MaterialCommunityIcons name={iconName} size={20} color="#0066cc" />;
    };
    
    return (
      <View style={styles.aiContentContainer}>
        <View style={styles.aiContentHeader}>
          <View style={styles.aiContentTitleContainer}>
            <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} style={styles.aiContentIcon} />
            <Text variant="titleMedium" style={styles.sectionSubtitle}>{subtopicAiContent?.title || title}</Text>
          </View>
          <Chip 
            icon="brain" 
            mode="outlined" 
            style={styles.aiChip}
            textStyle={{ fontSize: 12 }}
          >
            AI Generated
          </Chip>
        </View>
        
        {showSegmentedControl && (
          <SegmentedButtons
            value={currentContentType}
            onValueChange={(value) => {
              // If the content is already generated, just switch to it
              // Otherwise, generate it
              if (subtopicAiContentObj?.[value]) {
                setAiContentType(prev => ({
                  ...prev,
                  [subtopicId]: value
                }));
              } else {
                generateAiContent(subtopicId, value);
              }
            }}
            buttons={segments.map(segment => ({
              value: segment.value,
              label: segment.label,
              icon: segment.icon,
              disabled: Object.values(isLoadingAiContent[subtopicId] || {}).some(v => v),
              style: { 
                backgroundColor: currentContentType === segment.value ? 
                  (segment.value === 'tips' ? '#e6f2ff' : 
                   segment.value === 'explanation' ? '#e6fff2' : 
                   '#ffe6e6') : undefined
              }
            }))}
            style={styles.segmentedControl}
          />
        )}
        
        <Divider style={styles.divider} />
        
        {isLoading ? (
          <View style={styles.aiLoadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.aiLoadingText}>Generating {title}...</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.random() * 70 + 10}%` }]} />
            </View>
          </View>
        ) : (
          renderStructuredContent()
        )}
      </View>
    );
  };

  // Reusable animated touchable component for consistent animations across the app
  const AnimatedTouchableCard = ({ onPress, style, backgroundColor, children }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={style}
      >
        <Animated.View style={{ 
          transform: [{ scale: scaleAnim }],
          backgroundColor,
          borderRadius: 12,
          flex: 1,
          shadowColor: backgroundColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          elevation: 4,
        }}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
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

                    <View style={styles.aiEnhancementsContainer}>
                      <Text variant="titleMedium" style={styles.sectionSubtitle}>Learning Enhancements</Text>
                      <View style={styles.aiButtonsContainer}>
                        <AnimatedTouchableCard
                          onPress={() => generateAiContent(subtopic.id, 'tips')}
                          style={styles.aiButton}
                          backgroundColor="#e6f2ff"
                          disabled={Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v)}
                        >
                          <View style={[
                            styles.aiButtonContent,
                            aiContentType[subtopic.id] === 'tips' && styles.activeAiButton,
                            Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) && styles.disabledAiButton
                          ]}>
                            <MaterialCommunityIcons 
                              name="lightbulb-on" 
                              size={24} 
                              color={Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) ? "#999999" : "#0066cc"} 
                            />
                            <Text style={[
                              styles.aiButtonText,
                              Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) && styles.disabledAiButtonText
                            ]}>
                              Tips & Tricks
                              {isLoadingAiContent[subtopic.id]?.['tips'] && (
                                <View style={styles.loadingIndicatorContainer}>
                                  <Text style={styles.loadingIndicatorText}>...</Text>
                                </View>
                              )}
                            </Text>
                          </View>
                        </AnimatedTouchableCard>
                        
                        <AnimatedTouchableCard
                          onPress={() => generateAiContent(subtopic.id, 'explanation')}
                          style={styles.aiButton}
                          backgroundColor="#e6fff2"
                          disabled={Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v)}
                        >
                          <View style={[
                            styles.aiButtonContent,
                            aiContentType[subtopic.id] === 'explanation' && styles.activeAiButton,
                            Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) && styles.disabledAiButton
                          ]}>
                            <MaterialCommunityIcons 
                              name="book-open-variant" 
                              size={24} 
                              color={Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) ? "#999999" : "#00994d"} 
                            />
                            <Text style={[
                              styles.aiButtonText,
                              Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) && styles.disabledAiButtonText
                            ]}>
                              Concept Explanation
                              {isLoadingAiContent[subtopic.id]?.['explanation'] && (
                                <View style={styles.loadingIndicatorContainer}>
                                  <Text style={styles.loadingIndicatorText}>...</Text>
                                </View>
                              )}
                            </Text>
                          </View>
                        </AnimatedTouchableCard>
                        
                        <AnimatedTouchableCard
                          onPress={() => generateAiContent(subtopic.id, 'analogies')}
                          style={styles.aiButton}
                          backgroundColor="#ffe6e6"
                          disabled={Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v)}
                        >
                          <View style={[
                            styles.aiButtonContent,
                            aiContentType[subtopic.id] === 'analogies' && styles.activeAiButton,
                            Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) && styles.disabledAiButton
                          ]}>
                            <MaterialCommunityIcons 
                              name="compare" 
                              size={24} 
                              color={Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) ? "#999999" : "#cc0000"} 
                            />
                            <Text style={[
                              styles.aiButtonText,
                              Object.values(isLoadingAiContent[subtopic.id] || {}).some(v => v) && styles.disabledAiButtonText
                            ]}>
                              Analogies
                              {isLoadingAiContent[subtopic.id]?.['analogies'] && (
                                <View style={styles.loadingIndicatorContainer}>
                                  <Text style={styles.loadingIndicatorText}>...</Text>
                                </View>
                              )}
                            </Text>
                          </View>
                        </AnimatedTouchableCard>
                      </View>
                    </View>
                    
                    {renderAiContent(subtopic.id)}

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
  aiEnhancementsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  aiButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  aiButton: {
    flex: 1,
    marginHorizontal: 4,
    height: 80,
  },
  aiButtonContent: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeAiButton: {
    borderWidth: 2,
    borderColor: '#0066cc',
    borderRadius: 10,
  },
  disabledAiButton: {
    opacity: 0.5,
  },
  disabledAiButtonText: {
    color: '#999999',
  },
  segmentedControl: {
    marginTop: 12,
    marginBottom: 8,
  },
  aiContentContainer: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
    maxWidth: '100%',
  },
  aiContentTextContainer: {
    width: '100%',
    maxWidth: '100%',
  },
  aiContentText: {
    marginBottom: 12,
    lineHeight: 22,
    fontSize: 15,
    color: '#333333',
  },
  aiContentHeader: {
    fontWeight: '600',
    fontSize: 17,
    marginBottom: 12,
    marginTop: 4,
    color: '#333333',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  aiLoadingText: {
    marginTop: 16,
    marginBottom: 12,
    color: '#666',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066cc',
    borderRadius: 2,
  },
  loadingIndicatorContainer: {
    marginLeft: 4,
  },
  loadingIndicatorText: {
    color: '#666',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 16,
  },
  bulletDot: {
    marginRight: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#0066cc',
  },
  bulletNumber: {
    marginRight: 8,
    fontSize: 15,
    fontWeight: '600',
    width: 24,
    color: '#0066cc',
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
    fontSize: 15,
    color: '#333333',
  },
  aiParagraph: {
    marginBottom: 12,
  },
  aiBoldText: {
    fontWeight: '600',
  },
  tipCard: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  tipHeader: {
    marginBottom: 8,
  },
  tipHeading: {
    fontWeight: '600',
    fontSize: 17,
    color: '#0066cc',
    marginBottom: 8,
  },
  tipContent: {
    lineHeight: 22,
    fontSize: 15,
    color: '#333333',
  },
  explanationSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontWeight: '600',
    fontSize: 17,
    color: '#00994d',
    marginBottom: 8,
  },
  sectionContent: {
    lineHeight: 22,
    marginBottom: 12,
    fontSize: 15,
    color: '#333333',
  },
  stepsList: {
    marginTop: 12,
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 4,
  },
  stepNumber: {
    fontWeight: '600',
    color: '#00994d',
    width: 24,
    fontSize: 15,
  },
  stepText: {
    flex: 1,
    lineHeight: 22,
    fontSize: 15,
    color: '#333333',
  },
  componentsList: {
    marginTop: 12,
    paddingLeft: 4,
  },
  componentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletDot: {
    marginRight: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#0066cc',
  },
  componentText: {
    flex: 1,
    lineHeight: 22,
    fontSize: 15,
    color: '#333333',
  },
  analogyCard: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  analogyDomain: {
    fontWeight: '600',
    fontSize: 17,
    color: '#cc0000',
    marginBottom: 8,
  },
  analogyContent: {
    lineHeight: 22,
    fontSize: 15,
    color: '#333333',
  },
});

export default TopicDetailScreen;
