'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { isColorDark } from '@/lib/colorUtils';

interface Label {
  id: number;
  name: string;
  color: string;
}

interface LabelManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLabelsUpdated: () => void;
}

const DEFAULT_COLORS = [
  'FFEB3B', // Yellow
  'FFC107', // Amber
  'FF9800', // Orange
  'FF5722', // Deep Orange
  'F44336', // Red
  'E91E63', // Pink
  '9C27B0', // Purple
  '673AB7', // Deep Purple
  '3F51B5', // Indigo
  '2196F3', // Blue
  '03A9F4', // Light Blue
  '00BCD4', // Cyan
  '009688', // Teal
  '4CAF50', // Green
  '8BC34A', // Light Green
  'CDDC39', // Lime
];

export default function LabelManagementModal({
  isOpen,
  onClose,
  onLabelsUpdated,
}: LabelManagementModalProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('B5EBF5');

  useEffect(() => {
    if (isOpen) {
      fetchLabels();
    }
  }, [isOpen]);

  const fetchLabels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/labels');
      if (response.ok) {
        const data = await response.json();
        setLabels(data);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      alert('Label name is required');
      return;
    }

    try {
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: newLabelColor,
        }),
      });

      if (response.ok) {
        await fetchLabels();
        setShowCreateForm(false);
        setNewLabelName('');
        setNewLabelColor('B5EBF5');
        onLabelsUpdated();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create label');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      alert('Error creating label');
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    if (!confirm('Are you sure you want to delete this label? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/labels/${labelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLabels();
        onLabelsUpdated();
      } else {
        alert('Failed to delete label');
      }
    } catch (error) {
      console.error('Error deleting label:', error);
      alert('Error deleting label');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Manage Labels</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Create Label Form */}
          {showCreateForm && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-3">Create New Label</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label Name
                  </label>
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Enter label name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewLabelColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newLabelColor === color
                            ? 'border-gray-800 scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: `#${color}` }}
                        title={`#${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewLabelName('');
                      setNewLabelColor('B5EBF5');
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateLabel}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Label Button */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              <Plus size={16} />
              Create New Label
            </button>
          )}

          {/* Labels List */}
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading labels...</p>
            </div>
          ) : labels.length === 0 ? (
            <div className="text-center py-8">
              <Tag size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No labels yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first label to organize snippets</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 mb-2">Existing Labels</h3>
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: `#${label.color}` }}
                    />
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `#${label.color}`,
                        color: isColorDark(`#${label.color}`) ? '#ffffff' : '#000000',
                      }}
                    >
                      {label.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteLabel(label.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete label"
                    aria-label="Delete label"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
} 