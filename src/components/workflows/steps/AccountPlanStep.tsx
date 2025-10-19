/**
 * Account Plan Step Component
 *
 * Step component for selecting an account plan within a workflow.
 * Uses the AccountPlanSelector component and integrates with workflow execution.
 *
 * Phase: Account Plan & Workflow Automation UI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { StepComponentProps } from '../StepRenderer';
import { AccountPlanSelector, AccountPlanType } from '../AccountPlanSelector';
import { Check, AlertCircle } from 'lucide-react';

// =====================================================
// Types
// =====================================================

export interface AccountPlanStepData {
  selectedPlan?: AccountPlanType;
  recommendedPlan?: AccountPlanType;
  justification?: string;
  customerId?: string;
}

// =====================================================
// AccountPlanStep Component
// =====================================================

export const AccountPlanStep: React.FC<StepComponentProps> = ({
  data = {},
  executionId,
  customerId,
  onDataChange,
  onComplete
}) => {
  const [stepData, setStepData] = useState<AccountPlanStepData>(data);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update internal state when prop changes
  useEffect(() => {
    setStepData(data);
  }, [data]);

  // Handle plan selection
  const handleSelectPlan = (plan: AccountPlanType) => {
    const newData = { ...stepData, selectedPlan: plan };
    setStepData(newData);
    onDataChange(newData);
    setSaveError(null);
  };

  // Handle justification change
  const handleJustificationChange = (value: string) => {
    const newData = { ...stepData, justification: value };
    setStepData(newData);
    onDataChange(newData);
  };

  // Save account plan to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !stepData.selectedPlan) return;

    setIsSubmitting(true);
    setSaveError(null);

    try {
      // Save to backend via API
      const response = await fetch(`/api/customers/${customerId}/account-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountPlan: stepData.selectedPlan,
          justification: stepData.justification || '',
          workflowExecutionId: executionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save account plan');
      }

      // Success - complete the step
      console.log('[AccountPlanStep] Account plan saved successfully:', stepData.selectedPlan);
      await onComplete();
    } catch (error) {
      console.error('[AccountPlanStep] Error saving account plan:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save account plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Plan Selector */}
      <AccountPlanSelector
        selectedPlan={stepData.selectedPlan}
        onSelectPlan={handleSelectPlan}
        recommendedPlan={stepData.recommendedPlan}
        disabled={isSubmitting}
      />

      {/* Optional Justification Field */}
      {stepData.selectedPlan && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Justification (Optional)
          </label>
          <textarea
            value={stepData.justification || ''}
            onChange={(e) => handleJustificationChange(e.target.value)}
            disabled={isSubmitting}
            placeholder="Explain your reasoning for this account plan selection..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[100px]"
            rows={4}
          />
          <p className="text-xs text-gray-500">
            Document the key factors that influenced this decision for future reference.
          </p>
        </div>
      )}

      {/* Error Message */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-1">Error Saving Account Plan</h4>
              <p className="text-sm text-red-800">{saveError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={!stepData.selectedPlan || isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Save Account Plan
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      {!stepData.selectedPlan && (
        <div className="text-center">
          <p className="text-sm text-gray-500 italic">
            Select an account plan above to continue
          </p>
        </div>
      )}
    </form>
  );
};

export default AccountPlanStep;
