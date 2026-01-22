/**
 * useWorkflowPersistence Hook
 *
 * React hook wrapper around WorkflowPersistenceService.
 * Handles auto-save, resume detection, and cleanup.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  WorkflowPersistenceService,
  getWorkflowPersistenceService,
} from '@/lib/persistence';
import type { WorkflowState, WorkflowPersistenceOptions } from '@/lib/types/workflow';

// =============================================================================
// TYPES
// =============================================================================

export interface UseWorkflowPersistenceOptions {
  workflowId: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  syncEnabled?: boolean;
  persistenceOptions?: Partial<WorkflowPersistenceOptions>;
}

export interface UseWorkflowPersistenceReturn {
  save: (state: WorkflowState) => Promise<void>;
  saveImmediate: (state: WorkflowState) => Promise<void>;
  load: (executionId?: string) => Promise<WorkflowState | null>;
  findResumable: () => Promise<WorkflowState | null>;
  markCompleted: (state: WorkflowState) => Promise<void>;
  markAbandoned: (state: WorkflowState) => Promise<void>;
  isRestoring: boolean;
  lastSaved: Date | null;
  error: Error | null;
}

// =============================================================================
// HOOK
// =============================================================================

export function useWorkflowPersistence(
  options: UseWorkflowPersistenceOptions
): UseWorkflowPersistenceReturn {
  const {
    workflowId,
    autoSave: _autoSave = true,
    autoSaveDelay: _autoSaveDelay = 500,
    syncEnabled = false,
    persistenceOptions,
  } = options;

  const serviceRef = useRef<WorkflowPersistenceService | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize service
  useEffect(() => {
    serviceRef.current = getWorkflowPersistenceService(persistenceOptions);

    if (syncEnabled) {
      serviceRef.current.startSync();
    }

    return () => {
      if (syncEnabled) {
        serviceRef.current?.stopSync();
      }
    };
  }, [persistenceOptions, syncEnabled]);

  // Save function
  const save = useCallback(
    async (state: WorkflowState) => {
      if (!serviceRef.current) return;

      try {
        await serviceRef.current.save(state);
        setLastSaved(new Date());
        setError(null);
      } catch (err) {
        console.error('[useWorkflowPersistence] Save error:', err);
        setError(err instanceof Error ? err : new Error('Save failed'));
      }
    },
    []
  );

  // Save immediate function
  const saveImmediate = useCallback(
    async (state: WorkflowState) => {
      if (!serviceRef.current) return;

      try {
        await serviceRef.current.saveImmediate(state);
        setLastSaved(new Date());
        setError(null);
      } catch (err) {
        console.error('[useWorkflowPersistence] Save immediate error:', err);
        setError(err instanceof Error ? err : new Error('Save failed'));
      }
    },
    []
  );

  // Load function
  const load = useCallback(
    async (executionId?: string): Promise<WorkflowState | null> => {
      if (!serviceRef.current) return null;

      setIsRestoring(true);
      try {
        const state = await serviceRef.current.load(workflowId, executionId);
        setError(null);
        return state;
      } catch (err) {
        console.error('[useWorkflowPersistence] Load error:', err);
        setError(err instanceof Error ? err : new Error('Load failed'));
        return null;
      } finally {
        setIsRestoring(false);
      }
    },
    [workflowId]
  );

  // Find resumable function
  const findResumable = useCallback(async (): Promise<WorkflowState | null> => {
    if (!serviceRef.current) return null;

    setIsRestoring(true);
    try {
      const state = await serviceRef.current.findResumable(workflowId);
      setError(null);
      return state;
    } catch (err) {
      console.error('[useWorkflowPersistence] Find resumable error:', err);
      setError(err instanceof Error ? err : new Error('Find resumable failed'));
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, [workflowId]);

  // Mark completed function
  const markCompleted = useCallback(
    async (state: WorkflowState) => {
      if (!serviceRef.current) return;

      try {
        await serviceRef.current.markCompleted(state);
        setLastSaved(new Date());
        setError(null);
      } catch (err) {
        console.error('[useWorkflowPersistence] Mark completed error:', err);
        setError(err instanceof Error ? err : new Error('Mark completed failed'));
      }
    },
    []
  );

  // Mark abandoned function
  const markAbandoned = useCallback(
    async (state: WorkflowState) => {
      if (!serviceRef.current) return;

      try {
        await serviceRef.current.markAbandoned(state);
        setLastSaved(new Date());
        setError(null);
      } catch (err) {
        console.error('[useWorkflowPersistence] Mark abandoned error:', err);
        setError(err instanceof Error ? err : new Error('Mark abandoned failed'));
      }
    },
    []
  );

  return {
    save,
    saveImmediate,
    load,
    findResumable,
    markCompleted,
    markAbandoned,
    isRestoring,
    lastSaved,
    error,
  };
}

export default useWorkflowPersistence;
