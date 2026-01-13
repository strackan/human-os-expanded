'use client';

/**
 * Automation Rules Dashboard Page
 *
 * Main dashboard for managing event-driven workflow launcher rules.
 * Displays list of automation rules with ability to create, edit, delete, and toggle.
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { AutomationRuleCard } from '@/components/automation/AutomationRuleCard';
import { AutomationRuleBuilderModal } from '@/components/automation/AutomationRuleBuilderModal';
import {
  useAutomationRules,
  useCreateAutomationRule,
  useUpdateAutomationRule,
  useDeleteAutomationRule,
  useToggleAutomationRule,
} from '@/lib/hooks/useAutomationRules';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useToast } from '@/components/ui/ToastProvider';
import type {
  AutomationRule,
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from '@/types/automation-rules';

// =====================================================
// AutomationRulesPage Component
// =====================================================

export default function AutomationRulesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);

  // Fetch automation rules
  const {
    rules,
    loading: rulesLoading,
    error: rulesError,
    refetch,
  } = useAutomationRules();

  // Fetch workflows
  const {
    templates: workflows,
    loading: workflowsLoading,
    error: workflowsError,
  } = useWorkflows({
    includeTemplates: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Mutation hooks
  const { createRule, loading: isCreating } = useCreateAutomationRule();
  const { updateRule, loading: isUpdating } = useUpdateAutomationRule();
  const { deleteRule, loading: isDeleting } = useDeleteAutomationRule();
  const { toggleRule } = useToggleAutomationRule();

  // Toast notifications
  const { showToast } = useToast();

  // Open modal for new rule
  const handleNewRule = () => {
    setSelectedRule(null);
    setIsModalOpen(true);
  };

  // Open modal for editing rule
  const handleEditRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      setSelectedRule(rule);
      setIsModalOpen(true);
    }
  };

  // Save rule (create or update)
  const handleSaveRule = async (
    input: CreateAutomationRuleInput | UpdateAutomationRuleInput
  ) => {
    try {
      if (selectedRule) {
        // Update existing rule
        await updateRule(selectedRule.id, input as UpdateAutomationRuleInput);
        showToast({
          message: 'Automation rule updated successfully',
          type: 'success',
          icon: 'check',
        });
      } else {
        // Create new rule
        await createRule(input as CreateAutomationRuleInput);
        showToast({
          message: 'Automation rule created successfully',
          type: 'success',
          icon: 'check',
        });
      }
      refetch();
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to save rule',
        type: 'error',
        icon: 'alert',
      });
      throw err;
    }
  };

  // Toggle rule active status
  const handleToggleRule = async (ruleId: string) => {
    try {
      await toggleRule(ruleId);
      showToast({
        message: 'Rule status updated',
        type: 'success',
        icon: 'check',
      });
      refetch();
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to toggle rule',
        type: 'error',
        icon: 'alert',
      });
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule(ruleId);
      showToast({
        message: 'Automation rule deleted successfully',
        type: 'success',
        icon: 'check',
      });
      refetch();
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to delete rule',
        type: 'error',
        icon: 'alert',
      });
      throw err;
    }
  };

  // Get workflow name by ID
  const getWorkflowName = (workflowConfigId: string): string => {
    const workflow = workflows.find((w) => w.id === workflowConfigId);
    return workflow?.name || 'Unknown Workflow';
  };

  const loading = rulesLoading || workflowsLoading;
  const error = rulesError || workflowsError;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-600" />
                Automation Rules
              </h1>
              <p className="text-gray-600 mt-2">
                Automatically launch workflows when external events occur
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Refresh rules"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleNewRule}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Rule
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-sm text-gray-600">Total Rules</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {rules.length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-sm text-gray-600">Active Rules</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {rules.filter((r) => r.is_active).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-sm text-gray-600">Total Triggers</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {rules.reduce((sum, r) => sum + r.trigger_count, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-4">Loading automation rules...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load Rules
            </h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && rules.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Automation Rules Yet
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Create your first automation rule to automatically launch workflows when
              specific events occur. Connect Gmail, Slack, Calendar, and more.
            </p>
            <button
              onClick={handleNewRule}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Rule
            </button>
          </div>
        )}

        {/* Rules List */}
        {!loading && !error && rules.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rules.map((rule) => (
              <AutomationRuleCard
                key={rule.id}
                rule={rule}
                workflowName={getWorkflowName(rule.workflow_config_id)}
                onToggle={handleToggleRule}
                onEdit={handleEditRule}
                onDelete={handleDeleteRule}
              />
            ))}
          </div>
        )}

        {/* Rule Builder Modal */}
        <AutomationRuleBuilderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRule(null);
          }}
          onSave={handleSaveRule}
          rule={selectedRule}
          workflows={workflows}
        />
      </div>
    </div>
  );
}
