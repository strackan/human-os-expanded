'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Task {
  id: number;
  task: string;
  description?: string;
  duedate?: string;
  taskStatus: {
    id: number;
    name: string;
  };
  taskPriority?: {
    id: number;
    name: string;
  };
  project?: {
    id: number;
    name: string;
  };
  createdDate: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  projectStatus: {
    id: number;
    name: string;
  };
  _count: {
    tasks: number;
  };
}

interface TaskStatus {
  id: number;
  name: string;
  description?: string;
}

interface TaskPriority {
  id: number;
  name: string;
  description?: string;
}

interface TaskPanelProps {
  selectedText?: string;
  onTaskCreated?: (task: Task) => void;
}

export default function TaskPanel({ selectedText, onTaskCreated }: TaskPanelProps) {
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [taskPriorities, setTaskPriorities] = useState<TaskPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    task: selectedText || '',
    description: '',
    duedate: '',
    projectId: '',
    priorityId: '',
  });

  useEffect(() => {
    if (selectedText) {
      setNewTask(prev => ({ ...prev, task: selectedText }));
      setShowCreateForm(true);
    }
  }, [selectedText]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes, statusesRes, prioritiesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/task-statuses'),
        fetch('/api/task-priorities'),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }

      if (statusesRes.ok) {
        const statusesData = await statusesRes.json();
        setTaskStatuses(statusesData);
      }

      if (prioritiesRes.ok) {
        const prioritiesData = await prioritiesRes.json();
        setTaskPriorities(prioritiesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: newTask.task,
          description: newTask.description || null,
          duedate: newTask.duedate || null,
          projectId: newTask.projectId || null,
          taskPriorityId: newTask.priorityId || null,
        }),
      });

      if (response.ok) {
        const createdTask = await response.json();
        setTasks(prev => [createdTask, ...prev]);
        setNewTask({
          task: '',
          description: '',
          duedate: '',
          projectId: '',
          priorityId: '',
        });
        setShowCreateForm(false);
        onTaskCreated?.(createdTask);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId: number, statusId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskStatusId: statusId,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'to do':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priorityName: string) => {
    switch (priorityName.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <aside
      className={`fixed right-0 top-0 h-screen z-40 transition-all duration-300 bg-gray-50/95 backdrop-blur-sm flex flex-col border-l border-gray-200/50
        ${isCollapsed ? 'w-20' : 'w-80'}
      `}
      aria-label="Task Panel"
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -left-3 top-8 w-6 h-6 rounded-full bg-white shadow-lg border border-gray-200/50 flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:shadow-xl z-[100]`}
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        <svg 
          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={2} 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Panel Header */}
      <div className="flex flex-col items-center justify-center px-4 border-b border-gray-200/50 transition-all duration-300 mt-[100px] py-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-2xl font-bold mb-2 text-white shadow-lg">
          ✅
        </div>
        <span className={`font-semibold text-gray-900 text-base text-center w-full truncate transition-all duration-200 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto mb-3'}`}>
          Tasks
        </span>
        {/* New Task Button - prominently displayed */}
        <button
          onClick={() => setShowCreateForm(true)}
          className={`w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm ${isCollapsed ? 'opacity-0 h-0 overflow-hidden pointer-events-none' : 'opacity-100 h-auto'}`}
        >
          New Task
        </button>
      </div>

      {/* Panel Content */}
      <div className={`flex-1 p-4 overflow-y-auto transition-all duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Add Task */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Quick Add Task</h3>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  {showCreateForm ? 'Cancel' : 'Add Task'}
                </button>
              </div>
              
              {showCreateForm && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Task title..."
                    value={newTask.task}
                    onChange={(e) => setNewTask(prev => ({ ...prev, task: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                  />
                                     <div className="grid grid-cols-2 gap-2">
                     <input
                       type="date"
                       value={newTask.duedate}
                       onChange={(e) => setNewTask(prev => ({ ...prev, duedate: e.target.value }))}
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                       aria-label="Due date"
                       title="Due date"
                     />
                     <select
                       value={newTask.priorityId}
                       onChange={(e) => setNewTask(prev => ({ ...prev, priorityId: e.target.value }))}
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                       aria-label="Priority"
                       title="Priority"
                     >
                      <option value="">Priority</option>
                      {taskPriorities.map(priority => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={createTask}
                    disabled={!newTask.task.trim()}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Create Task
                  </button>
                </div>
              )}
            </div>

            {/* Tasks List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">Recent Tasks</h3>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm">No tasks yet</p>
                  <p className="text-xs">Create your first task to get started</p>
                </div>
              ) : (
                tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => updateTaskStatus(task.id, task.taskStatus.id === 1 ? 2 : 1)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              task.taskStatus.id === 2 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {task.taskStatus.id === 2 && (
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <h4 className={`text-sm font-medium truncate ${task.taskStatus.id === 2 ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.task}
                          </h4>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.taskStatus.name)}`}>
                            {task.taskStatus.name}
                          </span>
                          
                          {task.taskPriority && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.taskPriority.name)}`}>
                              {task.taskPriority.name}
                            </span>
                          )}
                          
                          {task.duedate && (
                            <span className="text-xs text-gray-500">
                              Due: {formatDate(task.duedate)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 ml-2"
                        title="Delete task"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
              
              {tasks.length > 5 && (
                <div className="text-center">
                  <button
                    onClick={() => window.location.href = '/tasks'}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    View all {tasks.length} tasks →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collapsed State Icons */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 text-sm">✅</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-sm">📋</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-sm">⚡</span>
          </div>
        </div>
      )}
    </aside>
  );
} 