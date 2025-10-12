/**
 * Test Modal Workflow Page
 *
 * Demonstrates launching workflow/task mode within a resizable modal.
 * This simulates how workflows would be launched from the dashboard.
 */

'use client';

import React, { useState } from 'react';
import { PlayCircle, FileText, Calendar } from 'lucide-react';
import { ResizableModal } from '@/components/workflows/ResizableModal';
import { WorkflowExecutor } from '@/components/workflows/WorkflowExecutor';
import { testWorkflowDefinition } from '@/components/workflows/definitions/testWorkflow';

export default function TestModalWorkflowPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');

  const handleLaunchWorkflow = (workflowId: string) => {
    setSelectedWorkflow(workflowId);
    setModalOpen(true);
  };

  const handleComplete = (executionId: string) => {
    console.log('Workflow completed:', executionId);
    alert(`Workflow completed! Execution ID: ${executionId}`);
    setModalOpen(false);
  };

  const handleExit = () => {
    if (confirm('Are you sure you want to exit this workflow?')) {
      setModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Dashboard Mock */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Success Dashboard</h1>
          <p className="text-lg text-gray-600">Launch workflows in resizable modals</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">24</div>
            <div className="text-sm text-gray-600 mt-1">Active Renewals</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">18</div>
            <div className="text-sm text-gray-600 mt-1">At Risk</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-orange-600">6</div>
            <div className="text-sm text-gray-600 mt-1">Critical</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">$4.2M</div>
            <div className="text-sm text-gray-600 mt-1">Total ARR</div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Customers Requiring Action</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Customer 1 */}
            <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Acme Corporation</h3>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      At Risk
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>ARR: $725,000</span>
                    <span>•</span>
                    <span>Renewal: 120 days</span>
                    <span>•</span>
                    <span>Health: 85%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLaunchWorkflow('renewal-planning')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Start Renewal Planning</span>
                  </button>

                  <button
                    onClick={() => handleLaunchWorkflow('qbr-prep')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>QBR Prep</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Customer 2 */}
            <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">TechStart Inc</h3>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                      Critical
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>ARR: $450,000</span>
                    <span>•</span>
                    <span>Renewal: 30 days</span>
                    <span>•</span>
                    <span>Health: 62%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLaunchWorkflow('urgent-renewal')}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Emergency Workflow</span>
                  </button>

                  <button
                    onClick={() => handleLaunchWorkflow('escalation')}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Escalate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Customer 3 */}
            <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Global Enterprises</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>ARR: $1,200,000</span>
                    <span>•</span>
                    <span>Renewal: 180 days</span>
                    <span>•</span>
                    <span>Health: 92%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLaunchWorkflow('expansion')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Expansion Planning</span>
                  </button>

                  <button
                    onClick={() => handleLaunchWorkflow('renewal-planning')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Standard Renewal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 Test Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click any workflow button to launch it in a resizable modal</li>
            <li>• <strong>Drag the header</strong> to reposition the modal</li>
            <li>• <strong>Drag edges or corners</strong> to resize the modal</li>
            <li>• <strong>Click maximize</strong> to go full screen</li>
            <li>• <strong>Click minimize</strong> to collapse to bottom-right corner</li>
            <li>• Modal persists while you navigate the dashboard behind it</li>
          </ul>
        </div>
      </div>

      {/* Resizable Modal containing Workflow */}
      <ResizableModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Renewal Planning Workflow - Acme Corporation"
        defaultWidth={85}
        defaultHeight={90}
        minWidth={800}
        minHeight={600}
      >
        <WorkflowExecutor
          workflowDefinition={testWorkflowDefinition}
          customerId="550e8400-e29b-41d4-a716-446655440001"
          onComplete={handleComplete}
          onExit={handleExit}
        />
      </ResizableModal>
    </div>
  );
}
