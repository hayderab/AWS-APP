import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, Checkbox } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuestionState } from "../../hooks/useQuestionState";

const MultipleResponseRenderer = ({
  question,
  onAnswerChange,
  userAnswer = null,
  showResult = false,
  result = null,
}) => {
  // Use the custom hook for state management
  const { selectedOptions, toggleOption } = useQuestionState(
    question,
    onAnswerChange
  );

  // Use provided answer if available (for review mode)
  const currentAnswers = userAnswer !== null ? userAnswer : selectedOptions;

  // Determine if the question is answered and locked (only in review mode)
  const isAnswered = showResult;

  // Render the multiple response options
  const renderOptions = () => {
    return question.choices.map((choice, index) => {
      const isCorrect =
        showResult &&
        question.correctAnswers &&
        question.correctAnswers.includes(choice);
      const isSelected = currentAnswers && currentAnswers.includes(choice);
      const isIncorrect = showResult && isSelected && !isCorrect;
      const shouldBeSelected = showResult && !isSelected && isCorrect;

      const optionStyle = [
        styles.optionContainer,
        isSelected && styles.selectedOption,
        showResult && isCorrect && styles.correctOption,
        showResult && isIncorrect && styles.incorrectOption,
        showResult && shouldBeSelected && styles.missedCorrectOption,
      ];

      return (
        <TouchableOpacity
          key={`option-${index}`}
          style={optionStyle}
          onPress={() => !isAnswered && toggleOption(choice)}
          disabled={isAnswered}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <Checkbox
              status={isSelected ? "checked" : "unchecked"}
              onPress={() => !isAnswered && toggleOption(choice)}
              disabled={isAnswered}
              color="#007AFF"
            />
            <Text
              style={[
                styles.optionText,
                isSelected && styles.selectedOptionText,
                showResult && isCorrect && styles.correctOptionText,
                showResult && isIncorrect && styles.incorrectOptionText,
                showResult && shouldBeSelected && styles.missedOptionText,
              ]}
            >
              {choice}
            </Text>

            {showResult && (
              <View style={styles.resultIndicator}>
                {isCorrect && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#34C759"
                  />
                )}
                {isIncorrect && (
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#FF3B30"
                  />
                )}
                {shouldBeSelected && (
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={20}
                    color="#FF9500"
                  />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  // Render explanation
  const renderExplanation = () => {
    if (!showResult || !result) return null;

    return (
      <View style={styles.explanationContainer}>
        <Text style={styles.explanationTitle}>
          {result.isCorrect ? "Correct!" : "Explanation"}
        </Text>
        <Text style={styles.explanationText}>{result.explanation}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question}</Text>
      <Text style={styles.instructionsText}>
        Select all that apply. This question has multiple correct answers.
      </Text>
      <View style={styles.optionsContainer}>{renderOptions()}</View>
      {renderExplanation()}
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
  optionsContainer: {
    gap: 12,
  },
  optionContainer: {
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    overflow: "hidden",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 56,
  },
  selectedOption: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  correctOption: {
    backgroundColor: "#E8F5E8",
    borderColor: "#34C759",
  },
  incorrectOption: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FF3B30",
  },
  missedCorrectOption: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9500",
  },
  optionText: {
    fontSize: 17,
    lineHeight: 24,
    flex: 1,
    marginLeft: 12,
    color: "#1D1D1F",
  },
  selectedOptionText: {
    fontWeight: "500",
    color: "#007AFF",
  },
  correctOptionText: {
    fontWeight: "500",
    color: "#34C759",
  },
  incorrectOptionText: {
    fontWeight: "500",
    color: "#FF3B30",
  },
  missedOptionText: {
    fontWeight: "500",
    color: "#FF9500",
  },
  resultIndicator: {
    marginLeft: 8,
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

export default MultipleResponseRenderer;
