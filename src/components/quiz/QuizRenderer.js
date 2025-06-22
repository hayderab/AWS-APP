import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { quizRendererRegistry } from './QuizRendererRegistry';

// Base component for rendering quiz questions
const QuizRenderer = ({ 
  question, 
  onAnswerChange, 
  userAnswer, 
  showResult = false, 
  result = null 
}) => {
  if (!question) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No question provided</Text>
      </View>
    );
  }

  // Try to get a registered renderer for this question type
  try {
    if (quizRendererRegistry.hasRenderer(question.type)) {
      const Renderer = quizRendererRegistry.getRenderer(question.type);
      return (
        <Renderer
          question={question}
          onAnswerChange={onAnswerChange}
          userAnswer={userAnswer}
          showResult={showResult}
          result={result}
        />
      );
    }
  } catch (error) {
    console.error(`Error rendering question type ${question.type}:`, error);
  }

  // Fallback renderer if no specific renderer is found
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.questionText}>{question.question}</Text>
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            No renderer available for question type: {question.type}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
  },
  errorText: {
    color: '#cc0000',
    fontSize: 16,
  },
  warningContainer: {
    padding: 16,
    backgroundColor: '#ffffee',
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    color: '#cc6600',
    fontSize: 16,
  },
});

export default QuizRenderer;
