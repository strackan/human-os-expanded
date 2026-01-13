/**
 * Task Panel Component
 *
 * Displays workflow tasks with:
 * - Active tasks (pending, in_progress, snoozed)
 * - Completed tasks
 * - Task actions (complete, snooze, skip)
 * - Task creation
 * - 7-day snooze enforcement UI
 *
 * Phase 2.3: Task Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  Calendar,
  User
} from 'lucide-react';
import { API_ROUTES, buildApiUrl } from '@/lib/constants/api-routes';

// =====================================================
// Types
// =====================================================

export interface WorkflowTask {
  id: string;
  workflow_execution_id?: string;
  customer_id: string;
  task_type: string;
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'snoozed' | 'completed' | 'skipped';
  created_at: string;
  snoozed_until?: string;
  first_snoozed_at?: string;
  max_snooze_date?: string;
  force_action: boolean;
  snooze_count: number;
  completed_at?: string;
  daysUntilDeadline?: number;
  isOverdue?: boolean;
  customer?: { id: string; name: string };
  assigned_user?: { id: string; full_name: string };
}

export interface TaskPanelProps {
  workflowExecutionId?: string;
  customerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreateTask?: () => void;
}

// =====================================================
// TaskCard Component
// =====================================================

interface TaskCardProps {
  task: WorkflowTask;
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, days: number) => void;
  onSkip: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onSnooze, onSkip }) => {
  const [showActions, setShowActions] = useState(false);
  const [snoozing, setSnoozing] = useState(false);

  // Priority colors
  const priorityConfig = {
    urgent: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Urgent' },
    high: { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'High' },
    medium: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Medium' },
    low: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Low' }
  };

  const config = priorityConfig[task.priority];

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (task.max_snooze_date) {
      const deadline = new Date(task.max_snooze_date);
      const now = new Date();
      const days = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days;
    }
    return null;
  };

  const daysRemaining = getDaysRemaining();
  const canSnooze = !task.force_action && task.status !== 'snoozed';

  return (
    <div className={`bg-white rounded-lg border-2 ${config.color} p-4 mb-3 transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
            {task.force_action && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">
                Action Required
              </span>
            )}
            {task.status === 'snoozed' && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Snoozed
              </span>
            )}
          </div>
          <h4 className="font-semibold text-gray-900">{task.action}</h4>
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        </div>

        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showActions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Metadata */}
      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
        </div>
        {task.customer && (
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>{task.customer.name}</span>
          </div>
        )}
        {task.snooze_count > 0 && (
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Snoozed {task.snooze_count}x</span>
          </div>
        )}
      </div>

      {/* Deadline Warning */}
      {daysRemaining !== null && daysRemaining <= 2 && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-800">
            {task.force_action
              ? `Deadline passed! Must complete or skip.`
              : `Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left to complete this task.`
            }
          </div>
        </div>
      )}

      {/* Actions (expanded) */}
      {showActions && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Complete */}
            <button
              onClick={() => onComplete(task.id)}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete</span>
            </button>

            {/* Snooze */}
            {canSnooze ? (
              snoozing ? (
                <div className="flex-1 flex items-center space-x-1">
                  <button
                    onClick={() => {
                      onSnooze(task.id, 1);
                      setSnoozing(false);
                    }}
                    className="flex-1 px-2 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs"
                  >
                    1d
                  </button>
                  <button
                    onClick={() => {
                      onSnooze(task.id, 3);
                      setSnoozing(false);
                    }}
                    className="flex-1 px-2 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs"
                  >
                    3d
                  </button>
                  <button
                    onClick={() => {
                      onSnooze(task.id, 7);
                      setSnoozing(false);
                    }}
                    className="flex-1 px-2 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs"
                  >
                    7d
                  </button>
                  <button
                    onClick={() => setSnoozing(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSnoozing(true)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <Clock className="w-4 h-4" />
                  <span>Snooze</span>
                </button>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                <Clock className="w-4 h-4 mr-1" />
                <span>Can't Snooze</span>
              </div>
            )}

            {/* Skip */}
            <button
              onClick={() => onSkip(task.id)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// TaskPanel Component
// =====================================================

export const TaskPanel: React.FC<TaskPanelProps> = ({
  workflowExecutionId,
  customerId,
  isOpen,
  onClose,
  onCreateTask
}) => {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch tasks
  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, workflowExecutionId, customerId]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (workflowExecutionId) params.append('workflowExecutionId', workflowExecutionId);
      if (customerId) params.append('customerId', customerId);
      params.append('status', 'active'); // pending, in_progress, snoozed

      const response = await fetch(buildApiUrl(API_ROUTES.WORKFLOWS.TASKS.LIST, Object.fromEntries(params)));

      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch tasks (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('[TaskPanel] Error fetching tasks:', err);

      // Show more helpful error message for common issues
      let errorMessage = 'Failed to load tasks';
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Please log in to view tasks';
        } else if (err.message.includes('404')) {
          errorMessage = 'Tasks API not available';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // For development: Set empty tasks array so UI doesn't break
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      const response = await fetch(API_ROUTES.WORKFLOWS.TASKS.BY_ID(taskId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      // Refresh tasks
      fetchTasks();
    } catch (err) {
      console.error('[TaskPanel] Error completing task:', err);
    }
  };

  const handleSnooze = async (taskId: string, days: number) => {
    try {
      const response = await fetch(API_ROUTES.WORKFLOWS.TASKS.BY_ID(taskId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'snooze', snoozeDays: days })
      });

      if (!response.ok) {
        throw new Error('Failed to snooze task');
      }

      // Refresh tasks
      fetchTasks();
    } catch (err) {
      console.error('[TaskPanel] Error snoozing task:', err);
    }
  };

  const handleSkip = async (taskId: string) => {
    try {
      const response = await fetch(API_ROUTES.WORKFLOWS.TASKS.BY_ID(taskId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip', skipReason: 'Skipped by user' })
      });

      if (!response.ok) {
        throw new Error('Failed to skip task');
      }

      // Refresh tasks
      fetchTasks();
    } catch (err) {
      console.error('[TaskPanel] Error skipping task:', err);
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'skipped');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'skipped');

  if (!isOpen) return null;

  return (
    <div id="workflow-task-panel" className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col z-50">
      {/* Header */}
      <div id="task-panel-header" className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 id="task-panel-title" className="font-semibold text-gray-900">Tasks</h3>
          {activeTasks.length > 0 && (
            <span id="task-panel-count" className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {activeTasks.length}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onCreateTask && (
            <button
              id="task-panel-create-button"
              onClick={onCreateTask}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Create new task"
              aria-label="Create new task"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            id="task-panel-close-button"
            onClick={onClose}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Close tasks panel"
            aria-label="Close tasks panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div id="task-panel-content" className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading tasks...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No active tasks</p>
            {onCreateTask && (
              <button
                onClick={onCreateTask}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Create a task
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Active Tasks */}
            <div className="space-y-3">
              {activeTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  onSkip={handleSkip}
                />
              ))}
            </div>

            {/* Completed Tasks (collapsible) */}
            {completedTasks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 mb-3"
                >
                  {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span>Completed ({completedTasks.length})</span>
                </button>

                {showCompleted && (
                  <div className="space-y-2">
                    {completedTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-700 text-sm line-through">{task.action}</h5>
                            <p className="text-xs text-gray-500 mt-1">
                              {task.status === 'completed' ? 'Completed' : 'Skipped'}{' '}
                              {new Date(task.completed_at || task.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskPanel;
