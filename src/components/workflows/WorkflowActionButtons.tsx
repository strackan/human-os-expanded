'use client';

/**
 * Workflow Action Buttons
 *
 * Provides snooze, skip, and escalate actions for workflows.
 * Displays in workflow header for easy access.
 */

import React, { useState } from 'react';
import { Clock, X, UserPlus } from 'lucide-react';
import { WorkflowActionService } from '@/lib/workflows/actions';
import { EnhancedSnoozeModal } from './EnhancedSnoozeModal';
import { WakeTrigger } from '@/types/wake-triggers';

interface WorkflowActionButtonsProps {
  executionId: string;
  userId: string;
  currentStatus: string;
  onActionComplete?: (actionType: string) => void;
  className?: string;
}

export default function WorkflowActionButtons({
  executionId,
  userId,
  currentStatus,
  onActionComplete,
  className = '',
}: WorkflowActionButtonsProps) {
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSnoozeClick = () => {
    setShowSnoozeModal(true);
  };

  const handleSkipClick = () => {
    setShowSkipModal(true);
  };

  const handleEscalateClick = () => {
    setShowEscalateModal(true);
  };

  // Don't show buttons for terminal states
  if (['completed', 'rejected', 'lost', 'skipped'].includes(currentStatus)) {
    return null;
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Snooze Button */}
        <button
          onClick={handleSnoozeClick}
          disabled={isProcessing || currentStatus === 'snoozed'}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Snooze workflow"
        >
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Snooze</span>
        </button>

        {/* Skip Button */}
        <button
          onClick={handleSkipClick}
          disabled={isProcessing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Skip workflow"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Skip</span>
        </button>

        {/* Escalate Button */}
        <button
          onClick={handleEscalateClick}
          disabled={isProcessing || currentStatus === 'escalated'}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Escalate to another user"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Escalate</span>
        </button>
      </div>

      {/* Modals */}
      {showSnoozeModal && (
        <EnhancedSnoozeModal
          workflowId={executionId}
          isOpen={showSnoozeModal}
          onClose={() => setShowSnoozeModal(false)}
          onSnooze={async (triggers: WakeTrigger[]) => {
            setIsProcessing(true);
            try {
              const service = new WorkflowActionService();
              const result = await service.snoozeWorkflowWithTriggers(executionId, userId, triggers);
              if (result.success) {
                setShowSnoozeModal(false);
                onActionComplete?.('snooze');
              } else {
                throw new Error(result.error || 'Failed to snooze workflow');
              }
            } finally {
              setIsProcessing(false);
            }
          }}
        />
      )}

      {showSkipModal && (
        <SkipModal
          executionId={executionId}
          userId={userId}
          onClose={() => setShowSkipModal(false)}
          onSuccess={() => {
            setShowSkipModal(false);
            onActionComplete?.('skip');
          }}
          setIsProcessing={setIsProcessing}
        />
      )}

      {showEscalateModal && (
        <EscalateModal
          executionId={executionId}
          userId={userId}
          onClose={() => setShowEscalateModal(false)}
          onSuccess={() => {
            setShowEscalateModal(false);
            onActionComplete?.('escalate');
          }}
          setIsProcessing={setIsProcessing}
        />
      )}
    </>
  );
}

// Note: SnoozeModal has been replaced by EnhancedSnoozeModal component

// Skip Modal Component
interface SkipModalProps {
  executionId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  setIsProcessing: (processing: boolean) => void;
}

function SkipModal({ executionId, userId, onClose, onSuccess, setIsProcessing }: SkipModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSkip = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for skipping');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const service = new WorkflowActionService();
      const result = await service.skipWorkflow(executionId, userId, { reason });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to skip workflow');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-900">Skip Workflow</h3>

        <p className="text-sm text-gray-600 mb-4">
          Skipping this workflow will permanently remove it from your active list. This action cannot be undone.
        </p>

        <div className="space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Reason for skipping: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer not interested, duplicate workflow, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Skip Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

// Escalate Modal Component (placeholder - will be enhanced with user selector)
interface EscalateModalProps {
  executionId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  setIsProcessing: (processing: boolean) => void;
}

function EscalateModal({ executionId, userId, onClose, onSuccess, setIsProcessing }: EscalateModalProps) {
  const [toUserId, setToUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Search users when query changes
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    setShowDropdown(true);

    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setIsLoadingUsers(true);
    try {
      // Use API instead of direct Supabase
      const response = await fetch(`/api/team/members?search=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      const data = await response.json();
      setUsers(data.members || []);
    } catch (err: any) {
      console.error('Error searching users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const selectUser = (user: {id: string, full_name: string, email: string}) => {
    setToUserId(user.id);
    setSearchQuery(`${user.full_name} (${user.email})`);
    setShowDropdown(false);
  };

  const handleEscalate = async () => {
    if (!toUserId.trim()) {
      setError('Please select a user to escalate to');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const service = new WorkflowActionService();
      const result = await service.escalateWorkflow(executionId, userId, {
        toUserId,
        reason,
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to escalate workflow');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-900">Escalate Workflow</h3>

        <p className="text-sm text-gray-600 mb-4">
          Escalate this workflow to another team member. You&apos;ll be able to monitor progress but won&apos;t be able to manage it.
        </p>

        <div className="space-y-4">
          {/* User Selector with Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Escalate to: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {isLoadingUsers ? (
                  <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </button>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">No users found</div>
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">Type at least 2 characters to search</div>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Reason (optional):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Requires senior review, technical expertise needed, etc."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleEscalate}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Escalate
          </button>
        </div>
      </div>
    </div>
  );
}
