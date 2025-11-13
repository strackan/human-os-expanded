'use client';

/**
 * Return Visit Page (Placeholder)
 *
 * Email lookup for returning candidates - Release 1.6 feature
 * Allows candidates to continue their conversation after initial interview
 *
 * Release 1.6: Return Visit System - Longitudinal Intelligence
 */

import { useState } from 'react';

export default function ReturningPage() {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    // TODO: Implement email lookup in Sprint 4 (Release 1.6)
    setTimeout(() => {
      setIsSearching(false);
      alert('Return visit feature coming in Release 1.6 (Sprint 4)');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome Back!
          </h1>
          <p className="text-lg text-gray-600">
            Enter your email to continue where you left off
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jane@example.com"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800 font-medium">
                🚧 Coming in Release 1.6 - Sprint 4 (Weeks 7-8)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Longitudinal intelligence: We'll remember your previous conversations and
                reference specific details when you return.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSearching ? 'Looking up...' : 'Continue Interview'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New here?{' '}
              <a href="/join" className="text-blue-600 hover:text-blue-700 font-medium">
                Start your application
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">What is Return Visit?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ Intelligence file synthesizes all your sessions</li>
            <li>✓ Check-in conversations (5-10 min lighter format)</li>
            <li>✓ System remembers: "Hey Jane! How are Lucy and Marcus?"</li>
            <li>✓ Tracks relationship evolution (cold/warm/hot)</li>
            <li>✓ "It actually remembered me. No one does that."</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
