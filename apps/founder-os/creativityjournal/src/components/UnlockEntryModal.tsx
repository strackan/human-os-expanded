'use client';

import React, { useState } from 'react';
import Modal from './Modal';

interface UnlockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => Promise<void>;
  onBreakGlass: () => Promise<string>;
  onBreakGlassVerify: (code: string) => Promise<string>;
  hasBreakGlass: boolean;
}

export default function UnlockEntryModal({
  isOpen,
  onClose,
  onUnlock,
  onBreakGlass,
  onBreakGlassVerify,
  hasBreakGlass
}: UnlockEntryModalProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showBreakGlass, setShowBreakGlass] = useState(false);
  const [breakGlassCode, setBreakGlassCode] = useState('');
  const [breakGlassStep, setBreakGlassStep] = useState<'request' | 'verify' | 'result'>('request');
  const [breakGlassResult, setBreakGlassResult] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUnlock(password);
      setPassword('');
      onClose();
    } catch (error: any) {
      setError(error.message || 'Invalid password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBreakGlassRequest = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const code = await onBreakGlass();
      setBreakGlassStep('verify');
      // In production, this would be sent via email
      console.log('Break glass code:', code);
    } catch (error: any) {
      setError(error.message || 'Failed to request break glass code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBreakGlassVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!breakGlassCode) {
      setError('Break glass code required');
      return;
    }

    setIsSubmitting(true);
    try {
      const passwordHash = await onBreakGlassVerify(breakGlassCode);
      setBreakGlassResult(passwordHash);
      setBreakGlassStep('result');
    } catch (error: any) {
      setError(error.message || 'Invalid or expired break glass code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setBreakGlassCode('');
    setBreakGlassResult('');
    setError('');
    setShowBreakGlass(false);
    setBreakGlassStep('request');
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Unlock Private Entry"
      size="sm"
    >
      <div>

        {!showBreakGlass ? (
          <>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                🔒 This entry is password protected. Enter your password to view the content.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  required
                />
              </div>

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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Unlocking...' : 'Unlock'}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowBreakGlass(true)}
                className="w-full text-sm text-orange-600 hover:text-orange-700 underline"
              >
                Forgot password? Use break glass access
              </button>
            </div>
          </>
        ) : (
          <>
            {breakGlassStep === 'request' && (
              <>
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800">
                    ⚠️ <strong>Break Glass Access:</strong> This will generate a temporary code 
                    that will be sent to your email. Use this only if you've forgotten your password.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBreakGlass(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBreakGlassRequest}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Requesting...' : 'Request Break Glass Code'}
                  </button>
                </div>
              </>
            )}

            {breakGlassStep === 'verify' && (
              <>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✅ Break glass code has been generated. Check your email for the code.
                    <br />
                    <em>Note: For development, the code is also logged to console.</em>
                  </p>
                </div>

                <form onSubmit={handleBreakGlassVerify} className="space-y-4">
                  <div>
                    <label htmlFor="breakGlassCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Break Glass Code
                    </label>
                    <input
                      type="text"
                      id="breakGlassCode"
                      value={breakGlassCode}
                      onChange={(e) => setBreakGlassCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                      placeholder="Enter code from email"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setBreakGlassStep('request')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {breakGlassStep === 'result' && (
              <>
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    🔓 <strong>Break Glass Access Granted:</strong> Your password hash is displayed below. 
                    This is a one-time display for emergency access.
                  </p>
                </div>

                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-600 mb-2">Password Hash:</p>
                  <code className="text-xs font-mono break-all text-gray-800">
                    {breakGlassResult}
                  </code>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
} 