/**
 * Tutorial Mode with Workflow Layout
 *
 * New v0-style layout version of the tutorial.
 * Uses WorkflowModeLayout with chat in the sidebar.
 *
 * This component is used when FEATURES.USE_WORKFLOW_MODE_LAYOUT is enabled.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore } from '@/lib/stores/user';
import {
  initializeTutorial,
  sendTutorialMessage,
  persistReport as persistReportApi,
} from '@/lib/api/tutorial';
import { ReportEditor, type ReportTab } from '@/components/report';
import { WorkflowModeLayout } from '@/components/workflow-mode';
import type {
  TutorialStep,
  TutorialProgress,
  ExecutiveReport,
  CharacterProfile,
  ReportConfirmations,
  OutstandingQuestion,
  WorkflowStep,
  WorkflowMessage,
  WorkflowModeActions,
  MessageResponse,
} from '@/lib/types';
import { TUTORIAL_STEPS, getStepIndex, getResumeStep, getAllCompletionKeys } from '@/lib/tutorial/steps';

// =============================================================================
// CONVERT TUTORIAL STEPS TO WORKFLOW STEPS
// =============================================================================

function convertToWorkflowSteps(
  tutorialSteps: typeof TUTORIAL_STEPS,
  currentIndex: number
): WorkflowStep[] {
  return tutorialSteps.map((step, index) => ({
    id: step.id,
    label: step.label,
    description: step.description,
    required: true, // Tutorial steps are always required
    status:
      index < currentIndex
        ? 'completed'
        : index === currentIndex
        ? 'in_progress'
        : 'locked',
    iconName: step.iconName,
    completionKey: step.completionKey,
  }));
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TutorialWorkflowMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();
  const { status } = useUserStatusStore();
  const initializedRef = useRef(false);

  // Tutorial state
  const [progress, setProgress] = useState<TutorialProgress>({
    currentStep: 'welcome',
    stepIndex: getStepIndex('welcome'),
    questionsAnswered: 0,
    totalQuestions: 5,
    viewedReport: false,
  });

  // Data from API
  const [originalReport, setOriginalReport] = useState<ExecutiveReport | null>(null);
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [, setQuestions] = useState<OutstandingQuestion[]>([]);
  const [, setCurrentQuestion] = useState<{ id: string; title: string; prompt: string } | null>(null);

  // Report state
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('status');
  const [reportConfirmations, setReportConfirmations] = useState<ReportConfirmations>({
    status: false,
    personality: false,
    voice: false,
    character: false,
  });
  const [characterProfile] = useState<CharacterProfile | null>(null);

  // Loading state for artifact
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Session context
  const sessionId = searchParams.get('session') || status?.contexts?.active;

  // Convert tutorial steps to workflow steps
  const workflowSteps = convertToWorkflowSteps(TUTORIAL_STEPS, progress.stepIndex);

  // =============================================================================
  // QUICK ACTIONS
  // =============================================================================

  // Get quick actions based on current step
  const getQuickActionsForStep = useCallback((step: TutorialStep) => {
    switch (step) {
      case 'welcome':
        return [
          { label: 'Sure!', value: 'show_report' },
          { label: 'Skip for now', value: 'skip_report' },
        ];
      case 'voice_testing':
        return [
          { label: "Let's test your voice", value: 'start_voice_testing' },
          { label: 'Skip for now', value: 'skip_voice_testing' },
        ];
      case 'tool_testing':
        return [{ label: 'Continue', value: 'continue_to_complete' }];
      case 'complete':
        return [{ label: 'Show me my Founder OS!', value: 'go_to_dashboard' }];
      default:
        return [];
    }
  }, []);

  // =============================================================================
  // MESSAGE HANDLER
  // =============================================================================

  const handleMessage = useCallback(
    async (message: WorkflowMessage): Promise<MessageResponse | null> => {
      // Check for action value in metadata (from quick actions) or fallback to content
      const actionValue = (message.metadata?.actionValue as string) || message.content;
      const displayContent = message.content;

      // Handle special quick action values that require navigation
      if (actionValue === 'go_to_dashboard') {
        navigate('/founder-os/dashboard');
        return null;
      }

      if (actionValue === 'start_voice_testing') {
        navigate(`/founder-os/voice-test?session=${sessionId}&return=/founder-os/tutorial`);
        return null;
      }

      // Track when we're loading a report (show loading in artifact area)
      if (actionValue === 'show_report') {
        setIsLoadingReport(true);
      }

      if (!sessionId) {
        setIsLoadingReport(false);
        return {
          content: "I'm having trouble connecting. Please try again.",
          quickActions: getQuickActionsForStep('welcome'),
        };
      }

      try {
        // Use the display content (label) for the API, or map action values
        let apiMessage = displayContent;
        if (actionValue === 'show_report') {
          apiMessage = 'Sure, show me!';
        } else if (actionValue === 'skip_report') {
          apiMessage = 'Skip for now';
        } else if (actionValue === 'skip_voice_testing') {
          apiMessage = 'Skip voice testing for now';
        } else if (actionValue === 'continue_to_complete') {
          apiMessage = "Let's continue";
        }

        const data = await sendTutorialMessage(
          sessionId,
          apiMessage,
          [],
          progress,
          token
        );

        // Debug logging
        console.log('[tutorial-workflow] API response:', {
          actionValue,
          hasReport: !!data.report,
          newStep: data.progress?.currentStep,
          action: data.action,
        });

        // Handle state updates
        if (data.questions) setQuestions(data.questions);
        if (data.report) {
          console.log('[tutorial-workflow] Setting report:', data.report);
          setOriginalReport(data.report);
          setReport(data.report);
          setIsLoadingReport(false); // Report loaded, clear loading state
        }
        if (data.progress) {
          console.log('[tutorial-workflow] Setting progress:', data.progress);
          setProgress(data.progress);
        }
        if (data.currentQuestion) {
          setCurrentQuestion(data.currentQuestion);
        }

        // Handle special actions from API response
        if (data.action === 'tutorial_complete') {
          localStorage.setItem('founder-os-tutorial-completed', new Date().toISOString());
        }

        // Get quick actions for the new step
        const newStep = data.progress?.currentStep || progress.currentStep;
        const quickActions = getQuickActionsForStep(newStep);

        return {
          content: data.content || '',
          quickActions: quickActions.length > 0 ? quickActions : undefined,
        };
      } catch (error) {
        console.error('[tutorial-workflow] Error sending message:', error);
        setIsLoadingReport(false);
        return {
          content: "Something went wrong. Let's try that again.",
          quickActions: getQuickActionsForStep(progress.currentStep),
        };
      }
    },
    [sessionId, progress, token, navigate, getQuickActionsForStep]
  );

  // =============================================================================
  // STEP HANDLERS
  // =============================================================================

  const handleStepComplete = useCallback((stepId: string) => {
    const step = TUTORIAL_STEPS.find((s) => s.id === stepId);
    if (step?.completionKey) {
      localStorage.setItem(step.completionKey, new Date().toISOString());
    }
  }, []);

  const handleStepChange = useCallback((_fromIndex: number, toIndex: number) => {
    setProgress((prev) => ({
      ...prev,
      currentStep: TUTORIAL_STEPS[toIndex]?.id as TutorialStep,
      stepIndex: toIndex,
    }));
  }, []);

  const handleWorkflowComplete = useCallback(() => {
    localStorage.setItem('founder-os-tutorial-completed', new Date().toISOString());
    navigate('/founder-os/dashboard');
  }, [navigate]);

  const handleReset = useCallback(() => {
    // Clear all tutorial completion keys
    const completionKeys = getAllCompletionKeys();
    completionKeys.forEach(key => localStorage.removeItem(key));

    // Clear the workflow state persistence (key format: persistenceKey-workflowId)
    localStorage.removeItem('founder-os-tutorial-tutorial');
    localStorage.removeItem('founder-os-tutorial-completed');
    localStorage.removeItem('founder-os-tutorial-progress');

    // Also clear any legacy keys that might exist
    localStorage.removeItem('workflow-mode-tutorial');
    localStorage.removeItem('founder-os-tutorial');

    // Reload the page to reset all state
    window.location.reload();
  }, []);

  const handleInitialize = useCallback(async (actions: WorkflowModeActions) => {
    const defaultQuickActions = getQuickActionsForStep('welcome');

    if (!sessionId) {
      // No session - show default welcome with quick actions
      actions.addAssistantMessage(
        "Welcome! Let's get you set up. Would you like to see what I learned about you?",
        defaultQuickActions
      );
      return;
    }

    try {
      const data = await initializeTutorial(sessionId, progress, token);

      // Update state from API response
      if (data.questions) setQuestions(data.questions);
      if (data.report) {
        setOriginalReport(data.report);
        setReport(data.report);
      }
      if (data.progress) {
        setProgress(data.progress);
      }
      if (data.currentQuestion) {
        setCurrentQuestion(data.currentQuestion);
      }

      // Determine which step we're on and get appropriate quick actions
      const currentStep = data.progress?.currentStep || progress.currentStep;
      const quickActions = getQuickActionsForStep(currentStep);

      // Add the welcome message with quick actions
      if (data.content) {
        actions.addAssistantMessage(data.content, quickActions);
      }
    } catch (error) {
      console.error('[tutorial-workflow] Error initializing:', error);
      actions.addAssistantMessage(
        "Welcome! Let's get you set up. Would you like to see what I learned about you?",
        defaultQuickActions
      );
    }
  }, [sessionId, progress, token, getQuickActionsForStep]);

  // =============================================================================
  // REPORT HANDLERS
  // =============================================================================

  const resetReportEdits = useCallback(() => {
    if (originalReport) {
      setReport(originalReport);
      setReportConfirmations({ status: false, personality: false, voice: false, character: false });
    }
  }, [originalReport]);

  const handleFieldEdit = useCallback(
    (field: string, index: number, value: string) => {
      if (!report) return;

      const parts = field.split('.');
      if (parts[0] === 'personality' && parts.length === 3) {
        const fieldName = parts[2] as 'trait' | 'description' | 'insight';
        const updatedPersonality = [...report.personality];
        updatedPersonality[index] = {
          ...updatedPersonality[index],
          [fieldName]: value,
        };
        setReport({
          ...report,
          personality: updatedPersonality,
        });
      }
    },
    [report]
  );

  const persistReport = useCallback(async () => {
    if (!report || !sessionId) return;

    try {
      await persistReportApi(sessionId, report, progress, token);
      setOriginalReport(report);
    } catch (error) {
      console.error('[tutorial-workflow] Error persisting report:', error);
    }
  }, [report, sessionId, progress, token]);

  const confirmReportSection = useCallback(() => {
    setReportConfirmations((prev) => ({ ...prev, [activeReportTab]: true }));

    if (activeReportTab === 'status' && !reportConfirmations.personality) {
      setActiveReportTab('personality');
    } else if (activeReportTab === 'personality' && !reportConfirmations.voice) {
      setActiveReportTab('voice');
    } else if (activeReportTab === 'voice' && !reportConfirmations.character) {
      setActiveReportTab('character');
    }
  }, [activeReportTab, reportConfirmations]);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const tutorialComplete = localStorage.getItem('founder-os-tutorial-completed');
    if (tutorialComplete) {
      navigate('/founder-os/dashboard');
      return;
    }

    const { stepId, stepIndex } = getResumeStep();
    if (stepIndex > 0) {
      setProgress({
        currentStep: stepId as TutorialStep,
        stepIndex,
        questionsAnswered: stepId === 'complete' ? 10 : 0,
        totalQuestions: 10,
        viewedReport: stepIndex > 1,
      });
    }
  }, [navigate]);

  // =============================================================================
  // RENDER
  // =============================================================================

  // Loading artifact component
  const loadingArtifact = (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Preparing your profile...</p>
      </motion.div>
    </div>
  );

  // Artifact content (report or loading)
  const artifactContent = isLoadingReport ? loadingArtifact : (
    report && progress.currentStep === 'about_you' ? (
      <div className="h-full flex flex-col p-4">
        <ReportEditor
          report={report}
          characterProfile={characterProfile}
          activeTab={activeReportTab}
          onTabChange={setActiveReportTab}
          confirmations={reportConfirmations}
          onConfirmSection={confirmReportSection}
          onContinue={persistReport}
          originalReport={originalReport}
          onResetEdits={resetReportEdits}
          onTakeAssessment={() => navigate('/goodhang/assessment?return=/founder-os/tutorial')}
          onFieldEdit={handleFieldEdit}
          className="flex-1 min-h-0"
        />
      </div>
    ) : null
  );

  return (
    <WorkflowModeLayout
      options={{
        workflowId: 'tutorial',
        steps: workflowSteps,
        initialStepIndex: progress.stepIndex,
        onStepComplete: handleStepComplete,
        onStepChange: handleStepChange,
        onWorkflowComplete: handleWorkflowComplete,
        onMessage: handleMessage,
        onReset: handleReset,
        onInitialize: handleInitialize,
        persistenceKey: 'founder-os-tutorial',
        autoSave: true,
      }}
      artifactContent={artifactContent}
      className="h-screen"
    />
  );
}
