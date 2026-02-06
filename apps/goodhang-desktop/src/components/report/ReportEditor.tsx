/**
 * Report Editor Component
 *
 * Tutorial-specific wrapper for ReportView with edit functionality.
 * Adds confirmation buttons and reset capability.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCw, Sparkles, Play } from 'lucide-react';
import type { ExecutiveReport, CharacterProfile, ReportConfirmations } from '@/lib/types';
import { ReportView, type ReportTab } from './ReportView';

const ASSESSMENT_STORAGE_KEY = 'goodhang-dnd-assessment-progress';

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
  /** Callback when all sections are confirmed (Looks Good clicked) */
  onConfirmSection: () => void;
  /** Original report for comparison (shows reset if modified) */
  originalReport?: ExecutiveReport | null;
  /** Callback to reset edits */
  onResetEdits?: () => void;
  /** Callback when user wants to take character assessment */
  onTakeAssessment?: () => void;
  /** Callback for inline field edits (double-click to edit) */
  onFieldEdit?: (field: string, index: number, value: string) => void;
  /** Whether the user has completed the GoodHang assessment */
  hasCompletedAssessment?: boolean;
  /** Optional: callback when user clicks Continue (after all confirmed) */
  onContinue?: () => void;
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
  originalReport,
  onResetEdits,
  onTakeAssessment,
  onFieldEdit,
  hasCompletedAssessment: _hasCompletedAssessment = false,
  onContinue,
  className = '',
}: ReportEditorProps) {
  const allSectionsConfirmed =
    confirmations.status &&
    confirmations.personality &&
    confirmations.voice &&
    confirmations.character;

  // Character assessment is complete ONLY if we have actual character data to display
  // Backend status alone is not enough - we need the data to show "Looks Good"
  const hasCharacterData = !!(characterProfile?.race && characterProfile?.alignment);
  // For Character tab: require actual data, not just backend status
  // For other purposes (like showing checkmark): backend status is fine
  const assessmentCompleteWithData = hasCharacterData;

  // Check if there's saved assessment progress (for "Resume Assessment" button)
  const [hasAssessmentProgress, setHasAssessmentProgress] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
      if (saved) {
        const { answers } = JSON.parse(saved);
        setHasAssessmentProgress(answers && Object.keys(answers).length > 0);
      } else {
        setHasAssessmentProgress(false);
      }
    } catch {
      setHasAssessmentProgress(false);
    }
  }, [activeTab]); // Re-check when tab changes

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
          <div className="flex gap-2 items-center">
            {/* Character tab: show Take/Resume Assessment if no character data */}
            {activeTab === 'character' && !assessmentCompleteWithData && !confirmations.character && onTakeAssessment && (
              <button
                onClick={onTakeAssessment}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                {hasAssessmentProgress ? (
                  <>
                    <Play className="w-4 h-4" />
                    Resume Assessment
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Take Assessment
                  </>
                )}
              </button>
            )}
            {/* Per-tab "Looks Good" button */}
            {/* For non-character tabs: always available (data from Sculptor) */}
            {/* For character tab: only when we have actual character data to display */}
            {!confirmations[activeTab] && !allSectionsConfirmed &&
             (activeTab !== 'character' || assessmentCompleteWithData) && (
              <button
                onClick={onConfirmSection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Looks Good
              </button>
            )}
            {allSectionsConfirmed && onContinue && (
              <button
                onClick={onContinue}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Continue
              </button>
            )}
            {allSectionsConfirmed && !onContinue && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 text-sm rounded-lg border border-green-600/30">
                <Sparkles className="w-4 h-4" />
                <span>All sections confirmed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ReportEditor;
