"use client";

import React from 'react';
import TaskModeStandalone from '@/components/artifacts/workflows/TaskModeStandalone';
import { dynamicChatAI } from '@/components/artifacts/workflows/config/configs/DynamicChatFixed';

// Debug: Log the config we're using
console.log('DynamicHDAIPage: Using config:', {
  customerName: dynamicChatAI.customer?.name,
  hasAnalytics: !!dynamicChatAI.analytics,
  hasCustomerOverview: !!dynamicChatAI.customerOverview,
  hasChat: !!dynamicChatAI.chat,
  hasArtifacts: !!dynamicChatAI.artifacts
});

export default function DynamicHDAIPage() {
  return (
    <TaskModeStandalone
      workflowConfig={dynamicChatAI}
      workflowConfigName="dynamic-ai"
      showArtifact={false}
      startingWith="ai"
    />
  );
}