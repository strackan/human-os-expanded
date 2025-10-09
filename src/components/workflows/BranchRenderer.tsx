/**
 * Branch Renderer Component
 *
 * Renders individual chat branches with type-specific styling and icons.
 * Supports: fixed, saved_action, llm, rag branch types
 *
 * Phase 2.2a: Chat UI Foundation (Database-driven)
 */

'use client';

import React from 'react';
import {
  ArrowRight,
  MessageSquare,
  Clock,
  AlertCircle,
  Zap,
  Database
} from 'lucide-react';

// =====================================================
// Types
// =====================================================

export interface ChatBranch {
  branch_id: string;
  branch_label: string;
  branch_type: 'fixed' | 'saved_action' | 'llm' | 'rag';
  response_text?: string;
  next_step_id?: string;
  saved_action_id?: string;
  return_to_step?: string;
  llm_handler?: string;
  allow_off_script?: boolean;
}

export interface BranchRendererProps {
  branch: ChatBranch;
  onClick: (branch: ChatBranch) => void;
  disabled?: boolean;
}

// =====================================================
// Branch Type Configurations
// =====================================================

const getBranchConfig = (branchType: ChatBranch['branch_type']) => {
  switch (branchType) {
    case 'fixed':
      return {
        icon: ArrowRight,
        bgColor: 'bg-blue-50',
        hoverBgColor: 'hover:bg-blue-100',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        iconColor: 'text-blue-600',
        description: 'Navigate to next step'
      };

    case 'saved_action':
      return {
        icon: Zap,
        bgColor: 'bg-purple-50',
        hoverBgColor: 'hover:bg-purple-100',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-900',
        iconColor: 'text-purple-600',
        description: 'Execute action'
      };

    case 'llm':
      return {
        icon: MessageSquare,
        bgColor: 'bg-green-50',
        hoverBgColor: 'hover:bg-green-100',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        iconColor: 'text-green-600',
        description: 'Start AI conversation'
      };

    case 'rag':
      return {
        icon: Database,
        bgColor: 'bg-amber-50',
        hoverBgColor: 'hover:bg-amber-100',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-900',
        iconColor: 'text-amber-600',
        description: 'Search knowledge base'
      };

    default:
      return {
        icon: AlertCircle,
        bgColor: 'bg-gray-50',
        hoverBgColor: 'hover:bg-gray-100',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-900',
        iconColor: 'text-gray-600',
        description: 'Unknown action'
      };
  }
};

// =====================================================
// BranchRenderer Component
// =====================================================

export const BranchRenderer: React.FC<BranchRendererProps> = ({
  branch,
  onClick,
  disabled = false
}) => {
  const config = getBranchConfig(branch.branch_type);
  const Icon = config.icon;

  const handleClick = () => {
    if (!disabled) {
      onClick(branch);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-full px-4 py-3 text-left rounded-lg border transition-all
        ${config.bgColor}
        ${config.hoverBgColor}
        ${config.borderColor}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        group
      `}
      aria-label={`${branch.branch_label} - ${config.description}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <div className={`font-medium ${config.textColor}`}>
              {branch.branch_label}
            </div>

            {/* Optional hint text based on branch type */}
            {branch.branch_type === 'llm' && branch.allow_off_script && (
              <div className="text-xs text-green-600 mt-0.5">
                Ask anything about this workflow
              </div>
            )}

            {branch.branch_type === 'saved_action' && branch.saved_action_id?.includes('snooze') && (
              <div className="text-xs text-purple-600 mt-0.5 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Postpone this workflow
              </div>
            )}

            {branch.branch_type === 'rag' && (
              <div className="text-xs text-amber-600 mt-0.5">
                AI will search relevant documents
              </div>
            )}
          </div>
        </div>

        {/* Animated arrow indicator */}
        <div className={`
          flex-shrink-0 ml-2 transition-transform
          ${!disabled && 'group-hover:translate-x-1'}
          ${config.iconColor}
        `}>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
};

// =====================================================
// BranchList Component (Convenience wrapper)
// =====================================================

export interface BranchListProps {
  branches: ChatBranch[];
  onBranchClick: (branch: ChatBranch) => void;
  disabled?: boolean;
  emptyMessage?: string;
}

export const BranchList: React.FC<BranchListProps> = ({
  branches,
  onBranchClick,
  disabled = false,
  emptyMessage = 'No options available'
}) => {
  if (branches.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {branches.map(branch => (
        <BranchRenderer
          key={branch.branch_id}
          branch={branch}
          onClick={onBranchClick}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default BranchRenderer;
