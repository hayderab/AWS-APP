import { quizRendererRegistry } from './QuizRendererRegistry';
import QuizRenderer from './QuizRenderer';
import MultipleChoiceRenderer from './MultipleChoiceRenderer';
import MultipleResponseRenderer from './MultipleResponseRenderer';
import OrderingRenderer from './OrderingRenderer';
import MatchingRenderer from './MatchingRenderer';
import CaseStudyRenderer from './CaseStudyRenderer';
import { useQuestionState } from '../../hooks/useQuestionState';

// Register all the built-in renderers
quizRendererRegistry
  .register('MultipleChoiceQuestion', MultipleChoiceRenderer, useQuestionState)
  .register('MultipleResponseQuestion', MultipleResponseRenderer, useQuestionState)
  .register('OrderingQuestion', OrderingRenderer, useQuestionState)
  .register('MatchingQuestion', MatchingRenderer, useQuestionState)
  .register('CaseStudyQuestion', CaseStudyRenderer, useQuestionState);

// Export all components and the registry
export {
  quizRendererRegistry,
  QuizRenderer,
  MultipleChoiceRenderer,
  MultipleResponseRenderer,
  OrderingRenderer,
  MatchingRenderer,
  CaseStudyRenderer,
  useQuestionState
};

export default QuizRenderer;
