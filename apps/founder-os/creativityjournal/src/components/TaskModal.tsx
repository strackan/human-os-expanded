'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';

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

interface TaskModalProps {
  selectedText?: string;
  onTaskCreated?: (task: Task) => void;
  onClose: () => void;
  isOpen: boolean;
  entryId?: number;
}

export default function TaskModal({ selectedText, onTaskCreated, onClose, isOpen, entryId }: TaskModalProps) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [taskPriorities, setTaskPriorities] = useState<TaskPriority[]>([]);
  const [loading, setLoading] = useState(true);
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
    }
  }, [selectedText]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

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
          entryId: entryId || null,
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
        onTaskCreated?.(createdTask);
        onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close task modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Create Task Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter task title..."
                    value={newTask.task}
                    onChange={(e) => setNewTask(prev => ({ ...prev, task: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Enter task description..."
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                                         <input
                       type="date"
                       value={newTask.duedate}
                       onChange={(e) => setNewTask(prev => ({ ...prev, duedate: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                       title="Due date"
                     />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                                         <select
                       value={newTask.priorityId}
                       onChange={(e) => setNewTask(prev => ({ ...prev, priorityId: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                       title="Priority"
                     >
                      <option value="">Select priority</option>
                      {taskPriorities.map(priority => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project (optional)
                  </label>
                                     <select
                     value={newTask.projectId}
                     onChange={(e) => setNewTask(prev => ({ ...prev, projectId: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     title="Project"
                   >
                    <option value="">Select project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTask}
                    disabled={!newTask.task.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Task
                  </button>
                </div>
              </div>

              {/* Recent Tasks */}
              {tasks.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Tasks</h3>
                  <div className="space-y-3">
                    {tasks.slice(0, 3).map(task => (
                      <div key={task.id} className="bg-gray-50 rounded-lg p-4">
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 