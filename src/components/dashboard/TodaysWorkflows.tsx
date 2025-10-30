'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Play, Target, TrendingUp, AlertTriangle, RefreshCw, Users } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'all' | 'new' | 'due' | 'category'>('all');
  const [dbWorkflows, setDbWorkflows] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // NEW: Fetch workflows from database when userId provided
  // Wrap in useCallback to prevent useEffect dependency issues
  const loadWorkflowsFromDatabase = useCallback(async () => {
    if (!userId) return;

    console.log('[TodaysWorkflows] Loading workflows for user:', userId);
    setLoadingDb(true);

    // Add timeout to prevent infinite loading (5 seconds)
    const timeoutId = setTimeout(() => {
      console.warn('[TodaysWorkflows] Query timeout after 5s, falling back to empty state');
      setDbWorkflows([]);
      setLoadingDb(false);
    }, 5000);

    try {
      const queryService = new WorkflowQueryService();
      const result = await queryService.getActiveWorkflows(userId);

      clearTimeout(timeoutId); // Clear timeout on success

      if (result.success && result.workflows) {
        console.log('[TodaysWorkflows] Successfully loaded', result.workflows.length, 'workflows');
        setDbWorkflows(result.workflows);
      } else {
        console.warn('[TodaysWorkflows] Query failed or returned no workflows:', result.error);
        setDbWorkflows([]);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[TodaysWorkflows] Error loading workflows from database:', err);
      setDbWorkflows([]); // Fallback to empty array on error
    } finally {
      setLoadingDb(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && !providedWorkflows) {
      loadWorkflowsFromDatabase();
    }
  }, [userId, providedWorkflows, loadWorkflowsFromDatabase]);

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

  // NEW: Filter and sort database workflows
  const getFilteredWorkflows = () => {
    if (dbWorkflows.length === 0) return [];

    let filtered = [...dbWorkflows];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (viewMode) {
      case 'all':
        // Show all, sort by criticality
        filtered.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
        break;
      case 'new':
        // Filter: created within last 7 days, sort by newest first
        filtered = filtered.filter(wf => {
          const createdDate = wf.created_at ? new Date(wf.created_at) : null;
          return createdDate && createdDate >= sevenDaysAgo;
        });
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        break;
      case 'due':
        // Filter: has due_date in next 30 days, sort by most urgent first
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(wf => {
          const dueDate = wf.due_date ? new Date(wf.due_date) : null;
          return dueDate && dueDate <= thirtyDaysFromNow;
        });
        filtered.sort((a, b) => {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return dateA - dateB; // Most urgent first
        });
        break;
      case 'category':
        // Show all, sort by category then criticality
        filtered.sort((a, b) => {
          const catA = a.workflow_type || '';
          const catB = b.workflow_type || '';
          if (catA !== catB) return catA.localeCompare(catB);
          return (b.priority_score || 0) - (a.priority_score || 0);
        });
        break;
    }

    return filtered.map(wf => ({
      customer: wf.customer_name || wf.customers?.name || 'Unknown Customer',
      workflow: wf.workflow_name,
      priority: wf.priority_score >= 80 ? 'Critical' : wf.priority_score >= 60 ? 'High' : wf.priority_score >= 40 ? 'Medium' : 'Low',
      complete: completedWorkflowIds.has(wf.id),
      workflowData: {
        workflowId: wf.id,
        title: wf.workflow_name,
        customerId: wf.customer_id,
        customerName: wf.customer_name || wf.customers?.name || 'Unknown Customer'
      }
    }));
  };

  const dbDisplayWorkflows = getFilteredWorkflows();

  // Use workflows in this order: provided > database > static fallback
  const workflows = displayWorkflows || (dbDisplayWorkflows.length > 0 ? dbDisplayWorkflows : staticWorkflows);

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

  const getCardStyles = (priority: string, complete: boolean) => {
    if (complete) {
      return 'bg-green-50 border-green-100 opacity-60 cursor-default';
    }

    // Severity-based color system
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 border-red-100 hover:border-red-300';
      case 'High':
        return 'bg-orange-50 border-orange-100 hover:border-orange-300';
      case 'Medium':
        return 'bg-yellow-50 border-yellow-100 hover:border-yellow-300';
      case 'Low':
        return 'bg-blue-50 border-blue-100 hover:border-blue-300';
      default:
        return 'bg-gray-50 border-gray-100 hover:border-gray-300';
    }
  };

  const getWorkflowIcon = (workflowName: string, workflowType?: string) => {
    // Determine icon based on workflow type or name
    const name = workflowName.toLowerCase();
    const type = workflowType?.toLowerCase() || '';

    if (type === 'risk' || name.includes('risk') || name.includes('executive') || name.includes('escalation')) {
      return AlertTriangle;
    }
    if (type === 'opportunity' || name.includes('expansion') || name.includes('opportunity') || name.includes('upsell')) {
      return TrendingUp;
    }
    if (type === 'renewal' || name.includes('renewal') || name.includes('contract')) {
      return RefreshCw;
    }
    if (type === 'strategic' || name.includes('strategic') || name.includes('plan') || name.includes('account plan')) {
      return Target;
    }
    if (name.includes('engagement') || name.includes('qbr') || name.includes('meeting')) {
      return Users;
    }

    // Default
    return Target;
  };

  const getIconColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-500';
      case 'High':
        return 'text-orange-500';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
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
    <div data-section="todays-plays" className={`bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-purple-100 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-purple-600 font-medium">Today's Plays</span>
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

      {/* Tabs - Always visible */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setViewMode('all')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'all'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setViewMode('new')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'new'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          New
        </button>
        <button
          onClick={() => setViewMode('due')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'due'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Due
        </button>
        <button
          onClick={() => setViewMode('category')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'category'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Category
        </button>
      </div>

      {/* Workflow List View */}
      <div className="space-y-3">
        {/* First workflow - always shown */}
        {workflows.length > 0 && (() => {
          const item = workflows[0];
          const WorkflowIcon = getWorkflowIcon(item.workflow, (item as any).workflowData?.workflow_type);
          return (
            <div className={`p-4 rounded-xl border transition-all hover:shadow-sm ${getCardStyles(item.priority, item.complete)}`}>
              <div className="flex items-start gap-3">
                <WorkflowIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getIconColor(item.priority)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">{item.customer}</p>
                  <p className="text-xs text-gray-500">{item.workflow}</p>
                </div>
                <button
                  onClick={() => {
                    if (!item.complete && 'workflowData' in item && onWorkflowClick && item.workflowData) {
                      onWorkflowClick(item.workflowData as WorkflowItem);
                    }
                  }}
                  disabled={item.complete}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1"
                  aria-label="Launch workflow"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Remaining workflows - shown when expanded */}
        {isExpanded && workflows.slice(1).map((item, idx) => {
          const WorkflowIcon = getWorkflowIcon(item.workflow, (item as any).workflowData?.workflow_type);
          return (
            <div key={idx + 1} className={`p-4 rounded-xl border transition-all hover:shadow-sm ${getCardStyles(item.priority, item.complete)}`}>
              <div className="flex items-start gap-3">
                <WorkflowIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getIconColor(item.priority)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">{item.customer}</p>
                  <p className="text-xs text-gray-500">{item.workflow}</p>
                </div>
                <button
                  onClick={() => {
                    if (!item.complete && 'workflowData' in item && onWorkflowClick && item.workflowData) {
                      onWorkflowClick(item.workflowData as WorkflowItem);
                    }
                  }}
                  disabled={item.complete}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1"
                  aria-label="Launch workflow"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
