'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { TERMINOLOGY } from '@/lib/constants';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';

interface WorkflowItem {
  workflowId: string;
  title: string;
  customerId: string;
  customerName: string;
  description?: string;
  day?: string;
}

interface TodaysWorkflowsProps {
  className?: string;
  workflows?: WorkflowItem[];
  userId?: string; // NEW: Add userId for database integration
  onWorkflowClick?: (workflow: WorkflowItem) => void;
  completedWorkflowIds?: Set<string>;
}

export default function TodaysWorkflows({
  className = '',
  workflows: providedWorkflows,
  userId,
  onWorkflowClick,
  completedWorkflowIds = new Set()
}: TodaysWorkflowsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'list'>('list'); // Default to list when workflows provided
  const [dbWorkflows, setDbWorkflows] = useState<WorkflowItem[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // NEW: Fetch workflows from database when userId provided
  useEffect(() => {
    if (userId && !providedWorkflows) {
      loadWorkflowsFromDatabase();
    }
  }, [userId, providedWorkflows]);

  const loadWorkflowsFromDatabase = async () => {
    if (!userId) return;

    setLoadingDb(true);
    try {
      const queryService = new WorkflowQueryService();
      const result = await queryService.getActiveWorkflows(userId);

      if (result.success && result.workflows) {
        const mappedWorkflows = result.workflows.map(wf => ({
          workflowId: wf.id,
          title: wf.workflow_name,
          customerId: wf.customer_id,
          customerName: wf.customer_name || wf.customers?.name || 'Unknown Customer'
        }));
        setDbWorkflows(mappedWorkflows);
      }
    } catch (err) {
      console.error('[TodaysWorkflows] Error loading workflows from database:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  // Static demo data - hardcoded (fallback when no workflows provided)
  const categories = [
    { name: 'Check-ins', complete: true, count: 0 },
    { name: 'Renewals', complete: true, count: 0 },
    { name: 'Expansion', complete: true, count: 0 },
    { name: 'Health Scores', complete: false, count: 2 },
    { name: 'Follow-ups', complete: false, count: 1 },
    { name: 'Pricing', complete: false, count: 2 },
    { name: 'Onboarding', complete: false, count: 1 },
    { name: 'QBRs', complete: false, count: 1 }
  ];

  // Use provided workflows if available, otherwise use fallback hardcoded data
  const staticWorkflows = [
    { customer: 'Obsidian Black', workflow: 'Strategic Account Plan', priority: 'Critical', complete: false },
    { customer: 'DataViz Corp', workflow: 'Expansion Discovery', priority: 'High', complete: false },
    { customer: 'Acme Industries', workflow: 'Health Score Review', priority: 'High', complete: false },
    { customer: 'TechFlow Inc', workflow: 'Renewal Prep', priority: 'Medium', complete: true },
    { customer: 'InnovateCo', workflow: 'QBR Planning', priority: 'Medium', complete: false },
    { customer: 'CloudSync', workflow: 'Check-in', priority: 'Low', complete: true },
    { customer: 'NexGen Solutions', workflow: 'Pricing Review', priority: 'Medium', complete: false },
  ];

  // Map provided workflows to display format
  const displayWorkflows = providedWorkflows?.map(wf => ({
    customer: wf.customerName,
    workflow: wf.title,
    priority: 'High' as const, // Default priority
    complete: completedWorkflowIds.has(wf.workflowId),
    workflowData: wf
  }));

  // NEW: Map database workflows to display format
  const dbDisplayWorkflows = dbWorkflows.map(wf => ({
    customer: wf.customerName,
    workflow: wf.title,
    priority: 'High' as const, // Default priority
    complete: completedWorkflowIds.has(wf.workflowId),
    workflowData: wf
  }));

  // Use workflows in this order: provided > database > static fallback
  const workflows = displayWorkflows || (dbWorkflows.length > 0 ? dbDisplayWorkflows : staticWorkflows);

  const totalWorkflows = providedWorkflows?.length || dbWorkflows.length || 10;
  const completedWorkflows = completedWorkflowIds.size || 3;
  const percentComplete = (completedWorkflows / totalWorkflows) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 text-red-600';
      case 'High':
        return 'bg-orange-50 text-orange-600';
      case 'Medium':
        return 'bg-yellow-50 text-yellow-600';
      case 'Low':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // NEW: Show loading state with zen styling
  if (loadingDb) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg text-gray-700">Today's {TERMINOLOGY.WORKFLOW_PLURAL}</h3>
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg text-gray-700">Today's {TERMINOLOGY.WORKFLOW_PLURAL}</h3>
            <p className="text-sm text-gray-400">{completedWorkflows} of {totalWorkflows} complete</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* RYG Progress Bar - always shown */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-medium text-gray-600">{Math.round(percentComplete)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="flex h-full">
            <div className="bg-green-500 h-2" style={{ width: `${percentComplete}%` }}></div>
            <div className="bg-red-200 h-2" style={{ width: `${100 - percentComplete}%` }}></div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Complete all {totalWorkflows} to hit your daily goal</p>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* View Toggle Tabs */}
          <div className="flex gap-2 my-4 border-b border-gray-200">
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'category'
                  ? 'text-purple-600 border-b-2 border-purple-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'text-purple-600 border-b-2 border-purple-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              By {TERMINOLOGY.WORKFLOW_SINGULAR}
            </button>
          </div>

          {/* Category View */}
          {viewMode === 'category' && (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    item.complete
                      ? 'bg-green-50 border-green-200 cursor-default'
                      : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-700">{item.name}</p>
                    {item.complete ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    ) : (
                      <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {item.complete ? 'Complete' : `${item.count} pending`}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Workflow List View */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {workflows.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!item.complete && 'workflowData' in item && onWorkflowClick && item.workflowData) {
                      onWorkflowClick(item.workflowData as WorkflowItem);
                    }
                  }}
                  disabled={item.complete}
                  className={`w-full p-3 rounded-xl border transition-all text-left ${
                    item.complete
                      ? 'bg-green-50 border-green-200 opacity-60 cursor-default'
                      : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">{item.customer}</p>
                      <p className="text-xs text-gray-500">{item.workflow}</p>
                    </div>
                    <span
                      className={`ml-3 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
