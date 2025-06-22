import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import {
  Text,
  Card,
  Surface,
  Portal,
  Dialog,
  Button,
  ProgressBar,
  Chip,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuestionState } from "../../hooks/useQuestionState";

const MatchingRenderer = ({
  question,
  onAnswerChange,
  userAnswer = null,
  showResult = false,
  result = null,
}) => {
  // Use the custom hook for state management
  const { matchingPairs, removeMatchingPair, clearAllMatches } =
    useQuestionState(question, onAnswerChange);

  // Use provided answer if available (for review mode)
  const currentPairs = userAnswer !== null ? userAnswer : matchingPairs;

  // Determine if the question is answered and locked (only in review mode)
  const isAnswered = showResult;

  // Local state for response selector
  const [selectedPrompt, setSelectedPrompt] = React.useState(null);
  const [showResponseSelector, setShowResponseSelector] = React.useState(false);

  // Helper functions
  const getMatchedResponse = (prompt) => {
    const pair = currentPairs.find((p) => p.prompt === prompt);
    return pair ? pair.response : null;
  };

  const isResponseMatched = (response) => {
    return currentPairs.some((pair) => pair.response === response);
  };

  const getMatchingProgress = () => {
    if (!question.prompts) return { completed: 0, total: 0, percentage: 0 };
    const total = question.prompts.length;
    const completed = currentPairs.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const handlePromptSelect = (prompt) => {
    if (isAnswered) return;
    setSelectedPrompt(prompt);
    setShowResponseSelector(true);
  };

  const handleResponseSelect = (response) => {
    if (!selectedPrompt || isAnswered) return;

    // Remove existing match for this prompt if any
    const existingPairIndex = currentPairs.findIndex(
      (pair) => pair.prompt === selectedPrompt
    );
    let newPairs = [...currentPairs];
    if (existingPairIndex !== -1) {
      newPairs.splice(existingPairIndex, 1);
    }

    // Add new match
    newPairs.push({ prompt: selectedPrompt, response });
    onAnswerChange(newPairs);
    setShowResponseSelector(false);
    setSelectedPrompt(null);
  };

  const handleRemoveMatch = (prompt) => {
    if (isAnswered) return;
    removeMatchingPair(prompt);
  };

  const renderProgress = () => {
    const progress = getMatchingProgress();

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Matching Progress</Text>
          <Text style={styles.progressText}>
            {progress.completed} of {progress.total} matched
          </Text>
        </View>
        <ProgressBar
          progress={progress.percentage / 100}
          color="#007AFF"
          style={styles.progressBar}
        />
      </View>
    );
  };

  const renderPrompts = () => {
    if (!question.prompts || question.prompts.length === 0) {
      return <Text style={styles.noDataText}>No prompts available</Text>;
    }

    return question.prompts.map((prompt, index) => {
      const matchedResponse = getMatchedResponse(prompt);
      const isCorrect =
        showResult &&
        question.correctPairs &&
        question.correctPairs[prompt] === matchedResponse;
      const isIncorrect = showResult && matchedResponse && !isCorrect;

      const promptStyle = [
        styles.promptContainer,
        matchedResponse && styles.matchedPrompt,
        showResult && isCorrect && styles.correctPrompt,
        showResult && isIncorrect && styles.incorrectPrompt,
      ];

      return (
        <TouchableOpacity
          key={`prompt-${index}`}
          style={promptStyle}
          onPress={() => handlePromptSelect(prompt)}
          disabled={isAnswered}
          activeOpacity={0.7}
        >
          <View style={styles.promptContent}>
            <Text
              style={[
                styles.promptText,
                matchedResponse && styles.matchedPromptText,
                showResult && isCorrect && styles.correctPromptText,
                showResult && isIncorrect && styles.incorrectPromptText,
              ]}
            >
              {prompt}
            </Text>

            {matchedResponse && (
              <View style={styles.matchedResponseContainer}>
                <Text
                  style={[
                    styles.matchedResponseText,
                    showResult && isCorrect && styles.correctMatchedText,
                    showResult && isIncorrect && styles.incorrectMatchedText,
                  ]}
                >
                  → {matchedResponse}
                </Text>
                {!isAnswered && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMatch(prompt)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color="#FF3B30"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {showResult && (
              <View style={styles.resultIndicator}>
                <MaterialCommunityIcons
                  name={isCorrect ? "check-circle" : "close-circle"}
                  size={20}
                  color={isCorrect ? "#34C759" : "#FF3B30"}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderBulkOperations = () => {
    if (isAnswered || currentPairs.length === 0) return null;

    return (
      <View style={styles.bulkOperationsContainer}>
        <TouchableOpacity
          onPress={clearAllMatches}
          style={styles.clearAllButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="delete-sweep"
            size={16}
            color="#FF3B30"
          />
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderResponseSelector = () => {
    const availableResponses =
      question.responses?.filter(
        (response) =>
          !isResponseMatched(response) ||
          getMatchedResponse(selectedPrompt) === response
      ) || [];

    return (
      <Portal>
        <Dialog
          visible={showResponseSelector}
          onDismiss={() => setShowResponseSelector(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Select Response
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogPrompt}>
              Match with: "{selectedPrompt}"
            </Text>
            <ScrollView style={styles.responsesList}>
              {availableResponses.map((response, index) => (
                <TouchableOpacity
                  key={`response-${index}`}
                  style={styles.responseOption}
                  onPress={() => handleResponseSelect(response)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.responseText}>{response}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowResponseSelector(false)}
              textColor="#007AFF"
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  const renderExplanation = () => {
    if (!showResult || !result) return null;

    return (
      <View style={styles.explanationContainer}>
        <Text style={styles.explanationTitle}>
          {result.isCorrect ? "Perfect Matching!" : "Explanation"}
        </Text>
        <Text style={styles.explanationText}>{result.explanation}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question}</Text>
      <Text style={styles.instructionsText}>
        Tap on each prompt to select its matching response.
      </Text>

      {renderProgress()}
      {renderBulkOperations()}

      <View style={styles.promptsContainer}>{renderPrompts()}</View>

      {renderExplanation()}
      {renderResponseSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    color: "#1D1D1F",
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#8E8E93",
    marginBottom: 24,
    fontStyle: "italic",
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
  bulkOperationsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
    gap: 6,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FF3B30",
  },
  promptsContainer: {
    gap: 12,
  },
  promptContainer: {
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    overflow: "hidden",
  },
  matchedPrompt: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  correctPrompt: {
    backgroundColor: "#E8F5E8",
    borderColor: "#34C759",
  },
  incorrectPrompt: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FF3B30",
  },
  promptContent: {
    padding: 16,
    minHeight: 56,
  },
  promptText: {
    fontSize: 17,
    lineHeight: 24,
    color: "#1D1D1F",
    marginBottom: 8,
  },
  matchedPromptText: {
    fontWeight: "500",
    color: "#007AFF",
  },
  correctPromptText: {
    fontWeight: "500",
    color: "#34C759",
  },
  incorrectPromptText: {
    fontWeight: "500",
    color: "#FF3B30",
  },
  matchedResponseContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  matchedResponseText: {
    fontSize: 15,
    color: "#8E8E93",
    flex: 1,
  },
  correctMatchedText: {
    color: "#34C759",
    fontWeight: "500",
  },
  incorrectMatchedText: {
    color: "#FF3B30",
    fontWeight: "500",
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  resultIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  noDataText: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    padding: 20,
  },
  dialog: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1D1D1F",
  },
  dialogPrompt: {
    fontSize: 15,
    color: "#3A3A3C",
    marginBottom: 16,
    fontStyle: "italic",
  },
  responsesList: {
    maxHeight: 300,
  },
  responseOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    marginBottom: 8,
  },
  responseText: {
    fontSize: 16,
    color: "#1D1D1F",
  },
  explanationContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  explanationTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1D1D1F",
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#3A3A3C",
  },
});

export default MatchingRenderer;
