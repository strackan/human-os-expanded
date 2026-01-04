'use client';

/**
 * ZenWorkflowStateTabs Component
 *
 * Zen-styled workflow state management
 * Simplified version of WorkflowStatePanel with zen aesthetic
 */

import React, { useEffect, useState } from 'react';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';
import { TrendingUp, Clock, Users, CheckCircle } from 'lucide-react';

interface ZenWorkflowStateTabsProps {
  userId: string;
  className?: string;
  onWorkflowClick?: (executionId: string) => void;
}

type TabType = 'active' | 'snoozed' | 'escalated';

interface WorkflowCounts {
  active: number;
  snoozed: number;
  escalatedToMe: number;
  escalatedByMe: number;
  completed: number;
  skipped: number;
}

export default function ZenWorkflowStateTabs({
  userId,
  className = '',
  onWorkflowClick
}: ZenWorkflowStateTabsProps) {
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

  const queryService = new WorkflowQueryService();

  useEffect(() => {
    loadCounts();
  }, [userId]);

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
      console.error('[ZenWorkflowStateTabs] Error loading counts:', err);
    }
  };

  const loadWorkflows = async () => {
    setLoading(true);

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
        default:
          result = { success: false, error: 'Invalid tab' };
      }

      if (result.success && result.workflows) {
        setWorkflows(result.workflows);
      }
    } catch (err) {
      console.error('[ZenWorkflowStateTabs] Error loading workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'active' as TabType, label: 'Active', icon: TrendingUp, count: counts.active, color: 'blue' },
    { id: 'snoozed' as TabType, label: 'Snoozed', icon: Clock, count: counts.snoozed, color: 'orange' },
    { id: 'escalated' as TabType, label: 'Escalated', icon: Users, count: counts.escalatedToMe, color: 'purple' }
  ];

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Zen-styled tabs - centered */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-sm'
                  : 'bg-white/40 backdrop-blur-sm border border-gray-200 hover:border-purple-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                {tab.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workflow cards - zen style */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-200 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-700 mb-2">All caught up!</h3>
          <p className="text-sm text-gray-400">
            No {activeTab} workflows right now
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <button
              key={workflow.id}
              onClick={() => onWorkflowClick && onWorkflowClick(workflow.id)}
              className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:border-purple-200 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
                    {workflow.workflow_name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {workflow.customer_name || workflow.customers?.name}
                  </p>
                  {workflow.snooze_until && (
                    <p className="text-xs text-orange-600 mt-2">
                      Snoozed until {new Date(workflow.snooze_until).toLocaleDateString()}
                    </p>
                  )}
                  {workflow.escalated_from_name && (
                    <p className="text-xs text-purple-600 mt-2">
                      Escalated by {workflow.escalated_from_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  {workflow.priority_score && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.priority_score >= 80
                          ? 'bg-red-50 text-red-600'
                          : workflow.priority_score >= 60
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {workflow.priority_score >= 80 ? 'Critical' : workflow.priority_score >= 60 ? 'High' : 'Medium'}
                    </span>
                  )}
                  {workflow.completion_percentage !== undefined && (
                    <span className="text-xs text-gray-400">
                      {Math.round(workflow.completion_percentage)}% complete
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
