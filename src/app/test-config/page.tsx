"use client";

import React from 'react';
import { planningChecklistDemoConfig } from '@/components/artifacts/workflows/config/configs/PlanningChecklistDemoConfig';

export default function TestConfigPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Configuration Test</h1>

      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Planning Checklist Demo Config</h2>
        <div className="space-y-2">
          <p><strong>Customer Name:</strong> {planningChecklistDemoConfig.customer.name}</p>
          <p><strong>Next Customer:</strong> {planningChecklistDemoConfig.customer.nextCustomer}</p>
          <p><strong>Chat Mode:</strong> {planningChecklistDemoConfig.chat.mode}</p>
          <p><strong>Number of Artifacts:</strong> {planningChecklistDemoConfig.artifacts.sections.length}</p>
          <p><strong>AI Greeting:</strong> {planningChecklistDemoConfig.chat.aiGreeting}</p>
        </div>
      </div>
    </div>
  );
}