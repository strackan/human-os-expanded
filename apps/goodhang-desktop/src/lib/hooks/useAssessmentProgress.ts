/**
 * useAssessmentProgress Hook
 *
 * Manages assessment progress with localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AssessmentProgress } from '@/lib/types';

export interface UseAssessmentProgressOptions {
  /** Storage key for localStorage */
  storageKey: string;
  /** Total number of questions */
  totalQuestions: number;
}

export interface UseAssessmentProgressReturn {
  answers: Record<string, string>;
  currentIndex: number;
  isLoaded: boolean;
  progress: number;
  setAnswer: (questionId: string, answer: string) => void;
  setCurrentIndex: (index: number) => void;
  saveProgress: () => void;
  clearProgress: () => void;
  restoreProgress: () => boolean;
}

export function useAssessmentProgress(
  options: UseAssessmentProgressOptions
): UseAssessmentProgressReturn {
  const { storageKey, totalQuestions } = options;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Calculate progress percentage
  const progress = totalQuestions > 0
    ? (Object.keys(answers).length / totalQuestions) * 100
    : 0;

  // Restore progress from localStorage on mount
  const restoreProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: AssessmentProgress = JSON.parse(saved);
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          setAnswers(parsed.answers);
          setCurrentIndex(parsed.currentIndex || 0);
          console.log(`[${storageKey}] Restored progress:`, Object.keys(parsed.answers).length, 'answers');
          return true;
        }
      }
    } catch (err) {
      console.warn(`[${storageKey}] Failed to load saved progress:`, err);
    }
    return false;
  }, [storageKey]);

  // Load progress on mount
  useEffect(() => {
    restoreProgress();
    setIsLoaded(true);
  }, [restoreProgress]);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    if (!isLoaded) return;
    try {
      const progress: AssessmentProgress = {
        answers,
        currentIndex,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (err) {
      console.warn(`[${storageKey}] Failed to save progress:`, err);
    }
  }, [answers, currentIndex, isLoaded, storageKey]);

  // Auto-save on changes
  useEffect(() => {
    if (isLoaded) {
      saveProgress();
    }
  }, [answers, currentIndex, isLoaded, saveProgress]);

  // Set a single answer
  const setAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }, []);

  // Clear all progress
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setAnswers({});
      setCurrentIndex(0);
      console.log(`[${storageKey}] Progress cleared`);
    } catch (err) {
      console.warn(`[${storageKey}] Failed to clear progress:`, err);
    }
  }, [storageKey]);

  return {
    answers,
    currentIndex,
    isLoaded,
    progress,
    setAnswer,
    setCurrentIndex,
    saveProgress,
    clearProgress,
    restoreProgress,
  };
}
