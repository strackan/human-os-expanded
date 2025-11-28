/**
 * WorkflowPersistenceService
 *
 * Handles saving and loading workflow state for resume functionality.
 * Uses a two-tier architecture:
 * 1. IndexedDB for fast local access
 * 2. Supabase for multi-device sync and persistence
 *
 * Features:
 * - Debounced auto-save (500ms)
 * - Optimistic local writes
 * - Background sync to Supabase
 * - Version-based conflict resolution
 */

import { createClient } from '@/lib/supabase/client';
import type {
  WorkflowStateSnapshot,
  WorkflowStateSnapshotRow,
  WorkflowStateAuditEntry,
  WorkflowAuditAction,
  LocalStateSnapshot,
  SyncStatus,
} from './types';

const CURRENT_VERSION = 1;
const SAVE_DEBOUNCE_MS = 500;

export class WorkflowPersistenceService {
  private saveTimeoutId: NodeJS.Timeout | null = null;
  private pendingSave: WorkflowStateSnapshot | null = null;
  private executionId: string | null = null;
  private userId: string | null = null;
  private isSaving = false;
  private lastSavedVersion = 0;

  constructor() {
    // Bind methods for use as callbacks
    this.save = this.save.bind(this);
    this.load = this.load.bind(this);
  }

  /**
   * Initialize service with execution and user context
   */
  initialize(executionId: string, userId: string): void {
    this.executionId = executionId;
    this.userId = userId;
  }

  /**
   * Debounced save - call frequently, actual save is throttled
   */
  async save(state: WorkflowStateSnapshot): Promise<void> {
    if (!this.executionId || !this.userId) {
      console.warn('[Persistence] Cannot save - not initialized');
      return;
    }

    // Store latest state for debounced save
    this.pendingSave = {
      ...state,
      version: CURRENT_VERSION,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Clear existing timeout
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
    }

    // Schedule debounced save
    this.saveTimeoutId = setTimeout(async () => {
      await this.executeSave();
    }, SAVE_DEBOUNCE_MS);
  }

  /**
   * Force immediate save (e.g., on modal close)
   */
  async saveImmediate(state: WorkflowStateSnapshot): Promise<void> {
    if (!this.executionId || !this.userId) {
      console.warn('[Persistence] Cannot save - not initialized');
      return;
    }

    // Clear any pending debounced save
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }

    this.pendingSave = {
      ...state,
      version: CURRENT_VERSION,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.executeSave();
  }

  /**
   * Execute the actual save operation
   */
  private async executeSave(): Promise<void> {
    if (!this.pendingSave || !this.executionId || !this.userId || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const stateToSave = this.pendingSave;
    this.pendingSave = null;

    try {
      console.log('[Persistence] Saving state for execution:', this.executionId);

      // 1. Save to IndexedDB first (fast, offline-capable)
      await this.saveToIndexedDB(this.executionId, stateToSave);

      // 2. Sync to Supabase (background)
      await this.saveToSupabase(this.executionId, this.userId, stateToSave);

      this.lastSavedVersion++;
      console.log('[Persistence] State saved successfully, version:', this.lastSavedVersion);
    } catch (error) {
      console.error('[Persistence] Save failed:', error);
      // Re-queue for retry
      this.pendingSave = stateToSave;
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Load workflow state - tries IndexedDB first, then Supabase
   */
  async load(executionId: string): Promise<WorkflowStateSnapshot | null> {
    console.log('[Persistence] Loading state for execution:', executionId);

    try {
      // 1. Try IndexedDB first (instant)
      const localState = await this.loadFromIndexedDB(executionId);

      // 2. Fetch from Supabase (may be newer if user switched devices)
      const serverState = await this.loadFromSupabase(executionId);

      // 3. Reconcile and return newest
      const result = this.reconcile(localState, serverState);

      if (result) {
        console.log('[Persistence] State loaded, slide:', result.currentSlideIndex);
      } else {
        console.log('[Persistence] No saved state found');
      }

      return result;
    } catch (error) {
      console.error('[Persistence] Load failed:', error);
      return null;
    }
  }

  /**
   * Record audit log entry
   */
  async recordAudit(
    action: WorkflowAuditAction,
    slideIndex?: number,
    previousState?: Partial<WorkflowStateSnapshot>,
    newState?: Partial<WorkflowStateSnapshot>,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.executionId || !this.userId) return;

    try {
      const supabase = createClient();
      await supabase.from('workflow_state_audit').insert({
        execution_id: this.executionId,
        user_id: this.userId,
        action_type: action,
        slide_index: slideIndex,
        previous_state: previousState,
        new_state: newState,
        metadata,
      });
    } catch (error) {
      // Audit logging should not block main flow
      console.warn('[Persistence] Audit log failed:', error);
    }
  }

  /**
   * Check if there's an existing in-progress execution for resume
   */
  static async checkForResumable(
    workflowId: string,
    customerId: string,
    userId: string
  ): Promise<{ executionId: string; snapshot: WorkflowStateSnapshot } | null> {
    try {
      const supabase = createClient();

      // Find in-progress execution
      const { data: execution, error: execError } = await supabase
        .from('workflow_executions')
        .select('id, status, current_step_index')
        .eq('workflow_config_id', workflowId)
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (execError || !execution) return null;

      // Check for saved state
      const { data: snapshot, error: snapError } = await supabase
        .from('workflow_state_snapshots')
        .select('*')
        .eq('execution_id', execution.id)
        .eq('is_latest', true)
        .maybeSingle();

      if (snapError || !snapshot) return null;

      return {
        executionId: execution.id,
        snapshot: rowToSnapshot(snapshot),
      };
    } catch (error) {
      console.error('[Persistence] Resume check failed:', error);
      return null;
    }
  }

  // ============================================
  // INDEXEDDB OPERATIONS
  // ============================================

  private async saveToIndexedDB(executionId: string, state: WorkflowStateSnapshot): Promise<void> {
    // For now, use localStorage as a simple fallback
    // TODO: Implement proper IndexedDB with Dexie in Phase 2
    try {
      const key = `workflow_state_${executionId}`;
      const localState: LocalStateSnapshot = {
        ...state,
        executionId,
        syncStatus: 'pending',
        localVersion: this.lastSavedVersion + 1,
      };
      localStorage.setItem(key, JSON.stringify(localState));
    } catch (error) {
      console.warn('[Persistence] localStorage save failed:', error);
    }
  }

  private async loadFromIndexedDB(executionId: string): Promise<LocalStateSnapshot | null> {
    try {
      const key = `workflow_state_${executionId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      return JSON.parse(stored) as LocalStateSnapshot;
    } catch (error) {
      console.warn('[Persistence] localStorage load failed:', error);
      return null;
    }
  }

  // ============================================
  // SUPABASE OPERATIONS
  // ============================================

  private async saveToSupabase(
    executionId: string,
    userId: string,
    state: WorkflowStateSnapshot
  ): Promise<void> {
    const supabase = createClient();

    // Mark any existing snapshots as not latest
    await supabase
      .from('workflow_state_snapshots')
      .update({ is_latest: false })
      .eq('execution_id', executionId)
      .eq('is_latest', true);

    // Insert new snapshot
    const { error } = await supabase.from('workflow_state_snapshots').insert({
      execution_id: executionId,
      user_id: userId,
      current_slide_index: state.currentSlideIndex,
      completed_slides: state.completedSlides,
      skipped_slides: state.skippedSlides,
      slide_states: state.slideStates,
      workflow_data: state.workflowData,
      chat_messages: state.chatMessages,
      current_branch: state.currentBranch,
      is_latest: true,
      version: state.version,
    });

    if (error) {
      throw new Error(`Supabase save failed: ${error.message}`);
    }

    // Update local sync status
    await this.updateLocalSyncStatus(executionId, 'synced');
  }

  private async loadFromSupabase(executionId: string): Promise<WorkflowStateSnapshot | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('workflow_state_snapshots')
      .select('*')
      .eq('execution_id', executionId)
      .eq('is_latest', true)
      .maybeSingle();

    if (error || !data) return null;

    return rowToSnapshot(data as WorkflowStateSnapshotRow);
  }

  private async updateLocalSyncStatus(executionId: string, status: SyncStatus): Promise<void> {
    try {
      const key = `workflow_state_${executionId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const localState = JSON.parse(stored) as LocalStateSnapshot;
        localState.syncStatus = status;
        localState.lastSyncAt = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(localState));
      }
    } catch (error) {
      // Non-critical
    }
  }

  // ============================================
  // RECONCILIATION
  // ============================================

  private reconcile(
    local: LocalStateSnapshot | null,
    server: WorkflowStateSnapshot | null
  ): WorkflowStateSnapshot | null {
    // No data at all
    if (!local && !server) return null;

    // Only server has data
    if (!local && server) {
      // Cache locally for next time
      if (this.executionId) {
        this.saveToIndexedDB(this.executionId, server);
      }
      return server;
    }

    // Only local has data (offline scenario)
    if (local && !server) {
      return local;
    }

    // Both have data - use server as source of truth (simpler for now)
    // In Phase 2, we can implement proper version-based merge
    if (local && server) {
      // Server wins, update local cache
      if (this.executionId) {
        this.saveToIndexedDB(this.executionId, server);
      }
      return server;
    }

    return null;
  }

  /**
   * Cleanup on unmount
   */
  dispose(): void {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
    }
    // Force save any pending state
    if (this.pendingSave && this.executionId && this.userId) {
      this.executeSave();
    }
  }
}

/**
 * Convert database row to WorkflowStateSnapshot
 */
function rowToSnapshot(row: WorkflowStateSnapshotRow): WorkflowStateSnapshot {
  return {
    version: row.version,
    currentSlideIndex: row.current_slide_index,
    completedSlides: row.completed_slides || [],
    skippedSlides: row.skipped_slides || [],
    workflowData: row.workflow_data || {},
    slideStates: row.slide_states || {},
    chatMessages: row.chat_messages || [],
    currentBranch: row.current_branch,
    savedAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Export singleton for convenience
export const workflowPersistence = new WorkflowPersistenceService();
