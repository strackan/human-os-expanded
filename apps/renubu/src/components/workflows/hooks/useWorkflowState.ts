/**
 * useWorkflowState Hook
 *
 * Manages workflow state including:
 * - Current slide/step tracking
 * - Completed slides tracking
 * - Generic workflow state storage
 * - Chat message history
 * - Navigation functions
 */

import { useState } from 'react';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface UseWorkflowStateReturn {
  // State
  currentSlideIndex: number;
  completedSlides: Set<number>;
  workflowState: Record<string, any>;
  chatMessages: ChatMessage[];

  // Setters
  setCurrentSlideIndex: (index: number) => void;
  setCompletedSlides: (slides: Set<number>) => void;
  setWorkflowState: (state: Record<string, any>) => void;
  setChatMessages: (messages: ChatMessage[]) => void;

  // Navigation
  goToNextSlide: (totalSlides: number) => void;
  goToPreviousSlide: () => void;
  goToSlide: (index: number) => void;

  // State helpers
  addChatMessage: (message: ChatMessage) => void;
  updateWorkflowState: (key: string, value: any) => void;
  markSlideComplete: (index: number) => void;
}

export function useWorkflowState(): UseWorkflowStateReturn {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(new Set([0]));
  const [workflowState, setWorkflowState] = useState<Record<string, any>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const goToNextSlide = (totalSlides: number) => {
    if (currentSlideIndex < totalSlides - 1) {
      const nextIndex = currentSlideIndex + 1;
      setCompletedSlides(prev => new Set(prev).add(nextIndex));
      setCurrentSlideIndex(nextIndex);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToSlide = (index: number) => {
    if (completedSlides.has(index)) {
      setCurrentSlideIndex(index);
    }
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const updateWorkflowState = (key: string, value: any) => {
    setWorkflowState(prev => ({ ...prev, [key]: value }));
  };

  const markSlideComplete = (index: number) => {
    setCompletedSlides(prev => new Set(prev).add(index));
  };

  return {
    // State
    currentSlideIndex,
    completedSlides,
    workflowState,
    chatMessages,

    // Setters
    setCurrentSlideIndex,
    setCompletedSlides,
    setWorkflowState,
    setChatMessages,

    // Navigation
    goToNextSlide,
    goToPreviousSlide,
    goToSlide,

    // Helpers
    addChatMessage,
    updateWorkflowState,
    markSlideComplete
  };
}
