"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Play, Edit2, Trash2, ExternalLink, GripVertical, X, Save, Eye } from 'lucide-react';
import {
  TemplateGroup,
  getAllTemplateGroups,
  availableConfigs,
  createTemplateGroup,
  addTemplateGroup,
  removeTemplateGroup
} from '../config/templateGroups';
import { safeLaunchTemplateGroup, getDemoUrl } from '../utils/templateLauncher';

interface TemplateGroupManagerProps {
  className?: string;
}

const TemplateGroupManager: React.FC<TemplateGroupManagerProps> = ({ className = '' }) => {
  const [groups, setGroups] = useState<TemplateGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TemplateGroup | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    templates: [] as string[],
    tags: [] as string[]
  });

  useEffect(() => {
    setGroups(getAllTemplateGroups());
  }, []);

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (newGroup.templates.length === 0) {
      alert('Please add at least one template to the group');
      return;
    }

    const group = createTemplateGroup(newGroup);
    addTemplateGroup(group);
    setGroups(getAllTemplateGroups());
    setNewGroup({ name: '', description: '', templates: [], tags: [] });
    setShowCreateModal(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this template group?')) {
      removeTemplateGroup(groupId);
      setGroups(getAllTemplateGroups());
    }
  };

  const handleLaunchGroup = (groupId: string) => {
    safeLaunchTemplateGroup(groupId);
  };

  const handleAddTemplate = (templateName: string) => {
    if (!newGroup.templates.includes(templateName)) {
      setNewGroup({
        ...newGroup,
        templates: [...newGroup.templates, templateName]
      });
    }
  };

  const handleRemoveTemplate = (templateName: string) => {
    setNewGroup({
      ...newGroup,
      templates: newGroup.templates.filter(t => t !== templateName)
    });
  };

  const handleReorderTemplate = (fromIndex: number, toIndex: number) => {
    const newTemplates = [...newGroup.templates];
    const [removed] = newTemplates.splice(fromIndex, 1);
    newTemplates.splice(toIndex, 0, removed);
    setNewGroup({
      ...newGroup,
      templates: newTemplates
    });
  };

  const copyDemoUrl = (groupId: string) => {
    const url = getDemoUrl(groupId, true);
    navigator.clipboard.writeText(url).then(() => {
      alert('Demo URL copied to clipboard!');
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Demo Template Groups</h3>
          <p className="text-sm text-gray-500">Create and manage sequences of templates for demos</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No template groups created yet.</p>
            <p className="text-sm">Create your first group to get started with demo sequences.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {group.templates.length} template{group.templates.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{group.description}</p>

                  {/* Template Sequence */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {group.templates.map((template, index) => (
                      <React.Fragment key={template}>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {index + 1}. {template}
                        </span>
                        {index < group.templates.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleLaunchGroup(group.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Launch Demo"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyDemoUrl(group.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy Demo URL"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit Group"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGroup) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingGroup ? 'Edit Template Group' : 'Create Template Group'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingGroup(null);
                  setNewGroup({ name: '', description: '', templates: [], tags: [] });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Group Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  placeholder="e.g., Healthcare Demo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="Brief description of this demo sequence"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Templates
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {availableConfigs.map((template) => (
                    <button
                      key={template}
                      onClick={() => handleAddTemplate(template)}
                      disabled={newGroup.templates.includes(template)}
                      className={`text-left p-3 border rounded-lg transition-colors ${
                        newGroup.templates.includes(template)
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <div className="font-medium text-sm">{template}</div>
                      <div className="text-xs text-gray-500">
                        {newGroup.templates.includes(template) ? 'Added' : 'Click to add'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Templates (Sequence) */}
              {newGroup.templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Demo Sequence ({newGroup.templates.length} templates)
                  </label>
                  <div className="space-y-2">
                    {newGroup.templates.map((template, index) => (
                      <div
                        key={template}
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}.
                        </span>
                        <span className="flex-1 text-sm">{template}</span>
                        <button
                          onClick={() => handleRemoveTemplate(template)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Templates will be shown in this order during the demo
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingGroup(null);
                  setNewGroup({ name: '', description: '', templates: [], tags: [] });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroup.name.trim() || newGroup.templates.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingGroup ? 'Update Group' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGroupManager;