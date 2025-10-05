"use client";

/**
 * Test Page for DynamicChatFixedTemplated
 *
 * This page validates that the templated version of DynamicChatFixed
 * works correctly and demonstrates all artifact types.
 */

import React, { useState } from 'react';
import { TaskModeModal } from '@/components/artifacts/workflows/TaskModeAdvanced';
import { dynamicChatAITemplated } from '@/components/artifacts/workflows/config/configs';

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
                Template System Test
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Testing DynamicChatFixedTemplated - Built entirely from reusable templates
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Test Config</div>
                <div className="text-lg font-semibold text-blue-600">
                  DynamicChatAITemplated
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
            Template System Validation
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p className="mb-4">
              This test page demonstrates the complete template-based workflow system with 5 slides and all artifact types.
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold text-purple-900 mb-3">Artifact Types Demonstrated</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="font-medium text-gray-900">Slide 1</div>
                <div className="text-gray-600 mt-1">
                  • Planning Checklist<br />
                  • Contract<br />
                  • Email<br />
                  • Workflow Summary
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="font-medium text-gray-900">Slide 2</div>
                <div className="text-gray-600 mt-1">
                  • Follow-up Email<br />
                  • Assessment Summary
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="font-medium text-gray-900">Slide 3</div>
                <div className="text-gray-600 mt-1">
                  • Pricing Analysis ⭐<br />
                  • Quote ⭐
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="font-medium text-gray-900">Slides 4-5</div>
                <div className="text-gray-600 mt-1">
                  • Contact Strategy ⭐<br />
                  • Plan Summary ⭐
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-700">
              ⭐ = New artifact types added via template system
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Launch Templated Workflow
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
        workflowConfigName="dynamic-ai-templated"
        config={dynamicChatAITemplated}
      />
    </div>
  );
}
