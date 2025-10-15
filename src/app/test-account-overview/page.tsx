'use client';

import { useState } from 'react';
import { TaskModeModal } from '@/components/artifacts/workflows/TaskModeAdvanced';
import { accountOverviewWithQAConfig } from '@/components/artifacts/workflows/config/configs/AccountOverviewWithQA';

export default function TestAccountOverviewPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Account Overview Enhancements - Test Page
          </h1>

          <div className="space-y-4 text-sm text-gray-700">
            <p className="font-semibold text-lg">Features to Test:</p>

            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900">1. Contract Q&A</p>
                <p className="text-blue-700">Type: "What about the contract?" or "Tell me about the contract"</p>
                <p className="text-xs text-blue-600 mt-1">Expected: Bot provides contract details with recommendation about metrics-tied clause</p>
              </div>

              <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                <p className="font-semibold text-green-900">2. Contact Editing</p>
                <p className="text-green-700">Click the pencil icon next to "David Park" in the Contacts tab</p>
                <p className="text-xs text-green-600 mt-1">Expected: Modal opens with autocomplete search (try typing "Sarah")</p>
              </div>

              <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                <p className="font-semibold text-purple-900">3. Skip/Snooze Controls</p>
                <p className="text-purple-700">Look for greyscale alarm clock and X icons in the artifact footer</p>
                <p className="text-xs text-purple-600 mt-1">Expected: Icons appear and clicking closes the workflow</p>
              </div>

              <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-500">
                <p className="font-semibold text-orange-900">4. Account Overview Tabs</p>
                <p className="text-orange-700">Click "Review Account" then explore Contract, Contacts, Pricing tabs</p>
                <p className="text-xs text-orange-600 mt-1">Expected: All tabs load with complete information</p>
              </div>

              <div className="p-3 bg-pink-50 rounded border-l-4 border-pink-500">
                <p className="font-semibold text-pink-900">5. Strategic Plan (Consolidated)</p>
                <p className="text-pink-700">After Q&A, click "Yes, build plan" to see consolidated strategic plan</p>
                <p className="text-xs text-pink-600 mt-1">Expected: Plan includes contract goal about removing metrics-tied clause</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-900">💡 Pattern Matching Test:</p>
              <p className="text-yellow-700">Try these variations in chat:</p>
              <ul className="list-disc list-inside text-xs text-yellow-600 mt-2 space-y-1">
                <li>"contract" - triggers contract Q&A</li>
                <li>"What are the terms?" - triggers contract Q&A</li>
                <li>"Tell me about pricing" - triggers pricing Q&A</li>
                <li>"Who are the contacts?" - triggers contacts Q&A</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Open Workflow
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Reset Page
            </button>
          </div>
        </div>
      </div>

      {/* The Workflow */}
      {isOpen && (
        <TaskModeModal
          workflowConfig={accountOverviewWithQAConfig}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
