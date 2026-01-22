/**
 * Step Indicator Component
 *
 * Single step circle for the workflow progress bar.
 * Shows status with icons and supports hover actions.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Circle,
  Loader2,
  Lock,
  Clock,
  SkipForward,
  MoreVertical,
} from 'lucide-react';
import type { StepIndicatorProps, StepStatus, StepActionType } from '@/lib/types/workflow';

// =============================================================================
// STATUS ICON MAPPING
// =============================================================================

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'completed':
      return <Check className="w-4 h-4 text-white" />;
    case 'in_progress':
      return <Loader2 className="w-4 h-4 text-white animate-spin" />;
    case 'locked':
      return <Lock className="w-3.5 h-3.5 text-gray-500" />;
    case 'snoozed':
      return <Clock className="w-3.5 h-3.5 text-amber-400" />;
    case 'skipped':
      return <SkipForward className="w-3.5 h-3.5 text-gray-400" />;
    default:
      return <Circle className="w-4 h-4 text-gray-500" />;
  }
}

// =============================================================================
// ACTION MENU
// =============================================================================

interface ActionMenuProps {
  onAction: (action: StepActionType) => void;
  onClose: () => void;
  showSkip?: boolean;
}

function ActionMenu({ onAction, onClose, showSkip = true }: ActionMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
    >
      <div className="bg-gh-dark-700 border border-gh-dark-600 rounded-lg shadow-xl py-1 min-w-[120px]">
        <button
          onClick={() => {
            onAction('snooze');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gh-dark-600 hover:text-white transition-colors"
        >
          <Clock className="w-4 h-4 text-amber-400" />
          Snooze
        </button>
        {showSkip && (
          <button
            onClick={() => {
              onAction('skip');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gh-dark-600 hover:text-white transition-colors"
          >
            <SkipForward className="w-4 h-4 text-gray-400" />
            Skip
          </button>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StepIndicator({
  step,
  index,
  isActive,
  showConnector = true,
  onClick,
  onActionClick,
}: StepIndicatorProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getBackgroundColor = () => {
    if (step.status === 'completed') return 'bg-green-500';
    if (isActive) return 'bg-blue-500';
    if (step.status === 'snoozed') return 'bg-amber-500/20 border-amber-500';
    if (step.status === 'skipped') return 'bg-gray-600/50 border-gray-500';
    if (step.status === 'locked') return 'bg-gh-dark-600';
    return 'bg-gh-dark-700 border-gh-dark-500';
  };

  const isClickable = step.status !== 'locked' && onClick;
  const showActions = onActionClick && !['locked', 'completed'].includes(step.status);

  return (
    <div className="relative flex items-center">
      {/* Connector line */}
      {showConnector && index > 0 && (
        <div
          className={`absolute right-full w-8 h-0.5 -mr-1 ${
            step.status === 'completed' || isActive
              ? 'bg-gradient-to-r from-green-500 to-blue-500'
              : 'bg-gh-dark-600'
          }`}
        />
      )}

      {/* Step button */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowMenu(false);
        }}
      >
        <motion.button
          onClick={isClickable ? onClick : undefined}
          disabled={step.status === 'locked'}
          whileHover={isClickable ? { scale: 1.1 } : undefined}
          whileTap={isClickable ? { scale: 0.95 } : undefined}
          className={`
            relative w-10 h-10 rounded-full flex items-center justify-center
            border-2 transition-all duration-200
            ${getBackgroundColor()}
            ${isClickable ? 'cursor-pointer' : 'cursor-default'}
            ${isActive ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gh-dark-800' : ''}
          `}
          title={step.label}
        >
          <StatusIcon status={step.status} />
        </motion.button>

        {/* Action menu trigger */}
        {showActions && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gh-dark-700 border border-gh-dark-500 flex items-center justify-center hover:bg-gh-dark-600 transition-colors"
          >
            <MoreVertical className="w-3 h-3 text-gray-400" />
          </button>
        )}

        {/* Action menu */}
        <AnimatePresence>
          {showMenu && onActionClick && (
            <ActionMenu
              onAction={onActionClick}
              onClose={() => setShowMenu(false)}
              showSkip={!step.required}
            />
          )}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && !showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40"
            >
              <div className="bg-gh-dark-900 border border-gh-dark-600 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                <div className="text-sm text-white font-medium">{step.label}</div>
                <div className="text-xs text-gray-400">{step.description}</div>
                {step.required && (
                  <div className="text-xs text-amber-400 mt-1">Required</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default StepIndicator;
