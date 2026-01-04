'use client';

import { useState, useEffect } from 'react';
import { Target, CheckCircle } from 'lucide-react';
import { TERMINOLOGY } from '@/lib/constants';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';

interface PriorityWorkflowCardProps {
  workflowTitle?: string; // Made optional for database mode
  priority?: 'Critical' | 'High' | 'Medium' | 'Low'; // Made optional for database mode
  dueDate?: string; // Made optional for database mode
  arr?: string;
  userId?: string; // NEW: Add userId for database integration
  onLaunch: () => void;
  className?: string;
  completed?: boolean;
  isLoading?: boolean; // NEW: External loading state (e.g., LLM prefetch)
}

export default function PriorityWorkflowCard({
  workflowTitle: providedTitle,
  priority: providedPriority,
  dueDate: providedDueDate,
  arr: providedArr,
  userId,
  onLaunch,
  className = '',
  completed = false,
  isLoading = false
}: PriorityWorkflowCardProps) {
  const [dbWorkflow, setDbWorkflow] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // REMOVED: useEffect that loaded on mount
  // This was causing unnecessary DB queries on dashboard load
  // Now we only load when the user clicks the card

  const loadPriorityWorkflowFromDatabase = async () => {
    if (!userId) return;

    console.log('[PriorityWorkflowCard] loadPriorityWorkflowFromDatabase called');
    console.time('[PriorityWorkflowCard] Total load time');

    setLoadingDb(true);
    try {
      const queryService = new WorkflowQueryService();
      const result = await queryService.getActiveWorkflows(userId);

      console.log('[PriorityWorkflowCard] Query result:', {
        success: result.success,
        workflowCount: result.workflows?.length || 0
      });

      if (result.success && result.workflows && result.workflows.length > 0) {
        // Get the highest priority workflow
        const sortedWorkflows = result.workflows.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
        setDbWorkflow(sortedWorkflows[0]);
        console.log('[PriorityWorkflowCard] Set priority workflow:', sortedWorkflows[0]?.workflow_name);
      } else {
        console.log('[PriorityWorkflowCard] No workflows found');
      }
    } catch (err) {
      console.error('[PriorityWorkflowCard] Error loading workflow from database:', err);
    } finally {
      setLoadingDb(false);
      console.timeEnd('[PriorityWorkflowCard] Total load time');
    }
  };

  // Handle card click - load data first if needed
  const handleCardClick = async () => {
    console.log('[PriorityWorkflowCard] Card clicked');

    // If we have provided data or already loaded from DB, launch immediately
    if (providedTitle || dbWorkflow) {
      console.log('[PriorityWorkflowCard] Data available, launching workflow');
      onLaunch();
      return;
    }

    // Otherwise, load from database first, then launch
    if (!hasInteracted && userId) {
      console.log('[PriorityWorkflowCard] First interaction, loading data...');
      setHasInteracted(true);
      await loadPriorityWorkflowFromDatabase();

      // After loading, trigger launch if we got data
      // (we'll need to use a useEffect to handle this since state update is async)
    }
  };

  // Launch workflow automatically after data loads on first interaction
  useEffect(() => {
    if (hasInteracted && dbWorkflow && onLaunch) {
      console.log('[PriorityWorkflowCard] Data loaded, auto-launching workflow');
      onLaunch();
    }
  }, [dbWorkflow, hasInteracted]);

  // Check if no workflows are available
  const hasNoWorkflows = !providedTitle && !dbWorkflow && hasInteracted;

  // Use provided data or database data
  const workflowTitle = providedTitle || dbWorkflow?.workflow_name || 'Click to load workflow';
  const priority = providedPriority || (dbWorkflow?.priority_score >= 80 ? 'Critical' : dbWorkflow?.priority_score >= 60 ? 'High' : 'Medium') as any;
  const dueDate = providedDueDate || 'Today';
  const arr = providedArr;

  const getPriorityColor = () => {
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

  // NEW: Show loading state with zen styling (for DB loading)
  if (loadingDb) {
    return (
      <div
        id="priority-workflow-card"
        data-testid="priority-workflow-card"
        data-loading="true"
        className={`bg-white rounded-3xl p-10 border border-gray-200 shadow-lg priority-workflow-card priority-workflow-card--loading ${className}`}
      >
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 priority-workflow-card__skeleton priority-workflow-card__skeleton--header"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3 priority-workflow-card__skeleton priority-workflow-card__skeleton--title"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 priority-workflow-card__skeleton priority-workflow-card__skeleton--meta"></div>
        </div>
      </div>
    );
  }

  // Show gradient loading animation when LLM prefetch is in progress
  if (isLoading) {
    return (
      <div
        id="priority-workflow-card"
        data-testid="priority-workflow-card"
        data-loading="llm"
        className={`relative overflow-hidden rounded-3xl p-10 border border-purple-300 shadow-lg priority-workflow-card priority-workflow-card--llm-loading ${className}`}
      >
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(90deg, #a855f7, #6366f1, #8b5cf6, #a855f7)',
            backgroundSize: '300% 100%',
            animation: 'gradient-shift 2s ease infinite',
          }}
        />
        <style jsx>{`
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>

        {/* Content */}
        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6 priority-workflow-card__header">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-500 animate-pulse priority-workflow-card__icon" />
              <span className="text-sm text-gray-500 tracking-wide priority-workflow-card__label">Today&apos;s One Thing</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs font-medium">Loading...</span>
            </div>
          </div>

          {/* Main Content */}
          <h2 className="text-2xl mb-4 text-gray-800 priority-workflow-card__title">
            {workflowTitle}
          </h2>

          {/* Metadata Badges */}
          <div className="flex items-center gap-4 text-sm text-gray-500 priority-workflow-card__meta">
            <span className={`px-3 py-1 ${getPriorityColor()} rounded-full text-xs font-medium priority-workflow-card__priority-badge`}>
              {priority}
            </span>
            <span className="priority-workflow-card__due-date">Due: {dueDate}</span>
            {arr && (
              <>
                <span>•</span>
                <span className="priority-workflow-card__arr">{arr} ARR</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // NEW: Show onboarding message when no workflows available
  if (hasNoWorkflows) {
    return (
      <div
        id="priority-workflow-card"
        data-testid="priority-workflow-card"
        data-state="empty"
        className={`bg-white rounded-3xl p-10 border border-gray-200 shadow-lg relative priority-workflow-card priority-workflow-card--empty ${className}`}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6 priority-workflow-card__header">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-gray-400 priority-workflow-card__icon" />
            <span className="text-sm text-gray-500 tracking-wide priority-workflow-card__label">Today's One Thing</span>
          </div>
        </div>

        {/* Main Content */}
        <h2 className="text-2xl mb-4 text-gray-700 priority-workflow-card__title" data-testid="priority-workflow-title">
          No workflows yet
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6 priority-workflow-card__message" data-testid="priority-workflow-message">
          Workflows will appear here when they're assigned to you. Check with your administrator to set up workflow definitions, or explore Today's Plays below to see all available tasks.
        </p>

        {/* View Plays Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Scroll to Today's Plays section
            const playsSection = document.querySelector('[data-section="todays-plays"]');
            playsSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          data-testid="priority-workflow-view-all-btn"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium priority-workflow-card__action-btn"
        >
          View All Workflows
        </button>
      </div>
    );
  }

  return (
    <div
      id="priority-workflow-card"
      data-testid="priority-workflow-card"
      data-state={completed ? 'completed' : 'active'}
      data-priority={priority?.toLowerCase()}
      onClick={handleCardClick}
      className={`bg-white rounded-3xl p-10 border ${
        completed ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
      } shadow-lg cursor-pointer hover:shadow-xl transition-all group relative priority-workflow-card ${completed ? 'priority-workflow-card--completed' : 'priority-workflow-card--active'} ${className}`}
    >
      {/* Completion Badge */}
      {completed && (
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium priority-workflow-card__badge priority-workflow-card__badge--completed" data-testid="priority-workflow-badge">
          <CheckCircle className="w-4 h-4" />
          <span>Completed</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-6 priority-workflow-card__header">
        <div className="flex items-center gap-3">
          <Target className={`w-6 h-6 ${completed ? 'text-green-500' : 'text-purple-500'} priority-workflow-card__icon`} />
          <span className="text-sm text-gray-500 tracking-wide priority-workflow-card__label">Today's One Thing</span>
        </div>
        {/* Subtle Launch Icon - Passage/Door */}
        {!completed && (
          <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-500 transition-colors priority-workflow-card__launch-hint" data-testid="priority-workflow-launch-hint">
            <img src="/passage_icon.png" alt="Launch" className="w-6 h-6 opacity-40 group-hover:opacity-70 transition-opacity" />
            <span className="text-xs font-medium">Launch {TERMINOLOGY.TASK_MODE}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <h2
        data-testid="priority-workflow-title"
        className={`text-2xl mb-4 transition-colors priority-workflow-card__title ${
          completed
            ? 'text-green-800'
            : 'text-gray-800 group-hover:text-purple-600'
        }`}
      >
        {workflowTitle}
      </h2>

      {/* Metadata Badges */}
      <div className="flex items-center gap-4 text-sm text-gray-500 priority-workflow-card__meta" data-testid="priority-workflow-meta">
        <span className={`px-3 py-1 ${getPriorityColor()} rounded-full text-xs font-medium priority-workflow-card__priority-badge`} data-testid="priority-workflow-priority">
          {priority}
        </span>
        <span className="priority-workflow-card__due-date" data-testid="priority-workflow-due">Due: {dueDate}</span>
        {arr && (
          <>
            <span>•</span>
            <span className="priority-workflow-card__arr" data-testid="priority-workflow-arr">{arr} ARR</span>
          </>
        )}
      </div>
    </div>
  );
}
