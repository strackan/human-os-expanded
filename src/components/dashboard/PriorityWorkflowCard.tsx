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
}

export default function PriorityWorkflowCard({
  workflowTitle: providedTitle,
  priority: providedPriority,
  dueDate: providedDueDate,
  arr: providedArr,
  userId,
  onLaunch,
  className = '',
  completed = false
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

  // NEW: Show loading state with zen styling
  if (loadingDb) {
    return (
      <div className={`bg-white rounded-3xl p-10 border border-gray-200 shadow-lg ${className}`}>
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // NEW: Show completion message when no workflows available
  if (hasNoWorkflows) {
    return (
      <div className={`bg-white rounded-3xl p-10 border border-green-300 bg-green-50/30 shadow-lg relative ${className}`}>
        {/* Completion Badge */}
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle className="w-4 h-4" />
          <span>All Done!</span>
        </div>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-green-500" />
            <span className="text-sm text-gray-500 tracking-wide">Today's One Thing</span>
          </div>
        </div>

        {/* Main Content */}
        <h2 className="text-2xl mb-4 text-green-800">
          You knocked out your big task for the day
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Would you like to view the rest of today's plays?
        </p>

        {/* View Plays Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Scroll to Today's Plays section
            const playsSection = document.querySelector('[data-section="todays-plays"]');
            playsSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          View Today's Plays
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-3xl p-10 border ${
        completed ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
      } shadow-lg cursor-pointer hover:shadow-xl transition-all group relative ${className}`}
    >
      {/* Completion Badge */}
      {completed && (
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle className="w-4 h-4" />
          <span>Completed</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className={`w-6 h-6 ${completed ? 'text-green-500' : 'text-purple-500'}`} />
          <span className="text-sm text-gray-500 tracking-wide">Today's One Thing</span>
        </div>
        {/* Subtle Launch Icon - Passage/Door */}
        {!completed && (
          <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-500 transition-colors">
            <img src="/passage_icon.png" alt="Launch" className="w-6 h-6 opacity-40 group-hover:opacity-70 transition-opacity" />
            <span className="text-xs font-medium">Launch {TERMINOLOGY.TASK_MODE}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <h2 className={`text-2xl mb-4 transition-colors ${
        completed
          ? 'text-green-800'
          : 'text-gray-800 group-hover:text-purple-600'
      }`}>
        {workflowTitle}
      </h2>

      {/* Metadata Badges */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className={`px-3 py-1 ${getPriorityColor()} rounded-full text-xs font-medium`}>
          {priority}
        </span>
        <span>Due: {dueDate}</span>
        {arr && (
          <>
            <span>•</span>
            <span>{arr} ARR</span>
          </>
        )}
      </div>
    </div>
  );
}
