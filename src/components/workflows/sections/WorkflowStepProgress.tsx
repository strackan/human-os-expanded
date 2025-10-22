'use client';

/**
 * WorkflowStepProgress Component
 *
 * Renders the workflow step progress bar with:
 * - Step circles (numbered, active state, completed checkmarks)
 * - Skip/Snooze actions menu (click-based with hover persistence)
 * - Progress connectors between steps
 */

import React from 'react';
import { X, Clock } from 'lucide-react';
import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

interface WorkflowStepProgressProps {
  slides: WorkflowSlide[];
  currentSlideIndex: number;
  completedSlides: Set<number>;
  stepActionMenu: number | null;
  onStepClick: (index: number) => void;
  onToggleStepActionMenu: (index: number | null) => void;
  onSnoozeStep: (index: number) => void;
  onSkipStep: (index: number) => void;
}

export default function WorkflowStepProgress({
  slides,
  currentSlideIndex,
  completedSlides,
  stepActionMenu,
  onStepClick,
  onToggleStepActionMenu,
  onSnoozeStep,
  onSkipStep
}: WorkflowStepProgressProps) {
  return (
    <div className="w-full px-6 py-6 border-b bg-gray-50" id="step-progress-bar">
      <div className="flex items-center justify-between">
        {slides.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          const isCompleted = completedSlides.has(index) && !isActive;
          const isUpcoming = !completedSlides.has(index) && !isActive;
          const isClickable = completedSlides.has(index);
          const showActions = stepActionMenu === index;

          return (
            <React.Fragment key={`step-${index}-${slide.id}`}>
              <div
                className="flex flex-col items-center flex-1 relative"
                id={`step-${index}`}
              >
                <button
                  onClick={(e) => {
                    // If clicking on the step circle itself, navigate
                    if (isClickable && stepActionMenu !== index) {
                      onStepClick(index);
                    } else if (index > 0) {
                      // If clicking again or on non-clickable step, toggle menu
                      e.stopPropagation();
                      onToggleStepActionMenu(stepActionMenu === index ? null : index);
                    }
                  }}
                  disabled={!isClickable && index === 0}
                  className={`flex flex-col items-center ${isClickable || index > 0 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-200' : ''}
                      ${isCompleted ? 'bg-green-600 text-white' : ''}
                      ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                    `}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div
                    className={`
                      mt-2 text-sm font-medium text-center
                      ${isActive ? 'text-blue-600' : ''}
                      ${isCompleted ? 'text-green-600' : ''}
                      ${isUpcoming ? 'text-gray-500' : ''}
                    `}
                  >
                    {slide.label}
                  </div>
                </button>

                {/* Skip/Snooze Actions */}
                {showActions && index > 0 && (
                  <div
                    className="absolute -top-14 left-1/2 -translate-x-1/2 flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-10 animate-fade-in"
                    onMouseEnter={() => onToggleStepActionMenu(index)}
                    onMouseLeave={() => onToggleStepActionMenu(null)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSnoozeStep(index);
                      }}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Snooze this step"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSkipStep(index);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Skip this step"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {index < slides.length - 1 && (
                <div className="flex-1 px-4 pb-6">
                  <div className={`h-1 rounded ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
