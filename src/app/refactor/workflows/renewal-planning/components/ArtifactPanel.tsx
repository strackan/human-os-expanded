'use client';

import React from 'react';
import { ContractArtifact, ContractData } from './ContractArtifact';
import { MetricsArtifact, MetricsData } from './MetricsArtifact';
import { ReportArtifact, ReportData } from './ReportArtifact';

/**
 * Artifact type definition
 */
export interface Artifact {
  title: string;
  type: 'contract' | 'email' | 'checklist' | 'metrics' | 'report';
  data: any;
}

/**
 * ArtifactPanel Props
 */
interface ArtifactPanelProps {
  artifact: Artifact | null;
  visible: boolean;
}

/**
 * ArtifactPanel Component
 *
 * Container for displaying workflow artifacts:
 * - Conditionally renders based on visibility
 * - Shows artifact title
 * - Renders appropriate artifact component based on type
 * - Scrollable content area
 *
 * Checkpoint 1.3: Basic artifact panel
 * Currently supports: contract type
 * Future: email, checklist, and other types
 */
export function ArtifactPanel({ artifact, visible }: ArtifactPanelProps) {
  // Don't render if not visible or no artifact
  if (!visible || !artifact) {
    return null;
  }

  return (
    <div className="border-l border-gray-200 h-full overflow-y-auto bg-white">
      {/* Artifact Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <h3 className="text-xl font-bold text-gray-900">{artifact.title}</h3>
      </div>

      {/* Artifact Content */}
      <div className="p-6">
        {/* Render appropriate artifact type */}
        {artifact.type === 'contract' && (
          <ContractArtifact data={artifact.data as ContractData} />
        )}

        {artifact.type === 'metrics' && (
          <MetricsArtifact data={artifact.data as MetricsData} />
        )}

        {artifact.type === 'report' && (
          <ReportArtifact data={artifact.data as ReportData} />
        )}

        {artifact.type === 'email' && (
          <div className="text-gray-500 italic">
            Email artifact type not yet implemented
          </div>
        )}

        {artifact.type === 'checklist' && (
          <div className="text-gray-500 italic">
            Checklist artifact type not yet implemented
          </div>
        )}
      </div>
    </div>
  );
}
