"use client";

console.log('🟠 PlanningChecklistArtifact LOADED - Build timestamp:', new Date().toISOString());

import React from 'react';
import { CheckSquare } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface PlanningChecklistProps {
  title?: string;
  items: ChecklistItem[];
  onItemToggle?: (itemId: string, completed: boolean) => void;
  onNotYet?: () => void;
  onLetsDoIt?: () => void;
  onGoBack?: () => void;
  showActions?: boolean;
}

const PlanningChecklistArtifact: React.FC<PlanningChecklistProps> = ({
  title = "Let's review what we need to accomplish:",
  items = [],
  onItemToggle,
  onNotYet,
  onLetsDoIt,
  onGoBack,
  showActions = true
}) => {
  // Static display - no interactive state management
  const completedCount = items.filter(item => item.completed).length;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
        <h3 className="text-base font-semibold text-white">Planning Checklist</h3>
        <p className="text-xs text-blue-100 mt-0.5">{title}</p>
      </div>

      {/* Content */}
      <div className="p-5">
        <ul className="space-y-3 mb-5">
          {items.map((item, index) => {
            return (
              <li
                key={item.id}
                data-checklist-item={item.id}
                className="flex items-start gap-3 group"
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-semibold transition-all ${
                  item.completed
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                    : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                }`}>
                  {item.completed ? '✓' : index + 1}
                </div>
                <span className={`text-sm leading-6 transition-all ${
                  item.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-800 font-medium'
                }`}>
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>


        {showActions && (
          <div className="flex gap-2 pt-4">
            <button
              onClick={onLetsDoIt}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
            >
              Let's Do It!
            </button>
            <button
              onClick={onNotYet}
              className="flex-1 bg-white text-gray-700 text-sm font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Not Yet
            </button>
            <button
              onClick={onGoBack}
              className="flex-1 bg-white text-gray-700 text-sm font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningChecklistArtifact;