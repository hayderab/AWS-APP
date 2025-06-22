import React from 'react';
import { quizTypeRegistry } from '../../services/quiz/QuizTypes';

// Registry for quiz renderer components
class QuizRendererRegistry {
  constructor() {
    this.renderers = new Map();
  }

  // Register a renderer component for a specific question type
  register(typeName, rendererComponent, stateHook) {
    // Verify that the question type exists
    if (!quizTypeRegistry.getAllTypes().includes(typeName)) {
      console.warn(`Attempting to register renderer for unknown question type: ${typeName}`);
    }

    this.renderers.set(typeName, {
      component: rendererComponent,
      stateHook: stateHook
    });
    
    console.log(`Registered renderer for quiz type: ${typeName}`);
    return this; // For chaining
  }

  // Unregister a renderer
  unregister(typeName) {
    if (this.renderers.has(typeName)) {
      this.renderers.delete(typeName);
      console.log(`Unregistered renderer for quiz type: ${typeName}`);
    }
    return this; // For chaining
  }

  // Get a renderer component by question type
  getRenderer(typeName) {
    if (!this.renderers.has(typeName)) {
      throw new Error(`Renderer not registered for quiz type: ${typeName}`);
    }
    return this.renderers.get(typeName).component;
  }

  // Get the state hook for a question type
  getStateHook(typeName) {
    if (!this.renderers.has(typeName)) {
      throw new Error(`State hook not registered for quiz type: ${typeName}`);
    }
    return this.renderers.get(typeName).stateHook;
  }

  // Check if a renderer exists for a question type
  hasRenderer(typeName) {
    return this.renderers.has(typeName);
  }

  // Get all registered renderers
  getAllRenderers() {
    return Array.from(this.renderers.keys()).map(typeName => ({
      typeName,
      ...this.renderers.get(typeName)
    }));
  }
}

// Create and export the registry
export const quizRendererRegistry = new QuizRendererRegistry();

export default quizRendererRegistry;
