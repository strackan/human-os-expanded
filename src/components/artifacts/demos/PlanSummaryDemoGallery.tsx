"use client";

import React from 'react';
import { TaskModeModal } from '../workflows/TaskModeAdvanced';
import { planSummaryDemoConfig } from '../workflows/config/configs';

export default function PlanSummaryDemoGallery() {
  return (
    <TaskModeModal
      isOpen={true}
      inline={true}
      workflowConfig={planSummaryDemoConfig}
      workflowConfigName="plan-summary-demo"
      onClose={() => {}}
      showArtifact={false}
      artifact_visible={true}
      starting_with="ai"
    />
  );
}