"use client";

import React from 'react';
import { TaskModeModal } from '../workflows/TaskModeAdvanced';
import { contactStrategyDemoConfig } from '../workflows/config/configs';

export default function ContactStrategyDemoGallery() {
  return (
    <TaskModeModal
      isOpen={true}
      inline={true}
      workflowConfig={contactStrategyDemoConfig}
      workflowConfigName="contact-strategy-demo"
      onClose={() => {}}
      showArtifact={false}
      artifact_visible={true}
      starting_with="ai"
    />
  );
}