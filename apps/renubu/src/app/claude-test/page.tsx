'use client';

import { useState } from 'react';

export default function ClaudeTestPage() {
  const [prompt, setPrompt] = useState('Hello! Can you hear me?');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testClaude = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/test-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.response);
      } else {
        setError(`Error: ${data.error}\nStatus: ${data.status}\nDetails: ${data.details}`);
      }
    } catch (err: any) {
      setError(`Fetch error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Claude API Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Message
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
              rows={4}
              placeholder="Type something to send to Claude..."
            />
          </div>

          <button
            onClick={testClaude}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            {loading ? 'Calling Claude...' : 'Send to Claude'}
          </button>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">Error:</p>
              <pre className="text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap font-mono">
                {error}
              </pre>
            </div>
          )}

          {response && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
                Claude's Response:
              </p>
              <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">
                {response}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            Open browser console to see detailed logs
          </p>
        </div>
      </div>
    </div>
  );
}
