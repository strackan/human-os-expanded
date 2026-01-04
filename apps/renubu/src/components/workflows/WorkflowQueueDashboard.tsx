/**
 * Workflow Queue Dashboard Component
 *
 * Displays priority-sorted workflows from the backend API.
 * Shows workflows sorted by priority score with filter controls.
 *
 * Features:
 * - Fetches from /api/workflows/queue/[csmId]
 * - Priority score indicators (minimal design)
 * - Filter by workflow type, account plan, urgency
 * - Account plan badges
 * - Click to launch workflow
 *
 * Phase: Account Plan & Workflow Automation UI - Task 4
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Play, Calendar, AlertTriangle, TrendingUp, ShieldAlert, Target, Filter, ChevronDown, Clock } from 'lucide-react';
import { AccountPlanBadge, AccountPlanIndicator } from './AccountPlanIndicator';
import { AccountPlanType } from './AccountPlanSelector';
import { PriorityScoreBreakdown } from './PriorityScoreBreakdown';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { SnoozedWorkflowsList, type SnoozedWorkflow } from './SnoozedWorkflowCard';
import { WorkflowActionService } from '@/lib/workflows/actions';

// =====================================================
// Types
// =====================================================

export type WorkflowType = 'renewal' | 'strategic' | 'opportunity' | 'risk';

export interface WorkflowQueueItem {
  id: string;
  workflowType: WorkflowType;
  workflowName: string;
  customerId: string;
  customerName: string;
  customerDomain: string;
  accountPlan: AccountPlanType;
  priorityScore: number;
  urgencyLevel: 'high' | 'medium' | 'low';
  arr: number;
  dueDate?: string;
  metadata?: {
    renewalStage?: string;
    daysUntilRenewal?: number;
    healthScore?: number;
    opportunityScore?: number;
    riskScore?: number;
  };
}

export interface WorkflowQueueDashboardProps {
  csmId?: string; // If not provided, uses authenticated user
  onLaunchWorkflow?: (workflowId: string, customerId: string) => void;
  className?: string;
}

// =====================================================
// Filter State
// =====================================================

interface Filters {
  workflowType: WorkflowType | 'all';
  accountPlan: AccountPlanType | 'all';
  urgencyLevel: 'high' | 'medium' | 'low' | 'all';
}

// =====================================================
// WorkflowQueueDashboard Component
// =====================================================

export const WorkflowQueueDashboard: React.FC<WorkflowQueueDashboardProps> = ({
  csmId,
  onLaunchWorkflow,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'snoozed'>('active');
  const [workflows, setWorkflows] = useState<WorkflowQueueItem[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<WorkflowQueueItem[]>([]);
  const [snoozedWorkflows, setSnoozedWorkflows] = useState<SnoozedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [snoozedLoading, setSnoozedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snoozedError, setSnoozedError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    workflowType: 'all',
    accountPlan: 'all',
    urgencyLevel: 'all'
  });

  // Fetch workflow queue on mount
  useEffect(() => {
    fetchWorkflowQueue();
  }, [csmId]);

  // Fetch snoozed workflows when tab changes
  useEffect(() => {
    if (activeTab === 'snoozed') {
      fetchSnoozedWorkflows();
    }
  }, [activeTab, csmId]);

  // Apply filters whenever workflows or filters change
  useEffect(() => {
    applyFilters();
  }, [workflows, filters]);

  const fetchWorkflowQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = csmId
        ? API_ROUTES.WORKFLOWS.QUEUE.BY_CSM(csmId)
        : API_ROUTES.WORKFLOWS.QUEUE.ME;

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch workflow queue (${response.status})`);
      }

      const data = await response.json();
      setWorkflows(data.workflows || []);
      console.log('[WorkflowQueueDashboard] Loaded workflows:', data.workflows?.length || 0);
    } catch (err) {
      console.error('[WorkflowQueueDashboard] Error fetching queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflow queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchSnoozedWorkflows = async () => {
    setSnoozedLoading(true);
    setSnoozedError(null);

    try {
      // For now, use API route - Agent 2 should create this endpoint
      const endpoint = csmId
        ? `/api/workflows/snoozed?userId=${csmId}`
        : '/api/workflows/snoozed';

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch snoozed workflows (${response.status})`);
      }

      const data = await response.json();
      setSnoozedWorkflows(data.workflows || []);
      console.log('[WorkflowQueueDashboard] Loaded snoozed workflows:', data.workflows?.length || 0);
    } catch (err) {
      console.error('[WorkflowQueueDashboard] Error fetching snoozed workflows:', err);
      setSnoozedError(err instanceof Error ? err.message : 'Failed to load snoozed workflows');
    } finally {
      setSnoozedLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...workflows];

    // Filter by workflow type
    if (filters.workflowType !== 'all') {
      filtered = filtered.filter(w => w.workflowType === filters.workflowType);
    }

    // Filter by account plan
    if (filters.accountPlan !== 'all') {
      filtered = filtered.filter(w => w.accountPlan === filters.accountPlan);
    }

    // Filter by urgency level
    if (filters.urgencyLevel !== 'all') {
      filtered = filtered.filter(w => w.urgencyLevel === filters.urgencyLevel);
    }

    setFilteredWorkflows(filtered);
  };

  const handleWakeNow = async (workflowId: string) => {
    try {
      const service = new WorkflowActionService();
      // Get user ID from context or use csmId
      const userId = csmId || 'current-user'; // This should be from auth context
      const result = await service.resumeWorkflow(workflowId, userId);

      if (result.success) {
        // Refresh both lists
        fetchSnoozedWorkflows();
        fetchWorkflowQueue();
      } else {
        throw new Error(result.error || 'Failed to wake workflow');
      }
    } catch (error) {
      console.error('[WorkflowQueueDashboard] Error waking workflow:', error);
      throw error;
    }
  };

  const handleViewDetails = (workflowId: string) => {
    // Navigate to workflow details or open modal
    // This would typically use router or call onLaunchWorkflow
    const workflow = snoozedWorkflows.find(w => w.id === workflowId);
    if (workflow && onLaunchWorkflow) {
      onLaunchWorkflow(workflowId, workflow.customerId);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getWorkflowTypeIcon = (type: WorkflowType) => {
    switch (type) {
      case 'renewal': return <Calendar className="w-4 h-4" />;
      case 'strategic': return <Target className="w-4 h-4" />;
      case 'opportunity': return <TrendingUp className="w-4 h-4" />;
      case 'risk': return <ShieldAlert className="w-4 h-4" />;
    }
  };

  const getWorkflowTypeColor = (type: WorkflowType) => {
    switch (type) {
      case 'renewal': return 'text-blue-600 bg-blue-50';
      case 'strategic': return 'text-purple-600 bg-purple-50';
      case 'opportunity': return 'text-green-600 bg-green-50';
      case 'risk': return 'text-red-600 bg-red-50';
    }
  };

  const getPriorityIndicator = (score: number) => {
    if (score >= 200) return { text: 'High', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (score >= 100) return { text: 'Medium', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { text: 'Low', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Workflows</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchWorkflowQueue}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with Tabs */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Workflow Queue</h2>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'active'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Active ({filteredWorkflows.length})
              </button>
              <button
                onClick={() => setActiveTab('snoozed')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'snoozed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                Snoozed ({snoozedWorkflows.length})
              </button>
            </div>
          </div>

          {activeTab === 'active' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Filter Controls (only for active tab) */}
        {activeTab === 'active' && showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {/* Workflow Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Workflow Type</label>
              <select
                value={filters.workflowType}
                onChange={(e) => handleFilterChange('workflowType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="renewal">Renewal</option>
                <option value="strategic">Strategic</option>
                <option value="opportunity">Opportunity</option>
                <option value="risk">Risk</option>
              </select>
            </div>

            {/* Account Plan Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Account Plan</label>
              <select
                value={filters.accountPlan}
                onChange={(e) => handleFilterChange('accountPlan', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="invest">Invest</option>
                <option value="expand">Expand</option>
                <option value="manage">Manage</option>
                <option value="monitor">Monitor</option>
              </select>
            </div>

            {/* Urgency Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Urgency Level</label>
              <select
                value={filters.urgencyLevel}
                onChange={(e) => handleFilterChange('urgencyLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'active' ? (
        /* Active Workflows List */
        <div className="divide-y divide-gray-100">
          {filteredWorkflows.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {workflows.length === 0
                ? 'No workflows in your queue yet'
                : 'No workflows match your filters'}
            </p>
          </div>
        ) : (
          filteredWorkflows.map((workflow) => {
            const priorityIndicator = getPriorityIndicator(workflow.priorityScore);

            return (
              <div
                key={workflow.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between space-x-4">
                  {/* Left: Workflow Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {/* Workflow Type Badge */}
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${getWorkflowTypeColor(workflow.workflowType)}`}>
                        {getWorkflowTypeIcon(workflow.workflowType)}
                        <span>{workflow.workflowType}</span>
                      </span>

                      {/* Account Plan Indicator */}
                      <AccountPlanIndicator plan={workflow.accountPlan} size="small" showLabel={false} />

                      {/* Priority Score with Breakdown */}
                      <PriorityScoreBreakdown
                        score={workflow.priorityScore}
                        size="small"
                        showLabel={false}
                        context={{
                          arr: workflow.arr,
                          accountPlan: workflow.accountPlan,
                          workflowType: workflow.workflowType,
                          urgencyLevel: workflow.urgencyLevel,
                          renewalStage: workflow.metadata?.renewalStage,
                          daysUntilRenewal: workflow.metadata?.daysUntilRenewal
                        }}
                      />
                    </div>

                    <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {workflow.customerName || workflow.customerDomain}
                    </h3>

                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>ARR: {formatCurrency(workflow.arr)}</span>
                      {workflow.dueDate && (
                        <span>Due: {new Date(workflow.dueDate).toLocaleDateString()}</span>
                      )}
                      {workflow.metadata?.daysUntilRenewal !== undefined && (
                        <span>{workflow.metadata.daysUntilRenewal} days until renewal</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <button
                    onClick={() => onLaunchWorkflow?.(workflow.id, workflow.customerId)}
                    className="flex-shrink-0 inline-flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Play className="w-4 h-4" />
                    <span>Launch</span>
                  </button>
                </div>
              </div>
            );
          })
          )}
        </div>
      ) : (
        /* Snoozed Workflows List */
        <div className="p-6">
          <SnoozedWorkflowsList
            workflows={snoozedWorkflows}
            onWakeNow={handleWakeNow}
            onViewDetails={handleViewDetails}
            loading={snoozedLoading}
            error={snoozedError || undefined}
          />
        </div>
      )}
    </div>
  );
};

export default WorkflowQueueDashboard;
