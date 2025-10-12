/**
 * Workflow Executor Component
 *
 * Main orchestrator for workflow execution with step navigation,
 * state management, progress tracking, and auto-save.
 *
 * Features:
 * - Step-by-step navigation with breadcrumbs
 * - Workflow state management (current step, data, artifacts)
 * - Progress tracking with visual indicator
 * - Auto-save mechanism (debounced)
 * - Backend API integration for workflow executions
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, Save, Check, AlertCircle, MessageCircle, Zap } from 'lucide-react';
import { StepRenderer } from './StepRenderer';
import { ArtifactDisplay } from './ArtifactDisplay';
import { CustomerMetrics, MetricsToggleButton } from './CustomerMetrics';
import { WorkflowChatPanel } from './WorkflowChatPanel';
import { TaskPanel } from './TaskPanel';
import { WorkflowContextProvider } from '@/contexts/WorkflowContext';
import { createClient } from '@/lib/supabase';

// =====================================================
// Types
// =====================================================

export interface WorkflowStep {
  id: string;
  number: number;
  title: string;
  description: string;
  component: string; // Component name to render
  validation?: (data: any) => boolean;
  artifacts?: Array<{
    id: string;
    type: 'dashboard' | 'status_grid' | 'countdown' | 'action_tracker' | 'timeline' | 'table' | 'checklist' | 'alert' | 'markdown';
    title: string;
    autoRefresh?: boolean;
    refreshInterval?: number; // seconds
    visible?: string; // template condition
    config: any;
  }>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecutionState {
  executionId: string;
  workflowId: string;
  currentStepIndex: number;
  completedSteps: Set<number>;
  stepData: Map<number, any>; // Step data indexed by step number
  artifacts: Map<number, any[]>; // Artifacts indexed by step number
  status: 'not_started' | 'in_progress' | 'completed' | 'completed_with_pending_tasks';
}

export interface WorkflowExecutorProps {
  workflowDefinition: WorkflowDefinition;
  customerId: string;
  executionId?: string; // If resuming existing execution
  onComplete?: (executionId: string) => void;
  onExit?: () => void;
}

// =====================================================
// WorkflowExecutor Component
// =====================================================

export const WorkflowExecutor: React.FC<WorkflowExecutorProps> = ({
  workflowDefinition,
  customerId,
  executionId: initialExecutionId,
  onComplete,
  onExit
}) => {
  const supabase = createClient();

  // State
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>({
    executionId: initialExecutionId || '',
    workflowId: workflowDefinition.id,
    currentStepIndex: 0,
    completedSteps: new Set(),
    stepData: new Map(),
    artifacts: new Map(),
    status: 'not_started'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [artifactsPanelOpen, setArtifactsPanelOpen] = useState(false);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50); // percentage
  const [artifactsExpanded, setArtifactsExpanded] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const resizeRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // Initialization & Loading
  // =====================================================

  useEffect(() => {
    initializeExecution();
  }, []);

  const initializeExecution = async () => {
    try {
      if (initialExecutionId) {
        // Load existing execution
        console.log('[WorkflowExecutor] Loading execution:', initialExecutionId);
        await loadExecution(initialExecutionId);
      } else {
        // Create new execution
        console.log('[WorkflowExecutor] Creating new execution for workflow:', workflowDefinition.id);
        const newExecutionId = await createExecution();
        setExecutionState(prev => ({
          ...prev,
          executionId: newExecutionId,
          status: 'in_progress'
        }));
      }
    } catch (error) {
      console.error('[WorkflowExecutor] Initialization error:', error);
      setSaveError('Failed to initialize workflow execution');
    }
  };

  const createExecution = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch('/api/workflows/executions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowConfigId: workflowDefinition.id,
        workflowName: workflowDefinition.name,
        workflowType: 'discovery', // Default type for now
        customerId,
        totalSteps: workflowDefinition.steps.length
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WorkflowExecutor] Create execution error:', errorData);
      throw new Error(errorData.error || 'Failed to create workflow execution');
    }

    const { execution } = await response.json();
    console.log('[WorkflowExecutor] Created execution:', execution.id);
    return execution.id;
  };

  const loadExecution = async (executionId: string) => {
    const response = await fetch(`/api/workflows/executions/${executionId}`);
    if (!response.ok) {
      throw new Error('Failed to load workflow execution');
    }

    const { execution } = await response.json();

    // Get step executions
    const { data: stepExecutions } = await supabase
      .from('workflow_step_executions')
      .select('*')
      .eq('workflow_execution_id', executionId)
      .order('step_index', { ascending: true });

    // Reconstruct state from loaded data
    const stepData = new Map();
    const artifacts = new Map();
    const completedSteps = new Set<number>();

    stepExecutions?.forEach((stepExec: any) => {
      const stepNumber = stepExec.step_index + 1; // Convert 0-based to 1-based
      if (stepExec.metadata) {
        stepData.set(stepNumber, stepExec.metadata);
        if (stepExec.metadata.artifacts) {
          artifacts.set(stepNumber, stepExec.metadata.artifacts);
        }
      }
      if (stepExec.status === 'completed') {
        completedSteps.add(stepNumber);
      }
    });

    setExecutionState({
      executionId,
      workflowId: execution.workflow_config_id,
      currentStepIndex: execution.current_step_index || 0,
      completedSteps,
      stepData,
      artifacts,
      status: execution.status
    });

    console.log('[WorkflowExecutor] Loaded execution:', executionId, 'at step', execution.current_step_index);
  };

  // =====================================================
  // Auto-save
  // =====================================================

  const saveStepData = useCallback(async (stepNumber: number, data: any) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const response = await fetch(`/api/workflows/executions/${executionState.executionId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber,
          stepData: data,
          status: 'in_progress'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[WorkflowExecutor] Save error response:', errorData);
        throw new Error(errorData.error || 'Failed to save step data');
      }

      setLastSaved(new Date());
      console.log('[WorkflowExecutor] Saved step', stepNumber, 'data');
    } catch (error) {
      console.error('[WorkflowExecutor] Save error:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  }, [executionState.executionId]);

  const debouncedSave = useCallback((stepNumber: number, data: any) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for 500ms debounce
    saveTimeoutRef.current = setTimeout(() => {
      saveStepData(stepNumber, data);
    }, 500);
  }, [saveStepData]);

  // =====================================================
  // Step Navigation
  // =====================================================

  const navigateToStep = async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= workflowDefinition.steps.length) {
      return;
    }

    // Save current step data before navigating
    const currentStep = workflowDefinition.steps[executionState.currentStepIndex];
    const currentData = executionState.stepData.get(currentStep.number);
    if (currentData) {
      await saveStepData(currentStep.number, currentData);
    }

    setExecutionState(prev => ({
      ...prev,
      currentStepIndex: stepIndex
    }));

    // Update backend with new current step (use current_step_index for existing schema)
    await fetch(`/api/workflows/executions/${executionState.executionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentStep: stepIndex // API will map this to current_step_index
      })
    });
  };

  const completeStep = async (stepNumber: number) => {
    try {
      // Cancel any pending debounced saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Optimistically update UI first
      setExecutionState(prev => ({
        ...prev,
        completedSteps: new Set([...prev.completedSteps, stepNumber])
      }));

      // Mark step as completed (single API call)
      const response = await fetch(`/api/workflows/executions/${executionState.executionId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber,
          status: 'completed'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[WorkflowExecutor] Complete step error response:', errorData);
        throw new Error(errorData.error || 'Failed to complete step');
      }

      console.log('[WorkflowExecutor] Completed step:', stepNumber);

      // Auto-advance to next step if not last
      if (executionState.currentStepIndex < workflowDefinition.steps.length - 1) {
        // Navigate immediately (UI update is instant)
        const nextStepIndex = executionState.currentStepIndex + 1;
        setExecutionState(prev => ({
          ...prev,
          currentStepIndex: nextStepIndex
        }));

        // Update backend asynchronously (don't await)
        fetch(`/api/workflows/executions/${executionState.executionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentStep: nextStepIndex })
        }).catch(err => console.error('Failed to update current step:', err));
      } else {
        // Last step completed - mark workflow as complete
        await completeWorkflow();
      }
    } catch (error) {
      console.error('[WorkflowExecutor] Error completing step:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to complete step');
    }
  };

  const completeWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflows/executions/${executionState.executionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete workflow');
      }

      setExecutionState(prev => ({
        ...prev,
        status: 'completed'
      }));

      console.log('[WorkflowExecutor] Workflow completed');
      onComplete?.(executionState.executionId);
    } catch (error) {
      console.error('[WorkflowExecutor] Error completing workflow:', error);
    }
  };

  // =====================================================
  // Data Handlers
  // =====================================================

  const handleStepDataChange = (stepNumber: number, data: any) => {
    setExecutionState(prev => {
      const newStepData = new Map(prev.stepData);
      newStepData.set(stepNumber, data);
      return {
        ...prev,
        stepData: newStepData
      };
    });

    // Trigger debounced save
    debouncedSave(stepNumber, data);
  };

  const handleArtifactGenerated = (stepNumber: number, artifact: any) => {
    setExecutionState(prev => {
      const newArtifacts = new Map(prev.artifacts);
      const stepArtifacts = newArtifacts.get(stepNumber) || [];
      newArtifacts.set(stepNumber, [...stepArtifacts, artifact]);
      return {
        ...prev,
        artifacts: newArtifacts
      };
    });

    // Open artifacts panel when new artifact generated
    setArtifactsPanelOpen(true);
  };

  // =====================================================
  // Resize Handling
  // =====================================================

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;

      // Constrain between 20% and 80%
      const constrainedWidth = Math.min(Math.max(newWidth, 20), 80);
      setArtifactsPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // =====================================================
  // Render
  // =====================================================

  const currentStep = workflowDefinition.steps[executionState.currentStepIndex];
  const currentStepData = executionState.stepData.get(currentStep?.number);
  const progressPercentage = ((executionState.currentStepIndex + 1) / workflowDefinition.steps.length) * 100;

  // Collect all artifacts across steps
  const allArtifacts: any[] = [];
  executionState.artifacts.forEach((artifacts, stepNumber) => {
    artifacts.forEach(artifact => {
      allArtifacts.push({
        ...artifact,
        stepNumber,
        stepTitle: workflowDefinition.steps.find(s => s.number === stepNumber)?.title
      });
    });
  });

  if (!currentStep) {
    return <div className="p-8 text-center">Loading workflow...</div>;
  }

  return (
    <WorkflowContextProvider customerId={customerId} executionId={executionState.executionId}>
      <div id="workflow-executor" className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div id="workflow-header" className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 id="workflow-name" className="text-2xl font-bold text-gray-900">{workflowDefinition.name}</h1>
            <p id="workflow-description" className="text-sm text-gray-600 mt-1">{workflowDefinition.description}</p>
          </div>

          <div id="workflow-controls" className="flex items-center space-x-4">
            {/* Metrics Toggle Button */}
            <MetricsToggleButton
              isOpen={metricsOpen}
              onClick={() => setMetricsOpen(!metricsOpen)}
            />

            {/* Chat Toggle Button */}
            <button
              id="workflow-chat-toggle"
              onClick={() => setChatPanelOpen(!chatPanelOpen)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                ${chatPanelOpen
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              title={chatPanelOpen ? 'Close chat panel' : 'Open chat panel'}
              aria-label={chatPanelOpen ? 'Close chat panel' : 'Open chat panel'}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Chat</span>
            </button>

            {/* Tasks Toggle Button */}
            <button
              id="workflow-tasks-toggle"
              onClick={() => setTaskPanelOpen(!taskPanelOpen)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                ${taskPanelOpen
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              title={taskPanelOpen ? 'Close tasks panel' : 'Open tasks panel'}
              aria-label={taskPanelOpen ? 'Close tasks panel' : 'Open tasks panel'}
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Tasks</span>
            </button>

            {/* Save Status */}
            <div className="flex items-center space-x-2 text-sm">
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-gray-600">Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </>
              ) : null}
              {saveError && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">{saveError}</span>
                </>
              )}
            </div>

            {/* Exit Button */}
            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div id="workflow-progress" className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span id="workflow-step-counter" className="text-sm font-medium text-gray-700">
              Step {executionState.currentStepIndex + 1} of {workflowDefinition.steps.length}
            </span>
            <span id="workflow-progress-percentage" className="text-sm text-gray-600">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              id="workflow-progress-bar"
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div id="workflow-breadcrumbs" className="mt-4 flex items-center space-x-2 overflow-x-auto pb-2">
          {workflowDefinition.steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => navigateToStep(index)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                  ${index === executionState.currentStepIndex
                    ? 'bg-blue-500 text-white'
                    : executionState.completedSteps.has(step.number)
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {step.number}. {step.title}
              </button>
              {index < workflowDefinition.steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div id="workflow-main-content" className="flex-1 flex overflow-hidden relative">
        {/* Step Content */}
        <div
          id="workflow-step-container"
          className={`flex flex-col overflow-hidden transition-all duration-300 ${
            artifactsExpanded ? 'hidden' : ''
          }`}
          style={{
            width: artifactsPanelOpen && !artifactsExpanded
              ? `${100 - artifactsPanelWidth}%`
              : '100%'
          }}
        >
          {/* Customer Metrics (slides down from top) */}
          <CustomerMetrics
            customerId={customerId}
            executionId={executionState.executionId}
            isOpen={metricsOpen}
            onToggle={() => setMetricsOpen(false)}
          />

          {/* Step Content (scrollable, takes remaining height) */}
          <div id="workflow-step-content" className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <StepRenderer
                  step={currentStep}
                  data={currentStepData}
                  executionId={executionState.executionId}
                  customerId={customerId}
                  onDataChange={(data) => handleStepDataChange(currentStep.number, data)}
                  onArtifactGenerated={(artifact) => handleArtifactGenerated(currentStep.number, artifact)}
                  onComplete={() => completeStep(currentStep.number)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        {artifactsPanelOpen && !artifactsExpanded && (
          <div
            ref={resizeRef}
            onMouseDown={handleResizeStart}
            className={`
              w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize relative group
              transition-colors duration-150 flex-shrink-0
              ${isResizing ? 'bg-blue-500' : ''}
            `}
          >
            {/* Resize Pill/Notch */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-1.5 h-12 bg-gray-300 group-hover:bg-blue-500 rounded-full
                          transition-colors duration-150
                          flex items-center justify-center">
              <div className="w-0.5 h-8 bg-white/50 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Artifact Panel */}
        {artifactsPanelOpen && (
          <div
            className={`border-l border-gray-200 bg-white transition-all duration-300 ${
              artifactsExpanded ? 'fixed inset-0 z-50' : 'relative'
            }`}
            style={{
              width: artifactsExpanded ? '100%' : `${artifactsPanelWidth}%`
            }}
          >
            <ArtifactDisplay
              artifacts={allArtifacts}
              onClose={() => {
                setArtifactsPanelOpen(false);
                setArtifactsExpanded(false);
              }}
              isExpanded={artifactsExpanded}
              onToggleExpand={() => setArtifactsExpanded(!artifactsExpanded)}
            />
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
        <button
          onClick={() => navigateToStep(executionState.currentStepIndex - 1)}
          disabled={executionState.currentStepIndex === 0}
          className="
            flex items-center space-x-2 px-4 py-2 rounded-md
            disabled:opacity-50 disabled:cursor-not-allowed
            text-gray-700 hover:bg-gray-100 transition-colors
          "
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => {
            if (executionState.currentStepIndex === workflowDefinition.steps.length - 1) {
              completeStep(currentStep.number);
            } else {
              navigateToStep(executionState.currentStepIndex + 1);
            }
          }}
          className="
            flex items-center space-x-2 px-6 py-2 rounded-md
            bg-blue-500 text-white hover:bg-blue-600 transition-colors
          "
        >
          <span>
            {executionState.currentStepIndex === workflowDefinition.steps.length - 1
              ? 'Complete Workflow'
              : 'Continue'}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      </div>

      {/* Chat Panel (slides in from right) */}
      <WorkflowChatPanel
        workflowId={workflowDefinition.id}
        stepId={currentStep.id}
        executionId={executionState.executionId}
        isOpen={chatPanelOpen}
        onClose={() => setChatPanelOpen(false)}
        onNavigateToStep={(stepId) => {
          // Find step index by ID and navigate
          const stepIndex = workflowDefinition.steps.findIndex(s => s.id === stepId);
          if (stepIndex !== -1) {
            navigateToStep(stepIndex);
          }
        }}
      />

      {/* Task Panel (slides in from right, stacks with chat if both open) */}
      <TaskPanel
        workflowExecutionId={executionState.executionId}
        customerId={customerId}
        isOpen={taskPanelOpen}
        onClose={() => setTaskPanelOpen(false)}
        onCreateTask={() => {
          // TODO: Open task creation dialog
          console.log('[WorkflowExecutor] Create task clicked');
        }}
      />
    </WorkflowContextProvider>
  );
};
