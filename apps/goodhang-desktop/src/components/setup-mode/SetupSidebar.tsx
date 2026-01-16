/**
 * Setup Mode Sidebar
 *
 * Collapsible left navigation showing setup checklist items.
 * v0-style design with progress tracking.
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  Loader2,
  Lock,
  Unlock,
} from 'lucide-react';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'locked';
  artifacts?: string[];
}

interface SetupSidebarProps {
  items: ChecklistItem[];
  currentItemId?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onItemClick: (itemId: string) => void;
  onUnlockProduction?: () => void;
  canUnlock: boolean;
}

export function SetupSidebar({
  items,
  currentItemId,
  collapsed,
  onToggleCollapse,
  onItemClick,
  onUnlockProduction,
  canUnlock,
}: SetupSidebarProps) {
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const totalRequired = items.filter((i) => i.required).length;
  const requiredCompleted = items.filter(
    (i) => i.required && i.status === 'completed'
  ).length;
  const progress = totalRequired > 0 ? (requiredCompleted / totalRequired) * 100 : 0;

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'locked':
        return <Lock className="w-4 h-4 text-gray-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 48 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-gh-dark-800 border-r border-gh-dark-700 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gh-dark-700">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-medium text-white">Setup Mode</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gh-dark-700 rounded transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Checklist */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.status !== 'locked' && onItemClick(item.id)}
                  disabled={item.status === 'locked'}
                  className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all ${
                    currentItemId === item.id
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : item.status === 'locked'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gh-dark-700'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-medium truncate ${
                          item.status === 'completed'
                            ? 'text-green-400'
                            : currentItemId === item.id
                            ? 'text-white'
                            : 'text-gray-300'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.required && (
                        <span className="text-xs text-amber-500">*</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed state - just icons */}
        {collapsed && (
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => item.status !== 'locked' && onItemClick(item.id)}
                disabled={item.status === 'locked'}
                className={`w-full flex justify-center p-2 rounded transition-colors ${
                  currentItemId === item.id
                    ? 'bg-blue-600/20'
                    : 'hover:bg-gh-dark-700'
                }`}
                title={item.label}
              >
                {getStatusIcon(item.status)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress & Unlock */}
      <div className="p-3 border-t border-gh-dark-700">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {completedCount}/{items.length}
                  </span>
                </div>
                <div className="h-1.5 bg-gh-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  />
                </div>
              </div>

              {/* Unlock button */}
              <button
                onClick={onUnlockProduction}
                disabled={!canUnlock}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  canUnlock
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                    : 'bg-gh-dark-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canUnlock ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unlock Production
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed progress indicator */}
        {collapsed && (
          <div className="flex justify-center">
            <div
              className="w-8 h-8 rounded-full border-2 border-gh-dark-600 flex items-center justify-center"
              style={{
                background: `conic-gradient(#22c55e ${progress}%, transparent ${progress}%)`,
              }}
            >
              <div className="w-6 h-6 rounded-full bg-gh-dark-800 flex items-center justify-center">
                <span className="text-xs text-gray-400">{completedCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SetupSidebar;
