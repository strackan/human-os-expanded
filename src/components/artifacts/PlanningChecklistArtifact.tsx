"use client";

console.log('🟠 PlanningChecklistArtifact LOADED - Build timestamp:', new Date().toISOString());

import React from 'react';

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

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-indigo-50/30">
        <h3 className="text-lg font-semibold text-gray-900">Planning Checklist</h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <ul className="space-y-4">
          {items.map((item, index) => {
            return (
              <li
                key={item.id}
                data-checklist-item={item.id}
                className="flex items-start gap-4"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm ${
                  item.completed
                    ? 'bg-green-100 text-green-700 border-2 border-green-200'
                    : 'bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 border-2 border-purple-200'
                }`}>
                  {item.completed ? '✓' : index + 1}
                </div>
                <span className={`text-sm leading-8 ${
                  item.completed
                    ? 'text-gray-400 line-through'
                    : 'text-gray-800 font-medium'
                }`}>
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {showActions && (
        <div className="px-8 py-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onLetsDoIt}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-3 px-4 rounded-lg hover:bg-blue-700"
          >
            Let's Do It!
          </button>
          <button
            onClick={onNotYet}
            className="px-4 py-3 text-gray-600 text-sm font-medium hover:text-gray-900"
          >
            Not Yet
          </button>
          <button
            onClick={onGoBack}
            className="px-4 py-3 text-gray-600 text-sm font-medium hover:text-gray-900"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanningChecklistArtifact;