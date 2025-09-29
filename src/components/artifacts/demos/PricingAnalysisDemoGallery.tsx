"use client";

import React from 'react';
import { TaskModeModal } from '../workflows/TaskModeAdvanced';
import { pricingAnalysisDemoConfig } from '../workflows/config/configs';

export default function PricingAnalysisDemoGallery() {
  return (
    <TaskModeModal
      isOpen={true}
      inline={true}
      workflowConfig={pricingAnalysisDemoConfig}
      workflowConfigName="pricing-analysis-demo"
      onClose={() => {}}
      showArtifact={false}
      artifact_visible={true}
      starting_with="ai"
    />
  );
}