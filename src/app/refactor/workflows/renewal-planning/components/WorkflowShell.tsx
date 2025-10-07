'use client';

import React from 'react';
import { X } from 'lucide-react';
import { StepProgress } from './StepProgress';

interface Step {
  id: string;
  label: string;
}

interface WorkflowShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: Step[];
  currentStep?: number; // Optional now since chat handles navigation
  children: React.ReactNode;
}

/**
 * WorkflowShell Component
 *
 * Modal container for workflow execution.
 * Includes:
 * - Modal overlay and container
 * - Header with title and close button
 * - Step progress indicator
 * - Content area for workflow steps
 *
 * Checkpoint 1.1: Basic modal with step display
 * Checkpoint 1.2: Added step navigation
 * Checkpoint 1.3: Removed navigation footer (chat handles buttons)
 */
export function WorkflowShell({
  open,
  onClose,
  title,
  steps,
  currentStep = 0,
  children
}: WorkflowShellProps) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-4 border-b">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close workflow"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Step Progress */}
          <StepProgress steps={steps} currentStep={currentStep} />

          {/* Content Area - Chat handles its own buttons */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
