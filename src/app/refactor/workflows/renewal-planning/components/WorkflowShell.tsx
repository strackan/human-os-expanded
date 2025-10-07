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
  currentStep: number;
  onStepChange?: (stepIndex: number) => void;
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
 * - Navigation buttons (Next/Previous)
 *
 * Checkpoint 1.1: Basic modal with step display
 * Checkpoint 1.2: Added step navigation
 */
export function WorkflowShell({
  open,
  onClose,
  title,
  steps,
  currentStep,
  onStepChange,
  children
}: WorkflowShellProps) {
  if (!open) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1 && onStepChange) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0 && onStepChange) {
      onStepChange(currentStep - 1);
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

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

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between px-8 py-4 border-t bg-gray-50">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`
                px-6 py-2 font-semibold rounded-lg transition-all
                ${isFirstStep
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
                }
              `}
            >
              Previous
            </button>

            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>

            <button
              onClick={handleNext}
              disabled={isLastStep}
              className={`
                px-6 py-2 font-semibold rounded-lg transition-all
                ${isLastStep
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
