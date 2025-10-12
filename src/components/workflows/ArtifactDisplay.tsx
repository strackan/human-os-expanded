/**
 * Artifact Display Component
 *
 * Collapsible panel for displaying workflow-generated artifacts.
 *
 * Features:
 * - Collapsible panel with artifacts list
 * - Markdown rendering with syntax highlighting
 * - Copy to clipboard functionality
 * - Download as PDF/markdown
 * - Timestamp display
 * - Auto-expand on new artifact
 */

'use client';

import React, { useState } from 'react';
import { X, Copy, Download, ChevronDown, ChevronUp, FileText, Clock, Check, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DashboardArtifact, DashboardArtifactData } from './artifacts/DashboardArtifact';

// =====================================================
// Types
// =====================================================

export interface Artifact {
  id: string;
  title: string;
  content: string; // Markdown content or JSON string
  stepNumber?: number;
  stepTitle?: string;
  createdAt?: Date;
  type?: 'markdown' | 'html' | 'json' | 'dashboard';
}

export interface ArtifactDisplayProps {
  artifacts: Artifact[];
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// =====================================================
// ArtifactDisplay Component
// =====================================================

export const ArtifactDisplay: React.FC<ArtifactDisplayProps> = ({
  artifacts,
  onClose,
  isExpanded = false,
  onToggleExpand
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    artifacts.length > 0 ? artifacts[artifacts.length - 1].id : ''
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId);

  // =====================================================
  // Handlers
  // =====================================================

  const handleCopy = async (artifact: Artifact) => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopiedId(artifact.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy artifact:', error);
    }
  };

  const handleDownload = (artifact: Artifact) => {
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // =====================================================
  // Render
  // =====================================================

  // Empty state
  if (artifacts.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title={isExpanded ? 'Exit full screen' : 'Expand to full screen'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
            <h3 className="text-lg font-semibold text-gray-900">Artifacts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No artifacts yet</h4>
          <p className="text-sm text-gray-600 max-w-sm">
            Artifacts will appear here as you complete workflow steps. They may include analysis reports, recommendations, and generated documents.
          </p>
        </div>
      </div>
    );
  }

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
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Artifacts</h3>
            <p className="text-sm text-gray-600">{artifacts.length} generated</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Artifact List (if multiple) */}
      {artifacts.length > 1 && (
        <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => setSelectedArtifactId(artifact.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-md transition-colors
                  ${selectedArtifactId === artifact.id
                    ? 'bg-blue-50 border border-blue-200 text-blue-900'
                    : 'hover:bg-gray-50 border border-transparent text-gray-700'
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{artifact.title}</p>
                    {artifact.stepTitle && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Step {artifact.stepNumber}: {artifact.stepTitle}
                      </p>
                    )}
                  </div>
                  <Clock className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Artifact Content */}
      {selectedArtifact && (
        <>
          {/* Artifact Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{selectedArtifact.title}</h4>
                {selectedArtifact.stepTitle && (
                  <p className="text-sm text-gray-600 mt-1">
                    From Step {selectedArtifact.stepNumber}: {selectedArtifact.stepTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(selectedArtifact)}
                className="
                  flex items-center space-x-2 px-3 py-1.5 text-sm
                  bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors
                "
              >
                {copiedId === selectedArtifact.id ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownload(selectedArtifact)}
                className="
                  flex items-center space-x-2 px-3 py-1.5 text-sm
                  bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors
                "
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <div className="flex-1" />

              <span className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Generated {formatTimestamp(selectedArtifact.createdAt)}</span>
              </span>
            </div>
          </div>

          {/* Artifact Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
            {/* Render Dashboard Artifact */}
            {selectedArtifact.type === 'dashboard' ? (
              <DashboardArtifact data={JSON.parse(selectedArtifact.content) as DashboardArtifactData} />
            ) : (
              /* Render Markdown Artifact */
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                  // Custom renderers for better styling
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-3" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-gray-700 mb-4 leading-relaxed" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-gray-700" {...props} />
                  ),
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono" {...props} />
                    ) : (
                      <code className="block px-4 py-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                    ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-gray-50" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-4 py-2 text-sm text-gray-700 border-t border-gray-200" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-600" {...props} />
                  ),
                  }}
                >
                  {selectedArtifact.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// =====================================================
// Compact Artifact Card (for inline display)
// =====================================================

export const ArtifactCard: React.FC<{
  artifact: Artifact;
  onView: () => void;
}> = ({ artifact, onView }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{artifact.title}</h4>
          {artifact.stepTitle && (
            <p className="text-sm text-gray-600 mt-1">
              Step {artifact.stepNumber}: {artifact.stepTitle}
            </p>
          )}
        </div>
        <FileText className="w-5 h-5 text-blue-500" />
      </div>

      <button
        onClick={onView}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        View Full Artifact →
      </button>
    </div>
  );
};
