"use client";

import React from 'react';
import RenewalChatWorkflow from '@/components/artifacts/RenewalChatWorkflow';

export default function TestRenewalChatPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Test Renewal Chat Workflow</h1>
        <RenewalChatWorkflow />
      </div>
    </div>
  );
}
