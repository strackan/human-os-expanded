"use client";

import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

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
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set((items || []).filter(item => item.completed).map(item => item.id))
  );

  const handleToggle = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems);
    const isChecked = newCheckedItems.has(itemId);

    if (isChecked) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
    }

    setCheckedItems(newCheckedItems);
    onItemToggle?.(itemId, !isChecked);
  };

  const allItemsCompleted = items.length > 0 && items.every(item => checkedItems.has(item.id));

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
      <div className="bg-gray-50 border-b border-gray-300 px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckSquare size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Planning Checklist</h3>
            <p className="text-sm text-gray-600">{title}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 mb-6">
          {items.map((item) => {
            const isChecked = checkedItems.has(item.id);
            return (
              <div
                key={item.id}
                data-checklist-item={item.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => handleToggle(item.id)}
              >
                {isChecked ? (
                  <CheckSquare size={20} className="text-green-600 flex-shrink-0" />
                ) : (
                  <Square size={20} className="text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm ${isChecked ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{checkedItems.size} of {items.length} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(checkedItems.size / items.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {showActions && (
          <>
            <div className="border-t border-gray-200 pt-4 mb-4">
              <p className="text-lg font-medium text-gray-900 mb-2">Ready To Get Started?</p>
              <p className="text-sm text-gray-600">
                {allItemsCompleted
                  ? "Great! All items are complete. Ready to proceed?"
                  : "You can proceed now or complete the checklist items first."
                }
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={onLetsDoIt}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  allItemsCompleted
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Let's Do It!
              </button>

              <button
                onClick={onNotYet}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Not Yet
              </button>

              {onGoBack && (
                <button
                  onClick={onGoBack}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Go Back
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanningChecklistArtifact;