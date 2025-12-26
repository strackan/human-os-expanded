'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRole } from '@/hooks/useRole';

interface Project {
  id: number;
  name: string;
  description?: string;
  createdDate: string;
  projectStatus: {
    id: number;
    name: string;
  };
  _count: {
    tasks: number;
  };
}

interface ProjectStatus {
  id: number;
  name: string;
  description?: string;
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successProjectName, setSuccessProjectName] = useState('');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  
  // Form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    projectStatusId: 1,
  });
  
  // Project statuses
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }
    fetchProjects();
    
    // Check for success parameter
    const success = searchParams.get('success');
    const projectName = searchParams.get('projectName');
    if (success === 'true' && projectName) {
      setShowSuccessBanner(true);
      setSuccessProjectName(decodeURIComponent(projectName));
      
      // Auto-hide banner after 5 seconds
      setTimeout(() => {
        setShowSuccessBanner(false);
      }, 5000);
    }
  }, [session, router, searchParams]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const fetchProjectStatuses = async () => {
    try {
      const response = await fetch('/api/task-statuses'); // We'll create this endpoint
      if (response.ok) {
        const statuses = await response.json();
        setProjectStatuses(statuses);
      }
    } catch (error) {
      console.error('Error fetching project statuses:', error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      description: project.description || '',
      projectStatusId: project.projectStatus.id,
    });
    setShowEditModal(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
        setShowEditModal(false);
        setEditingProject(null);
        setEditForm({ name: '', description: '', projectStatusId: 1 });
      } else {
        const error = await response.json();
        alert(`Error updating project: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  };

  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!deletingProject) return;
    
    try {
      const response = await fetch(`/api/projects/${deletingProject.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== deletingProject.id));
        setShowDeleteModal(false);
        setDeletingProject(null);
      } else {
        const error = await response.json();
        alert(`Error deleting project: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  };

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
          {/* Success Banner */}
          {showSuccessBanner && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">✓</div>
                <span>Project "{successProjectName}" created successfully!</span>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">Manage your projects and track progress</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/tasks')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Tasks
              </button>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.projectStatus.name)}`}>
                        {project.projectStatus.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(project.createdDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/tasks?projectId=${project.id}`)}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                          title="View tasks"
                        >
                          View
                        </button>
                        {role.canManageProjects() && (
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50"
                            title="Edit project"
                          >
                            Edit
                          </button>
                        )}
                        {role.canManageProjects() && (
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                            title="Delete project"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-4">Create your first project to get started organizing your tasks.</p>
              <button
                onClick={() => router.push('/tasks')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Tasks
              </button>
            </div>
          )}

          {/* Edit Project Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg max-w-md w-full mx-4">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Project</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter project name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                        placeholder="Enter project description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editForm.projectStatusId}
                        onChange={(e) => setEditForm(prev => ({ ...prev, projectStatusId: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        title="Select project status"
                      >
                        <option value={1}>Active</option>
                        <option value={2}>On Hold</option>
                        <option value={3}>Completed</option>
                        <option value={4}>Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingProject(null);
                        setEditForm({ name: '', description: '', projectStatusId: 1 });
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProject}
                      disabled={!editForm.name.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300"
                    >
                      Update Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Project Modal */}
          {showDeleteModal && deletingProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg max-w-md w-full mx-4">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Project</h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete the project "{deletingProject.name}"? 
                    This action cannot be undone.
                  </p>
                  {deletingProject._count.tasks > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ This project has {deletingProject._count.tasks} associated task(s). 
                        You must remove or reassign these tasks before deleting the project.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletingProject(null);
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteProject}
                      disabled={deletingProject._count.tasks > 0}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300"
                    >
                      Delete Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 