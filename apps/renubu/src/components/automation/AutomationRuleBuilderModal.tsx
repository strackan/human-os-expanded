'use client';

/**
 * AutomationRuleBuilderModal Component
 *
 * Modal for creating and editing automation rules.
 * Includes form fields, condition builder, and validation.
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { ConditionBuilder } from './ConditionBuilder';
import type {
  AutomationRule,
  EventCondition,
  TriggerLogic,
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from '@/types/automation-rules';
import type { WorkflowTemplate } from '@/hooks/useWorkflows';

// =====================================================
// Types
// =====================================================

export interface AutomationRuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateAutomationRuleInput | UpdateAutomationRuleInput) => Promise<void>;
  rule?: AutomationRule | null;
  workflows: WorkflowTemplate[];
  className?: string;
}

// =====================================================
// Helper Functions
// =====================================================

function getEventSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    gmail_received: 'Gmail Received',
    gmail_sent: 'Gmail Sent',
    calendar_event: 'Calendar Event',
    slack_message: 'Slack Message',
    customer_login: 'Customer Login',
    usage_threshold: 'Usage Threshold',
    workflow_action_completed: 'Workflow Action',
    manual_event: 'Manual Event',
  };
  return labels[source] || source;
}

function formatPreviewText(
  workflowName: string,
  conditions: EventCondition[],
  logic: TriggerLogic
): string {
  if (conditions.length === 0) {
    return `Launch "${workflowName}" when [add conditions below]`;
  }

  if (conditions.length === 1) {
    return `Launch "${workflowName}" when ${getEventSourceLabel(conditions[0].source)} occurs`;
  }

  const conditionTexts = conditions.map((c) => getEventSourceLabel(c.source));
  return `Launch "${workflowName}" when ${conditionTexts.join(` ${logic} `)}`;
}

// =====================================================
// AutomationRuleBuilderModal Component
// =====================================================

export const AutomationRuleBuilderModal: React.FC<AutomationRuleBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rule,
  workflows,
  className = '',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowConfigId, setWorkflowConfigId] = useState('');
  const [conditions, setConditions] = useState<EventCondition[]>([]);
  const [logicOperator, setLogicOperator] = useState<TriggerLogic>('OR');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize form when rule changes
  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || '');
      setWorkflowConfigId(rule.workflow_config_id);
      setConditions(rule.event_conditions);
      setLogicOperator(rule.logic_operator || 'OR');
    } else {
      // Reset form for new rule
      setName('');
      setDescription('');
      setWorkflowConfigId(workflows.length > 0 ? workflows[0].id : '');
      setConditions([]);
      setLogicOperator('OR');
    }
    setError('');
    setValidationErrors([]);
  }, [rule, workflows]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('Rule name is required');
    }

    if (!workflowConfigId) {
      errors.push('Please select a workflow to launch');
    }

    if (conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (conditions.length > 2) {
      errors.push('Maximum of 2 conditions allowed');
    }

    if (conditions.length === 2 && !logicOperator) {
      errors.push('Logic operator (AND/OR) is required for multiple conditions');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (rule) {
        // Update existing rule
        const input: UpdateAutomationRuleInput = {
          name,
          description: description || undefined,
          event_conditions: conditions,
          logic_operator: conditions.length > 1 ? logicOperator : undefined,
        };
        await onSave(input);
      } else {
        // Create new rule
        const input: CreateAutomationRuleInput = {
          workflow_config_id: workflowConfigId,
          name,
          description: description || undefined,
          event_conditions: conditions,
          logic_operator: conditions.length > 1 ? logicOperator : undefined,
          is_active: true,
        };
        await onSave(input);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save automation rule');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedWorkflow = workflows.find((w) => w.id === workflowConfigId);
  const previewText = formatPreviewText(
    selectedWorkflow?.name || 'Workflow',
    conditions,
    logicOperator
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        className={`bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 relative max-h-[90vh] overflow-y-auto ${className}`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h3 className="text-xl font-semibold mb-2 text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {rule
            ? 'Update the automation rule configuration'
            : 'Configure when and how workflows should be automatically launched'}
        </p>

        <div className="space-y-6">
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Rule Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Launch renewal workflow on invoice email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this automation rule does..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Workflow Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Workflow to Launch <span className="text-red-500">*</span>
            </label>
            <select
              value={workflowConfigId}
              onChange={(e) => setWorkflowConfigId(e.target.value)}
              disabled={!!rule}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a workflow...</option>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
            {selectedWorkflow?.description && (
              <p className="text-xs text-gray-500 mt-1">{selectedWorkflow.description}</p>
            )}
            {rule && (
              <p className="text-xs text-yellow-600 mt-1">
                Workflow cannot be changed when editing a rule
              </p>
            )}
          </div>

          {/* Event Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Event Conditions <span className="text-red-500">*</span>
            </label>
            <ConditionBuilder
              conditions={conditions}
              onChange={setConditions}
              maxConditions={2}
            />
            <p className="text-xs text-gray-500 mt-2">
              Configure when this rule should trigger (max 2 conditions)
            </p>
          </div>

          {/* Logic Operator (only show if 2 conditions) */}
          {conditions.length === 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Logic Operator <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLogicOperator('OR')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    logicOperator === 'OR'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">OR (Any)</div>
                  <div className="text-xs mt-1">Trigger when ANY condition is met</div>
                </button>
                <button
                  type="button"
                  onClick={() => setLogicOperator('AND')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    logicOperator === 'AND'
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">AND (All)</div>
                  <div className="text-xs mt-1">Trigger only when ALL conditions are met</div>
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Preview
            </h4>
            <p className="text-sm text-gray-700">{previewText}</p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">
                    Please fix the following errors:
                  </h4>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
};
