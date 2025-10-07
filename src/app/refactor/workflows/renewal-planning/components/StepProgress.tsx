'use client';

import React from 'react';

interface Step {
  id: string;
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
}

/**
 * StepProgress Component
 *
 * Displays a horizontal progress indicator showing workflow steps.
 * Current step is highlighted, completed steps shown differently.
 *
 * Checkpoint 1.1: Basic visual display
 */
export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="w-full px-8 py-6 border-b bg-gray-50">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle and Label */}
              <div className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm transition-all
                    ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-200' : ''}
                    ${isCompleted ? 'bg-green-600 text-white' : ''}
                    ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                {/* Label */}
                <div
                  className={`
                    mt-2 text-sm font-medium text-center
                    ${isActive ? 'text-blue-600' : ''}
                    ${isCompleted ? 'text-green-600' : ''}
                    ${isUpcoming ? 'text-gray-500' : ''}
                  `}
                >
                  {step.label}
                </div>
              </div>

              {/* Connector Line (except after last step) */}
              {index < steps.length - 1 && (
                <div className="flex-1 px-4 pb-6">
                  <div
                    className={`
                      h-1 rounded transition-all
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
