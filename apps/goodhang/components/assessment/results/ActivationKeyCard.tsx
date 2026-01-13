'use client';

import { useState, useEffect } from 'react';

interface ActivationKeyCardProps {
  sessionId: string;
  tier?: string | undefined;
  archetype?: string | undefined;
}

interface ActivationKeyData {
  code: string;
  deepLink: string;
  expiresAt: string;
}

export function ActivationKeyCard({ sessionId, tier: _tier, archetype: _archetype }: ActivationKeyCardProps) {
  const [keyData, setKeyData] = useState<ActivationKeyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchKey() {
      try {
        // Use the session-based endpoint which returns existing key or generates new one
        const response = await fetch(`/api/activation/session/${sessionId}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get activation key');
        }

        const data = await response.json();
        if (data.success) {
          setKeyData({
            code: data.code,
            deepLink: data.deepLink,
            expiresAt: data.expiresAt,
          });
        } else {
          throw new Error(data.error || 'Failed to get activation key');
        }
      } catch (err) {
        console.error('Error fetching activation key:', err);
        setError(err instanceof Error ? err.message : 'Failed to get key');
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) {
      fetchKey();
    }
  }, [sessionId]);

  const copyToClipboard = async () => {
    if (!keyData?.code) return;
    try {
      await navigator.clipboard.writeText(keyData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-8 mb-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your activation key...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
        <p className="text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!keyData) return null;

  const expiresDate = new Date(keyData.expiresAt);
  const daysUntilExpiry = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-2 border-green-500/50 rounded-lg p-8 mb-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-green-400 mb-2">
          Your Activation Key
        </h2>
        <p className="text-gray-400 mb-6">
          Use this key to unlock your profile in the Good Hang desktop app
        </p>

        {/* Key Display */}
        <div className="relative inline-block mb-6">
          <div className="bg-black/50 border-2 border-green-500/50 rounded-lg px-8 py-4">
            <span className="text-3xl font-mono font-bold text-green-300 tracking-wider">
              {keyData.code}
            </span>
          </div>
          <button
            onClick={copyToClipboard}
            className="absolute -right-2 -top-2 p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Expiry Notice */}
        <p className="text-sm text-gray-500 mb-6">
          Expires in {daysUntilExpiry} days ({expiresDate.toLocaleDateString()})
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={keyData.deepLink}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Open in Desktop App
          </a>
          <a
            href="https://goodhang.com/download"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border-2 border-green-500/50 hover:border-green-400 text-green-300 hover:text-green-200 font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Desktop App
          </a>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-left bg-black/30 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-3">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
            <li>Download the Good Hang desktop app if you haven&apos;t already</li>
            <li>Open the app and enter your activation key</li>
            <li>Create your account to unlock your full character profile</li>
            <li>Start connecting with your people!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
