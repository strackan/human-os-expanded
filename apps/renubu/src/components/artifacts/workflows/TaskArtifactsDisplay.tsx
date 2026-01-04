/**
 * Task Artifacts Display Component
 *
 * Displays artifacts from workflow_task_artifacts table
 * Fetches artifacts for a given workflow execution and renders them
 * using the ArtifactRenderer component
 *
 * Features:
 * - Fetches artifacts from database
 * - Sidebar list of artifacts
 * - Full artifact display using ArtifactRenderer
 * - Expandable/collapsible panel
 * - Loading and error states
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, FileText, RefreshCw } from 'lucide-react';
import { ArtifactRenderer, ArtifactList, type WorkflowArtifact } from './ArtifactRenderer';

interface TaskArtifactsDisplayProps {
  workflowExecutionId: string;
  customerId: string;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function TaskArtifactsDisplay({
  workflowExecutionId,
  customerId,
  onClose,
  isExpanded = false,
  onToggleExpand
}: TaskArtifactsDisplayProps) {
  const [artifacts, setArtifacts] = useState<WorkflowArtifact[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [customerContext, setCustomerContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer context for handlebars variables
  useEffect(() => {
    fetchCustomerContext();
  }, [customerId]);

  // Fetch artifacts
  useEffect(() => {
    if (workflowExecutionId) {
      fetchArtifacts();
    }
  }, [workflowExecutionId]);

  // Auto-select first artifact when loaded
  useEffect(() => {
    if (artifacts.length > 0 && !selectedArtifactId) {
      setSelectedArtifactId(artifacts[0].id);
    }
  }, [artifacts]);

  const fetchCustomerContext = async () => {
    try {
      const response = await fetch(`/api/workflows/context?customerId=${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer context');
      const data = await response.json();
      setCustomerContext(data);
    } catch (err) {
      console.error('[TaskArtifactsDisplay] Error fetching customer context:', err);
      // Don't set error state - context is optional for artifact display
    }
  };

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all tasks for this workflow execution
      const tasksResponse = await fetch(`/api/workflows/tasks?workflowExecutionId=${workflowExecutionId}`);
      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch workflow tasks');
      }
      const { tasks } = await tasksResponse.json();

      // Fetch artifacts for each task
      const allArtifacts: WorkflowArtifact[] = [];
      for (const task of tasks) {
        try {
          const artifactsResponse = await fetch(`/api/workflows/artifacts?taskId=${task.id}`);
          if (artifactsResponse.ok) {
            const { artifacts: taskArtifacts } = await artifactsResponse.json();
            allArtifacts.push(...taskArtifacts);
          }
        } catch (err) {
          console.error(`[TaskArtifactsDisplay] Error fetching artifacts for task ${task.id}:`, err);
        }
      }

      // Sort by created_at (newest first)
      allArtifacts.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setArtifacts(allArtifacts);
    } catch (err) {
      console.error('[TaskArtifactsDisplay] Error fetching artifacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load artifacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArtifact = async (artifactId: string, updatedContent: any) => {
    try {
      const response = await fetch(`/api/workflows/artifacts/${artifactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent })
      });

      if (!response.ok) {
        throw new Error('Failed to save artifact');
      }

      // Refresh artifacts after save
      await fetchArtifacts();
    } catch (err) {
      console.error('[TaskArtifactsDisplay] Error saving artifact:', err);
      alert('Failed to save artifact changes');
    }
  };

  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId);

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <h3 className="text-lg font-semibold text-gray-900">Artifacts</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading artifacts...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <h3 className="text-lg font-semibold text-gray-900">Artifacts</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-500 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Artifacts</h4>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchArtifacts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (artifacts.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <h3 className="text-lg font-semibold text-gray-900">Artifacts</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No artifacts yet</h4>
          <p className="text-sm text-gray-600 max-w-sm">
            Artifacts will appear here as workflow tasks generate them. They may include status reports, action plans, meeting notes, and assessments.
          </p>
        </div>
      </div>
    );
  }

  // Main display with artifacts
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? 'Exit full screen' : 'Expand to full screen'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Artifacts</h3>
            <p className="text-sm text-gray-600">{artifacts.length} generated</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchArtifacts}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            title="Refresh artifacts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Artifact List */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto p-4">
          <ArtifactList
            artifacts={artifacts}
            selectedArtifactId={selectedArtifactId || undefined}
            onSelectArtifact={setSelectedArtifactId}
            customerContext={customerContext}
          />
        </div>

        {/* Main - Selected Artifact */}
        <div className="flex-1 overflow-hidden">
          {selectedArtifact ? (
            <ArtifactRenderer
              artifact={selectedArtifact}
              customerContext={customerContext}
              onClose={() => setSelectedArtifactId(null)}
              onSave={handleSaveArtifact}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Select an artifact to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
