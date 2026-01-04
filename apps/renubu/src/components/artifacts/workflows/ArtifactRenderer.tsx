/**
 * Artifact Renderer Component
 *
 * Maps database artifacts to appropriate React components
 *
 * Responsibilities:
 * - Receives artifact from database (type, content, title, metadata)
 * - Dispatches to correct component based on artifact_type
 * - Passes customer context for handlebars variable injection
 * - Handles loading and error states
 *
 * Artifact Type Mapping:
 * - 'contract_analysis' → ContractAnalysisArtifact
 * - 'meeting_notes' → MeetingNotesArtifact
 * - 'action_plan' → ActionPlanArtifact
 * - 'assessment' → CSMAssessmentArtifact
 */

'use client';

import React from 'react';
import { ContractAnalysisArtifact } from './ContractAnalysisArtifact';
import { MeetingNotesArtifact } from './MeetingNotesArtifact';
import { ActionPlanArtifact } from './ActionPlanArtifact';
import { CSMAssessmentArtifact } from '../CSMAssessmentArtifact';

export interface WorkflowArtifact {
  id: string;
  task_id: string;
  artifact_type: 'contract_analysis' | 'meeting_notes' | 'action_plan' | 'assessment';
  title: string;
  content: any; // JSONB from database
  generated_by_ai: boolean;
  ai_model?: string;
  ai_prompt?: string;
  is_approved: boolean;
  metadata?: any;
  created_at: string;
  updated_at?: string;
}

interface ArtifactRendererProps {
  artifact: WorkflowArtifact;
  customerContext?: any;
  onClose?: () => void;
  onSave?: (artifactId: string, updatedContent: any) => Promise<void>;
}

export function ArtifactRenderer({
  artifact,
  customerContext,
  onClose,
  onSave
}: ArtifactRendererProps) {
  // Handle save for editable artifacts
  const handleSave = async (updatedContent: any) => {
    if (onSave) {
      await onSave(artifact.id, updatedContent);
    }
  };

  // Render appropriate component based on artifact_type
  switch (artifact.artifact_type) {
    case 'contract_analysis':
      return (
        <ContractAnalysisArtifact
          title={artifact.title}
          data={artifact.content}
          customerContext={customerContext}
          onClose={onClose}
        />
      );

    case 'meeting_notes':
      return (
        <MeetingNotesArtifact
          title={artifact.title}
          data={artifact.content}
          customerContext={customerContext}
          onClose={onClose}
        />
      );

    case 'action_plan':
      return (
        <ActionPlanArtifact
          title={artifact.title}
          data={artifact.content}
          customerContext={customerContext}
          onClose={onClose}
        />
      );

    case 'assessment':
      return (
        <CSMAssessmentArtifact
          title={artifact.title}
          data={artifact.content}
          customerContext={customerContext}
          onClose={onClose}
          onSave={handleSave}
        />
      );

    default:
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900">Unknown Artifact Type</h2>
            <p className="text-sm text-red-700 mt-1">
              Artifact type "{artifact.artifact_type}" is not supported
            </p>
          </div>
          <div className="flex-1 p-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Artifact Details:</p>
              <pre className="text-xs text-gray-800 overflow-auto">
                {JSON.stringify(artifact, null, 2)}
              </pre>
            </div>
          </div>
          {onClose && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      );
  }
}

/**
 * Artifact List Component
 *
 * Displays a list of artifacts with ability to select and view
 */
interface ArtifactListProps {
  artifacts: WorkflowArtifact[];
  selectedArtifactId?: string;
  onSelectArtifact: (artifactId: string) => void;
  customerContext?: any;
}

export function ArtifactList({
  artifacts,
  selectedArtifactId,
  onSelectArtifact,
  customerContext
}: ArtifactListProps) {
  if (artifacts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-gray-600">No artifacts created yet</p>
      </div>
    );
  }

  // Get artifact type icon
  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'contract_analysis':
        return '📋';
      case 'meeting_notes':
        return '📝';
      case 'action_plan':
        return '✅';
      case 'assessment':
        return '📊';
      default:
        return '📄';
    }
  };

  // Get artifact type label
  const getArtifactTypeLabel = (type: string) => {
    switch (type) {
      case 'contract_analysis':
        return 'Contract Analysis';
      case 'meeting_notes':
        return 'Meeting Notes';
      case 'action_plan':
        return 'Action Plan';
      case 'assessment':
        return 'Assessment';
      default:
        return type;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <button
          key={artifact.id}
          onClick={() => onSelectArtifact(artifact.id)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            selectedArtifactId === artifact.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{getArtifactIcon(artifact.artifact_type)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {artifact.title}
                </h3>
                {artifact.generated_by_ai && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    AI
                  </span>
                )}
                {artifact.is_approved && (
                  <span className="text-green-600" title="Approved">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-2">
                {getArtifactTypeLabel(artifact.artifact_type)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(artifact.created_at)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
