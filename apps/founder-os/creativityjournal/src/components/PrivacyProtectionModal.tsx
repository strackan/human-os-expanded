'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';

interface PrivacyProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetPrivacy: (password: string) => Promise<void>;
  onRemovePrivacy: (password: string) => Promise<void>;
  isCurrentlyPrivate: boolean;
}

export default function PrivacyProtectionModal({
  isOpen,
  onClose,
  onSetPrivacy,
  onRemovePrivacy,
  isCurrentlyPrivate
}: PrivacyProtectionModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on password input when modal opens
  useEffect(() => {
    if (isOpen && passwordInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isCurrentlyPrivate) {
      // Setting privacy - require password confirmation
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else {
      // Removing privacy - just require current password
      if (!password) {
        setError('Password required');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isCurrentlyPrivate) {
        await onRemovePrivacy(password);
      } else {
        await onSetPrivacy(password);
      }
      
      // Reset form
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to update privacy settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={isCurrentlyPrivate ? 'Remove Privacy Protection' : 'Set Privacy Protection'}
      size="sm"
    >
      <div>

        {!isCurrentlyPrivate && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Privacy Protection:</strong> This entry will be password protected. 
              The content will be hidden and require a password to view.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {isCurrentlyPrivate ? 'Current Password' : 'Password'}
            </label>
            <input
              type="password"
              id="password"
              ref={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={isCurrentlyPrivate ? 'Enter current password' : 'Enter password (min 6 characters)'}
              required
            />
          </div>

          {!isCurrentlyPrivate && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
                required
              />
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                isCurrentlyPrivate 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting 
                ? 'Processing...' 
                : isCurrentlyPrivate 
                  ? 'Remove Protection' 
                  : 'Set Protection'
              }
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 