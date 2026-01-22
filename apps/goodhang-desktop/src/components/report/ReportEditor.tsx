/**
 * Report Editor Component
 *
 * Tutorial-specific wrapper for ReportView with edit functionality.
 * Adds confirmation buttons and reset capability.
 */

import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import type { ExecutiveReport, CharacterProfile, ReportConfirmations } from '@/lib/types';
import { ReportView, type ReportTab } from './ReportView';

// =============================================================================
// TYPES
// =============================================================================

export interface ReportEditorProps {
  report: ExecutiveReport;
  characterProfile?: CharacterProfile | null;
  /** Currently active tab */
  activeTab: ReportTab;
  /** Callback when tab changes */
  onTabChange: (tab: ReportTab) => void;
  /** Track which sections are confirmed */
  confirmations: ReportConfirmations;
  /** Callback when current section is confirmed */
  onConfirmSection: () => void;
  /** Callback when all sections confirmed and user continues */
  onContinue: () => void;
  /** Original report for comparison (shows reset if modified) */
  originalReport?: ExecutiveReport | null;
  /** Callback to reset edits */
  onResetEdits?: () => void;
  /** Callback when user wants to take character assessment */
  onTakeAssessment?: () => void;
  /** Callback for inline field edits (double-click to edit) */
  onFieldEdit?: (field: string, index: number, value: string) => void;
  /** Optional: custom className for the container */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReportEditor({
  report,
  characterProfile = null,
  activeTab,
  onTabChange,
  confirmations,
  onConfirmSection,
  onContinue,
  originalReport,
  onResetEdits,
  onTakeAssessment,
  onFieldEdit,
  className = '',
}: ReportEditorProps) {
  const allSectionsConfirmed =
    confirmations.status &&
    confirmations.personality &&
    confirmations.voice &&
    confirmations.character;

  const confirmedCount = Object.values(confirmations).filter(Boolean).length;

  const isModified =
    originalReport &&
    report &&
    JSON.stringify(report) !== JSON.stringify(originalReport);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full h-full flex flex-col ${className}`}
    >
      {/* Report View */}
      <ReportView
        report={report}
        characterProfile={characterProfile}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTakeAssessment={onTakeAssessment}
        confirmations={confirmations}
        className="rounded-b-none flex-1 min-h-0"
        onEdit={onFieldEdit}
      />

      {/* Editor Controls */}
      <div className="bg-gh-dark-800 rounded-b-xl border-t border-gh-dark-700 p-3">
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {confirmedCount} of 4 confirmed
            </span>
            {isModified && onResetEdits && (
              <button
                onClick={onResetEdits}
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {!confirmations[activeTab] && (
              <button
                onClick={onConfirmSection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Looks Good
              </button>
            )}
            {allSectionsConfirmed && (
              <button
                onClick={onContinue}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ReportEditor;
