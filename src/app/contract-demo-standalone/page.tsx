"use client";

import React from 'react';
import { TaskModeModal } from '@/components/artifacts/workflows/TaskModeAdvanced';
import { contractDemoStandaloneConfig } from '@/components/artifacts/workflows/config/configs/ContractDemoStandalone';

export default function ContractDemoStandalonePage() {
  return (
    <div className="w-full h-screen">
      <TaskModeModal
        isOpen={true}
        onClose={() => {}}
        workflowConfig={contractDemoStandaloneConfig}
        workflowConfigName="contract-demo-standalone"
        inline={true}
        showArtifact={false}
        artifact_visible={true}
      />
    </div>
  );
}
