'use client';

import { useEffect, useRef } from 'react';
import { WorkflowModeProvider } from '@/lib/founders/workflow-context';
import { useWorkflowModeState } from '@/lib/founders/hooks/use-workflow-state';
import { WorkflowSidebar } from './WorkflowSidebar';
import type { UseWorkflowModeStateOptions, WorkflowModeLayoutProps } from '@/lib/founders/workflow-types';

interface WorkflowModeLayoutInnerProps extends WorkflowModeLayoutProps {
  options: UseWorkflowModeStateOptions;
}

function WorkflowModeLayoutInner({ children, sidebarContent, artifactContent, className, options, hideChatInput }: WorkflowModeLayoutInnerProps) {
  const state = useWorkflowModeState(options);
  const prevHadArtifactRef = useRef(false);
  const { uiState, actions } = state;
  const hasArtifact = !!artifactContent;
  const showArtifactPanel = hasArtifact && !uiState.artifactPanelCollapsed;

  useEffect(() => {
    if (hasArtifact && !prevHadArtifactRef.current && uiState.artifactPanelCollapsed) actions.toggleArtifactPanel();
    prevHadArtifactRef.current = hasArtifact;
  }, [hasArtifact, uiState.artifactPanelCollapsed, actions]);

  return (
    <WorkflowModeProvider value={state}>
      <div className={`flex h-full bg-[var(--gh-dark-900)] overflow-hidden ${className ?? ''}`}>
        <div className={`h-full overflow-hidden ${hasArtifact ? 'flex-shrink-0' : 'flex-1'}`}>
          {sidebarContent ?? <WorkflowSidebar expandToFill={!hasArtifact} hideChatInput={hideChatInput ?? false} />}
        </div>
        {hasArtifact && (
          <div style={{ opacity: showArtifactPanel ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }}
            className={`h-full overflow-hidden bg-[var(--gh-dark-850)] border-l border-[var(--gh-dark-700)] ${showArtifactPanel ? 'flex-1' : 'w-0'}`}>
            {artifactContent}
          </div>
        )}
        {children && <div className="flex-1 h-full overflow-hidden">{children}</div>}
      </div>
    </WorkflowModeProvider>
  );
}

export interface WorkflowModeLayoutWithOptionsProps extends WorkflowModeLayoutProps {
  options: UseWorkflowModeStateOptions;
}

export function WorkflowModeLayout({ children, sidebarContent, artifactContent, className, options, hideChatInput }: WorkflowModeLayoutWithOptionsProps) {
  return (
    <WorkflowModeLayoutInner
      options={options}
      sidebarContent={sidebarContent}
      artifactContent={artifactContent}
      {...(className != null ? { className } : {})}
      {...(hideChatInput != null ? { hideChatInput } : {})}
    >
      {children}
    </WorkflowModeLayoutInner>
  );
}
