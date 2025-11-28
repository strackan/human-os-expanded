/**
 * useWorkflowPersistence Hook
 *
 * React hook that provides workflow state persistence functionality.
 * Wraps the WorkflowPersistenceService for use in React components.
 *
 * Features:
 * - Automatic state restoration on mount
 * - Debounced auto-save (500ms)
 * - Force save on unmount/modal close
 * - Sync status tracking
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  WorkflowPersistenceService,
  workflowPersistence,
} from '@/lib/persistence/WorkflowPersistenceService';
import type {
  WorkflowStateSnapshot,
  SerializableChatMessage,
} from '@/lib/persistence/types';
import { toSerializableMessage } from '@/lib/persistence/types';
import type { ChatMessage } from '@/components/workflows/sections/ChatRenderer';

interface UseWorkflowPersistenceProps {
  executionId: string | undefined;
  userId: string | undefined;
  enabled?: boolean; // Allow disabling persistence (e.g., for demo mode)
}

interface UseWorkflowPersistenceReturn {
  /**
   * Load saved state for current execution
   * Returns null if no saved state exists
   */
  loadState: () => Promise<WorkflowStateSnapshot | null>;

  /**
   * Save current state (debounced 500ms)
   */
  saveState: (state: PersistableState) => void;

  /**
   * Force immediate save (use on modal close)
   */
  saveStateImmediate: (state: PersistableState) => Promise<void>;

  /**
   * Whether persistence is ready (initialized with executionId/userId)
   */
  isReady: boolean;

  /**
   * Whether currently loading/saving
   */
  isBusy: boolean;

  /**
   * Last saved timestamp
   */
  lastSavedAt: string | null;
}

/**
 * State that can be persisted
 * Maps to React state in useTaskModeState
 */
export interface PersistableState {
  currentSlideIndex: number;
  completedSlides: Set<number> | number[];
  skippedSlides: Set<number> | number[];
  workflowState: Record<string, any>;
  chatMessages: ChatMessage[];
  currentBranch: string | null;
}

/**
 * Convert React state to persistable snapshot
 */
function toPersistableSnapshot(
  state: PersistableState
): Omit<WorkflowStateSnapshot, 'version' | 'savedAt' | 'updatedAt'> {
  // Convert Sets to arrays
  const completedSlides = state.completedSlides instanceof Set
    ? Array.from(state.completedSlides)
    : state.completedSlides;

  const skippedSlides = state.skippedSlides instanceof Set
    ? Array.from(state.skippedSlides)
    : state.skippedSlides;

  // Convert chat messages to serializable format
  const serializableMessages: SerializableChatMessage[] = state.chatMessages.map(
    toSerializableMessage
  );

  return {
    currentSlideIndex: state.currentSlideIndex,
    completedSlides,
    skippedSlides,
    workflowData: state.workflowState,
    slideStates: {}, // TODO: Add per-slide form state tracking
    chatMessages: serializableMessages,
    currentBranch: state.currentBranch,
  };
}

/**
 * Hook for workflow state persistence
 */
export function useWorkflowPersistence({
  executionId,
  userId,
  enabled = true,
}: UseWorkflowPersistenceProps): UseWorkflowPersistenceReturn {
  const serviceRef = useRef<WorkflowPersistenceService>(workflowPersistence);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Initialize service when executionId and userId are available
  useEffect(() => {
    console.log('[useWorkflowPersistence] Init check - enabled:', enabled, 'executionId:', executionId, 'userId:', userId);

    if (!enabled || !executionId || !userId) {
      console.log('[useWorkflowPersistence] Not ready - missing required values');
      setIsReady(false);
      return;
    }

    console.log('[useWorkflowPersistence] Initializing with execution:', executionId);
    serviceRef.current.initialize(executionId, userId);
    setIsReady(true);
    console.log('[useWorkflowPersistence] Service ready');

    // Cleanup on unmount
    return () => {
      console.log('[useWorkflowPersistence] Disposing service');
      serviceRef.current.dispose();
    };
  }, [executionId, userId, enabled]);

  /**
   * Load saved state
   */
  const loadState = useCallback(async (): Promise<WorkflowStateSnapshot | null> => {
    if (!isReady || !executionId) {
      console.log('[useWorkflowPersistence] Cannot load - not ready');
      return null;
    }

    setIsBusy(true);
    try {
      const state = await serviceRef.current.load(executionId);
      console.log('[useWorkflowPersistence] Loaded state:', state ? 'found' : 'not found');
      return state;
    } finally {
      setIsBusy(false);
    }
  }, [isReady, executionId]);

  /**
   * Save state (debounced)
   */
  const saveState = useCallback(
    (state: PersistableState) => {
      if (!isReady) {
        console.log('[useWorkflowPersistence] saveState called but not ready');
        return;
      }

      console.log('[useWorkflowPersistence] saveState called - slide:', state.currentSlideIndex, 'messages:', state.chatMessages.length);
      const snapshot = toPersistableSnapshot(state);
      serviceRef.current.save(snapshot as WorkflowStateSnapshot);
    },
    [isReady]
  );

  /**
   * Force immediate save
   */
  const saveStateImmediate = useCallback(
    async (state: PersistableState): Promise<void> => {
      if (!isReady) {
        console.log('[useWorkflowPersistence] Cannot save - not ready');
        return;
      }

      setIsBusy(true);
      try {
        const snapshot = toPersistableSnapshot(state);
        await serviceRef.current.saveImmediate(snapshot as WorkflowStateSnapshot);
        setLastSavedAt(new Date().toISOString());
        console.log('[useWorkflowPersistence] State saved immediately');
      } finally {
        setIsBusy(false);
      }
    },
    [isReady]
  );

  return {
    loadState,
    saveState,
    saveStateImmediate,
    isReady,
    isBusy,
    lastSavedAt,
  };
}

export default useWorkflowPersistence;
