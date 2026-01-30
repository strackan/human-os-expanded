/**
 * Workflow Mode Layout Component
 *
 * Main layout wrapper for the v0-style chat + artifact layout.
 * Two-panel layout: WorkflowSidebar (left) + Artifact area (right).
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { WorkflowModeProvider } from '@/lib/contexts';
import { useWorkflowModeState } from '@/lib/hooks';
import { WorkflowSidebar } from './WorkflowSidebar';
import type {
  WorkflowModeLayoutProps,
  UseWorkflowModeStateOptions,
} from '@/lib/types/workflow';

// =============================================================================
// INTERNAL LAYOUT COMPONENT
// =============================================================================

interface WorkflowModeLayoutInnerProps extends WorkflowModeLayoutProps {
  options: UseWorkflowModeStateOptions;
}

function WorkflowModeLayoutInner({
  children,
  sidebarContent,
  artifactContent,
  className,
  options,
}: WorkflowModeLayoutInnerProps) {
  const state = useWorkflowModeState(options);
  const prevHadArtifactRef = useRef(false);

  const { uiState, actions } = state;

  // When there's no artifact content, use a full-width layout
  const hasArtifact = !!artifactContent;
  const showArtifactPanel = hasArtifact && !uiState.artifactPanelCollapsed;

  // Auto-expand artifact panel when content appears
  useEffect(() => {
    if (hasArtifact && !prevHadArtifactRef.current && uiState.artifactPanelCollapsed) {
      // Content just appeared and panel is collapsed - expand it
      actions.toggleArtifactPanel();
    }
    prevHadArtifactRef.current = hasArtifact;
  }, [hasArtifact, uiState.artifactPanelCollapsed, actions]);

  return (
    <WorkflowModeProvider value={state}>
      <div className={`flex h-full bg-gh-dark-900 overflow-hidden ${className ?? ''}`}>
        {/* Left sidebar with chat - grows to fill when no artifact */}
        <div className={`h-full overflow-hidden ${hasArtifact ? 'flex-shrink-0' : 'flex-1'}`}>
          {sidebarContent ?? <WorkflowSidebar expandToFill={!hasArtifact} />}
        </div>

        {/* Right panel for artifacts - expands to fill available space */}
        {hasArtifact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: showArtifactPanel ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={`h-full overflow-hidden bg-gh-dark-850 border-l border-gh-dark-700 ${
              showArtifactPanel ? 'flex-1' : 'w-0'
            }`}
          >
            {artifactContent}
          </motion.div>
        )}

        {/* Main content area (if any additional content) */}
        {children && (
          <div className="flex-1 h-full overflow-hidden">
            {children}
          </div>
        )}
      </div>
    </WorkflowModeProvider>
  );
}

// =============================================================================
// PUBLIC COMPONENT WITH OPTIONS
// =============================================================================

export interface WorkflowModeLayoutWithOptionsProps extends WorkflowModeLayoutProps {
  options: UseWorkflowModeStateOptions;
}

export function WorkflowModeLayout({
  children,
  sidebarContent,
  artifactContent,
  className,
  options,
}: WorkflowModeLayoutWithOptionsProps) {
  return (
    <WorkflowModeLayoutInner
      options={options}
      sidebarContent={sidebarContent}
      artifactContent={artifactContent}
      className={className}
    >
      {children}
    </WorkflowModeLayoutInner>
  );
}

export default WorkflowModeLayout;
