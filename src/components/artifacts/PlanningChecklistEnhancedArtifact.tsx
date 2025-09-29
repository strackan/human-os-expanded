"use client";

import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Sparkles, TrendingUp, Calendar, Users } from 'lucide-react';

export interface EnhancedChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  chapterNumber?: number; // For anchor linking to chapters
  icon?: string;
  description?: string;
}

export interface PlanningChecklistEnhancedProps {
  title?: string;
  subtitle?: string;
  items: EnhancedChecklistItem[];
  onItemToggle?: (itemId: string, completed: boolean) => void;
  onChapterNavigation?: (chapterNumber: number) => void; // New prop for chapter navigation
  onNotYet?: () => void;
  onLetsDoIt?: () => void;
  onGoBack?: () => void;
  showActions?: boolean;
  enableAnimations?: boolean;
  theme?: 'professional' | 'vibrant';
}

const PlanningChecklistEnhancedArtifact: React.FC<PlanningChecklistEnhancedProps> = ({
  title = "Let's review what we need to accomplish:",
  subtitle = "Click any item to navigate to that section of the plan",
  items = [],
  onItemToggle,
  onChapterNavigation,
  onNotYet,
  onLetsDoIt,
  onGoBack,
  showActions = true,
  enableAnimations = true,
  theme = 'professional'
}) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set((items || []).filter(item => item.completed).map(item => item.id))
  );
  const [recentlyChecked, setRecentlyChecked] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleToggle = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems);
    const isChecked = newCheckedItems.has(itemId);

    if (isChecked) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
      setRecentlyChecked(itemId);

      // Trigger confetti if all items are now completed
      if (newCheckedItems.size === items.length && enableAnimations) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }

    setCheckedItems(newCheckedItems);
    onItemToggle?.(itemId, !isChecked);
  };

  const handleItemClick = (item: EnhancedChecklistItem) => {
    // If item has a chapter number, navigate to it
    if (item.chapterNumber && onChapterNavigation) {
      onChapterNavigation(item.chapterNumber);
    } else {
      // Otherwise, just toggle the item
      handleToggle(item.id);
    }
  };

  // Clear recently checked animation after delay
  useEffect(() => {
    if (recentlyChecked) {
      const timer = setTimeout(() => setRecentlyChecked(null), 600);
      return () => clearTimeout(timer);
    }
  }, [recentlyChecked]);

  const allItemsCompleted = items.length > 0 && items.every(item => checkedItems.has(item.id));
  const completionPercentage = items.length > 0 ? (checkedItems.size / items.length) * 100 : 0;

  const themeClasses = {
    professional: {
      container: "bg-white border border-gray-300 rounded-lg shadow-lg",
      header: "bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-300",
      icon: "bg-blue-100 text-blue-600",
      progressBar: "bg-blue-600",
      checkIcon: "text-green-600",
      uncheckedIcon: "text-gray-400"
    },
    vibrant: {
      container: "bg-white border border-purple-200 rounded-lg shadow-xl",
      header: "bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200",
      icon: "bg-purple-100 text-purple-600",
      progressBar: "bg-gradient-to-r from-purple-600 to-pink-600",
      checkIcon: "text-emerald-600",
      uncheckedIcon: "text-gray-400"
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`${currentTheme.container} ${enableAnimations ? 'transform transition-all duration-300' : ''}`}>
      {/* Confetti Effect */}
      {showConfetti && enableAnimations && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className={`${currentTheme.header} px-6 py-4 rounded-t-lg`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${currentTheme.icon} rounded-full flex items-center justify-center relative`}>
            {allItemsCompleted && enableAnimations ? (
              <Sparkles size={20} className={`${theme === 'professional' ? 'text-blue-600' : 'text-purple-600'} animate-pulse`} />
            ) : (
              <CheckSquare size={20} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Planning Checklist
              {allItemsCompleted && (
                <span className="text-green-600 animate-pulse">✨</span>
              )}
            </h3>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          {theme === 'vibrant' && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <Calendar className="w-4 h-4 text-pink-500" />
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Progress Overview */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Progress Overview</span>
            <span className="font-semibold text-gray-800">
              {checkedItems.size} of {items.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 relative overflow-hidden">
            <div
              className={`${currentTheme.progressBar} h-3 rounded-full transition-all duration-700 ease-out relative`}
              style={{ width: `${completionPercentage}%` }}
            >
              {enableAnimations && completionPercentage > 0 && (
                <div className="absolute inset-0 bg-white opacity-30 animate-pulse rounded-full"></div>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {completionPercentage === 100 ? (
              <span className="text-green-600 font-medium">🎉 All tasks completed! Ready to proceed.</span>
            ) : (
              <span>{Math.round(completionPercentage)}% complete - {items.length - checkedItems.size} remaining</span>
            )}
          </div>
        </div>

        {/* Enhanced Checklist Items */}
        <div className="space-y-3 mb-6">
          {items.map((item, index) => {
            const isChecked = checkedItems.has(item.id);
            const isRecentlyChecked = recentlyChecked === item.id;
            const hasChapterNavigation = item.chapterNumber !== undefined;

            return (
              <div
                key={item.id}
                className={`group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                  hasChapterNavigation ? 'cursor-pointer hover:shadow-md' : 'cursor-pointer'
                } ${
                  isChecked
                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                } ${
                  isRecentlyChecked && enableAnimations ? 'animate-pulse scale-105' : ''
                }`}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={hasChapterNavigation ? `${item.label} - Click to navigate to chapter ${item.chapterNumber}` : item.label}
              >
                {/* Completion Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isChecked ? (
                    <CheckSquare
                      size={20}
                      className={`${currentTheme.checkIcon} ${enableAnimations ? 'transform transition-all duration-300 scale-110' : ''}`}
                    />
                  ) : (
                    <Square
                      size={20}
                      className={`${currentTheme.uncheckedIcon} group-hover:text-gray-600 transition-colors`}
                    />
                  )}
                </div>

                {/* Item Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <span className="text-base">{item.icon}</span>
                    )}
                    <span className={`text-sm font-medium transition-all duration-300 ${
                      isChecked
                        ? 'text-green-800 line-through'
                        : 'text-gray-800 group-hover:text-gray-900'
                    }`}>
                      {item.label}
                    </span>
                    {hasChapterNavigation && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Chapter {item.chapterNumber}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className={`text-xs mt-1 transition-colors ${
                      isChecked ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Navigation Hint */}
                {hasChapterNavigation && !isChecked && (
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-blue-600 font-medium">→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <>
            <div className="border-t border-gray-200 pt-6 mb-4">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {allItemsCompleted ? "Outstanding! 🎯" : "Ready To Get Started?"}
                </p>
                <p className="text-sm text-gray-600">
                  {allItemsCompleted
                    ? "All planning tasks are complete. You're ready to move forward with confidence!"
                    : "You can proceed now or complete the checklist items first by clicking on them."
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={onLetsDoIt}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  allItemsCompleted
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                } ${enableAnimations ? 'transform transition-all duration-200' : ''}`}
              >
                {allItemsCompleted && <Sparkles className="w-4 h-4" />}
                Let's Do It!
              </button>

              <button
                onClick={onNotYet}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Not Yet
              </button>

              {onGoBack && (
                <button
                  onClick={onGoBack}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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

export default PlanningChecklistEnhancedArtifact;