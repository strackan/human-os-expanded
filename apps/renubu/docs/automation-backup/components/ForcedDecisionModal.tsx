/**
 * ForcedDecisionModal Component
 *
 * Modal shown when task hits 7-day snooze limit.
 * CANNOT be dismissed without user making a choice:
 * - Take action (complete the task)
 * - Skip forever
 * - If user tries to close → Auto-skip (per requirement)
 *
 * Features:
 * - Backdrop click disabled
 * - ESC key disabled
 * - Close button triggers auto-skip warning
 * - Clear warning messaging
 */

import React, { useState, useEffect } from 'react';
import type { WorkflowTask } from '../task-types-frontend';

interface ForcedDecisionModalProps {
  task: WorkflowTask;
  open: boolean;
  onAction: () => void;
  onSkip: () => void;
  onDismiss: () => void; // Auto-skip
}

export const ForcedDecisionModal: React.FC<ForcedDecisionModalProps> = ({
  task,
  open,
  onAction,
  onSkip,
  onDismiss
}) => {
  const [showDismissWarning, setShowDismissWarning] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Reset warning state when modal opens/closes
  useEffect(() => {
    if (open) {
      setShowDismissWarning(false);
      setCountdown(5);
    }
  }, [open]);

  // Countdown for auto-skip
  useEffect(() => {
    if (showDismissWarning && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showDismissWarning && countdown === 0) {
      onDismiss();
    }
  }, [showDismissWarning, countdown, onDismiss]);

  // Prevent ESC key from closing modal
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAttemptedClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleAttemptedClose = () => {
    if (!showDismissWarning) {
      setShowDismissWarning(true);
    }
  };

  const handleCancelDismiss = () => {
    setShowDismissWarning(false);
    setCountdown(5);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleAttemptedClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {!showDismissWarning ? (
          // Main decision UI
          <>
            <div className="modal-header">
              <div className="modal-icon">⏰</div>
              <h2 className="modal-title">Task Requires Decision</h2>
              <button
                className="modal-close-btn"
                onClick={handleAttemptedClose}
                aria-label="Attempt to close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-message">
                <div className="warning-icon">⚠️</div>
                <div>
                  <p className="warning-title">7-Day Snooze Limit Reached</p>
                  <p className="warning-text">
                    This task has been snoozed for 7 days. You must take action or skip it to continue.
                  </p>
                </div>
              </div>

              <div className="task-details">
                <div className="task-detail-label">Task:</div>
                <div className="task-detail-value">{task.description}</div>

                <div className="task-detail-label">Action Required:</div>
                <div className="task-detail-value">{task.action}</div>

                <div className="task-detail-label">Owner:</div>
                <div className="task-detail-value">{task.owner}</div>

                <div className="task-detail-label">Snooze Count:</div>
                <div className="task-detail-value">{task.snoozeCount} times</div>

                <div className="task-detail-label">First Snoozed:</div>
                <div className="task-detail-value">
                  {task.firstSnoozedAt
                    ? new Date(task.firstSnoozedAt).toLocaleDateString()
                    : 'Unknown'}
                </div>
              </div>

              <div className="decision-prompt">
                <p className="decision-text">
                  <strong>What would you like to do?</strong>
                </p>
                <p className="decision-subtext">
                  You cannot close this dialog without making a choice.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={onAction}
                className="decision-btn decision-btn-primary"
                aria-label="Take action on task"
              >
                ✅ Take Action Now
              </button>
              <button
                onClick={onSkip}
                className="decision-btn decision-btn-danger"
                aria-label="Skip task forever"
              >
                ⏭️ Skip Forever
              </button>
            </div>

            <div className="modal-hint">
              <small>
                💡 Tip: Attempting to close this dialog will automatically skip the task.
              </small>
            </div>
          </>
        ) : (
          // Auto-skip warning
          <>
            <div className="modal-header">
              <div className="modal-icon warning">🚨</div>
              <h2 className="modal-title">Auto-Skip Warning</h2>
            </div>

            <div className="modal-body">
              <div className="auto-skip-warning">
                <p className="auto-skip-text">
                  Closing this dialog without making a choice will <strong>automatically skip</strong> this task.
                </p>
                <p className="auto-skip-countdown">
                  Auto-skipping in <span className="countdown-number">{countdown}</span> second
                  {countdown !== 1 ? 's' : ''}...
                </p>
              </div>

              <div className="task-summary">
                <strong>Task:</strong> {task.description}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={handleCancelDismiss}
                className="decision-btn decision-btn-secondary"
                aria-label="Go back to decision"
              >
                ← Go Back
              </button>
              <button
                onClick={onDismiss}
                className="decision-btn decision-btn-danger"
                aria-label="Confirm auto-skip"
              >
                Skip Now
              </button>
            </div>
          </>
        )}
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .modal-icon {
          font-size: 32px;
        }

        .modal-icon.warning {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .modal-title {
          flex: 1;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: color 0.2s;
        }

        .modal-close-btn:hover {
          color: #ef4444;
        }

        .modal-body {
          padding: 24px;
        }

        .warning-message {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #fef2f2;
          border: 2px solid #dc2626;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .warning-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .warning-title {
          font-size: 16px;
          font-weight: 700;
          color: #991b1b;
          margin: 0 0 4px 0;
        }

        .warning-text {
          font-size: 14px;
          color: #7f1d1d;
          margin: 0;
          line-height: 1.5;
        }

        .task-details {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .task-detail-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
        }

        .task-detail-value {
          color: #111827;
          font-size: 14px;
        }

        .decision-prompt {
          text-align: center;
          margin-bottom: 16px;
        }

        .decision-text {
          font-size: 16px;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .decision-subtext {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .decision-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .decision-btn-primary {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .decision-btn-primary:hover {
          background: #059669;
          border-color: #059669;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .decision-btn-danger {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .decision-btn-danger:hover {
          background: #dc2626;
          border-color: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .decision-btn-secondary {
          background: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .decision-btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .modal-hint {
          padding: 12px 24px;
          background: #fef3c7;
          text-align: center;
          color: #78350f;
        }

        .auto-skip-warning {
          text-align: center;
          padding: 24px;
          background: #fef2f2;
          border: 2px solid #ef4444;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .auto-skip-text {
          font-size: 16px;
          color: #991b1b;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .auto-skip-countdown {
          font-size: 18px;
          font-weight: 700;
          color: #dc2626;
          margin: 0;
        }

        .countdown-number {
          display: inline-block;
          font-size: 32px;
          color: #dc2626;
          animation: countdown-pulse 1s infinite;
        }

        @keyframes countdown-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .task-summary {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          text-align: center;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default ForcedDecisionModal;
