/**
 * Workflow Persistence Service
 *
 * Two-tier persistence: localStorage for instant access, Supabase for sync.
 * Handles save, load, resume detection, and cross-device sync.
 */

import type {
  WorkflowState,
  WorkflowStateSnapshot,
  WorkflowPersistenceOptions,
} from '@/lib/types/workflow';

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const DEFAULT_OPTIONS: WorkflowPersistenceOptions = {
  localStorageKey: 'workflow-state',
  supabaseTable: 'workflow_executions',
  syncInterval: 30000, // 30 seconds
};

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class WorkflowPersistenceService {
  private options: WorkflowPersistenceOptions;
  private pendingSave: WorkflowState | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: Partial<WorkflowPersistenceOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // =============================================================================
  // LOCAL STORAGE OPERATIONS
  // =============================================================================

  private getLocalKey(workflowId: string, executionId?: string): string {
    return executionId
      ? `${this.options.localStorageKey}-${workflowId}-${executionId}`
      : `${this.options.localStorageKey}-${workflowId}`;
  }

  private saveToLocal(state: WorkflowState): void {
    try {
      const snapshot: WorkflowStateSnapshot = {
        state,
        savedAt: new Date().toISOString(),
        version: 1,
      };
      localStorage.setItem(
        this.getLocalKey(state.workflowId, state.executionId),
        JSON.stringify(snapshot)
      );

      // Also save as "latest" for this workflow
      localStorage.setItem(
        this.getLocalKey(state.workflowId),
        JSON.stringify(snapshot)
      );
    } catch (error) {
      console.error('[WorkflowPersistence] Error saving to localStorage:', error);
    }
  }

  private loadFromLocal(workflowId: string, executionId?: string): WorkflowState | null {
    try {
      const key = this.getLocalKey(workflowId, executionId);
      const saved = localStorage.getItem(key);
      if (!saved) return null;

      const snapshot: WorkflowStateSnapshot = JSON.parse(saved);
      return snapshot.state;
    } catch (error) {
      console.error('[WorkflowPersistence] Error loading from localStorage:', error);
      return null;
    }
  }

  private deleteFromLocal(workflowId: string, executionId: string): void {
    try {
      localStorage.removeItem(this.getLocalKey(workflowId, executionId));
    } catch (error) {
      console.error('[WorkflowPersistence] Error deleting from localStorage:', error);
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Save workflow state (debounced)
   */
  async save(state: WorkflowState): Promise<void> {
    this.pendingSave = state;

    // Debounce saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      if (!this.pendingSave) return;

      const stateToSave = this.pendingSave;
      this.pendingSave = null;

      // Save to localStorage immediately
      this.saveToLocal(stateToSave);

      // Queue for Supabase sync (if configured)
      // This would be implemented when Supabase integration is needed
      // await this.saveToSupabase(stateToSave);
    }, 500);
  }

  /**
   * Save immediately (for critical operations like workflow completion)
   */
  async saveImmediate(state: WorkflowState): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.pendingSave = null;

    this.saveToLocal(state);

    // Immediate Supabase save would go here
    // await this.saveToSupabase(state);
  }

  /**
   * Load workflow state
   */
  async load(workflowId: string, executionId?: string): Promise<WorkflowState | null> {
    // First try localStorage (instant)
    const localState = this.loadFromLocal(workflowId, executionId);

    // In the future, reconcile with Supabase
    // const remoteState = await this.loadFromSupabase(workflowId, executionId);
    // return this.reconcileState(localState, remoteState);

    return localState;
  }

  /**
   * Find a resumable execution for a workflow
   */
  async findResumable(workflowId: string): Promise<WorkflowState | null> {
    // Load the latest state for this workflow
    const state = await this.load(workflowId);

    // Only return if it's in progress
    if (state && state.status === 'in_progress') {
      return state;
    }

    return null;
  }

  /**
   * Delete a workflow execution
   */
  async delete(workflowId: string, executionId: string): Promise<void> {
    this.deleteFromLocal(workflowId, executionId);

    // Delete from Supabase would go here
    // await this.deleteFromSupabase(executionId);
  }

  /**
   * Mark workflow as completed
   */
  async markCompleted(state: WorkflowState): Promise<void> {
    const completedState: WorkflowState = {
      ...state,
      status: 'completed',
      lastUpdatedAt: new Date().toISOString(),
    };

    await this.saveImmediate(completedState);
  }

  /**
   * Mark workflow as abandoned
   */
  async markAbandoned(state: WorkflowState): Promise<void> {
    const abandonedState: WorkflowState = {
      ...state,
      status: 'abandoned',
      lastUpdatedAt: new Date().toISOString(),
    };

    await this.saveImmediate(abandonedState);
  }

  /**
   * Start periodic sync with server
   */
  startSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      await this.sync();
    }, this.options.syncInterval!);
  }

  /**
   * Stop periodic sync
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync local state with server
   */
  async sync(): Promise<void> {
    // This would sync pending changes to Supabase
    // and reconcile any conflicts
    console.log('[WorkflowPersistence] Sync triggered');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.stopSync();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let defaultInstance: WorkflowPersistenceService | null = null;

export function getWorkflowPersistenceService(
  options?: Partial<WorkflowPersistenceOptions>
): WorkflowPersistenceService {
  if (!defaultInstance) {
    defaultInstance = new WorkflowPersistenceService(options);
  }
  return defaultInstance;
}

export default WorkflowPersistenceService;
