/**
 * OpenTasksStep Component
 *
 * "Step 0" shown at workflow start when there are open tasks from previous workflows.
 * Provides cross-workflow task continuity by:
 * - Surfacing tasks requiring decision first
 * - Allowing task transfer to current workflow
 * - Enabling immediate action or skip
 * - Showing task origin context
 *
 * Only renders if there are tasks from other workflows.
 */

import React, { useState, useEffect } from 'react';
import type { WorkflowTask } from '../task-types-frontend';
import { sortTasksByPriority, calculateSnoozeEligibility } from '../task-types-frontend';
import { ForcedDecisionModal } from './ForcedDecisionModal';
import { useTaskSnooze } from '../hooks/useTaskSnooze';

interface OpenTasksStepProps {
  currentWorkflowExecutionId: string;
  customerId: string;
  onTaskCompleted?: () => void;
  onStepComplete?: () => void;
  onError?: (error: Error) => void;
}

interface TaskOriginInfo {
  workflowName: string;
  workflowId: string;
  startedAt: Date;
}

// Priority labels
const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'URGENT', color: 'bg-red-100 text-red-800' },
  2: { label: 'HIGH', color: 'bg-orange-100 text-orange-800' },
  3: { label: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800' },
  4: { label: 'LOW', color: 'bg-green-100 text-green-800' },
  5: { label: 'LOWEST', color: 'bg-gray-100 text-gray-600' }
};

export const OpenTasksStep: React.FC<OpenTasksStepProps> = ({
  currentWorkflowExecutionId,
  customerId,
  onTaskCompleted,
  onStepComplete,
  onError
}) => {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [originInfo, setOriginInfo] = useState<Record<string, TaskOriginInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [showForcedDecisionModal, setShowForcedDecisionModal] = useState(false);

  const taskSnooze = useTaskSnooze({
    onSuccess: () => {
      fetchTasks();
      onTaskCompleted?.();
    },
    onError: onError
  });

  /**
   * Fetch open tasks from other workflows
   */
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/workflows/tasks?customerId=${customerId}&excludeWorkflowExecutionId=${currentWorkflowExecutionId}&status=pending,snoozed`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch open tasks');
      }

      const data = await response.json();
      const fetchedTasks: WorkflowTask[] = data.tasks.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        snoozedUntil: t.snoozedUntil ? new Date(t.snoozedUntil) : undefined,
        firstSnoozedAt: t.firstSnoozedAt ? new Date(t.firstSnoozedAt) : undefined,
        snoozeDeadline: t.snoozeDeadline ? new Date(t.snoozeDeadline) : undefined
      }));

      // Sort: requiresDecision first, then priority
      const sortedTasks = sortTasksByPriority(fetchedTasks);
      setTasks(sortedTasks);

      // Fetch origin info for each task
      const origins: Record<string, TaskOriginInfo> = {};
      for (const task of sortedTasks) {
        if (task.originalWorkflowExecutionId) {
          try {
            const originResponse = await fetch(
              `/api/workflows/executions/${task.originalWorkflowExecutionId}`
            );
            if (originResponse.ok) {
              const originData = await originResponse.json();
              origins[task.id] = {
                workflowName: originData.workflowName,
                workflowId: originData.workflowId,
                startedAt: new Date(originData.startedAt)
              };
            }
          } catch (err) {
            console.error(`Failed to fetch origin for task ${task.id}`, err);
          }
        }
      }
      setOriginInfo(origins);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [customerId, currentWorkflowExecutionId]);

  /**
   * Check if any task requires forced decision
   */
  useEffect(() => {
    const taskRequiringDecision = tasks.find(t => t.requiresDecision);
    if (taskRequiringDecision) {
      setSelectedTask(taskRequiringDecision);
      setShowForcedDecisionModal(true);
    }
  }, [tasks]);

  /**
   * Transfer task to current workflow
   */
  const handleTransferTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/workflows/tasks/${taskId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetWorkflowExecutionId: currentWorkflowExecutionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to transfer task');
      }

      fetchTasks();
      onTaskCompleted?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      onError?.(error);
    }
  };

  /**
   * Handle forced decision modal actions
   */
  const handleForcedDecisionAction = async () => {
    if (!selectedTask) return;

    setShowForcedDecisionModal(false);
    await taskSnooze.completeTask(selectedTask.id);
    setSelectedTask(null);
  };

  const handleForcedDecisionSkip = async () => {
    if (!selectedTask) return;

    setShowForcedDecisionModal(false);
    await taskSnooze.skipTask(selectedTask.id, 'User chose to skip from forced decision modal');
    setSelectedTask(null);
  };

  const handleForcedDecisionDismiss = async () => {
    if (!selectedTask) return;

    setShowForcedDecisionModal(false);
    await taskSnooze.dismissWithoutChoice(selectedTask.id);
    setSelectedTask(null);
  };

  /**
   * Render individual task
   */
  const renderTask = (task: WorkflowTask) => {
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[3];
    const eligibility = calculateSnoozeEligibility(task);
    const origin = originInfo[task.id];

    return (
      <div
        key={task.id}
        className={`open-task-item ${task.requiresDecision ? 'open-task-urgent' : ''}`}
      >
        {/* Task Header */}
        <div className="task-header">
          <div className="task-title-row">
            {task.requiresDecision && (
              <span className="urgent-badge">🚨 REQUIRES DECISION</span>
            )}
            <h4 className="task-title">{task.description}</h4>
          </div>

          <div className="task-meta-row">
            <span className={`priority-badge ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
            <span className="task-meta-item">Owner: {task.owner}</span>
            <span className="task-meta-item">Action: {task.action}</span>
            {task.snoozeCount > 0 && (
              <span className="task-meta-item">Snoozed {task.snoozeCount}x</span>
            )}
          </div>

          {/* Origin Info */}
          {origin && (
            <div className="task-origin">
              <span className="origin-icon">📁</span>
              <span className="origin-text">
                From <strong>{origin.workflowName}</strong> workflow started{' '}
                {origin.startedAt.toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Snooze Warning */}
          {task.status === 'snoozed' && eligibility.daysRemaining !== undefined && (
            <div className="snooze-warning">
              ⏰ {eligibility.daysRemaining > 0
                ? `${eligibility.daysRemaining} days remaining before deadline`
                : 'Deadline reached'}
            </div>
          )}
        </div>

        {/* Task Actions */}
        <div className="task-actions">
          <button
            onClick={() => taskSnooze.completeTask(task.id)}
            className="task-action-btn task-action-complete"
            disabled={taskSnooze.isLoading}
          >
            ✅ Complete Now
          </button>

          <button
            onClick={() => handleTransferTask(task.id)}
            className="task-action-btn task-action-transfer"
            disabled={taskSnooze.isLoading}
          >
            🔄 Transfer to This Workflow
          </button>

          {!task.requiresDecision && (
            <button
              onClick={() => taskSnooze.snoozeTask(task.id, task)}
              className="task-action-btn task-action-snooze"
              disabled={taskSnooze.isLoading || !eligibility.canSnooze}
              title={!eligibility.canSnooze ? eligibility.reason : 'Snooze for 1 week'}
            >
              💤 Snooze
            </button>
          )}

          <button
            onClick={() => taskSnooze.skipTask(task.id)}
            className="task-action-btn task-action-skip"
            disabled={taskSnooze.isLoading}
          >
            ⏭️ Skip
          </button>
        </div>
      </div>
    );
  };

  // Don't render if no tasks
  if (!isLoading && tasks.length === 0) {
    return null;
  }

  return (
    <div className="open-tasks-step">
      {/* Step Header */}
      <div className="step-header">
        <div className="step-icon">📋</div>
        <div className="step-content">
          <h3 className="step-title">Open Tasks from Previous Workflows</h3>
          <p className="step-description">
            You have {tasks.length} open task{tasks.length !== 1 ? 's' : ''} from previous
            workflows. Please review and take action before continuing.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner">⏳</div>
          <p>Loading open tasks...</p>
        </div>
      )}

      {/* Tasks List */}
      {!isLoading && (
        <>
          <div className="tasks-container">
            {tasks.map(renderTask)}
          </div>

          {/* Continue Button */}
          <div className="step-footer">
            <button
              onClick={onStepComplete}
              className="continue-btn"
              disabled={tasks.some(t => t.requiresDecision)}
            >
              Continue to Workflow →
            </button>
            {tasks.some(t => t.requiresDecision) && (
              <p className="continue-warning">
                ⚠️ You must resolve all tasks requiring decision before continuing
              </p>
            )}
          </div>
        </>
      )}

      {/* Forced Decision Modal */}
      {selectedTask && (
        <ForcedDecisionModal
          task={selectedTask}
          open={showForcedDecisionModal}
          onAction={handleForcedDecisionAction}
          onSkip={handleForcedDecisionSkip}
          onDismiss={handleForcedDecisionDismiss}
        />
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .open-tasks-step {
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .step-header {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
        }

        .step-icon {
          font-size: 40px;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .step-description {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .loading-state {
          text-align: center;
          padding: 48px;
          color: #6b7280;
        }

        .spinner {
          font-size: 48px;
          margin-bottom: 16px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .tasks-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .open-task-item {
          padding: 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
          transition: all 0.2s;
        }

        .open-task-item:hover {
          border-color: #3b82f6;
          background: white;
        }

        .open-task-urgent {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .task-header {
          margin-bottom: 16px;
        }

        .task-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .task-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .urgent-badge {
          background: #dc2626;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .task-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .task-meta-item {
          font-size: 13px;
          color: #6b7280;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .task-origin {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #dbeafe;
          border-left: 3px solid #3b82f6;
          border-radius: 4px;
          margin-top: 12px;
        }

        .origin-icon {
          font-size: 16px;
        }

        .origin-text {
          font-size: 14px;
          color: #1e40af;
        }

        .snooze-warning {
          margin-top: 12px;
          padding: 8px 12px;
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          border-radius: 4px;
          font-size: 13px;
          color: #92400e;
          font-weight: 500;
        }

        .task-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .task-action-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .task-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .task-action-complete {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .task-action-complete:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
        }

        .task-action-transfer {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .task-action-transfer:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }

        .task-action-snooze {
          background: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .task-action-snooze:hover:not(:disabled) {
          background: #f9fafb;
          color: #111827;
        }

        .task-action-skip {
          background: white;
          color: #ef4444;
          border-color: #ef4444;
        }

        .task-action-skip:hover:not(:disabled) {
          background: #fef2f2;
        }

        .step-footer {
          padding-top: 24px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
        }

        .continue-btn {
          padding: 12px 32px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .continue-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .continue-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .continue-warning {
          margin-top: 12px;
          font-size: 14px;
          color: #dc2626;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default OpenTasksStep;
