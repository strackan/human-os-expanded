"use client";

/**
 * Test Page for DynamicChatFixedTemplated
 *
 * This page validates that the templated version of DynamicChatFixed
 * works correctly and demonstrates all artifact types.
 */

import React, { useState } from 'react';
import { TaskModeModal } from '@/components/artifacts/workflows/TaskModeAdvanced';

export default function TestTemplatedDynamicPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Renewal Planning Workflow
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Testing workflow system with step-based progression
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Workflow ID</div>
                <div className="text-lg font-semibold text-blue-600">
                  renewal-planning
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Workflow System Test
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p className="mb-4">
              Testing the renewal planning workflow with 6 steps. Currently Steps 1-2 are fully implemented, Steps 3-6 are placeholders.
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Workflow Steps</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="font-medium text-green-700">✅ Step 1: Start Planning</div>
                <div className="text-gray-600 mt-1 text-xs">
                  Planning checklist with expansion branch
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="font-medium text-green-700">✅ Step 2: Review Contract</div>
                <div className="text-gray-600 mt-1 text-xs">
                  Contract details with email flow
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border-2 border-orange-200">
                <div className="font-medium text-orange-600">🚧 Step 3: Set Price</div>
                <div className="text-gray-600 mt-1 text-xs">
                  Placeholder - to be implemented
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border-2 border-orange-200">
                <div className="font-medium text-orange-600">🚧 Step 4: Confirm Contacts</div>
                <div className="text-gray-600 mt-1 text-xs">
                  Placeholder - to be implemented
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border-2 border-orange-200">
                <div className="font-medium text-orange-600">🚧 Step 5: Send Renewal Notice</div>
                <div className="text-gray-600 mt-1 text-xs">
                  Placeholder - to be implemented
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border-2 border-orange-200">
                <div className="font-medium text-orange-600">🚧 Step 6: Review Action Items</div>
                <div className="text-gray-600 mt-1 text-xs">
                  Placeholder - to be implemented
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-700">
              ✅ = Fully implemented | 🚧 = Placeholder (needs implementation)
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Launch Renewal Planning Workflow
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset Test
            </button>
          </div>
        </div>
      </div>

      {/* Task Mode Modal */}
      <TaskModeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workflowConfigName="renewal-planning"
        workflowId="renewal-planning"
      />
    </div>
  );
}
