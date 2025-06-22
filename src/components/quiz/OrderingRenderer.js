import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, IconButton, Surface } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuestionState } from "../../hooks/useQuestionState";

const OrderingRenderer = ({
  question,
  onAnswerChange,
  userAnswer = null,
  showResult = false,
  result = null,
}) => {
  // Use the custom hook for state management
  const { orderItems, handleReorder } = useQuestionState(
    question,
    onAnswerChange
  );

  // Use provided answer if available (for review mode)
  const currentItems = userAnswer !== null ? userAnswer : orderItems;

  // Determine if the question is answered and locked (only in review mode)
  const isAnswered = showResult;

  // Render the ordering items
  const renderOrderItems = () => {
    return currentItems.map((item, index) => {
      const isCorrectPosition =
        showResult &&
        question.correctOrder &&
        index < question.correctOrder.length &&
        item === question.correctOrder[index];

      const isIncorrectPosition = showResult && !isCorrectPosition;

      const itemStyle = [
        styles.orderItem,
        showResult && isCorrectPosition && styles.correctPositionItem,
        showResult && isIncorrectPosition && styles.incorrectPositionItem,
      ];

      return (
        <View key={`item-${index}`} style={itemStyle}>
          <View style={styles.orderItemContent}>
            <View
              style={[
                styles.orderNumberContainer,
                showResult &&
                  isCorrectPosition &&
                  styles.correctOrderNumberContainer,
                showResult &&
                  isIncorrectPosition &&
                  styles.incorrectOrderNumberContainer,
              ]}
            >
              <Text
                style={[
                  styles.orderNumber,
                  showResult && isCorrectPosition && styles.correctOrderNumber,
                  showResult &&
                    isIncorrectPosition &&
                    styles.incorrectOrderNumber,
                ]}
              >
                {String(index + 1)}
              </Text>
            </View>

            <Text
              style={[
                styles.itemText,
                showResult && isCorrectPosition && styles.correctItemText,
                showResult && isIncorrectPosition && styles.incorrectItemText,
              ]}
            >
              {item}
            </Text>

            {showResult && (
              <View style={styles.resultIndicator}>
                <MaterialCommunityIcons
                  name={isCorrectPosition ? "check-circle" : "close-circle"}
                  size={20}
                  color={isCorrectPosition ? "#34C759" : "#FF3B30"}
                />
              </View>
            )}
          </View>

          {!isAnswered && (
            <View style={styles.orderingButtons}>
              <TouchableOpacity
                onPress={() => handleReorder(index, "up")}
                disabled={index === 0}
                style={[
                  styles.orderButton,
                  index === 0 && styles.disabledButton,
                ]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="chevron-up"
                  size={20}
                  color={index === 0 ? "#C7C7CC" : "#007AFF"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleReorder(index, "down")}
                disabled={index === currentItems.length - 1}
                style={[
                  styles.orderButton,
                  index === currentItems.length - 1 && styles.disabledButton,
                ]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={
                    index === currentItems.length - 1 ? "#C7C7CC" : "#007AFF"
                  }
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    });
  };

  // Render explanation
  const renderExplanation = () => {
    if (!showResult || !result) return null;

    return (
      <View style={styles.explanationContainer}>
        <Text style={styles.explanationTitle}>
          {result.isCorrect ? "Perfect Order!" : "Explanation"}
        </Text>
        <Text style={styles.explanationText}>{result.explanation}</Text>
        {!result.isCorrect && question.correctOrder && (
          <View style={styles.correctOrderContainer}>
            <Text style={styles.correctOrderTitle}>Correct Order:</Text>
            {question.correctOrder.map((item, index) => (
              <Text key={`correct-${index}`} style={styles.correctOrderText}>
                {String(index + 1)}. {item}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question}</Text>
      <Text style={styles.instructionsText}>
        Arrange the items in the correct order using the arrows.
      </Text>
      <View style={styles.orderItemsContainer}>{renderOrderItems()}</View>
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
  orderItemsContainer: {
    gap: 12,
  },
  orderItem: {
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    overflow: "hidden",
  },
  correctPositionItem: {
    backgroundColor: "#E8F5E8",
    borderColor: "#34C759",
  },
  incorrectPositionItem: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FF3B30",
  },
  orderItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 56,
  },
  orderNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E5E7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  correctOrderNumberContainer: {
    backgroundColor: "#34C759",
  },
  incorrectOrderNumberContainer: {
    backgroundColor: "#FF3B30",
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3A3A3C",
  },
  correctOrderNumber: {
    color: "#FFFFFF",
  },
  incorrectOrderNumber: {
    color: "#FFFFFF",
  },
  itemText: {
    fontSize: 17,
    lineHeight: 24,
    flex: 1,
    color: "#1D1D1F",
  },
  correctItemText: {
    fontWeight: "500",
    color: "#34C759",
  },
  incorrectItemText: {
    fontWeight: "500",
    color: "#FF3B30",
  },
  resultIndicator: {
    marginLeft: 8,
  },
  orderingButtons: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E7",
    gap: 16,
  },
  orderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  disabledButton: {
    backgroundColor: "#F2F2F7",
    borderColor: "#E5E5E7",
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
    marginBottom: 12,
  },
  correctOrderContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1D1D6",
  },
  correctOrderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#34C759",
    marginBottom: 8,
  },
  correctOrderText: {
    fontSize: 15,
    color: "#34C759",
    marginBottom: 4,
    fontWeight: "500",
  },
});

export default OrderingRenderer;
