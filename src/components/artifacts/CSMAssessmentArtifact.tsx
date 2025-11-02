/**
 * CSM Assessment Artifact Component
 *
 * Priority 1 artifact for demo
 * Form-based artifact for capturing CSM's qualitative assessment
 *
 * Features:
 * - Multi-field form with various input types
 * - Handlebars variable support ({{customer.name}})
 * - Auto-save on blur
 * - Rating scales for relationship strength
 */

'use client';

import React, { useState } from 'react';

interface CSMAssessmentData {
  relationshipStrength?: number;
  keyStakeholders?: string;
  painPoints?: string;
  successMetrics?: string;
  renewalConfidence?: number;
  expansionOpportunity?: string;
  competitiveThreats?: string;
  notes?: string;
}

interface CSMAssessmentArtifactProps {
  artifactId?: string;
  title: string;
  data?: CSMAssessmentData;
  customerContext?: any;
  onSave: (data: CSMAssessmentData) => Promise<void>;
  onClose?: () => void;
  readOnly?: boolean;
}

export function CSMAssessmentArtifact({
  title,
  data: initialData,
  customerContext,
  onSave,
  onClose,
  readOnly = false
}: CSMAssessmentArtifactProps) {
  const [formData, setFormData] = useState<CSMAssessmentData>(initialData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Replace handlebars variables in title
  const processedTitle = title.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = customerContext;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : match;
  });

  // Auto-save handler
  const handleAutoSave = async () => {
    if (!isDirty || readOnly) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save assessment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update field handler
  const updateField = (field: keyof CSMAssessmentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Rating component
  const RatingField = ({
    label,
    value,
    onChange,
    max = 5
  }: {
    label: string;
    value?: number;
    onChange: (value: number) => void;
    max?: number;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map(rating => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            disabled={readOnly}
            className={`w-12 h-12 rounded-lg border-2 transition-all ${
              value === rating
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                : 'border-gray-300 hover:border-gray-400 text-gray-600'
            } ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {rating}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {value ? `Selected: ${value}/${max}` : 'No rating set'}
      </p>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{processedTitle}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Capture your assessment of the customer relationship
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Last saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6 max-w-3xl">

          {/* Relationship Strength Rating */}
          <RatingField
            label="Relationship Strength"
            value={formData.relationshipStrength}
            onChange={(value) => updateField('relationshipStrength', value)}
          />

          {/* Renewal Confidence Rating */}
          <RatingField
            label="Renewal Confidence"
            value={formData.renewalConfidence}
            onChange={(value) => updateField('renewalConfidence', value)}
          />

          {/* Key Stakeholders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Stakeholders
            </label>
            <textarea
              value={formData.keyStakeholders || ''}
              onChange={(e) => updateField('keyStakeholders', e.target.value)}
              onBlur={handleAutoSave}
              disabled={readOnly}
              rows={4}
              placeholder="List key stakeholders and their roles (e.g., John Doe - CTO, Champion)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Pain Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Pain Points & Concerns
            </label>
            <textarea
              value={formData.painPoints || ''}
              onChange={(e) => updateField('painPoints', e.target.value)}
              onBlur={handleAutoSave}
              disabled={readOnly}
              rows={4}
              placeholder="What challenges or concerns is the customer facing?..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Success Metrics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Success Metrics & Goals
            </label>
            <textarea
              value={formData.successMetrics || ''}
              onChange={(e) => updateField('successMetrics', e.target.value)}
              onBlur={handleAutoSave}
              disabled={readOnly}
              rows={4}
              placeholder="What does success look like for this customer? What are their goals?..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Expansion Opportunity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expansion Opportunity
            </label>
            <textarea
              value={formData.expansionOpportunity || ''}
              onChange={(e) => updateField('expansionOpportunity', e.target.value)}
              onBlur={handleAutoSave}
              disabled={readOnly}
              rows={3}
              placeholder="Potential upsell, cross-sell, or expansion opportunities..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Competitive Threats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Competitive Threats
            </label>
            <textarea
              value={formData.competitiveThreats || ''}
              onChange={(e) => updateField('competitiveThreats', e.target.value)}
              onBlur={handleAutoSave}
              disabled={readOnly}
              rows={3}
              placeholder="Any competitive risks or alternatives being considered?..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              onBlur={handleAutoSave}
              disabled={readOnly}
              rows={4}
              placeholder="Any other important context or observations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isDirty && !isSaving && (
              <span className="text-amber-600">Unsaved changes</span>
            )}
            {!isDirty && lastSaved && (
              <span className="text-green-600">All changes saved</span>
            )}
          </div>
          <div className="flex gap-3">
            {!readOnly && (
              <button
                onClick={handleAutoSave}
                disabled={!isDirty || isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
