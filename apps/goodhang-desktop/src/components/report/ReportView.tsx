/**
 * Report View Component
 *
 * Pure display component for executive reports.
 * Shows report content across tabs without edit functionality.
 * Highly reusable across dashboard, settings, profile pages.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { User, Brain, Mic, Sword, CheckCircle2 } from 'lucide-react';
import type { ExecutiveReport, CharacterProfile } from '@/lib/types';
import { StatusTab, PersonalityTab, VoiceTab, CharacterTab } from './ReportTabContent';

// =============================================================================
// TYPES
// =============================================================================

export type ReportTab = 'status' | 'personality' | 'voice' | 'character';

export interface ReportViewProps {
  report: ExecutiveReport;
  characterProfile?: CharacterProfile | null;
  /** Currently active tab */
  activeTab: ReportTab;
  /** Callback when tab changes */
  onTabChange: (tab: ReportTab) => void;
  /** Optional: show confirmation checkmarks on tabs */
  confirmations?: Record<ReportTab, boolean>;
  /** Optional: custom className for the container */
  className?: string;
  /** Optional: callback for inline edits (enables double-click editing) */
  onEdit?: (field: string, index: number, value: string) => void;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

const TABS: Array<{ id: ReportTab; label: string; icon: typeof User }> = [
  { id: 'status', label: 'Status', icon: User },
  { id: 'personality', label: 'Personality', icon: Brain },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'character', label: 'Character', icon: Sword },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ReportView({
  report,
  characterProfile = null,
  activeTab,
  onTabChange,
  confirmations,
  className = '',
  onEdit,
}: ReportViewProps) {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'status':
        return <StatusTab report={report} onEdit={onEdit} />;
      case 'personality':
        return <PersonalityTab report={report} onEdit={onEdit} />;
      case 'voice':
        return <VoiceTab report={report} onEdit={onEdit} />;
      case 'character':
        return <CharacterTab characterProfile={characterProfile} />;
    }
  };

  return (
    <div
      className={`bg-gh-dark-800 rounded-xl overflow-hidden flex flex-col ${className}`}
    >
      {/* Tabs */}
      <div className="flex border-b border-gh-dark-700 flex-shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isConfirmed = confirmations?.[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? 'text-white bg-gh-dark-700/50'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gh-dark-700/30'
              }`}
            >
              {isConfirmed ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="reportActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto scrollbar-minimal">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ReportView;
