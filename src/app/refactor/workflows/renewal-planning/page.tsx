'use client';

import React, { useState } from 'react';
import { WorkflowShell } from './components/WorkflowShell';

/**
 * Refactor: Renewal Planning Workflow
 *
 * CHECKPOINT 1.2: Step Navigation (50% Complete)
 *
 * What's being tested:
 * - Next/Previous buttons work
 * - Content changes based on current step
 * - Step progress indicator updates
 * - Buttons disabled appropriately (no Previous on step 1, no Next on last step)
 * - Step counter shows "Step X of 3"
 *
 * See REFACTOR-PROJECT-PLAN.md for full checklist
 */
export default function RenewalPlanningRefactor() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = [
    { id: 'start', label: 'Start Planning' },
    { id: 'review', label: 'Review Contract' },
    { id: 'send', label: 'Send Email' }
  ];

  const STEP_CONTENT = [
    {
      title: 'Step 1: Start Planning',
      description: 'Let\'s begin the renewal process for this customer.',
      details: 'In this step, we\'ll review the customer overview and decide if we\'re ready to proceed with renewal planning.'
    },
    {
      title: 'Step 2: Review Contract',
      description: 'Review contract terms and pricing details.',
      details: 'We\'ll examine the current contract terms, pricing caps, and any non-standard clauses that might affect the renewal.'
    },
    {
      title: 'Step 3: Send Email',
      description: 'Draft and send the renewal outreach email.',
      details: 'Compose a personalized email to the customer\'s primary contact to initiate the renewal conversation.'
    }
  ];

  return (
    <div className="container mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Refactor: Renewal Planning Workflow
        </h1>
        <p className="text-gray-600">
          Checkpoint 1.2 - Step Navigation (50% of Phase 1)
        </p>
      </div>

      {/* Checkpoint Info */}
      <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          What You're Testing (Checkpoint 1.2)
        </h2>
        <ul className="text-blue-800 space-y-1 list-disc list-inside">
          <li>Click "Next Step" button to advance through steps</li>
          <li>Content changes for each step (Step 1, 2, 3)</li>
          <li>Progress indicator updates (blue highlight moves)</li>
          <li>"Previous" button disabled on Step 1</li>
          <li>"Next Step" button disabled on Step 3</li>
          <li>Step counter shows "Step X of 3"</li>
        </ul>
      </div>

      {/* Launch Button */}
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        Launch Workflow
      </button>

      {/* Workflow Modal */}
      <WorkflowShell
        open={open}
        onClose={() => {
          setOpen(false);
          setCurrentStep(0); // Reset to step 1 when closing
        }}
        title="Renewal Planning"
        steps={STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        {/* Dynamic Content Based on Current Step */}
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {STEP_CONTENT[currentStep].title}
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              {STEP_CONTENT[currentStep].description}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                Step Details:
              </h3>
              <p className="text-blue-800 text-sm">
                {STEP_CONTENT[currentStep].details}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Next Checkpoint (1.3):
              </h3>
              <p className="text-gray-700 text-sm">
                We'll add a split-panel layout with Chat on the left and Artifacts on the right.
                You'll be able to click buttons in the chat to show/hide artifacts.
              </p>
            </div>
          </div>
        </div>
      </WorkflowShell>

      {/* UI Test Checklist */}
      <div className="mt-12 p-6 bg-gray-50 border border-gray-300 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          UI Test Checklist - Checkpoint 1.2 (Human Validation)
        </h2>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>Start on Step 1 "Start Planning"</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>"Previous" button is disabled (grayed out)</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>"Next Step" button is enabled (blue)</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>Click "Next Step" → Move to Step 2</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>Progress bar updates: Step 2 now highlighted in blue</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>Content changes to "Step 2: Review Contract"</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>"Previous" button now enabled</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>Click "Previous" → Back to Step 1</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>Content changes back to "Step 1: Start Planning"</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>Navigate to Step 3 "Send Email" (click Next twice)</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>"Next Step" button disabled on Step 3 (last step)</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>"Previous" button still enabled on Step 3</span>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-3" />
            <span>Step counter shows "Step X of 3" correctly</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-semibold">
            ✅ All 13 items checked = Checkpoint 1.2 PASS (50% of Phase 1 Complete)
          </p>
        </div>
      </div>

      {/* Files Modified */}
      <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">
          Files Modified (Checkpoint 1.2)
        </h2>
        <ul className="text-purple-800 space-y-1 font-mono text-sm">
          <li>✓ WorkflowShell.tsx - Added Next/Previous buttons + state management</li>
          <li>✓ page.tsx - Added currentStep state + step content array</li>
          <li>✓ StepProgress.tsx - Automatically updates based on currentStep prop</li>
        </ul>
        <div className="mt-4 pt-4 border-t border-purple-300">
          <p className="text-purple-900 text-sm">
            <strong>Component sizes remain small:</strong>
          </p>
          <ul className="text-purple-800 text-sm mt-2 space-y-1">
            <li>WorkflowShell.tsx: ~135 lines (was 90)</li>
            <li>page.tsx: ~230 lines</li>
            <li>StepProgress.tsx: 80 lines (unchanged)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
