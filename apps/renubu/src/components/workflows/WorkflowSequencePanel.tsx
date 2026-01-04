'use client';

import React from 'react';
import { ChevronRight, Check, Circle } from 'lucide-react';
import { WorkflowSpec } from '@/config/workflowSequences';

interface WorkflowSequencePanelProps {
  workflows: WorkflowSpec[];
  currentIndex: number;
  onSelectWorkflow: (index: number) => void;
  completedWorkflows: Set<number>;
  isDropdown?: boolean;
}

export default function WorkflowSequencePanel({
  workflows,
  currentIndex,
  onSelectWorkflow,
  completedWorkflows,
  isDropdown = false
}: WorkflowSequencePanelProps) {
  return (
    <div className={`bg-white flex flex-col overflow-hidden ${isDropdown ? 'rounded-b-2xl' : 'border-r border-gray-200 w-80 h-full'}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Workflow Sequence</h3>
        <p className="text-xs text-gray-500 mt-1">
          {currentIndex + 1} of {workflows.length} workflows
        </p>
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto py-4">
        {workflows.map((workflow, index) => {
          const isActive = index === currentIndex;
          const isCompleted = completedWorkflows.has(index);
          const isPast = index < currentIndex;

          return (
            <button
              key={workflow.workflowId}
              onClick={() => onSelectWorkflow(index)}
              className={`
                w-full px-6 py-4 text-left border-l-4 transition-all duration-150
                ${isActive
                  ? 'bg-blue-50 border-blue-600'
                  : isPast || isCompleted
                  ? 'border-green-500 hover:bg-gray-50'
                  : 'border-transparent hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <Circle className="w-2 h-2 text-white fill-current" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Day Label */}
                  {workflow.day && (
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {workflow.day}
                    </div>
                  )}

                  {/* Title */}
                  <div className={`text-sm font-medium mb-1 ${
                    isActive ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {workflow.title}
                  </div>

                  {/* Customer Name */}
                  <div className="text-xs text-gray-600 mb-1">
                    {workflow.customerName}
                  </div>

                  {/* Description */}
                  {workflow.description && (
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {workflow.description}
                    </div>
                  )}
                </div>

                {/* Arrow for active */}
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer with Progress */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span>{completedWorkflows.size} of {workflows.length} complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedWorkflows.size / workflows.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
