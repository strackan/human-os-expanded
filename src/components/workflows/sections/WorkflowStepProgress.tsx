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
  stepStates?: Record<number, any>;
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
  stepStates = {},
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

          // Check step state from database
          const stepState = stepStates[index];
          const isSnoozed = stepState?.status === 'snoozed';
          const isSkipped = stepState?.status === 'skipped';
          const snoozeUntil = stepState?.snooze_until ? new Date(stepState.snooze_until) : null;

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
                  title={
                    isSnoozed && snoozeUntil
                      ? `Snoozed until ${snoozeUntil.toLocaleDateString()}`
                      : isSkipped
                      ? 'Step skipped'
                      : undefined
                  }
                >
                  <div className="relative">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                        ${isActive && !isSnoozed && !isSkipped ? 'bg-blue-600 text-white ring-4 ring-blue-200' : ''}
                        ${isCompleted && !isSnoozed && !isSkipped ? 'bg-green-600 text-white' : ''}
                        ${isUpcoming && !isSnoozed && !isSkipped ? 'bg-gray-200 text-gray-500' : ''}
                        ${isSnoozed ? 'bg-gray-100 text-gray-400 border-2 border-gray-300 opacity-60' : ''}
                        ${isSkipped ? 'bg-gray-100 text-gray-300 border-2 border-gray-300 opacity-60' : ''}
                      `}
                    >
                      {isSnoozed ? (
                        <span className="text-lg opacity-50">💤</span>
                      ) : isSkipped ? (
                        <span className="text-gray-300">—</span>
                      ) : isCompleted ? (
                        '✓'
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Snooze badge - smaller, bottom-right */}
                    {isSnoozed && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center shadow-sm">
                        <Clock className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}

                    {/* Skip badge - smaller, bottom-right */}
                    {isSkipped && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center shadow-sm">
                        <X className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div
                    className={`
                      mt-2 text-sm font-medium text-center
                      ${isActive && !isSnoozed && !isSkipped ? 'text-blue-600' : ''}
                      ${isCompleted && !isSnoozed && !isSkipped ? 'text-green-600' : ''}
                      ${isUpcoming && !isSnoozed && !isSkipped ? 'text-gray-500' : ''}
                      ${isSnoozed ? 'text-gray-400 line-through opacity-60' : ''}
                      ${isSkipped ? 'text-gray-300 line-through opacity-60' : ''}
                    `}
                  >
                    {slide.label}
                    {isSnoozed && snoozeUntil && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Until {snoozeUntil.toLocaleDateString()}
                      </div>
                    )}
                    {isSkipped && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Skipped
                      </div>
                    )}
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
                        console.log('[WorkflowStepProgress] Snooze step button clicked for index:', index);
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
                  <div
                    className={`h-1 rounded ${
                      isSnoozed
                        ? 'bg-gray-300'
                        : isSkipped
                        ? 'bg-gray-300'
                        : isCompleted
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }`}
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
