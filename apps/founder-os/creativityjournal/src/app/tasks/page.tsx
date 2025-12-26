'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

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

export default function TasksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [taskPriorities, setTaskPriorities] = useState<TaskPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    task: '',
    description: '',
    duedate: '',
    projectId: '',
    priorityId: '',
  });
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }
    fetchData();
    
    // Check for projectId parameter from URL
    const projectId = searchParams.get('projectId');
    if (projectId) {
      setSelectedProject(parseInt(projectId));
    }
  }, [session, router, searchParams]);

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
        
        // Set default priority to "Medium" if no priority is currently set
        const mediumPriority = prioritiesData.find((p: TaskPriority) => p.name.toLowerCase() === 'medium');
        if (mediumPriority && !newTask.priorityId) {
          setNewTask(prev => ({ ...prev, priorityId: mediumPriority.id.toString() }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.task.trim()) return;
    
    try {
      setCreatingTask(true);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: newTask.task,
          description: newTask.description || null,
          duedate: newTask.duedate || null,
          projectId: newTask.projectId ? parseInt(newTask.projectId) : null,
          taskPriorityId: newTask.priorityId ? parseInt(newTask.priorityId) : null,
        }),
      });

      if (response.ok) {
        const createdTask = await response.json();
        setTasks(prev => [createdTask, ...prev]);
        
        // Reset form and close modal
        setNewTask({
          task: '',
          description: '',
          duedate: '',
          projectId: '',
          priorityId: '',
        });
        setShowCreateTask(false);
        
        // Redirect to tasks page (refresh current page to show new task)
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error creating task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    } finally {
      setCreatingTask(false);
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: task.task,
          description: task.description || null,
          duedate: task.duedate || null,
          taskStatusId: task.taskStatus.id,
          taskPriorityId: task.taskPriority?.id || null,
          projectId: task.project?.id || null,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        setEditingTask(null);
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

  const createProject = async () => {
    if (!newProject.name.trim()) return;
    
    try {
      setCreatingProject(true);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description || null,
        }),
      });

      if (response.ok) {
        const createdProject = await response.json();
        setProjects(prev => [createdProject, ...prev]);
        
        // Reset form and close modal
        setNewProject({
          name: '',
          description: '',
        });
        setShowCreateProject(false);
        
        // Redirect to projects page with success message
        router.push(`/projects?success=true&projectName=${encodeURIComponent(createdProject.name)}`);
      } else {
        const errorData = await response.json();
        alert(`Error creating project: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
    } finally {
      setCreatingProject(false);
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

  const filteredTasks = tasks?.filter(task => {
    if (selectedProject && task.project?.id !== selectedProject) return false;
    if (selectedStatus && task.taskStatus.id !== selectedStatus) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="h-full bg-main-bg">
        <div className="h-full p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-main-bg">
      <div className="h-full p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-600 mt-1">
                {selectedProject ? 
                  `Viewing tasks for: ${projects.find(p => p.id === selectedProject)?.name || 'Unknown Project'}` :
                  'Manage your tasks and projects'
                }
              </p>
              {selectedProject && (
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                >
                  ← Show all tasks
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/projects')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Projects
              </button>
              <button
                onClick={() => setShowCreateProject(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                New Project
              </button>
              <button
                onClick={() => setShowCreateTask(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                New Task
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                 <select
                   value={selectedProject || ''}
                   onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                   className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                   aria-label="Filter by project"
                   title="Filter by project"
                 >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project._count?.tasks || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                 <select
                   value={selectedStatus || ''}
                   onChange={(e) => setSelectedStatus(e.target.value ? parseInt(e.target.value) : null)}
                   className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                   aria-label="Filter by status"
                   title="Filter by status"
                 >
                  <option value="">All Statuses</option>
                  {taskStatuses?.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    {editingTask?.id === task.id ? (
                      <>
                        <td className="px-6 py-4" colSpan={6}>
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingTask.task}
                              onChange={(e) => setEditingTask(prev => prev ? { ...prev, task: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Task title"
                              aria-label="Task title"
                            />
                            <textarea
                              value={editingTask.description || ''}
                              onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              placeholder="Task description"
                              aria-label="Task description"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateTask(editingTask)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingTask(null)}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.task}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.taskStatus.name)}`}>
                            {task.taskStatus.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.taskPriority ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.taskPriority.name)}`}>
                              {task.taskPriority.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.project ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {task.project.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.duedate ? formatDate(task.duedate) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingTask(task)}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                              title="Edit task"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                              title="Delete task"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">
                {selectedProject || selectedStatus 
                  ? 'Try adjusting your filters or create a new task.'
                  : 'Create your first task to get started.'
                }
              </p>
              <button
                onClick={() => setShowCreateTask(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask(prev => ({ ...prev, task: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter task title..."
                  disabled={creatingTask}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Enter task description..."
                  disabled={creatingTask}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.duedate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, duedate: e.target.value }))}
                    onFocus={(e) => {
                      try {
                        e.target.showPicker?.();
                      } catch (error) {
                        // showPicker might not be supported in all browsers
                        console.debug('showPicker not supported');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    aria-label="Due date"
                    title="Due date"
                    disabled={creatingTask}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priorityId}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priorityId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    aria-label="Task priority"
                    title="Task priority"
                    disabled={creatingTask}
                  >
                    <option value="">Select Priority</option>
                    {taskPriorities?.map(priority => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={newTask.projectId}
                  onChange={(e) => setNewTask(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  aria-label="Task project"
                  title="Task project"
                  disabled={creatingTask}
                >
                  <option value="">Select Project</option>
                  {projects?.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateTask(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                disabled={creatingTask}
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                disabled={!newTask.task.trim() || creatingTask}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {creatingTask ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter project name..."
                  disabled={creatingProject}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Enter project description..."
                  disabled={creatingProject}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateProject(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                disabled={creatingProject}
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProject.name.trim() || creatingProject}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {creatingProject ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 