"use client";

import React from 'react';
import { TaskModeModal } from '../workflows/TaskModeAdvanced';
import { planningChecklistDemoConfig } from '../workflows/config/configs';

export default function PlanningChecklistDemoGallery() {
  return (
    <TaskModeModal
      isOpen={true}
      inline={true}
      workflowConfig={planningChecklistDemoConfig}
      workflowConfigName="planning-checklist-demo"
      onClose={() => {}}
      showArtifact={false}
      artifact_visible={true}
      starting_with="ai"
    />
  );
}