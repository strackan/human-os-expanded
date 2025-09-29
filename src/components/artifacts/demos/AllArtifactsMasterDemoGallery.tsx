"use client";

import React from 'react';
import { TaskModeModal } from '../workflows/TaskModeAdvanced';
import { allArtifactsMasterDemo } from '../workflows/config/configs';

export default function AllArtifactsMasterDemoGallery() {
  return (
    <TaskModeModal
      isOpen={true}
      inline={true}
      workflowConfig={allArtifactsMasterDemo}
      workflowConfigName="all-artifacts-master-demo"
      onClose={() => {}}
      showArtifact={false}
      artifact_visible={true}
      starting_with="ai"
    />
  );
}