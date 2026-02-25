/**
 * TaskList Component
 *
 * Displays a list of tasks with:
 * - Grouping by workflow or priority
 * - Status indicators
 * - Quick actions (complete, snooze, skip)
 * - Highlighting for tasks requiring decision
 */

import React, { useState } from 'react';
import type { WorkflowTask, TaskGroup } from '../task-types-frontend';
import { groupTasksByWorkflow, groupTasksByPriority, sortTasksByPriority } from '../task-types-frontend';

interface TaskListProps {
  tasks: WorkflowTask[];
  groupBy?: 'workflow' | 'priority' | 'none';
  onTaskClick?: (task: WorkflowTask) => void;
  onComplete?: (taskId: string) => void;
  onSnooze?: (taskId: string) => void;
  onSkip?: (taskId: string) => void;
  showOrigin?: boolean; // Show which workflow task came from
}

// Status icons
const STATUS_ICONS: Record<string, string> = {
  'pending': '⭕',
  'in_progress': '🔄',
  'completed': '✅',
  'snoozed': '💤',
  'skipped': '⏭️',
  'cancelled': '❌'
};

// Priority labels and colors
const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'URGENT', color: 'text-red-600 bg-red-50' },
  2: { label: 'HIGH', color: 'text-orange-600 bg-orange-50' },
  3: { label: 'MEDIUM', color: 'text-yellow-600 bg-yellow-50' },
  4: { label: 'LOW', color: 'text-green-600 bg-green-50' },
  5: { label: 'LOWEST', color: 'text-gray-600 bg-gray-50' }
};

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  groupBy = 'none',
  onTaskClick,
  onComplete,
  onSnooze,
  onSkip,
  showOrigin = false
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group tasks if needed
  let groupedTasks: TaskGroup[] = [];
  if (groupBy === 'workflow') {
    groupedTasks = groupTasksByWorkflow(tasks);
  } else if (groupBy === 'priority') {
    groupedTasks = groupTasksByPriority(tasks);
  } else {
    // No grouping - create single group
    groupedTasks = [{
      groupKey: 'all',
      groupLabel: 'All Tasks',
      tasks: sortTasksByPriority(tasks)
    }];
  }

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const renderTask = (task: WorkflowTask) => {
    const statusIcon = STATUS_ICONS[task.status] || '❓';
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[3];
    const requiresDecision = task.requiresDecision;

    return (
      <div
        key={task.id}
        className={`task-item ${requiresDecision ? 'task-item-urgent' : ''}`}
        onClick={() => onTaskClick?.(task)}
      >
        {/* Task Header */}
        <div className="task-header">
          <div className="task-status-icon" aria-label={task.status}>
            {statusIcon}
          </div>
          <div className="task-content">
            <div className="task-title">
              {requiresDecision && <span className="urgent-badge">🚨 REQUIRES DECISION</span>}
              {task.description}
            </div>
            <div className="task-meta">
              <span className={`priority-badge ${priorityConfig.color}`}>
                {priorityConfig.label}
              </span>
              <span className="task-meta-item">Owner: {task.owner}</span>
              <span className="task-meta-item">Action: {task.action}</span>
              {showOrigin && task.originalWorkflowExecutionId && (
                <span className="task-meta-item origin-badge">
                  From previous workflow
                </span>
              )}
            </div>

            {/* Snooze Info */}
            {task.status === 'snoozed' && task.snoozedUntil && (
              <div className="snooze-info">
                💤 Snoozed until {new Date(task.snoozedUntil).toLocaleDateString()}
                {task.snoozeCount > 0 && ` (${task.snoozeCount}x)`}
              </div>
            )}

            {/* Requires Decision Warning */}
            {requiresDecision && (
              <div className="decision-warning">
                ⚠️ This task has been snoozed for 7 days. You must take action or skip it.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {(onComplete || onSnooze || onSkip) && (
          <div className="task-actions" onClick={(e) => e.stopPropagation()}>
            {onComplete && task.status === 'pending' && (
              <button
                onClick={() => onComplete(task.id)}
                className="task-action-btn task-action-complete"
                aria-label="Complete task"
              >
                ✅ Complete
              </button>
            )}
            {onSnooze && task.status === 'pending' && !requiresDecision && (
              <button
                onClick={() => onSnooze(task.id)}
                className="task-action-btn task-action-snooze"
                aria-label="Snooze task"
              >
                💤 Snooze
              </button>
            )}
            {onSkip && (task.status === 'pending' || requiresDecision) && (
              <button
                onClick={() => onSkip(task.id)}
                className="task-action-btn task-action-skip"
                aria-label="Skip task"
              >
                ⏭️ Skip
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (group: TaskGroup) => {
    const isExpanded = groupBy === 'none' || expandedGroups.has(group.groupKey);
    const taskCount = group.tasks.length;
    const urgentCount = group.tasks.filter(t => t.requiresDecision).length;

    return (
      <div key={group.groupKey} className="task-group">
        {groupBy !== 'none' && (
          <div className="task-group-header" onClick={() => toggleGroup(group.groupKey)}>
            <div className="task-group-title">
              <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
              {group.groupLabel}
              <span className="task-count">
                {taskCount} task{taskCount !== 1 ? 's' : ''}
              </span>
              {urgentCount > 0 && (
                <span className="urgent-count">
                  🚨 {urgentCount} requiring decision
                </span>
              )}
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="task-group-content">
            {group.tasks.length === 0 ? (
              <div className="empty-state">No tasks in this group</div>
            ) : (
              group.tasks.map(renderTask)
            )}
          </div>
        )}
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <div className="empty-icon">✅</div>
        <div className="empty-title">No tasks</div>
        <div className="empty-description">You're all caught up!</div>
      </div>
    );
  }

  return (
    <div className="task-list">
      {groupedTasks.map(renderGroup)}

      {/* CSS Styles */}
      <style jsx>{`
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .task-group {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .task-group-header {
          padding: 12px 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
          user-select: none;
        }

        .task-group-header:hover {
          background: #f3f4f6;
        }

        .task-group-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          color: #111827;
        }

        .expand-icon {
          font-size: 12px;
          color: #6b7280;
        }

        .task-count {
          font-size: 14px;
          color: #6b7280;
          font-weight: 400;
        }

        .urgent-count {
          font-size: 14px;
          color: #dc2626;
          font-weight: 500;
        }

        .task-group-content {
          padding: 8px;
        }

        .task-item {
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .task-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .task-item:last-child {
          margin-bottom: 0;
        }

        .task-item-urgent {
          border-color: #dc2626;
          border-width: 2px;
          background: #fef2f2;
        }

        .task-header {
          display: flex;
          gap: 12px;
        }

        .task-status-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .task-content {
          flex: 1;
        }

        .task-title {
          font-weight: 500;
          color: #111827;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .urgent-badge {
          background: #dc2626;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .task-meta-item {
          font-size: 13px;
          color: #6b7280;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .origin-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .snooze-info {
          margin-top: 8px;
          padding: 8px;
          background: #fef3c7;
          border-radius: 4px;
          font-size: 13px;
          color: #92400e;
        }

        .decision-warning {
          margin-top: 8px;
          padding: 8px;
          background: #fee2e2;
          border-radius: 4px;
          font-size: 13px;
          color: #991b1b;
          font-weight: 500;
        }

        .task-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .task-action-btn {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .task-action-complete {
          background: #10b981;
          color: white;
        }

        .task-action-complete:hover {
          background: #059669;
        }

        .task-action-snooze {
          background: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .task-action-snooze:hover {
          background: #f9fafb;
        }

        .task-action-skip {
          background: white;
          color: #ef4444;
          border-color: #ef4444;
        }

        .task-action-skip:hover {
          background: #fef2f2;
        }

        .task-list-empty {
          text-align: center;
          padding: 48px 24px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default TaskList;
