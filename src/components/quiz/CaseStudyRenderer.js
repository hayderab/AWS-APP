import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Divider,
  ProgressBar,
  IconButton,
  Button,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuestionState } from "../../hooks/useQuestionState";
import QuizRenderer from "./QuizRenderer";

const CaseStudyRenderer = ({
  question,
  onAnswerChange,
  userAnswer = null,
  showResult = false,
  result = null,
  questionNumber = 1,
  totalQuestions = 1,
  onBookmark = null,
  isBookmarked = false,
}) => {
  // State for sub-question navigation
  const [expandedSubQuestions, setExpandedSubQuestions] = React.useState(
    new Set([0])
  ); // First sub-question expanded by default
  const [currentSubQuestion, setCurrentSubQuestion] = React.useState(0);

  // Use the custom hook for state management
  const { subQuestionAnswers, updateSubQuestionAnswer } = useQuestionState(
    question,
    onAnswerChange
  );

  // Use provided answer if available (for review mode)
  const currentAnswers = userAnswer !== null ? userAnswer : subQuestionAnswers;

  // Determine if the question is answered and locked (only in review mode)
  const isAnswered = showResult;

  // Calculate progress statistics
  const getProgressStats = () => {
    const totalSubQuestions = question.subQuestions?.length || 0;
    const answeredCount = currentAnswers
      ? currentAnswers.filter((answer) => answer !== null).length
      : 0;
    const progress =
      totalSubQuestions > 0 ? answeredCount / totalSubQuestions : 0;

    return {
      totalSubQuestions,
      answeredCount,
      progress,
      percentage: Math.round(progress * 100),
    };
  };

  // Calculate results statistics
  const getResultsStats = () => {
    if (!showResult || !result || !result.results) return null;

    let correctCount = 0;
    const totalCount = result.results.length;

    result.results.forEach((subResult) => {
      if (subResult && subResult.isCorrect) {
        correctCount++;
      }
    });

    return {
      correctCount,
      totalCount,
      accuracy: Math.round((correctCount / totalCount) * 100),
    };
  };

  // Toggle sub-question expansion
  const toggleSubQuestionExpansion = (index) => {
    const newExpanded = new Set(expandedSubQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSubQuestions(newExpanded);
  };

  // Navigate to specific sub-question
  const goToSubQuestion = (index) => {
    setCurrentSubQuestion(index);
    // Ensure the target sub-question is expanded
    const newExpanded = new Set(expandedSubQuestions);
    newExpanded.add(index);
    setExpandedSubQuestions(newExpanded);
  };

  // Enhanced sub-question answer update
  const handleSubQuestionAnswerUpdate = (index, answer) => {
    updateSubQuestionAnswer(index, answer);
  };

  // Render question header
  const renderQuestionHeader = () => {
    return (
      <View style={styles.questionHeader}>
        <View style={styles.questionInfo}>
          <Text style={styles.questionNumber}>
            Question {questionNumber} of {totalQuestions}
          </Text>
          <Text style={styles.questionType}>Case Study Question</Text>
        </View>
        {onBookmark && (
          <IconButton
            icon={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            onPress={onBookmark}
            iconColor="#007AFF"
            style={styles.bookmarkButton}
          />
        )}
      </View>
    );
  };

  // Render progress indicator
  const renderProgress = () => {
    const stats = getProgressStats();

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Sub-Questions Progress</Text>
          <Text style={styles.progressText}>
            {stats.answeredCount} of {stats.totalSubQuestions} answered
          </Text>
        </View>
        <ProgressBar
          progress={stats.progress}
          style={styles.progressBar}
          color="#007AFF"
        />
      </View>
    );
  };

  // Render results statistics
  const renderResultsStats = () => {
    if (!showResult) return null;

    const stats = getResultsStats();
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Case Study Results</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.correctCount}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render sub-question navigator
  const renderSubQuestionNavigator = () => {
    if (!question.subQuestions || question.subQuestions.length <= 1)
      return null;

    return (
      <View style={styles.navigatorContainer}>
        <Text style={styles.navigatorTitle}>Sub-Questions</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.navigatorScroll}
        >
          {question.subQuestions.map((_, index) => {
            const isAnswered = currentAnswers && currentAnswers[index] !== null;
            const isCorrect =
              showResult &&
              result &&
              result.results &&
              result.results[index] &&
              result.results[index].isCorrect;
            const isCurrent = currentSubQuestion === index;

            const buttonStyle = [
              styles.navigatorButton,
              isCurrent && styles.currentNavigatorButton,
              showResult && isCorrect && styles.correctNavigatorButton,
              showResult &&
                !isCorrect &&
                isAnswered &&
                styles.incorrectNavigatorButton,
            ];

            return (
              <Button
                key={`nav-${index}`}
                mode={isCurrent ? "contained" : "outlined"}
                onPress={() => goToSubQuestion(index)}
                style={buttonStyle}
                labelStyle={styles.navigatorButtonText}
                compact
              >
                {String(index + 1)}
              </Button>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render the scenario with enhanced styling
  const renderScenario = () => {
    return (
      <View style={styles.scenarioContainer}>
        <View style={styles.scenarioHeader}>
          <MaterialCommunityIcons
            name="book-open-variant"
            size={20}
            color="#007AFF"
            style={styles.scenarioIcon}
          />
          <Text style={styles.scenarioTitle}>Scenario</Text>
        </View>
        <Text style={styles.scenarioText}>{question.scenario}</Text>
      </View>
    );
  };

  // Render sub-questions with enhanced navigation
  const renderSubQuestions = () => {
    return question.subQuestions.map((subQuestion, index) => {
      const isExpanded = expandedSubQuestions.has(index);
      const isAnswered = currentAnswers && currentAnswers[index] !== null;
      const subResult =
        showResult && result && result.results ? result.results[index] : null;
      const isCorrect = subResult && subResult.isCorrect;

      const containerStyle = [
        styles.subQuestionContainer,
        showResult && isCorrect && styles.correctSubQuestion,
        showResult && !isCorrect && isAnswered && styles.incorrectSubQuestion,
      ];

      return (
        <View key={`sub-${index}`} style={containerStyle}>
          <View style={styles.subQuestionHeader}>
            <View style={styles.subQuestionTitleContainer}>
              <Text style={styles.subQuestionTitle}>
                Sub-Question {index + 1}
              </Text>
              {showResult && (
                <MaterialCommunityIcons
                  name={isCorrect ? "check-circle" : "close-circle"}
                  size={20}
                  color={isCorrect ? "#34C759" : "#FF3B30"}
                  style={styles.subQuestionStatusIcon}
                />
              )}
            </View>
            <IconButton
              icon={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              onPress={() => toggleSubQuestionExpansion(index)}
              iconColor="#8E8E93"
              style={styles.expandButton}
            />
          </View>

          {isExpanded && (
            <View style={styles.subQuestionContent}>
              <QuizRenderer
                question={subQuestion}
                onAnswerChange={(answer) =>
                  handleSubQuestionAnswerUpdate(index, answer)
                }
                userAnswer={currentAnswers ? currentAnswers[index] : null}
                showResult={showResult}
                result={subResult}
                questionNumber={index + 1}
                totalQuestions={question.subQuestions.length}
              />
            </View>
          )}
        </View>
      );
    });
  };

  // Render overall explanation with enhanced details
  const renderOverallExplanation = () => {
    if (!showResult || !result) return null;

    return (
      <View style={styles.explanationContainer}>
        <View style={styles.explanationHeader}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={20}
            color="#FF9500"
            style={styles.explanationIcon}
          />
          <Text style={styles.explanationTitle}>Overall Explanation</Text>
        </View>
        <Text style={styles.explanationText}>{result.explanation}</Text>

        {/* Key takeaways section */}
        {result.keyTakeaways && (
          <View style={styles.takeawaysContainer}>
            <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
            {result.keyTakeaways.map((takeaway, index) => (
              <View key={`takeaway-${index}`} style={styles.takeawayItem}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color="#007AFF"
                  style={styles.takeawayIcon}
                />
                <Text style={styles.takeawayText}>{takeaway}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render instructions
  const renderInstructions = () => {
    return (
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Read the scenario carefully, then answer each sub-question based on
          the information provided.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderQuestionHeader()}
      <Text style={styles.questionText}>{question.question}</Text>
      {renderInstructions()}
      {renderProgress()}
      {renderResultsStats()}
      {renderScenario()}
      {renderSubQuestionNavigator()}
      <View style={styles.subQuestionsContainer}>{renderSubQuestions()}</View>
      {renderOverallExplanation()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  questionInfo: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
  },
  questionType: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  bookmarkButton: {
    margin: 0,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    color: "#1D1D1F",
    marginBottom: 16,
  },
  instructionsContainer: {
    backgroundColor: "#F2F2F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#3A3A3C",
  },
  progressContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1D1F",
  },
  progressText: {
    fontSize: 15,
    color: "#8E8E93",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E5E7",
  },
  statsContainer: {
    backgroundColor: "#F2F2F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1D1F",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
  },
  navigatorContainer: {
    marginBottom: 20,
  },
  navigatorTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1D1F",
    marginBottom: 12,
  },
  navigatorScroll: {
    flexDirection: "row",
  },
  navigatorButton: {
    marginRight: 8,
    borderRadius: 8,
  },
  currentNavigatorButton: {
    backgroundColor: "#007AFF",
  },
  correctNavigatorButton: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  incorrectNavigatorButton: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
  },
  navigatorButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scenarioContainer: {
    marginBottom: 20,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  scenarioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  scenarioIcon: {
    marginRight: 8,
  },
  scenarioTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
  scenarioText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#3A3A3C",
    fontStyle: "italic",
  },
  subQuestionsContainer: {
    gap: 16,
  },
  subQuestionContainer: {
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    overflow: "hidden",
  },
  correctSubQuestion: {
    backgroundColor: "#E8F5E8",
    borderColor: "#34C759",
  },
  incorrectSubQuestion: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FF3B30",
  },
  subQuestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  subQuestionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  subQuestionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1D1D1F",
  },
  subQuestionStatusIcon: {
    marginLeft: 8,
  },
  expandButton: {
    margin: 0,
  },
  subQuestionContent: {
    padding: 16,
  },
  explanationContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  explanationIcon: {
    marginRight: 8,
  },
  explanationTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1D1D1F",
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#3A3A3C",
    marginBottom: 16,
  },
  takeawaysContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  takeawaysTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1D1F",
    marginBottom: 8,
  },
  takeawayItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  takeawayIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  takeawayText: {
    fontSize: 14,
    color: "#3A3A3C",
    flex: 1,
    lineHeight: 20,
  },
});

export default CaseStudyRenderer;
