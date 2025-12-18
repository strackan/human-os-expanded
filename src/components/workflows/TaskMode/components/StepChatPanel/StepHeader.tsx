'use client';

/**
 * StepHeader - Header for collapsible step container
 *
 * Shows:
 * - Status icon (pending/active/success/error/snoozed)
 * - Step title (double-click to edit)
 * - Pin button (on hover)
 * - Expand/collapse chevron
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Pin,
  PinOff,
} from 'lucide-react';
import type { StepHeaderProps } from '../../types/step-chat';
import { getStepDisplayTitle } from '../../types/step-chat';

/**
 * Status icon component
 */
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <div className="w-3 h-3 rounded-full bg-gray-300" />
      );
    case 'active':
      return (
        <div className="relative w-3 h-3">
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
          <div className="relative w-3 h-3 rounded-full bg-blue-500" />
        </div>
      );
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'snoozed':
      return <Clock className="w-4 h-4 text-purple-400" />;
    default:
      return <div className="w-3 h-3 rounded-full bg-gray-300" />;
  }
}

export function StepHeader({
  step,
  isExpanded,
  isPinned,
  onToggle,
  onTogglePin,
  onTitleChange,
  isCurrentStep,
}: StepHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = getStepDisplayTitle(step);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(displayTitle);
    setIsEditing(true);
  }, [displayTitle]);

  const handleTitleSubmit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== displayTitle) {
      onTitleChange(trimmed);
    }
    setIsEditing(false);
  }, [editValue, displayTitle, onTitleChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTitleSubmit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
    },
    [handleTitleSubmit]
  );

  const handlePinClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePin();
    },
    [onTogglePin]
  );

  // Determine background based on state
  const bgClass = isCurrentStep
    ? 'bg-blue-50 hover:bg-blue-100'
    : step.status === 'success'
    ? 'bg-green-50/50 hover:bg-green-50'
    : step.status === 'snoozed'
    ? 'bg-purple-50/50 hover:bg-purple-50'
    : 'bg-white hover:bg-gray-50';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${bgClass}`}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-expanded={isExpanded}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        <StatusIcon status={step.status} />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 text-sm font-medium bg-white border border-blue-300 rounded
                       focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        ) : (
          <span
            className="text-sm font-medium text-gray-900 truncate block"
            onDoubleClick={handleDoubleClick}
            title={displayTitle}
          >
            {displayTitle}
          </span>
        )}
        {step.slideLabel && step.slideLabel !== displayTitle && (
          <span className="text-xs text-gray-500">{step.slideLabel}</span>
        )}
      </div>

      {/* Pin button (shown on hover or when pinned) */}
      {(isHovered || isPinned) && (
        <button
          onClick={handlePinClick}
          className={`p-1 rounded transition-colors ${
            isPinned
              ? 'text-blue-500 hover:text-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title={isPinned ? 'Unpin step' : 'Pin step'}
        >
          {isPinned ? (
            <PinOff className="w-3.5 h-3.5" />
          ) : (
            <Pin className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Expand/Collapse chevron */}
      <div className="flex-shrink-0 text-gray-400">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </div>
    </div>
  );
}

export default StepHeader;
