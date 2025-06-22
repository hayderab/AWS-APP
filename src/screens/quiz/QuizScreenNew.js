import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Button,
  ProgressBar,
  ActivityIndicator,
  Divider,
  Card,
  Dialog,
  Portal,
  IconButton,
  Chip,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import QuizGenerator from "../../services/quiz/QuizGenerator";
import ApiService from "../../services/ApiService";
import { useAuth } from "../../context/AuthContext";
import QuizRenderer from "../../components/quiz/QuizRenderer";
import "../../components/quiz"; // This ensures the renderers are registered

const QuizScreen = ({ route, navigation }) => {
  const { topic, preGeneratedQuestions, isRetake } = route.params || {};
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [confirmSubmitVisible, setConfirmSubmitVisible] = useState(false);

  // Enhanced features state
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] =
    useState(null);

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        if (preGeneratedQuestions && preGeneratedQuestions.length > 0) {
          setQuestions(preGeneratedQuestions);
          setUserAnswers(new Array(preGeneratedQuestions.length).fill(null));
        } else if (topic) {
          const generator = new QuizGenerator(topic.key, user.uid);
          const generated = await generator.generateQuiz(10); // Generate 10 questions
          setQuestions(generated);
          setUserAnswers(new Array(generated.length).fill(null));
        } else {
          throw new Error("No topic or pre-generated questions provided.");
        }

        // Initialize timing
        setStartTime(Date.now());
        setCurrentQuestionStartTime(Date.now());
      } catch (err) {
        console.error("Failed to load questions:", err);
        setError("Failed to load the quiz. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [topic, preGeneratedQuestions, user.uid]);

  // Track time when moving between questions
  useEffect(() => {
    if (currentQuestionStartTime) {
      const timeSpent = Date.now() - currentQuestionStartTime;
      setQuestionTimes((prev) => ({
        ...prev,
        [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + timeSpent,
      }));
    }
    setCurrentQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Handle answer change for the current question
  const handleAnswerChange = (answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Handle confidence level change
  const handleConfidenceChange = (confidence) => {
    setConfidenceLevels((prev) => ({
      ...prev,
      [currentQuestionIndex]: confidence,
    }));
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    const newBookmarks = new Set(bookmarkedQuestions);
    if (newBookmarks.has(currentQuestionIndex)) {
      newBookmarks.delete(currentQuestionIndex);
    } else {
      newBookmarks.add(currentQuestionIndex);
    }
    setBookmarkedQuestions(newBookmarks);
  };

  // Navigation handlers
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Jump to specific question
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Helper function to check answers for different question types
  const checkQuestionAnswer = (question, userAnswer) => {
    try {
      // If the question has a checkAnswer method, use it
      if (typeof question.checkAnswer === "function") {
        return question.checkAnswer(userAnswer);
      }

      // Otherwise, handle different question types manually
      switch (question.type) {
        case "MultipleChoiceQuestion":
        case "multiple-choice":
          return {
            isCorrect: userAnswer === question.correctAnswer,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || "No explanation provided.",
          };

        case "MultipleResponseQuestion":
        case "multiple-response":
          if (
            !Array.isArray(userAnswer) ||
            !Array.isArray(question.correctAnswers)
          ) {
            return {
              isCorrect: false,
              correctAnswer: question.correctAnswers,
              explanation: question.explanation || "No explanation provided.",
            };
          }
          const correct =
            userAnswer.length === question.correctAnswers.length &&
            userAnswer.every((answer) =>
              question.correctAnswers.includes(answer)
            ) &&
            question.correctAnswers.every((answer) =>
              userAnswer.includes(answer)
            );
          return {
            isCorrect: correct,
            correctAnswer: question.correctAnswers,
            explanation: question.explanation || "No explanation provided.",
          };

        case "OrderingQuestion":
        case "ordering":
          if (
            !Array.isArray(userAnswer) ||
            !Array.isArray(question.correctOrder)
          ) {
            return {
              isCorrect: false,
              correctAnswer: question.correctOrder,
              explanation: question.explanation || "No explanation provided.",
            };
          }
          const orderCorrect =
            userAnswer.length === question.correctOrder.length &&
            userAnswer.every(
              (item, index) => item === question.correctOrder[index]
            );
          return {
            isCorrect: orderCorrect,
            correctAnswer: question.correctOrder,
            explanation: question.explanation || "No explanation provided.",
          };

        case "MatchingQuestion":
        case "matching":
          if (
            !Array.isArray(userAnswer) ||
            !Array.isArray(question.correctPairs)
          ) {
            return {
              isCorrect: false,
              correctAnswer: question.correctPairs,
              explanation: question.explanation || "No explanation provided.",
            };
          }
          const matchingCorrect =
            userAnswer.length === question.correctPairs.length &&
            userAnswer.every((pair) => {
              const correctPair = question.correctPairs.find(
                (cp) => cp.prompt === pair.prompt
              );
              return correctPair && correctPair.response === pair.response;
            });
          return {
            isCorrect: matchingCorrect,
            correctAnswer: question.correctPairs,
            explanation: question.explanation || "No explanation provided.",
          };

        case "CaseStudyQuestion":
        case "case-study":
          if (
            !Array.isArray(userAnswer) ||
            !Array.isArray(question.subQuestions)
          ) {
            return {
              isCorrect: false,
              correctAnswer: question.subQuestions?.map(
                (sq) => sq.correctAnswer
              ),
              explanation: question.explanation || "No explanation provided.",
              results: [],
            };
          }
          const subResults = question.subQuestions.map((subQ, idx) =>
            checkQuestionAnswer(subQ, userAnswer[idx])
          );
          const caseCorrect = subResults.every((result) => result.isCorrect);
          return {
            isCorrect: caseCorrect,
            correctAnswer: question.subQuestions?.map((sq) => sq.correctAnswer),
            explanation: question.explanation || "No explanation provided.",
            results: subResults,
          };

        default:
          console.warn(`Unknown question type: ${question.type}`);
          return {
            isCorrect: false,
            correctAnswer: null,
            explanation: "Unable to check answer for this question type.",
          };
      }
    } catch (error) {
      console.error("Error checking answer:", error);
      return {
        isCorrect: false,
        correctAnswer: null,
        explanation: "Error occurred while checking the answer.",
      };
    }
  };

  // Submit handler
  const handleSubmitQuiz = async () => {
    setConfirmSubmitVisible(false);
    setLoading(true);

    try {
      const results = {
        totalQuestions: questions.length,
        correctCount: 0,
        score: 0,
        pass: false,
        questionResults: [],
        totalTime: Date.now() - startTime,
        averageConfidence: 0,
        bookmarkedCount: bookmarkedQuestions.size,
      };

      const detailedResults = questions.map((q, index) => {
        const userAnswer = userAnswers[index];
        const result = checkQuestionAnswer(q, userAnswer);
        if (result.isCorrect) {
          results.correctCount++;
        }
        return {
          question: q.question,
          type: q.type,
          userAnswer,
          confidence: confidenceLevels[index] || null,
          timeSpent: questionTimes[index] || 0,
          isBookmarked: bookmarkedQuestions.has(index),
          ...result,
        };
      });

      results.questionResults = detailedResults;
      results.score = (results.correctCount / results.totalQuestions) * 100;
      results.pass = results.score >= 75; // Example passing score

      // Calculate average confidence
      const confidenceValues = Object.values(confidenceLevels).filter(
        (c) => c !== null
      );
      results.averageConfidence =
        confidenceValues.length > 0
          ? confidenceValues.reduce((sum, conf) => sum + conf, 0) /
            confidenceValues.length
          : 0;

      // Save results to backend
      if (!isRetake && topic && topic._id) {
        await ApiService.submitQuizResults({
          userId: user.uid,
          topicId: topic._id,
          score: results.score,
          results: detailedResults,
          timeSpent: results.totalTime,
          averageConfidence: results.averageConfidence,
          bookmarkedQuestions: Array.from(bookmarkedQuestions),
        });
      }

      setQuizResults(results);
      setQuizCompleted(true);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      Alert.alert("Error", "There was a problem submitting your quiz.");
    } finally {
      setLoading(false);
    }
  };

  // Render functions
  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator animating={true} size="large" />
      <Text style={styles.loadingText}>Generating Quiz...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <Button onPress={() => navigation.goBack()}>Go Back</Button>
    </View>
  );

  // Render question navigator
  const renderQuestionNavigator = () => {
    if (questions.length <= 1) return null;

    return (
      <View style={styles.questionNavigator}>
        <Text style={styles.navigatorTitle}>Questions:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.navigatorScroll}
        >
          {questions.map((_, index) => {
            const isAnswered = userAnswers[index] !== null;
            const isBookmarked = bookmarkedQuestions.has(index);
            const isCurrent = index === currentQuestionIndex;

            return (
              <Button
                key={index}
                mode={isCurrent ? "contained" : "outlined"}
                compact
                onPress={() => goToQuestion(index)}
                style={[
                  styles.navigatorButton,
                  isAnswered && styles.answeredButton,
                  isBookmarked && styles.bookmarkedButton,
                ]}
                labelStyle={styles.navigatorButtonLabel}
              >
                {String(index + 1)}
                {isBookmarked && (
                  <MaterialCommunityIcons
                    name="bookmark"
                    size={12}
                    color="#ff9800"
                  />
                )}
              </Button>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderQuizContent = () => {
    if (questions.length === 0) return null;
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <ScrollView style={styles.container}>
        {renderQuestionNavigator()}

        <QuizRenderer
          question={currentQuestion}
          onAnswerChange={handleAnswerChange}
          userAnswer={userAnswers[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onBookmark={handleBookmarkToggle}
          isBookmarked={bookmarkedQuestions.has(currentQuestionIndex)}
          onConfidenceChange={handleConfidenceChange}
          confidence={confidenceLevels[currentQuestionIndex]}
        />

        <View style={styles.navigationButtons}>
          <Button
            mode="outlined"
            onPress={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            icon="arrow-left"
          >
            Previous
          </Button>

          <View style={styles.centerButtons}>
            {bookmarkedQuestions.size > 0 && (
              <Chip
                icon="bookmark"
                style={styles.bookmarkChip}
                textStyle={styles.bookmarkChipText}
              >
                {String(bookmarkedQuestions.size)} bookmarked
              </Chip>
            )}
          </View>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              mode="contained"
              onPress={goToNextQuestion}
              icon="arrow-right"
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => setConfirmSubmitVisible(true)}
              disabled={userAnswers.some((a) => a === null)}
              icon="check"
            >
              Submit Quiz
            </Button>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderResults = () => {
    if (!quizResults) return null;

    const formatTime = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
    };

    return (
      <ScrollView style={styles.resultsContainer}>
        <Card style={styles.card}>
          <Card.Title title="Quiz Results" />
          <Card.Content>
            <Text style={styles.scoreText}>
              Your Score: {quizResults.score.toFixed(1)}%
            </Text>
            <Text
              style={quizResults.pass ? styles.passMessage : styles.failMessage}
            >
              {quizResults.pass
                ? "Congratulations, you passed!"
                : "You did not pass. Keep studying!"}
            </Text>

            {/* Enhanced statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="clock" size={20} color="#666" />
                <Text style={styles.statText}>
                  Time: {formatTime(quizResults.totalTime)}
                </Text>
              </View>

              {quizResults.averageConfidence > 0 && (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="emoticon-happy"
                    size={20}
                    color="#666"
                  />
                  <Text style={styles.statText}>
                    Avg. Confidence: {quizResults.averageConfidence.toFixed(1)}
                    /4
                  </Text>
                </View>
              )}

              {quizResults.bookmarkedCount > 0 && (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="bookmark"
                    size={20}
                    color="#666"
                  />
                  <Text style={styles.statText}>
                    Bookmarked: {quizResults.bookmarkedCount}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Text style={styles.reviewTitle}>Review Your Answers</Text>

        {quizResults.questionResults.map((result, index) => (
          <Card
            key={index}
            style={[
              styles.card,
              result.isCorrect ? styles.correctCard : styles.incorrectCard,
            ]}
          >
            <Card.Content>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewQuestionNumber}>
                  Question {index + 1}
                </Text>
                <View style={styles.reviewMeta}>
                  {result.isBookmarked && (
                    <MaterialCommunityIcons
                      name="bookmark"
                      size={16}
                      color="#ff9800"
                    />
                  )}
                  {result.confidence && (
                    <Chip compact style={styles.confidenceChip}>
                      Confidence: {result.confidence}/4
                    </Chip>
                  )}
                  {result.timeSpent && (
                    <Text style={styles.timeText}>
                      {formatTime(result.timeSpent)}
                    </Text>
                  )}
                </View>
              </View>

              <QuizRenderer
                question={questions[index]}
                userAnswer={result.userAnswer}
                showResult={true}
                result={result}
                questionNumber={index + 1}
                totalQuestions={questions.length}
                isBookmarked={result.isBookmarked}
                confidence={result.confidence}
              />
            </Card.Content>
          </Card>
        ))}

        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.finishButton}
          icon="check"
        >
          Finish Review
        </Button>
      </ScrollView>
    );
  };

  if (loading) return renderLoading();
  if (error) return renderError();
  if (quizCompleted) return renderResults();

  return (
    <>
      {renderQuizContent()}
      <Portal>
        <Dialog
          visible={confirmSubmitVisible}
          onDismiss={() => setConfirmSubmitVisible(false)}
        >
          <Dialog.Title>Confirm Submission</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to submit your answers?</Text>
            <Text style={styles.submitWarning}>
              You have answered{" "}
              {String(userAnswers.filter((a) => a !== null).length)} out of{" "}
              {String(questions.length)} questions.
            </Text>
            {bookmarkedQuestions.size > 0 && (
              <Text style={styles.submitInfo}>
                You have {String(bookmarkedQuestions.size)} bookmarked questions
                to review later.
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmSubmitVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleSubmitQuiz}>Submit</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  questionNavigator: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  navigatorTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  navigatorScroll: {
    flexDirection: "row",
  },
  navigatorButton: {
    marginRight: 8,
    minWidth: 40,
  },
  answeredButton: {
    backgroundColor: "#e8f5e8",
  },
  bookmarkedButton: {
    borderColor: "#ff9800",
  },
  navigatorButtonLabel: {
    fontSize: 12,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  centerButtons: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  bookmarkChip: {
    backgroundColor: "#fff3e0",
  },
  bookmarkChipText: {
    color: "#f57c00",
    fontSize: 12,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  correctCard: {
    borderColor: "green",
    borderWidth: 1,
  },
  incorrectCard: {
    borderColor: "red",
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  passMessage: {
    fontSize: 18,
    color: "green",
    textAlign: "center",
    marginBottom: 16,
  },
  failMessage: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  divider: {
    marginVertical: 16,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewQuestionNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  reviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confidenceChip: {
    height: 24,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  finishButton: {
    marginTop: 24,
    marginBottom: 24,
  },
  submitWarning: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  submitInfo: {
    marginTop: 4,
    fontSize: 14,
    color: "#2196f3",
  },
});

export default QuizScreen;
