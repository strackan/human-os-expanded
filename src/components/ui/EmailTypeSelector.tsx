/**
 * Email Type Selector Modal
 *
 * Modal component for selecting email type to generate.
 * Displays 5 email type options with descriptions.
 */

'use client';

import React, { useState } from 'react';
import { X, Mail, DollarSign, Calendar, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import type { EmailType } from '@/types/email';
import { EMAIL_TYPE_CONFIGS } from '@/types/email';

export interface EmailTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emailType: EmailType, customInstructions?: string) => void;
  isLoading?: boolean;
}

/**
 * Icon mapping for email types
 */
const EMAIL_TYPE_ICONS: Record<EmailType, React.ReactNode> = {
  renewal_kickoff: <Calendar className="w-6 h-6" />,
  pricing_discussion: <DollarSign className="w-6 h-6" />,
  qbr_invitation: <Calendar className="w-6 h-6" />,
  risk_mitigation: <AlertTriangle className="w-6 h-6" />,
  expansion_pitch: <TrendingUp className="w-6 h-6" />,
};

/**
 * Email Type Selector Modal Component
 */
export const EmailTypeSelector: React.FC<EmailTypeSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
}) => {
  const [selectedType, setSelectedType] = useState<EmailType | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  // Close modal and reset state
  const handleClose = () => {
    setSelectedType(null);
    setCustomInstructions('');
    setShowInstructions(false);
    onClose();
  };

  // Handle email type selection
  const handleSelectType = (type: EmailType) => {
    setSelectedType(type);
    setShowInstructions(true);
  };

  // Handle generate button click
  const handleGenerate = () => {
    if (!selectedType) return;
    onSelect(selectedType, customInstructions || undefined);
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {showInstructions ? 'Customize Email' : 'Generate AI Email'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showInstructions ? (
            // Email Type Selection
            <div>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Select the type of email you'd like to generate. AI will create a personalized email using customer data.
              </p>

              <div className="grid gap-3">
                {(Object.entries(EMAIL_TYPE_CONFIGS) as [EmailType, typeof EMAIL_TYPE_CONFIGS[EmailType]][]).map(
                  ([type, config]) => (
                    <button
                      key={type}
                      onClick={() => handleSelectType(type)}
                      className="flex items-start gap-4 p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group"
                    >
                      <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/50 dark:group-hover:text-blue-400">
                        {EMAIL_TYPE_ICONS[type]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          {config.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {config.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {config.defaultTone}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {config.estimatedLength} length
                          </span>
                          {config.requiresApproval && (
                            <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500">
                              requires approval
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            // Custom Instructions (Optional)
            <div>
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                    {EMAIL_TYPE_ICONS[selectedType!]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {EMAIL_TYPE_CONFIGS[selectedType!].label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {EMAIL_TYPE_CONFIGS[selectedType!].description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Mention our Q4 expansion opportunity, keep it casual, reference our last meeting..."
                  rows={4}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Add any specific points you want the AI to include in the email.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowInstructions(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Email
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
