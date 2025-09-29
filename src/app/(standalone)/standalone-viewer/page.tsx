'use client';

import React from 'react';
import { TaskModeModal } from '@/components/artifacts/workflows/TaskModeAdvanced';
import { defaultWorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';

export default function StandaloneViewerPage() {
  return (
    <TaskModeModal
      isOpen={true}
      onClose={() => {}}
      workflowConfig={defaultWorkflowConfig}
      workflowConfigName="standalone-viewer"
      showArtifact={false}
      artifact_visible={true}
    />
  );
}