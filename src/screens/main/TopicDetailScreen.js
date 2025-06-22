import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  Text,
  Card,
  Divider,
  Button,
  useTheme,
  Surface,
  IconButton,
  List,
  Portal,
  Dialog,
  Alert,
  Chip,
  SegmentedButtons,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import LocalDatabase from '../../services/LocalDatabase';
import MongoDatabase from "../../services/MongoDatabase";
import QuizGenerator from "../../services/quiz/QuizGenerator";
import GeminiService from "../../services/GeminiService";

const TopicDetailScreen = ({ route, navigation }) => {
  const { topic } = route.params || {};
  const theme = useTheme();
  const [expanded, setExpanded] = useState({});
  const [notes, setNotes] = useState([]);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [loading, setLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizLoadingProgress, setQuizLoadingProgress] = useState("");
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
        const topicNotes = await MongoDatabase.note.getNotesByTopic(topic.id);
        setNotes(topicNotes || []);
      } catch (error) {
        console.error("Error loading notes:", error);
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
      const cachedContent = await AsyncStorage.getItem(
        `ai_content_${topic.id}`
      );
      if (cachedContent) {
        const parsedContent = JSON.parse(cachedContent);
        setAiContent(parsedContent.content || {});
        setAiContentType(parsedContent.contentTypes || {});
        console.log("Loaded cached AI content");
      }
    } catch (error) {
      console.error("Error loading cached AI content:", error);
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
          [contentType]: content,
        },
      };

      const updatedContentTypes = {
        ...aiContentType,
        [subtopicId]: contentType,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        `ai_content_${topic.id}`,
        JSON.stringify({
          content: updatedContent,
          contentTypes: updatedContentTypes,
          timestamp: new Date().toISOString(),
        })
      );

      console.log("Saved AI content to cache");
    } catch (error) {
      console.error("Error saving AI content to cache:", error);
    }
  };

  const toggleAccordion = (id) => {
    setExpanded({
      ...expanded,
      [id]: !expanded[id],
    });
  };

  const handlePracticeQuiz = async () => {
    try {
      // Check if topic has subtopics
      if (!topic.subtopics || topic.subtopics.length === 0) {
        alert(
          "This topic has no subtopics. Please add subtopics before creating a quiz."
        );
        return;
      }

      // Show loading dialog
      setQuizLoadingVisible(true);
      setGeneratingQuiz(true);
      setQuizLoadingProgress("Initializing quiz generator...");

      // Small delay to ensure the dialog is visible
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate questions for the first subtopic
      setQuizLoadingProgress("Generating multiple choice questions...");
      let attempts = 0;
      let generatedQuestions = null;

      // Try up to 3 times to generate questions
      while (
        attempts < 3 &&
        (!generatedQuestions || generatedQuestions.length < 5)
      ) {
        attempts++;
        try {
          setQuizLoadingProgress(`Generating quiz (attempt ${attempts}/3)...`);
          generatedQuestions = await QuizGenerator.generateQuiz(
            topic,
            topic.subtopics[0],
            5
          );

          // Verify we have all question types
          const types = new Set(generatedQuestions.map((q) => q.type));
          if (types.size < 5) {
            setQuizLoadingProgress(
              `Missing some question types. Retrying (${attempts}/3)...`
            );
            generatedQuestions = null; // Force retry
          } else {
            // Log the question types we're passing to the quiz screen
            console.log(
              "Question types being passed to quiz screen:",
              generatedQuestions.map((q) => ({
                type: q.type,
                question:
                  (q.question || "No question").substring(0, 30) + "...",
              }))
            );
          }
        } catch (error) {
          console.error(`Error on attempt ${attempts}:`, error);

          // Only retry for specific error types that indicate a Gemini API issue
          // Don't retry for parsing errors or other client-side issues
          if (
            error.message &&
            (error.message.includes("API request failed") ||
              error.message.includes("network error") ||
              error.message.includes("timeout") ||
              error.message.includes("rate limit") ||
              error.message.includes("Missing question types") ||
              error.message.includes("Not enough questions generated"))
          ) {
            setQuizLoadingProgress(`API error. Retrying (${attempts}/3)...`);
          } else {
            // For parsing errors or other client-side issues, show error and stop retrying
            setQuizLoadingProgress(`Error: ${error.message}`);
            throw error; // Re-throw to exit the loop
          }
        }
      }

      setQuizLoadingProgress("Quiz ready! Launching quiz...");

      // Hide loading dialog
      setQuizLoadingVisible(false);
      setGeneratingQuiz(false);

      // If we have questions, navigate to the quiz screen
      if (generatedQuestions && generatedQuestions.length > 0) {
        // Log the question types one more time before navigation
        console.log(
          "Final question types before navigation:",
          generatedQuestions.map((q) => ({
            type: q.type,
            question: (q.question || "No question").substring(0, 30) + "...",
            constructor: q.constructor ? q.constructor.name : "Unknown",
          }))
        );

        // Navigate to the quiz screen with the generated questions
        navigation.navigate("Quiz", {
          topic,
          preGeneratedQuestions: generatedQuestions,
        });
      } else {
        // Show error if we couldn't generate questions
        Alert.alert(
          "Quiz Generation Failed",
          "Unable to generate quiz questions after multiple attempts. Please try again later.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setQuizLoadingVisible(false);
      setGeneratingQuiz(false);
      Alert.alert(
        "Quiz Generation Error",
        `An error occurred while generating the quiz: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  };

  // Function to generate quiz for a specific subtopic
  const handleSubtopicQuiz = async (subtopic) => {
    try {
      // Show loading dialog
      setQuizLoadingVisible(true);
      setGeneratingQuiz(true);
      setQuizLoadingProgress(
        `Initializing quiz generator for "${subtopic.title}"...`
      );

      // Small delay to ensure the dialog is visible
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate questions for the specific subtopic
      setQuizLoadingProgress("Generating questions...");
      let attempts = 0;
      let generatedQuestions = null;

      // Try up to 3 times to generate questions
      while (
        attempts < 3 &&
        (!generatedQuestions || generatedQuestions.length < 5)
      ) {
        attempts++;
        try {
          setQuizLoadingProgress(`Generating quiz (attempt ${attempts}/3)...`);
          generatedQuestions = await QuizGenerator.generateQuiz(
            topic,
            subtopic,
            10 // Use the default number of questions (now 10)
          );

          if (generatedQuestions && generatedQuestions.length > 0) {
            // Log the question types we're passing to the quiz screen
            console.log(
              "Question types being passed to quiz screen:",
              generatedQuestions.map((q) => ({
                type: q.type,
                question:
                  (q.question || "No question").substring(0, 30) + "...",
              }))
            );
            break;
          } else {
            setQuizLoadingProgress(
              `No questions generated. Retrying (${attempts}/3)...`
            );
          }
        } catch (error) {
          console.error(`Error on attempt ${attempts}:`, error);

          // Only retry for specific error types that indicate a Gemini API issue
          if (
            error.message &&
            (error.message.includes("API request failed") ||
              error.message.includes("network error") ||
              error.message.includes("timeout") ||
              error.message.includes("rate limit") ||
              error.message.includes("Missing question types") ||
              error.message.includes("Not enough questions generated"))
          ) {
            setQuizLoadingProgress(`API error. Retrying (${attempts}/3)...`);
          } else {
            // For parsing errors or other client-side issues, show error and stop retrying
            setQuizLoadingProgress(`Error: ${error.message}`);
            throw error; // Re-throw to exit the loop
          }
        }
      }

      setQuizLoadingProgress("Quiz ready! Launching quiz...");

      // Hide loading dialog
      setQuizLoadingVisible(false);
      setGeneratingQuiz(false);

      // If we have questions, navigate to the quiz screen
      if (generatedQuestions && generatedQuestions.length > 0) {
        // Navigate to the quiz screen with the generated questions
        navigation.navigate("Quiz", {
          topic,
          subtopic,
          preGeneratedQuestions: generatedQuestions,
        });
      } else {
        // Show error if we couldn't generate questions
        Alert.alert(
          "Quiz Generation Failed",
          "Unable to generate quiz questions after multiple attempts. Please try again later.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setQuizLoadingVisible(false);
      setGeneratingQuiz(false);
      Alert.alert(
        "Quiz Generation Error",
        `An error occurred while generating the quiz: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  };

  // Function to generate AI-powered learning enhancements
  const generateAiContent = async (subtopicId, contentType) => {
    // Update loading state for this specific subtopic and content type
    setIsLoadingAiContent((prev) => ({
      ...prev,
      [subtopicId]: {
        ...(prev[subtopicId] || {}),
        [contentType]: true,
      },
    }));

    try {
      // Find the subtopic
      const subtopic = topic.subtopics.find((s) => s.id === subtopicId);
      if (!subtopic) throw new Error("Subtopic not found");

      // Check if content already exists
      if (aiContent[subtopicId]?.[contentType]) {
        // If content already exists, just switch to it
        // Otherwise, generate it
        if (subtopicAiContentObj?.[value]) {
          setAiContentType((prev) => ({
            ...prev,
            [subtopicId]: value,
          }));
        } else {
          generateAiContent(subtopicId, value);
        }
      } else {
        // Use Gemini API to generate content
        const response = await GeminiService.generateLearningContent(
          contentType,
          subtopic,
          topic.title
        );

        // Store the generated content
        setAiContent((prev) => ({
          ...prev,
          [subtopicId]: {
            ...(prev[subtopicId] || {}),
            [contentType]: response,
          },
        }));

        // Update content type for this subtopic
        setAiContentType((prev) => ({
          ...prev,
          [subtopicId]: contentType,
        }));

        // Save to cache
        saveAiContentToCache(subtopicId, contentType, response);
      }
    } catch (error) {
      console.error("Error generating AI content:", error);
      Alert.alert("Error", "Failed to generate content. Please try again.");
    } finally {
      // Update loading state
      setIsLoadingAiContent((prev) => ({
        ...prev,
        [subtopicId]: {
          ...(prev[subtopicId] || {}),
          [contentType]: false,
        },
      }));
    }
  };

  // Render AI content section - No longer needed as content is rendered directly in the tabs
  const renderAiContent = (subtopicId) => {
    // This function is kept for compatibility but is no longer used
    // Content is now rendered directly in the tab content area
    return null;
  };

  // Render content based on the content type
  const renderStructuredContent = () => {
    const subtopicAiContentObj = aiContent[subtopicId];
    const currentContentType = aiContentType[subtopicId];

    if (
      !currentContentType &&
      !Object.values(isLoadingAiContent[subtopicId] || {}).some((v) => v)
    ) {
      return null;
    }

    const subtopicAiContent = subtopicAiContentObj?.[currentContentType];
    const isLoading = isLoadingAiContent[subtopicId]?.[currentContentType];

    // Get available content types for this subtopic
    const availableContentTypes = subtopicAiContentObj
      ? Object.keys(subtopicAiContentObj)
      : [];

    // Determine if we should show the segmented control
    const showSegmentedControl = availableContentTypes.length > 1;

    // Prepare segment data for the control
    const segments = [
      { value: "tips", label: "Tips & Tricks", icon: "lightbulb-on" },
      { value: "explanation", label: "Explanation", icon: "book-open-variant" },
      { value: "analogies", label: "Analogies", icon: "compare" },
    ].filter(
      (segment) =>
        // Only show segments for content types that are already generated or currently loading
        availableContentTypes.includes(segment.value) ||
        isLoadingAiContent[subtopicId]?.[segment.value]
    );

    let title = "";
    let icon = "";

    switch (currentContentType) {
      case "tips":
        title = "Tips & Tricks";
        icon = "lightbulb-on";
        break;
      case "explanation":
        title = "Concept Explanation";
        icon = "book-open-variant";
        break;
      case "analogies":
        title = "Helpful Analogies";
        icon = "compare";
        break;
      default:
        title = "AI-Generated Content";
        icon = "robot";
    }

    // Render content based on the content type
    const renderStructuredContent = () => {
      if (!subtopicAiContent) {
        return (
          <Text style={styles.aiContentText}>
            No content available. Please try again.
          </Text>
        );
      }

      // Handle raw content (fallback for parsing errors)
      if (subtopicAiContent.rawContent) {
        return (
          <View style={styles.aiContentTextContainer}>
            <Text style={styles.aiContentText}>
              {subtopicAiContent.rawContent}
            </Text>
          </View>
        );
      }

      // Render Tips & Tricks content
      if (currentContentType === "tips" && subtopicAiContent.tips) {
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
      if (currentContentType === "explanation" && subtopicAiContent.sections) {
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
      if (currentContentType === "analogies" && subtopicAiContent.analogies) {
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
      if (typeof subtopicAiContent === "string") {
        return (
          <View style={styles.aiContentTextContainer}>
            {subtopicAiContent.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("## ")) {
                // It's a header
                return (
                  <Text
                    key={index}
                    variant="titleMedium"
                    style={styles.aiContentHeader}
                  >
                    {paragraph.replace("## ", "")}
                  </Text>
                );
              } else if (paragraph.startsWith("- ")) {
                // It's a bullet point
                return (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>
                      {paragraph.replace("- ", "")}
                    </Text>
                  </View>
                );
              } else if (paragraph.match(/^\d+\. /)) {
                // It's a numbered list item
                const number = paragraph.match(/^\d+/)[0];
                const text = paragraph.replace(/^\d+\. /, "");
                return (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bulletNumber}>{number}.</Text>
                    <Text style={styles.bulletText}>{text}</Text>
                  </View>
                );
              } else if (paragraph.startsWith("**")) {
                // It's a bold section
                const parts = paragraph.split("**");
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
                  <Text key={index} style={styles.aiContentText}>
                    {paragraph}
                  </Text>
                );
              }
            })}
          </View>
        );
      }

      // Default fallback
      return (
        <Text style={styles.aiContentText}>Content format not recognized.</Text>
      );
    };

    // Helper function to get icon for analogy domain
    const getAnalogyIcon = (domain) => {
      let iconName = "domain";

      switch (domain.toLowerCase()) {
        case "restaurant":
          iconName = "food-fork-drink";
          break;
        case "transportation":
          iconName = "car";
          break;
        case "building":
          iconName = "office-building";
          break;
        case "team sports":
          iconName = "soccer";
          break;
      }

      return (
        <MaterialCommunityIcons name={iconName} size={20} color="#0066cc" />
      );
    };

    return (
      <View style={styles.aiContentContainer}>
        <View style={styles.aiContentHeader}>
          <View style={styles.aiContentTitleContainer}>
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={theme.colors.primary}
              style={styles.aiContentIcon}
            />
            <Text variant="titleMedium" style={styles.sectionSubtitle}>
              {subtopicAiContent?.title || title}
            </Text>
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
                setAiContentType((prev) => ({
                  ...prev,
                  [subtopicId]: value,
                }));
              } else {
                generateAiContent(subtopicId, value);
              }
            }}
            buttons={segments.map((segment) => ({
              value: segment.value,
              label: segment.label,
              icon: segment.icon,
              disabled: Object.values(
                isLoadingAiContent[subtopicId] || {}
              ).some((v) => v),
              style: {
                backgroundColor:
                  currentContentType === segment.value
                    ? segment.value === "tips"
                      ? "#e6f2ff"
                      : segment.value === "explanation"
                      ? "#e6fff2"
                      : "#ffe6e6"
                    : undefined,
              },
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
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.random() * 70 + 10}%` },
                ]}
              />
            </View>
          </View>
        ) : (
          renderStructuredContent()
        )}
      </View>
    );
  };

  // Reusable animated touchable component for consistent animations across the app
  const AnimatedTouchableCard = ({
    onPress,
    style,
    backgroundColor,
    children,
  }) => {
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
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            backgroundColor,
            borderRadius: 12,
            flex: 1,
            shadowColor: backgroundColor,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 4,
          }}
        >
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
            <Text variant="headlineSmall" style={styles.topicTitle}>
              {topic.title}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.topicDescription}>
            {topic.description || "No description available for this topic."}
          </Text>
        </Surface>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Subtopics ({topic.subtopics?.length || 0})
          </Text>

          {topic.subtopics && topic.subtopics.length > 0 ? (
            topic.subtopics.map((subtopic, index) => (
              <Surface
                key={`${subtopic.id || "subtopic"}-${index}`}
                style={styles.subtopicCard}
                elevation={1}
              >
                <List.Accordion
                  title={subtopic.title}
                  description={
                    subtopic.content
                      ? subtopic.content.substring(0, 60) + "..."
                      : "No content available"
                  }
                  expanded={expanded[subtopic.id]}
                  onPress={() => toggleAccordion(subtopic.id)}
                  titleStyle={styles.accordionTitle}
                  style={styles.accordion}
                  left={(props) => (
                    <List.Icon {...props} icon="book-open-variant" />
                  )}
                >
                  <View style={styles.subtopicContent}>
                    <Text variant="bodyLarge" style={styles.contentText}>
                      {subtopic.content ||
                        "No content available for this subtopic."}
                    </Text>

                    {subtopic.examples && subtopic.examples.length > 0 && (
                      <View style={styles.examplesSection}>
                        <Text
                          variant="titleMedium"
                          style={styles.sectionSubtitle}
                        >
                          Examples
                        </Text>
                        {subtopic.examples.map((example, idx) => (
                          <Surface
                            key={`example-${idx}`}
                            style={styles.exampleCard}
                            elevation={1}
                          >
                            <Text variant="bodyMedium">{example}</Text>
                          </Surface>
                        ))}
                      </View>
                    )}

                    {subtopic.resources && subtopic.resources.length > 0 && (
                      <View style={styles.resourcesSection}>
                        <Text
                          variant="titleMedium"
                          style={styles.sectionSubtitle}
                        >
                          Resources
                        </Text>
                        {subtopic.resources.map((resource, idx) => (
                          <TouchableOpacity
                            key={`resource-${idx}`}
                            style={styles.resourceItem}
                            onPress={() => {
                              if (resource.url) {
                                Linking.openURL(resource.url).catch((err) =>
                                  console.error(
                                    "Error opening resource URL:",
                                    err
                                  )
                                );
                              }
                            }}
                          >
                            <MaterialCommunityIcons
                              name="link"
                              size={20}
                              color={theme.colors.primary}
                            />
                            <Text
                              variant="bodyMedium"
                              style={styles.resourceText}
                              numberOfLines={1}
                            >
                              {resource.name || resource.title || "Resource"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <View style={styles.aiEnhancementsContainer}>
                      <Text
                        variant="titleMedium"
                        style={styles.sectionSubtitle}
                      >
                        Learning Enhancements
                      </Text>

                      <View style={styles.enhancementTabContainer}>
                        <View style={styles.enhancementTabs}>
                          <TouchableOpacity
                            style={[
                              styles.enhancementTab,
                              aiContentType[subtopic.id] === "tips" &&
                                styles.activeTab,
                            ]}
                            onPress={() => {
                              setAiContentType((prev) => ({
                                ...prev,
                                [subtopic.id]: "tips",
                              }));
                              if (!aiContent[subtopic.id]?.["tips"]) {
                                generateAiContent(subtopic.id, "tips");
                              }
                            }}
                            disabled={Object.values(
                              isLoadingAiContent[subtopic.id] || {}
                            ).some((v) => v)}
                          >
                            <View style={styles.tabIconContainer}>
                              <View
                                style={[
                                  styles.tabIconCircle,
                                  {
                                    backgroundColor:
                                      aiContentType[subtopic.id] === "tips"
                                        ? "#0066cc"
                                        : "transparent",
                                  },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name="lightbulb-on"
                                  size={18}
                                  color={
                                    aiContentType[subtopic.id] === "tips"
                                      ? "#ffffff"
                                      : "#0066cc"
                                  }
                                />
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.enhancementTabText,
                                aiContentType[subtopic.id] === "tips" &&
                                  styles.activeTabText,
                              ]}
                            >
                              Tips & Tricks
                            </Text>
                            {aiContentType[subtopic.id] === "tips" && (
                              <View
                                style={[
                                  styles.activeTabIndicator,
                                  { backgroundColor: "#0066cc" },
                                ]}
                              />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.enhancementTab,
                              aiContentType[subtopic.id] === "explanation" &&
                                styles.activeTab,
                            ]}
                            onPress={() => {
                              setAiContentType((prev) => ({
                                ...prev,
                                [subtopic.id]: "explanation",
                              }));
                              if (!aiContent[subtopic.id]?.["explanation"]) {
                                generateAiContent(subtopic.id, "explanation");
                              }
                            }}
                            disabled={Object.values(
                              isLoadingAiContent[subtopic.id] || {}
                            ).some((v) => v)}
                          >
                            <View style={styles.tabIconContainer}>
                              <View
                                style={[
                                  styles.tabIconCircle,
                                  {
                                    backgroundColor:
                                      aiContentType[subtopic.id] ===
                                      "explanation"
                                        ? "#00994d"
                                        : "transparent",
                                  },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name="book-open-variant"
                                  size={18}
                                  color={
                                    aiContentType[subtopic.id] === "explanation"
                                      ? "#ffffff"
                                      : "#00994d"
                                  }
                                />
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.enhancementTabText,
                                aiContentType[subtopic.id] === "explanation" &&
                                  styles.activeTabText,
                              ]}
                            >
                              Concept Explanation
                            </Text>
                            {aiContentType[subtopic.id] === "explanation" && (
                              <View
                                style={[
                                  styles.activeTabIndicator,
                                  { backgroundColor: "#00994d" },
                                ]}
                              />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.enhancementTab,
                              aiContentType[subtopic.id] === "analogies" &&
                                styles.activeTab,
                            ]}
                            onPress={() => {
                              setAiContentType((prev) => ({
                                ...prev,
                                [subtopic.id]: "analogies",
                              }));
                              if (!aiContent[subtopic.id]?.["analogies"]) {
                                generateAiContent(subtopic.id, "analogies");
                              }
                            }}
                            disabled={Object.values(
                              isLoadingAiContent[subtopic.id] || {}
                            ).some((v) => v)}
                          >
                            <View style={styles.tabIconContainer}>
                              <View
                                style={[
                                  styles.tabIconCircle,
                                  {
                                    backgroundColor:
                                      aiContentType[subtopic.id] === "analogies"
                                        ? "#cc0000"
                                        : "transparent",
                                  },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name="compare"
                                  size={18}
                                  color={
                                    aiContentType[subtopic.id] === "analogies"
                                      ? "#ffffff"
                                      : "#cc0000"
                                  }
                                />
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.enhancementTabText,
                                aiContentType[subtopic.id] === "analogies" &&
                                  styles.activeTabText,
                              ]}
                            >
                              Analogies
                            </Text>
                            {aiContentType[subtopic.id] === "analogies" && (
                              <View
                                style={[
                                  styles.activeTabIndicator,
                                  { backgroundColor: "#cc0000" },
                                ]}
                              />
                            )}
                          </TouchableOpacity>
                        </View>

                        {!aiContentType[subtopic.id] && (
                          <View style={styles.hintContainer}>
                            <View style={styles.hintIconContainer}>
                              <MaterialCommunityIcons
                                name="gesture-tap"
                                size={24}
                                color="#666"
                              />
                            </View>
                            <Text style={styles.hintText}>
                              Tap any option above to get AI-powered learning
                              enhancements
                            </Text>
                            <View style={styles.hintArrow} />
                          </View>
                        )}

                        {aiContentType[subtopic.id] && (
                          <View style={styles.enhancementContent}>
                            {/* Content will only be shown after a tab is clicked */}

                            {aiContentType[subtopic.id] === "tips" &&
                              (isLoadingAiContent[subtopic.id]?.["tips"] ? (
                                <View style={styles.loadingContainer}>
                                  <ActivityIndicator
                                    size="large"
                                    color="#0066cc"
                                  />
                                  <Text style={styles.loadingText}>
                                    Generating Tips & Tricks...
                                  </Text>
                                  <Text style={styles.loadingSubText}>
                                    This may take a few moments
                                  </Text>
                                </View>
                              ) : aiContent[subtopic.id]?.["tips"] ? (
                                <View style={styles.contentContainer}>
                                  {aiContent[subtopic.id]["tips"].tips?.map(
                                    (tip, index) => (
                                      <View key={index} style={styles.tipCard}>
                                        <View style={styles.tipHeader}>
                                          <MaterialCommunityIcons
                                            name="lightbulb-on"
                                            size={20}
                                            color="#0066cc"
                                          />
                                          <Text style={styles.tipHeading}>
                                            {tip.heading}
                                          </Text>
                                        </View>
                                        <Text style={styles.tipContent}>
                                          {tip.content}
                                        </Text>
                                      </View>
                                    )
                                  )}
                                </View>
                              ) : (
                                <View style={styles.emptyEnhancementContent}>
                                  <MaterialCommunityIcons
                                    name="lightbulb-outline"
                                    size={32}
                                    color="#0066cc"
                                    style={{ opacity: 0.5 }}
                                  />
                                  <Text style={styles.emptyEnhancementText}>
                                    No tips available yet
                                  </Text>
                                </View>
                              ))}

                            {aiContentType[subtopic.id] === "explanation" &&
                              (isLoadingAiContent[subtopic.id]?.[
                                "explanation"
                              ] ? (
                                <View style={styles.loadingContainer}>
                                  <ActivityIndicator
                                    size="large"
                                    color="#00994d"
                                  />
                                  <Text style={styles.loadingText}>
                                    Generating Concept Explanation...
                                  </Text>
                                  <Text style={styles.loadingSubText}>
                                    This may take a few moments
                                  </Text>
                                </View>
                              ) : aiContent[subtopic.id]?.["explanation"] ? (
                                <View style={styles.contentContainer}>
                                  {aiContent[subtopic.id][
                                    "explanation"
                                  ].sections?.map((section, index) => (
                                    <View
                                      key={index}
                                      style={styles.explanationSection}
                                    >
                                      <View style={styles.sectionHeaderRow}>
                                        <MaterialCommunityIcons
                                          name="book-open-page-variant"
                                          size={20}
                                          color="#00994d"
                                        />
                                        <Text style={styles.sectionHeading}>
                                          {section.heading}
                                        </Text>
                                      </View>
                                      <Text style={styles.sectionContent}>
                                        {section.content}
                                      </Text>

                                      {section.steps && (
                                        <View style={styles.stepsList}>
                                          {section.steps.map(
                                            (step, stepIndex) => (
                                              <View
                                                key={stepIndex}
                                                style={styles.stepItem}
                                              >
                                                <View
                                                  style={
                                                    styles.stepNumberCircle
                                                  }
                                                >
                                                  <Text
                                                    style={
                                                      styles.stepNumberText
                                                    }
                                                  >
                                                    {stepIndex + 1}
                                                  </Text>
                                                </View>
                                                <Text style={styles.stepText}>
                                                  {step}
                                                </Text>
                                              </View>
                                            )
                                          )}
                                        </View>
                                      )}

                                      {section.components && (
                                        <View style={styles.componentsList}>
                                          {section.components.map(
                                            (component, compIndex) => (
                                              <View
                                                key={compIndex}
                                                style={styles.componentItem}
                                              >
                                                <View
                                                  style={styles.bulletPoint}
                                                />
                                                <Text
                                                  style={styles.componentText}
                                                >
                                                  {component}
                                                </Text>
                                              </View>
                                            )
                                          )}
                                        </View>
                                      )}
                                    </View>
                                  ))}
                                </View>
                              ) : (
                                <View style={styles.emptyEnhancementContent}>
                                  <MaterialCommunityIcons
                                    name="book-open-outline"
                                    size={32}
                                    color="#00994d"
                                    style={{ opacity: 0.5 }}
                                  />
                                  <Text style={styles.emptyEnhancementText}>
                                    No explanation available yet
                                  </Text>
                                </View>
                              ))}

                            {aiContentType[subtopic.id] === "analogies" &&
                              (isLoadingAiContent[subtopic.id]?.[
                                "analogies"
                              ] ? (
                                <View style={styles.loadingContainer}>
                                  <ActivityIndicator
                                    size="large"
                                    color="#cc0000"
                                  />
                                  <Text style={styles.loadingText}>
                                    Generating Helpful Analogies...
                                  </Text>
                                  <Text style={styles.loadingSubText}>
                                    This may take a few moments
                                  </Text>
                                </View>
                              ) : aiContent[subtopic.id]?.["analogies"] ? (
                                <View style={styles.contentContainer}>
                                  {aiContent[subtopic.id][
                                    "analogies"
                                  ].analogies?.map((analogy, index) => (
                                    <View
                                      key={index}
                                      style={styles.analogyCard}
                                    >
                                      <View style={styles.analogyHeaderRow}>
                                        <MaterialCommunityIcons
                                          name="compare"
                                          size={20}
                                          color="#cc0000"
                                        />
                                        <Text style={styles.analogyDomain}>
                                          {analogy.domain}
                                        </Text>
                                      </View>
                                      <Text style={styles.analogyContent}>
                                        {analogy.analogy}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              ) : (
                                <View style={styles.emptyEnhancementContent}>
                                  <MaterialCommunityIcons
                                    name="compare-horizontal"
                                    size={32}
                                    color="#cc0000"
                                    style={{ opacity: 0.5 }}
                                  />
                                  <Text style={styles.emptyEnhancementText}>
                                    No analogies available yet
                                  </Text>
                                </View>
                              ))}
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("NoteEditor", {
                            topicId: topic.id,
                            subtopicId: subtopic.id,
                            subtopicTitle: subtopic.title,
                            category: "general",
                            onSave: (note) => console.log("Note saved:", note),
                          })
                        }
                        style={[styles.enhancedActionButton, styles.noteButton]}
                      >
                        <View style={styles.actionButtonIconContainer}>
                          <MaterialCommunityIcons
                            name="notebook-plus"
                            size={24}
                            color="#9C27B0"
                          />
                        </View>
                        <Text style={styles.enhancedActionButtonText}>
                          Add Note
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          /* Share functionality would go here */
                          alert("Share functionality coming soon!");
                        }}
                        style={[
                          styles.enhancedActionButton,
                          styles.shareButton,
                        ]}
                      >
                        <View style={styles.actionButtonIconContainer}>
                          <MaterialCommunityIcons
                            name="share-variant"
                            size={24}
                            color="#4CAF50"
                          />
                        </View>
                        <Text style={styles.enhancedActionButtonText}>
                          Share
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleSubtopicQuiz(subtopic)}
                        style={[styles.enhancedActionButton, styles.quizButton]}
                      >
                        <View style={styles.actionButtonIconContainer}>
                          <MaterialCommunityIcons
                            name="help-circle"
                            size={24}
                            color="#2196F3"
                          />
                        </View>
                        <Text style={styles.enhancedActionButtonText}>
                          Practice Quiz
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {subtopic.videoLinks && subtopic.videoLinks.length > 0 && (
                      <View style={styles.resourcesSection}>
                        <Text
                          variant="titleMedium"
                          style={styles.sectionSubtitle}
                        >
                          Video Tutorials
                        </Text>
                        {subtopic.videoLinks.map((video, idx) => (
                          <TouchableOpacity
                            key={`video-${idx}`}
                            style={styles.resourceItem}
                            onPress={() => {
                              if (video.url) {
                                Linking.openURL(video.url).catch((err) =>
                                  console.error("Error opening video URL:", err)
                                );
                              }
                            }}
                          >
                            <MaterialCommunityIcons
                              name="youtube"
                              size={20}
                              color="#FF0000"
                            />
                            <Text
                              variant="bodyMedium"
                              style={styles.resourceText}
                              numberOfLines={1}
                            >
                              {video.name || video.title || "Video Tutorial"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {notes.filter((note) => note.subtopicId === subtopic.id)
                      .length > 0 && (
                      <View style={styles.notesSection}>
                        <Text
                          variant="titleMedium"
                          style={styles.sectionSubtitle}
                        >
                          Your Notes
                        </Text>
                        {notes
                          .filter((note) => note.subtopicId === subtopic.id)
                          .map((note) => (
                            <Surface
                              key={note.id}
                              style={styles.noteCard}
                              elevation={1}
                            >
                              <Text
                                variant="titleSmall"
                                style={styles.noteTitle}
                              >
                                {note.title}
                              </Text>
                              <Text variant="bodyMedium">{note.content}</Text>
                            </Surface>
                          ))}
                      </View>
                    )}
                  </View>
                </List.Accordion>
              </Surface>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No subtopics available for this topic.
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            icon="history"
            onPress={() => navigation.navigate("QuizHistory")}
            style={styles.footerButton}
          >
            Quiz History
          </Button>

          <Button
            mode="contained"
            onPress={() => navigation.navigate("Notes", { topic })}
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
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  topicCard: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  topicHeader: {
    padding: 16,
  },
  topicTitle: {
    fontWeight: "bold",
  },
  divider: {
    height: 1,
  },
  topicDescription: {
    padding: 16,
    color: "#555",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtopicCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  accordion: {
    padding: 0,
  },
  accordionTitle: {
    fontWeight: "bold",
  },
  subtopicContent: {
    paddingTop: 0,
    paddingBottom: 16,
    paddingLeft: 7,
    paddingRight: 7,
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
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginBottom: 8,
  },
  resourceText: {
    marginLeft: 8,
    color: "#0073BB",
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
    fontWeight: "bold",
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 0.48,
  },
  enhancedActionButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  noteButton: {
    backgroundColor: "#f0e6ff", // Light purple like the explanation button
  },
  shareButton: {
    backgroundColor: "#e6ffe6", // Light green like the tips button
  },
  quizButton: {
    backgroundColor: "#e6f2ff", // Light blue like the analogies button
  },
  actionButtonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    // backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  enhancedActionButtonText: {
    color: "#333333",
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  footerButton: {
    flex: 0.48,
  },
  aiEnhancementsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  enhancementTabContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    marginTop: 12,
  },
  enhancementTabs: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingTop: 8,
  },
  enhancementTab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#ffffff",
  },
  tabIconContainer: {
    marginBottom: 6,
  },
  tabIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
  },
  enhancementTabText: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "700",
  },

  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 3,
    borderRadius: 1.5,
  },
  enhancementContent: {
    padding: 16,
    minHeight: 200,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  hintContainer: {
    padding: 16,
    backgroundColor: "#fffde7",
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff9c4",
    position: "relative",
  },
  hintIconContainer: {
    marginRight: 12,
  },
  hintText: {
    flex: 1,
    color: "#5d4037",
    fontSize: 14,
    lineHeight: 20,
  },
  hintArrow: {
    position: "absolute",
    top: -10,
    left: "50%",
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#fffde7",
  },
  emptyEnhancementContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginVertical: 8,
  },
  emptyEnhancementText: {
    marginTop: 12,
    color: "#757575",
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingSubText: {
    marginTop: 8,
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
  },
  contentContainer: {
    paddingVertical: 8,
  },
  tipCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#0066cc",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipHeading: {
    fontWeight: "700",
    fontSize: 16,
    color: "#0066cc",
    marginLeft: 8,
  },
  tipContent: {
    lineHeight: 20,
    color: "#333",
  },
  explanationSection: {
    marginBottom: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#00994d",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeading: {
    fontWeight: "700",
    fontSize: 16,
    color: "#00994d",
    marginLeft: 8,
  },
  sectionContent: {
    lineHeight: 20,
    marginBottom: 12,
    color: "#333",
  },
  stepsList: {
    marginVertical: 8,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00994d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  stepNumberText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
  },
  componentsList: {
    marginVertical: 8,
  },
  componentItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00994d",
    marginRight: 10,
    marginLeft: 8,
  },
  componentText: {
    flex: 1,
    lineHeight: 20,
  },
  analogyCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#cc0000",
  },
  analogyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  analogyDomain: {
    fontWeight: "700",
    fontSize: 16,
    color: "#cc0000",
    marginLeft: 8,
  },
  analogyContent: {
    lineHeight: 20,
    color: "#333",
  },
  segmentedControl: {
    marginTop: 12,
    marginBottom: 8,
  },
  aiContentContainer: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
    maxWidth: "100%",
    marginHorizontal: 0,
  },
  aiContentTextContainer: {
    width: "100%",
    maxWidth: "100%",
    marginHorizontal: 0,
  },
  aiContentText: {
    marginBottom: 12,
    lineHeight: 22,
    fontSize: 15,
    color: "#333333",
  },
  aiContentHeader: {
    fontWeight: "600",
    fontSize: 17,
    marginBottom: 12,
    marginTop: 4,
    color: "#333333",
  },
  aiLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    width: "100%",
  },
  aiLoadingText: {
    marginTop: 16,
    marginBottom: 12,
    color: "#666",
  },
  progressBar: {
    width: "80%",
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0066cc",
    borderRadius: 2,
  },
  loadingIndicatorContainer: {
    marginLeft: 4,
  },
  loadingIndicatorText: {
    color: "#666",
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 10,
    paddingRight: 16,
  },
  bulletDot: {
    marginRight: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#0066cc",
  },
  bulletNumber: {
    marginRight: 8,
    fontSize: 15,
    fontWeight: "600",
    width: 24,
    color: "#0066cc",
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
    fontSize: 15,
    color: "#333333",
  },
  aiParagraph: {
    marginBottom: 12,
  },
  aiBoldText: {
    fontWeight: "600",
  },
  tipCard: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
  },
  tipHeader: {
    marginBottom: 8,
  },
  tipHeading: {
    fontWeight: "600",
    fontSize: 17,
    color: "#0066cc",
    marginBottom: 8,
  },
  tipContent: {
    lineHeight: 22,
    fontSize: 15,
    color: "#333333",
  },
  explanationSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontWeight: "600",
    fontSize: 17,
    color: "#00994d",
    marginBottom: 8,
  },
  sectionContent: {
    lineHeight: 22,
    marginBottom: 12,
    fontSize: 15,
    color: "#333333",
  },
  stepsList: {
    marginTop: 12,
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingLeft: 4,
  },
  stepNumber: {
    fontWeight: "600",
    color: "#00994d",
    width: 24,
    fontSize: 15,
  },
  stepText: {
    flex: 1,
    lineHeight: 22,
    fontSize: 15,
    color: "#333333",
  },
  componentsList: {
    marginTop: 12,
    paddingLeft: 4,
  },
  componentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletDot: {
    marginRight: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#0066cc",
  },
  componentText: {
    flex: 1,
    lineHeight: 22,
    fontSize: 15,
    color: "#333333",
  },
  analogyCard: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
  },
  analogyDomain: {
    fontWeight: "600",
    fontSize: 17,
    color: "#cc0000",
    marginBottom: 8,
  },
  analogyContent: {
    lineHeight: 22,
    fontSize: 15,
    color: "#333333",
  },
});

export default TopicDetailScreen;
