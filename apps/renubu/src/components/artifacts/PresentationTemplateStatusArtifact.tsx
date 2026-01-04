'use client';

/**
 * Presentation Template Status Artifact
 *
 * Displays the status of presentation templates for a customer/company.
 * Shows appropriate UI based on whether templates exist:
 * - If templates exist: shows template selector
 * - If no templates: prompts to create one (Coming Soon)
 */

import React, { useState, useEffect } from 'react';
import { FileText, Upload, Sparkles, AlertCircle } from 'lucide-react';

interface PresentationTemplateStatusArtifactProps {
  customerId?: string;
  companyId?: string;
  onTemplateSetup?: () => void;
}

export default function PresentationTemplateStatusArtifact({
  customerId,
  companyId,
}: PresentationTemplateStatusArtifactProps) {
  const [hasTemplates, setHasTemplates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Check for available templates (will always be false for now)
  useEffect(() => {
    const checkTemplates = async () => {
      setIsLoading(true);
      try {
        // TODO: Implement actual template check API
        // const response = await fetch(`/api/presentation-templates?companyId=${companyId}`);
        // const data = await response.json();
        // setHasTemplates(data.templates.length > 0);

        // For now, always return false (no templates)
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        setHasTemplates(false);
      } catch (error) {
        console.error('[PresentationTemplateStatus] Error checking templates:', error);
        setHasTemplates(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTemplates();
  }, [companyId, customerId]);

  const handleSetupTemplate = () => {
    setShowComingSoon(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (showComingSoon) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-purple-900 mb-2">Coming Soon!</h3>
        <p className="text-purple-700 mb-6 max-w-md mx-auto">
          Presentation template creation is currently in development. Soon you&apos;ll be able to:
        </p>
        <ul className="text-left text-purple-700 space-y-2 max-w-sm mx-auto mb-6">
          <li className="flex items-start gap-2">
            <Upload className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <span>Upload your company&apos;s PowerPoint decks</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <span>Automatically extract styling, layouts, and branding</span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <span>Generate on-brand presentations instantly</span>
          </li>
        </ul>
        <button
          onClick={() => setShowComingSoon(false)}
          className="px-4 py-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!hasTemplates) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No Presentation Templates
            </h3>
            <p className="text-gray-600 mb-4">
              To generate meeting decks, you&apos;ll need to set up a presentation template first.
              Templates ensure your presentations match your company&apos;s brand guidelines.
            </p>
            <button
              onClick={handleSetupTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              Set Up Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Template exists - show template info (future state)
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Template Ready</h3>
          <p className="text-sm text-gray-600">Your presentation template is configured</p>
        </div>
      </div>
      {/* Future: Template selector and preview */}
    </div>
  );
}
