/**
 * Step Action Modals
 *
 * Modal dialogs for snooze and skip step actions.
 * Simplified from renubu's implementation.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, SkipForward, Calendar } from 'lucide-react';
import type { StepActionModalsProps, SnoozeDuration } from '@/lib/types/workflow';

// =============================================================================
// SNOOZE MODAL
// =============================================================================

interface SnoozeModalProps {
  isOpen: boolean;
  onConfirm: (until: Date, reason?: string) => void;
  onClose: () => void;
}

const SNOOZE_PRESETS: { label: string; duration: SnoozeDuration; days: number }[] = [
  { label: '1 Day', duration: '1_day', days: 1 },
  { label: '3 Days', duration: '3_days', days: 3 },
  { label: '1 Week', duration: '1_week', days: 7 },
];

function SnoozeModal({ isOpen, onConfirm, onClose }: SnoozeModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<SnoozeDuration | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    let untilDate: Date;

    if (selectedPreset && selectedPreset !== 'custom') {
      const preset = SNOOZE_PRESETS.find((p) => p.duration === selectedPreset);
      untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + (preset?.days ?? 1));
    } else if (customDate) {
      untilDate = new Date(customDate);
    } else {
      return;
    }

    onConfirm(untilDate, reason || undefined);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedPreset(null);
    setCustomDate('');
    setReason('');
  };

  const isValid = selectedPreset || customDate;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gh-dark-800 border border-gh-dark-600 rounded-xl shadow-2xl w-full max-w-md mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gh-dark-700">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Snooze Step</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gh-dark-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-400">
                Postpone this step for later. You can resume it anytime.
              </p>

              {/* Quick presets */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Quick options</label>
                <div className="grid grid-cols-3 gap-2">
                  {SNOOZE_PRESETS.map((preset) => (
                    <button
                      key={preset.duration}
                      onClick={() => {
                        setSelectedPreset(preset.duration);
                        setCustomDate('');
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                        selectedPreset === preset.duration
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-gh-dark-700 border-gh-dark-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom date */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Custom date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Optional reason */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Waiting for data"
                  className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gh-dark-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Snooze
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// SKIP MODAL
// =============================================================================

interface SkipModalProps {
  isOpen: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

function SkipModal({ isOpen, onConfirm, onClose }: SkipModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    onClose();
    setReason('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gh-dark-800 border border-gh-dark-600 rounded-xl shadow-2xl w-full max-w-md mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gh-dark-700">
              <div className="flex items-center gap-2">
                <SkipForward className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Skip Step</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gh-dark-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-400">
                You can skip this step, but please provide a reason.
              </p>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">Why are you skipping this step?</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Not applicable to my situation"
                  rows={3}
                  className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gh-dark-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!reason.trim()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StepActionModals({
  isSnoozeOpen,
  isSkipOpen,
  stepId,
  onSnoozeConfirm,
  onSkipConfirm,
  onClose,
}: StepActionModalsProps) {
  return (
    <>
      <SnoozeModal
        isOpen={isSnoozeOpen && !!stepId}
        onConfirm={onSnoozeConfirm}
        onClose={onClose}
      />
      <SkipModal
        isOpen={isSkipOpen && !!stepId}
        onConfirm={onSkipConfirm}
        onClose={onClose}
      />
    </>
  );
}

export default StepActionModals;
