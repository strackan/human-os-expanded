'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Tag } from 'lucide-react';

interface Snippet {
  id: number;
  snippet: string;
  description: string;
  startIndex: number;
  endIndex: number;
  highlightColor: string;
  createdDate: string;
  label?: {
    id: number;
    name: string;
    color: string;
  };
}

interface SnippetsPanelProps {
  entryId: number;
  isOpen: boolean;
  onClose: () => void;
  onSnippetCreated: () => void;
}

export default function SnippetsPanel({ entryId, isOpen, onClose, onSnippetCreated }: SnippetsPanelProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    highlightColor: '#FFEB3B',
  });

  useEffect(() => {
    if (isOpen && entryId) {
      fetchSnippets();
    }
  }, [isOpen, entryId]);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/snippets?entryId=${entryId}`);
      if (response.ok) {
        const data = await response.json();
        setSnippets(data);
      }
    } catch (error) {
      console.error('Error fetching snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setEditForm({
      description: snippet.description,
      highlightColor: snippet.highlightColor,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSnippet) return;

    try {
      const response = await fetch(`/api/snippets/${editingSnippet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchSnippets();
        setEditingSnippet(null);
        onSnippetCreated();
      }
    } catch (error) {
      console.error('Error updating snippet:', error);
    }
  };

  const handleDelete = async (snippetId: number) => {
    if (!confirm('Are you sure you want to delete this snippet?')) return;

    try {
      const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSnippets();
        onSnippetCreated();
      }
    } catch (error) {
      console.error('Error deleting snippet:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Snippets</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            title="Close snippets panel"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading snippets...</p>
            </div>
          ) : snippets.length === 0 ? (
            <div className="text-center py-8">
              <Tag size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No snippets yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Highlight text in your entry and use Ctrl+Shift+S to create snippets
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingSnippet?.id === snippet.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter snippet description"
                          title="Snippet description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Highlight Color
                        </label>
                        <input
                          type="color"
                          value={editForm.highlightColor}
                          onChange={(e) =>
                            setEditForm({ ...editForm, highlightColor: e.target.value })
                          }
                          className="w-full h-10 border border-gray-300 rounded-md"
                          title="Highlight color"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSnippet(null)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: snippet.highlightColor }}
                            />
                            {snippet.label && (
                              <span
                                className="px-2 py-1 text-xs rounded-full"
                                style={{
                                  backgroundColor: `#${snippet.label.color}`,
                                  color: '#000',
                                }}
                              >
                                {snippet.label.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            "{snippet.snippet}"
                          </p>
                          {snippet.description && (
                            <p className="text-gray-800 mb-2">{snippet.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDate(snippet.createdDate)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(snippet)}
                            className="text-gray-500 hover:text-blue-600"
                            title="Edit snippet"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(snippet.id)}
                            className="text-gray-500 hover:text-red-600"
                            title="Delete snippet"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 