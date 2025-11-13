'use client';

import React, { useState } from 'react';
import { Plus, Mic, Loader2, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { StringTieCard } from '@/components/string-ties/StringTieCard';
import { StringTieCreationModal } from '@/components/string-ties/StringTieCreationModal';
import { StringTieSettings } from '@/components/string-ties/StringTieSettings';
import { useStringTies } from '@/lib/hooks/useStringTies';

/**
 * String-Tie Dashboard Page
 *
 * Main dashboard for managing string-tie reminders with:
 * - Active/Dismissed tabs
 * - List of reminders in cards
 * - Create new reminder button (prominent)
 * - Settings section
 * - Empty states
 * - Loading and error states
 */

type TabType = 'active' | 'dismissed';

export default function StringTiesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch string ties based on active tab
  const {
    data: stringTies,
    isLoading,
    error,
    refetch,
  } = useStringTies({
    dismissed: activeTab === 'dismissed',
    reminded: activeTab === 'dismissed' ? undefined : false, // Active: not reminded
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                My String Ties
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Quick personal reminders - tie a string around your finger
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
              >
                <Mic className="w-5 h-5" />
                <Plus className="w-4 h-4" />
                New String Tie
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active
                {stringTies && activeTab === 'active' && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {stringTies.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('dismissed')}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'dismissed'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dismissed
                {stringTies && activeTab === 'dismissed' && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                    {stringTies.length}
                  </span>
                )}
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
                <p className="text-sm text-gray-600">Loading string ties...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-900 mb-1">
                    Failed to load string ties
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    {error instanceof Error ? error.message : 'An error occurred'}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* String Ties List */}
            {!isLoading && !error && stringTies && (
              <>
                {stringTies.length === 0 ? (
                  // Empty State
                  <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {activeTab === 'active' ? 'No active reminders' : 'No dismissed reminders'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                      {activeTab === 'active'
                        ? 'Create your first string-tie reminder using voice or text. Perfect for quick thoughts and time-sensitive tasks.'
                        : 'Dismissed reminders will appear here for your reference.'}
                    </p>
                    {activeTab === 'active' && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Mic className="w-5 h-5" />
                        <Plus className="w-4 h-4" />
                        Create Your First String Tie
                      </button>
                    )}
                  </div>
                ) : (
                  // String Ties List
                  <div className="space-y-3">
                    {stringTies.map((stringTie) => (
                      <StringTieCard key={stringTie.id} stringTie={stringTie} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Settings Panel */}
            {showSettings && <StringTieSettings className="mb-6" />}

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Use voice input for fastest reminder creation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Say natural phrases like "remind me tomorrow at 3pm"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Snooze reminders with quick time options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Set your default reminder time in Settings</span>
                </li>
              </ul>
            </div>

            {/* Voice Support Notice */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Voice Support</h4>
              <p className="text-xs text-gray-600">
                Voice input works in Chrome, Edge, and Safari. If unavailable, use text input instead.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      <StringTieCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
