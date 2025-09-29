"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Target } from 'lucide-react';

export interface ProgressMeterProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  position?: 'fixed' | 'static';
  side?: 'left' | 'right';
  isMinimized?: boolean;
  onToggleExpand?: () => void;
  onStepClick?: (stepNumber: number) => void;
  theme?: 'blue' | 'green' | 'purple';
  showStepNumbers?: boolean;
  showLabels?: boolean;
  animationDelay?: number;
}

const ProgressMeter: React.FC<ProgressMeterProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  position = 'fixed',
  side = 'left',
  isMinimized = true,
  onToggleExpand,
  onStepClick,
  theme = 'blue',
  showStepNumbers = true,
  showLabels = false,
  animationDelay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedState, setExpandedState] = useState(!isMinimized);

  // Show component with slight delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const themeClasses = {
    blue: {
      primary: 'bg-blue-600',
      secondary: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-50'
    },
    green: {
      primary: 'bg-green-600',
      secondary: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200',
      hover: 'hover:bg-green-50'
    },
    purple: {
      primary: 'bg-purple-600',
      secondary: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-50'
    }
  };

  const currentTheme = themeClasses[theme];

  const handleToggleExpand = () => {
    setExpandedState(!expandedState);
    onToggleExpand?.();
  };

  const handleStepClick = (stepNumber: number) => {
    onStepClick?.(stepNumber);
  };

  if (!isVisible) return null;

  // Minimized view - small pill
  if (expandedState === false || isMinimized) {
    return (
      <div
        className={`${position === 'fixed' ? 'fixed' : 'relative'} ${
          side === 'left' ? 'left-4' : 'right-4'
        } ${position === 'fixed' ? 'top-1/2 transform -translate-y-1/2 z-40' : ''}`}
      >
        <div
          className={`bg-white rounded-full shadow-lg border ${currentTheme.border} p-2 cursor-pointer transition-all duration-300 hover:shadow-xl ${currentTheme.hover}`}
          onClick={handleToggleExpand}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleExpand();
            }
          }}
          aria-label={`Progress: ${currentStep} of ${totalSteps} steps. Click to expand.`}
        >
          <div className="flex items-center gap-2">
            {/* Progress Circle */}
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={87.96}
                  strokeDashoffset={87.96 - (87.96 * progressPercentage) / 100}
                  className={currentTheme.text}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 0.5s ease-in-out'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {progressPercentage === 100 ? (
                  <CheckCircle className={`w-4 h-4 ${currentTheme.text}`} />
                ) : (
                  <span className={`text-xs font-bold ${currentTheme.text}`}>
                    {currentStep}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow indicator */}
            <ChevronRight className={`w-4 h-4 ${currentTheme.text} transition-transform duration-200`} />
          </div>
        </div>
      </div>
    );
  }

  // Expanded view - full progress panel
  return (
    <div
      className={`${position === 'fixed' ? 'fixed' : 'relative'} ${
        side === 'left' ? 'left-4' : 'right-4'
      } ${position === 'fixed' ? 'top-1/2 transform -translate-y-1/2 z-40' : ''}`}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Target className={`w-5 h-5 ${currentTheme.text}`} />
            <h4 className="font-semibold text-gray-800 text-sm">Progress</h4>
          </div>
          <button
            onClick={handleToggleExpand}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            aria-label="Minimize progress meter"
          >
            <ChevronRight className="w-4 h-4 transform rotate-180" />
          </button>
        </div>

        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span className="font-semibold">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${currentTheme.primary} h-2 rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentStep} of {totalSteps} steps completed
          </div>
        </div>

        {/* Step List */}
        {totalSteps > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Steps</h5>
            {[...Array(totalSteps)].map((_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber <= currentStep;
              const isCurrent = stepNumber === currentStep + 1;
              const stepLabel = stepLabels[index] || `Step ${stepNumber}`;

              return (
                <div
                  key={stepNumber}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                    onStepClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  } ${
                    isCurrent ? `${currentTheme.secondary} ${currentTheme.border} border` : ''
                  }`}
                  onClick={() => onStepClick && handleStepClick(stepNumber)}
                  role={onStepClick ? "button" : undefined}
                  tabIndex={onStepClick ? 0 : undefined}
                  onKeyDown={onStepClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStepClick(stepNumber);
                    }
                  } : undefined}
                  aria-label={onStepClick ? `Navigate to ${stepLabel}` : undefined}
                >
                  {/* Step indicator */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted
                      ? `${currentTheme.primary} text-white`
                      : isCurrent
                      ? `${currentTheme.secondary} ${currentTheme.text} border-2 ${currentTheme.border}`
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : showStepNumbers ? (
                      stepNumber
                    ) : (
                      '○'
                    )}
                  </div>

                  {/* Step label */}
                  {showLabels && (
                    <span className={`text-xs ${
                      isCompleted
                        ? 'text-gray-700 line-through'
                        : isCurrent
                        ? `${currentTheme.text} font-medium`
                        : 'text-gray-500'
                    }`}>
                      {stepLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Completion message */}
        {progressPercentage === 100 && (
          <div className={`mt-4 p-3 ${currentTheme.secondary} rounded-lg border ${currentTheme.border}`}>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${currentTheme.text}`} />
              <span className={`text-sm font-medium ${currentTheme.text}`}>
                All steps completed! 🎉
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressMeter;