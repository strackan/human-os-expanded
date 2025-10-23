'use client';

/**
 * WorkflowStatePanel Component
 *
 * Displays workflows organized by state (active, snoozed, escalated)
 * Uses WorkflowQueryService to fetch data
 */

import React, { useEffect, useState } from 'react';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';
import {  AlertCircle, Clock, Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface WorkflowStatePanelProps {
  userId: string;
  className?: string;
  onWorkflowClick?: (executionId: string) => void;
}

type TabType = 'active' | 'snoozed' | 'escalated' | 'completed';

interface WorkflowCounts {
  active: number;
  snoozed: number;
  escalatedToMe: number;
  escalatedByMe: number;
  completed: number;
  skipped: number;
}

export default function WorkflowStatePanel({ userId, className = '', onWorkflowClick }: WorkflowStatePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [counts, setCounts] = useState<WorkflowCounts>({
    active: 0,
    snoozed: 0,
    escalatedToMe: 0,
    escalatedByMe: 0,
    completed: 0,
    skipped: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryService = new WorkflowQueryService();

  // Load counts on mount
  useEffect(() => {
    loadCounts();
  }, [userId]);

  // Load workflows when tab changes
  useEffect(() => {
    loadWorkflows();
  }, [activeTab, userId]);

  const loadCounts = async () => {
    try {
      const result = await queryService.getWorkflowCounts(userId);
      if (result.success && result.counts) {
        setCounts(result.counts);
      }
    } catch (err) {
      console.error('Error loading workflow counts:', err);
    }
  };

  const loadWorkflows = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      switch (activeTab) {
        case 'active':
          result = await queryService.getActiveWorkflows(userId);
          break;
        case 'snoozed':
          result = await queryService.getSnoozedWorkflows(userId);
          break;
        case 'escalated':
          result = await queryService.getEscalatedToMe(userId);
          break;
        case 'completed':
          result = await queryService.getCompletedWorkflows(userId, 20);
          break;
        default:
          result = { success: false, error: 'Invalid tab' };
      }

      if (result.success && result.workflows) {
        setWorkflows(result.workflows);
      } else {
        setError(result.error || 'Failed to load workflows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'snoozed':
        return 'bg-orange-100 text-orange-700';
      case 'escalated':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'skipped':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs = [
    { id: 'active' as TabType, label: 'Active', icon: TrendingUp, count: counts.active },
    { id: 'snoozed' as TabType, label: 'Snoozed', icon: Clock, count: counts.snoozed },
    { id: 'escalated' as TabType, label: 'Escalated to Me', icon: Users, count: counts.escalatedToMe },
    { id: 'completed' as TabType, label: 'Completed', icon: CheckCircle, count: counts.completed }
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">My Workflows</h2>
        <p className="text-sm text-gray-500 mt-1">Manage and track your workflow assignments</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 py-8 justify-center">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && workflows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No {activeTab} workflows</p>
          </div>
        )}

        {!loading && !error && workflows.length > 0 && (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => onWorkflowClick && onWorkflowClick(workflow.id)}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{workflow.workflow_name || 'Workflow'}</h3>
                    <p className="text-sm text-gray-600 mt-1">{workflow.customer_name || 'Unknown Customer'}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                    {workflow.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {workflow.started_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Started {formatDate(workflow.started_at)}</span>
                    </div>
                  )}

                  {workflow.snooze_until && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Clock className="w-4 h-4" />
                      <span>Due {formatDate(workflow.snooze_until)}</span>
                    </div>
                  )}

                  {workflow.escalated_from && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <Users className="w-4 h-4" />
                      <span>Escalated from {workflow.escalated_from_name || 'someone'}</span>
                    </div>
                  )}

                  {workflow.completed_at && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed {formatDate(workflow.completed_at)}</span>
                    </div>
                  )}
                </div>

                {workflow.workflow_type && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {workflow.workflow_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Quick Actions */}
      {!loading && !error && workflows.length > 0 && activeTab === 'snoozed' && (
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{workflows.filter(w => w.snooze_until && new Date(w.snooze_until) <= new Date()).length}</span>
            {' '}workflow(s) ready to resume
          </p>
        </div>
      )}
    </div>
  );
}
