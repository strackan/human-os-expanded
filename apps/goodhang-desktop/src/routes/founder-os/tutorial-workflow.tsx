/**
 * Tutorial Mode with Workflow Layout
 *
 * New v0-style layout version of the tutorial.
 * Uses WorkflowModeLayout with chat in the sidebar.
 *
 * This component is used when FEATURES.USE_WORKFLOW_MODE_LAYOUT is enabled.
 */

import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, RotateCcw, Zap } from 'lucide-react';

// Lazy load VoiceTestPage for embedding in artifact panel
const VoiceTestPage = lazy(() => import('./voice-test'));
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore } from '@/lib/stores/user';
import { useQuestionSet } from '@/lib/hooks';
import {
  initializeTutorial,
  sendTutorialMessage,
  persistReport as persistReportApi,
} from '@/lib/api/tutorial';
import { post, isDevMode } from '@/lib/api';
import { ReportEditor, type ReportTab } from '@/components/report';
import { WorkflowModeLayout, ArtifactPanel } from '@/components/workflow-mode';
import { AssessmentFlow } from '@/components/assessment';
import type {
  TutorialStep,
  TutorialProgress,
  ExecutiveReport,
  CharacterProfile,
  CharacterAttributes,
  AssessmentSignals,
  MatchingProfile,
  ReportConfirmations,
  OutstandingQuestion,
  WorkflowStep,
  WorkflowMessage,
  WorkflowModeActions,
  MessageResponse,
  AssessmentConfig,
} from '@/lib/types';
import { TUTORIAL_STEPS, getStepIndex, getResumeStep, getAllCompletionKeys } from '@/lib/tutorial/steps';

// =============================================================================
// ASSESSMENT CONFIGURATION CONSTANTS
// =============================================================================

const ASSESSMENT_STORAGE_KEY = 'fos-consolidated-interview-progress';
const QUESTION_SET_SLUG = 'fos-consolidated-interview';

const ASSESSMENT_LOADING_MESSAGES = [
  "Analyzing your responses...",
  "Building your personality profile...",
  "Mapping your work style...",
  "Generating your comprehensive report...",
];

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
  const { token, userId } = useAuthStore();
  const { status, loading: statusLoading, fetchStatus } = useUserStatusStore();
  const initializedRef = useRef(false);
  const workflowActionsRef = useRef<WorkflowModeActions | null>(null);
  const hasShownReportCompleteRef = useRef(false);

  // Tutorial state
  const [progress, setProgress] = useState<TutorialProgress>({
    currentStep: 'interview',
    stepIndex: getStepIndex('interview'),
    questionsAnswered: 0,
    totalQuestions: 12,
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
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);

  // Loading state for artifact
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Artifact phase state: tracks interview → generating → report transitions
  type ArtifactPhase = 'interview' | 'generating' | 'report';
  const [artifactPhase, setArtifactPhase] = useState<ArtifactPhase>('report');

  // Legacy state (for backwards compatibility)
  const [showInlineAssessment, setShowInlineAssessment] = useState(false);

  // Session context
  const sessionId = searchParams.get('session') || status?.contexts?.active;

  // Fetch questions from database API
  const { sections: questionSections, isLoading: isLoadingQuestions, error: questionsError } = useQuestionSet(QUESTION_SET_SLUG, token);

  // Build assessment config dynamically from fetched questions
  const assessmentConfig: AssessmentConfig | null = useMemo(() => {
    if (isLoadingQuestions || questionsError || questionSections.length === 0) {
      return null;
    }
    return {
      storageKey: ASSESSMENT_STORAGE_KEY,
      sections: questionSections,
      loadingMessages: ASSESSMENT_LOADING_MESSAGES,
      themeColor: 'purple',
      title: 'Profile Interview',
      subtitle: 'Getting to Know You',
      completionTitle: "You've completed the interview!",
      completionDescription:
        "Click below to generate your comprehensive profile. Our AI will analyze your responses and create a personalized report covering your personality, work style, and AI assistant preferences.",
      submitButtonText: 'Generate My Profile',
    };
  }, [questionSections, isLoadingQuestions, questionsError]);

  // Convert tutorial steps to workflow steps
  const workflowSteps = convertToWorkflowSteps(TUTORIAL_STEPS, progress.stepIndex);

  // =============================================================================
  // QUICK ACTIONS
  // =============================================================================

  // Get quick actions based on current step
  const getQuickActionsForStep = useCallback((step: TutorialStep) => {
    switch (step) {
      case 'interview':
        // No quick actions during interview - user completes assessment then confirms report tabs
        return [];
      case 'voice_testing':
        // Voice test is shown automatically in the artifact panel - no quick actions needed
        // Only show skip option if user wants to bypass
        return [
          { label: 'Skip voice testing', value: 'skip_voice_testing' },
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


      // Handle Continue from report - persist and advance to next step (voice_testing)
      if (actionValue === 'continue_from_report') {
        if (report && sessionId) {
          try {
            await persistReportApi(sessionId, report, progress, token);
            setOriginalReport(report);
          } catch (error) {
            console.error('[tutorial-workflow] Error persisting report:', error);
          }
        }
        // Mark interview step as complete
        localStorage.setItem('founder-os-interview-completed', new Date().toISOString());

        // Advance to voice_testing step
        const voiceStepIndex = getStepIndex('voice_testing');
        setProgress((prev) => ({
          ...prev,
          currentStep: 'voice_testing' as TutorialStep,
          stepIndex: voiceStepIndex,
          viewedReport: true,
        }));

        return {
          content: "Your profile is saved! Now let's calibrate your AI voice. This helps me write content that sounds like you.",
          quickActions: getQuickActionsForStep('voice_testing' as TutorialStep),
        };
      }

      // Track when we're loading a report (show loading in artifact area)
      if (actionValue === 'show_report') {
        setIsLoadingReport(true);
      }

      if (!sessionId) {
        setIsLoadingReport(false);
        return {
          content: "I'm having trouble connecting. Please try again.",
          quickActions: getQuickActionsForStep('interview'),
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

  const handleReset = useCallback(async () => {
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
    localStorage.removeItem('founder-os-work-style-completed');
    localStorage.removeItem('goodhang-dnd-assessment-progress');

    // Clear assessment progress localStorage
    localStorage.removeItem(ASSESSMENT_STORAGE_KEY);

    // Reset assessment completion in backend and wait for it
    if (userId) {
      try {
        await post('/api/assessment/reset', { user_id: userId }, token);
        console.log('[tutorial-workflow] Assessment status reset in backend');
      } catch (error) {
        console.error('[tutorial-workflow] Error resetting assessment:', error);
      }
    }

    // Clear the user status store so it doesn't show stale data
    useUserStatusStore.getState().clearStatus();

    // Reset local state
    setCharacterProfile(null);
    setReportConfirmations({ status: false, personality: false, voice: false, character: false });
    setShowInlineAssessment(false);
    setArtifactPhase('interview');

    // Reset refs
    hasShownReportCompleteRef.current = false;
    workflowActionsRef.current = null;

    // Reload the page to reset all state
    window.location.reload();
  }, [userId, token]);

  // Effect to show Continue quick action when all report sections are confirmed
  useEffect(() => {
    const allConfirmed =
      reportConfirmations.status &&
      reportConfirmations.personality &&
      reportConfirmations.voice &&
      reportConfirmations.character;

    if (
      allConfirmed &&
      !hasShownReportCompleteRef.current &&
      workflowActionsRef.current &&
      progress.currentStep === 'interview'
    ) {
      hasShownReportCompleteRef.current = true;
      workflowActionsRef.current.addAssistantMessage(
        "Great, all set? Let's continue.",
        [{ label: 'Continue', value: 'continue_from_report' }]
      );
    }
  }, [reportConfirmations, progress.currentStep]);

  const handleInitialize = useCallback(async (actions: WorkflowModeActions) => {
    // Store actions ref for later use
    workflowActionsRef.current = actions;

    // Get session ID - check URL first, then status
    const currentSessionId = searchParams.get('session') || status?.contexts?.active;

    console.log('[tutorial-workflow] Initialize with sessionId:', currentSessionId, 'status:', status?.contexts);

    if (!currentSessionId) {
      // No session - can't load profile
      actions.addAssistantMessage(
        "Welcome! I couldn't find your session. Please try signing in again."
      );
      return;
    }

    // Immediately show loading state
    setIsLoadingReport(true);
    actions.addAssistantMessage(
      "Hello! Let me check your profile status..."
    );

    try {
      const data = await initializeTutorial(currentSessionId, progress, token);

      // Update state from API response
      if (data.questions) setQuestions(data.questions);

      // Check if user has already completed the assessment
      const hasCompletedAssessment = status?.products?.goodhang?.assessment?.completed ?? false;

      if (hasCompletedAssessment && data.report) {
        // User has completed assessment - show report for review
        setOriginalReport(data.report);
        setReport(data.report);
        setArtifactPhase('report');
        setIsLoadingReport(false);

        // Add follow-up message once report is loaded
        setTimeout(() => {
          actions.addAssistantMessage(
            "Here's your profile based on our conversation. Review each tab (Status, Personality, Voice, Character) and confirm them by clicking 'Looks Good' on each one."
          );
        }, 500);
      } else {
        // User hasn't completed assessment - start interview
        setIsLoadingReport(false);
        setArtifactPhase('interview');
        setShowInlineAssessment(true);

        // Add welcome message
        setTimeout(() => {
          actions.addAssistantMessage(
            "Welcome! Let's get to know you better through a brief interview. Your answers will help create a personalized profile."
          );
        }, 500);
      }

      if (data.currentQuestion) {
        setCurrentQuestion(data.currentQuestion);
      }
    } catch (error) {
      console.error('[tutorial-workflow] Error initializing:', error);
      setIsLoadingReport(false);

      // On error, start the interview anyway
      setArtifactPhase('interview');
      setShowInlineAssessment(true);
      actions.addAssistantMessage(
        "Let's get started with your interview."
      );
    }
  }, [searchParams, status, progress, token]);

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

      // StatusTab fields
      if (field === 'summary') {
        setReport({ ...report, summary: value });
        return;
      }

      if (field === 'communication.style') {
        setReport({
          ...report,
          communication: { ...report.communication, style: value },
        });
        return;
      }

      if (field === 'communication.preferences') {
        const updatedPreferences = [...report.communication.preferences];
        updatedPreferences[index] = value;
        setReport({
          ...report,
          communication: { ...report.communication, preferences: updatedPreferences },
        });
        return;
      }

      // PersonalityTab fields
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
        return;
      }

      // VoiceTab fields
      if (field === 'voice.tone' && report.voice) {
        setReport({
          ...report,
          voice: { ...report.voice, tone: value },
        });
        return;
      }

      if (field === 'voice.style' && report.voice) {
        setReport({
          ...report,
          voice: { ...report.voice, style: value },
        });
        return;
      }

      if (field === 'voice.characteristics' && report.voice) {
        const updatedCharacteristics = [...report.voice.characteristics];
        updatedCharacteristics[index] = value;
        setReport({
          ...report,
          voice: { ...report.voice, characteristics: updatedCharacteristics },
        });
        return;
      }

      if (field === 'voice.examples' && report.voice?.examples) {
        const updatedExamples = [...report.voice.examples];
        updatedExamples[index] = value;
        setReport({
          ...report,
          voice: { ...report.voice, examples: updatedExamples },
        });
        return;
      }
    },
    [report]
  );

  const confirmReportSection = useCallback(() => {
    // Confirm the current tab and advance to the next unconfirmed tab
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
  // INLINE ASSESSMENT HANDLERS
  // =============================================================================

  const handleStartAssessment = useCallback(() => {
    setShowInlineAssessment(true);
    setArtifactPhase('interview');
  }, []);

  const handleAssessmentComplete = useCallback(async (answers: Record<string, string>) => {
    // Transition to generating phase (stay in artifact panel)
    setArtifactPhase('generating');
    setShowInlineAssessment(false);

    // Build transcript in the format the scoring API expects
    // Use the fetched questions from the database
    const allQuestions = questionSections.flatMap((s) => s.questions);
    const transcript = allQuestions.flatMap((q) => [
      { role: 'assistant', content: q.text },
      { role: 'user', content: answers[q.id] || '' },
    ]);

    try {
      const response = await post<{
        success: boolean;
        profile: CharacterProfile;
        attributes: CharacterAttributes;
        signals: AssessmentSignals;
        matching: MatchingProfile;
        overall_score: number;
        summary?: string;
      }>('/api/assessment/score', {
        user_id: userId,
        transcript,
        source: 'desktop_app',
      }, token, { timeout: 120000 }); // 2 minute timeout for AI scoring

      console.log('[tutorial-workflow] Assessment scored successfully', response);

      // Set the character profile from API response with all data
      if (response.profile) {
        setCharacterProfile({
          ...response.profile,
          characterClass: response.profile.class || response.profile.characterClass,
          title: response.profile.tagline || response.profile.title,
          attributes: response.attributes,
          signals: response.signals,
          matching: response.matching,
          overall_score: response.overall_score,
          summary: response.summary,
        });
      }

      // Refresh user status to get updated assessment completion status
      if (token) {
        await fetchStatus(token, userId ?? undefined);
      }

      // Transition to report phase (stay in artifact panel)
      setArtifactPhase('report');

      // Add success message in chat - prompt user to review and confirm the Character tab
      if (workflowActionsRef.current) {
        workflowActionsRef.current.addAssistantMessage(
          "Your profile has been generated! Review each tab and click 'Looks Good' on each one to confirm."
        );
      }
    } catch (error) {
      console.error('[tutorial-workflow] Assessment scoring failed:', error);
      // On error, go back to report phase
      setArtifactPhase('report');
      if (workflowActionsRef.current) {
        workflowActionsRef.current.addAssistantMessage(
          "Something went wrong generating your profile. Please try again."
        );
      }
    }
  }, [userId, token, fetchStatus, questionSections]);

  const handleAssessmentExit = useCallback((_answers: Record<string, string>, _currentIndex: number) => {
    // User exited assessment without completing - go back to report phase
    setShowInlineAssessment(false);
    setArtifactPhase('report');
  }, []);

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
        questionsAnswered: stepId === 'complete' ? 12 : 0,
        totalQuestions: 12,
        viewedReport: stepIndex > 0,
      });
    }
  }, [navigate]);

  // =============================================================================
  // VOICE TEST COMPLETION DETECTION
  // =============================================================================
  // Watch for embedded VoiceTestPage completion and advance to next step

  useEffect(() => {
    if (progress.currentStep !== 'voice_testing') return;

    // Check if voice test was just completed
    const checkVoiceTestComplete = () => {
      const voiceTestComplete = localStorage.getItem('founder-os-voice-test-completed');
      if (voiceTestComplete) {
        // Advance to next step (tool_testing)
        const nextStepIndex = getStepIndex('tool_testing');
        setProgress((prev) => ({
          ...prev,
          currentStep: 'tool_testing' as TutorialStep,
          stepIndex: nextStepIndex,
        }));

        // Add completion message
        if (workflowActionsRef.current) {
          workflowActionsRef.current.addAssistantMessage(
            "Voice calibration complete! Your AI voice profile has been saved. Let's continue with the final setup.",
            [{ label: 'Continue', value: 'continue_to_complete' }]
          );
        }
      }
    };

    // Check immediately in case it was completed before we started watching
    checkVoiceTestComplete();

    // Set up interval to check periodically (VoiceTestPage updates localStorage on completion)
    const interval = setInterval(checkVoiceTestComplete, 1000);

    return () => clearInterval(interval);
  }, [progress.currentStep]);

  // =============================================================================
  // LOAD REPORT ON MOUNT (independent of workflow initialization)
  // =============================================================================
  // This effect ensures the report is loaded even when workflow state is restored
  // from localStorage (where onInitialize is skipped).

  const hasLoadedReportRef = useRef(false);

  useEffect(() => {
    // Skip if already loaded, loading, or another path is loading
    if (hasLoadedReportRef.current || report || isLoadingReport) return;

    // Need a session ID to load the report
    const currentSessionId = searchParams.get('session') || status?.contexts?.active;
    if (!currentSessionId || statusLoading) return;

    // Mark as loading to prevent duplicate requests
    hasLoadedReportRef.current = true;

    const loadReport = async () => {
      console.log('[tutorial-workflow] Loading report for restored session:', currentSessionId);
      setIsLoadingReport(true);

      try {
        const data = await initializeTutorial(currentSessionId, progress, token);

        if (data.report) {
          console.log('[tutorial-workflow] Report loaded via fallback:', data.report);
          setOriginalReport(data.report);
          setReport(data.report);
        }
        if (data.questions) {
          setQuestions(data.questions);
        }
      } catch (error) {
        console.error('[tutorial-workflow] Error loading report:', error);
      } finally {
        setIsLoadingReport(false);
      }
    };

    loadReport();
  }, [searchParams, status, statusLoading, report, isLoadingReport, progress, token]);

  // =============================================================================
  // AUTO-SAVE EDITS
  // =============================================================================
  // Debounced save effect (1 second delay) when report is modified via inline editing

  useEffect(() => {
    // Skip if no report, no session, or report hasn't changed
    if (!report || !sessionId) return;
    if (JSON.stringify(report) === JSON.stringify(originalReport)) return;

    const timeout = setTimeout(async () => {
      try {
        console.log('[tutorial-workflow] Auto-saving report edits...');
        await persistReportApi(sessionId, report, progress, token);
        setOriginalReport(report);
        console.log('[tutorial-workflow] Report auto-saved successfully');
      } catch (error) {
        console.error('[tutorial-workflow] Error auto-saving report:', error);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [report, originalReport, sessionId, progress, token]);

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

  // Debug: log artifact state
  console.log('[tutorial-workflow] Artifact state:', {
    isLoadingReport,
    hasReport: !!report,
    currentStep: progress.currentStep,
    artifactPhase,
    showInlineAssessment,
  });

  // Artifact content (report or loading)
  // Check if user has completed the GoodHang assessment
  const hasCompletedAssessment = status?.products?.goodhang?.assessment?.completed ?? false;

  // Determine artifact content based on phase for seamless transitions
  // The artifact panel stays open throughout: interview → generating → report
  const getArtifactContent = () => {
    // Show loading when initial report is loading
    if (isLoadingReport) {
      return (
        <ArtifactPanel showStepProgress={false}>
          {loadingArtifact}
        </ArtifactPanel>
      );
    }

    // Phase-based rendering for seamless transitions
    if (artifactPhase === 'interview' || showInlineAssessment) {
      // Show loading while questions are being fetched
      if (isLoadingQuestions || !assessmentConfig) {
        return (
          <ArtifactPanel showStepProgress={false}>
            <div className="h-full flex flex-col items-center justify-center p-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Loading questions...</p>
            </div>
          </ArtifactPanel>
        );
      }

      // Show error if questions failed to load
      if (questionsError) {
        return (
          <ArtifactPanel showStepProgress={false}>
            <div className="h-full flex flex-col items-center justify-center p-4">
              <p className="text-red-400 mb-2">Failed to load questions</p>
              <p className="text-gray-500 text-sm">{questionsError}</p>
            </div>
          </ArtifactPanel>
        );
      }

      return (
        <ArtifactPanel showStepProgress={false}>
          <div className="h-full overflow-y-auto">
            <AssessmentFlow
              config={assessmentConfig}
              onComplete={handleAssessmentComplete}
              onExit={handleAssessmentExit}
            />
          </div>
        </ArtifactPanel>
      );
    }

    if (artifactPhase === 'generating') {
      return (
        <ArtifactPanel showStepProgress={false}>
          <div className="h-full flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-300 text-lg font-medium mb-2">Analyzing your responses...</p>
              <p className="text-gray-500 text-sm">Generating your comprehensive profile</p>
            </motion.div>
          </div>
        </ArtifactPanel>
      );
    }

    // Default: report phase - show report editor if we have a report and are on interview step
    if (report && progress.currentStep === 'interview') {
      return (
        <ArtifactPanel showStepProgress={false}>
          <ReportEditor
            report={report}
            characterProfile={characterProfile}
            activeTab={activeReportTab}
            onTabChange={setActiveReportTab}
            confirmations={reportConfirmations}
            onConfirmSection={confirmReportSection}
            originalReport={originalReport}
            onResetEdits={resetReportEdits}
            onTakeAssessment={handleStartAssessment}
            onFieldEdit={handleFieldEdit}
            hasCompletedAssessment={hasCompletedAssessment}
            className="h-full"
          />
        </ArtifactPanel>
      );
    }

    // Voice testing step - show embedded VoiceTestPage in artifact panel
    if (progress.currentStep === 'voice_testing') {
      return (
        <ArtifactPanel showStepProgress={false}>
          <Suspense fallback={
            <div className="h-full flex flex-col items-center justify-center p-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Loading voice test...</p>
            </div>
          }>
            <VoiceTestPage />
          </Suspense>
        </ArtifactPanel>
      );
    }

    return null;
  };

  const artifactContent = getArtifactContent();

  // Wait for session ID to be available
  const effectiveSessionId = searchParams.get('session') || status?.contexts?.active;

  console.log('[tutorial-workflow] Session check:', {
    effectiveSessionId,
    statusLoading,
    contextsActive: status?.contexts?.active,
    urlSession: searchParams.get('session')
  });

  // Don't render until we have a session ID (or status finished loading with no session)
  if (!effectiveSessionId) {
    if (statusLoading) {
      return (
        <div className="h-screen-titlebar flex items-center justify-center bg-gh-dark-900">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your session...</p>
          </div>
        </div>
      );
    }
    // Status loaded but no session - show error
    return (
      <div className="h-screen-titlebar flex items-center justify-center bg-gh-dark-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">Could not find your session.</p>
          <button
            onClick={() => navigate('/activate')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  // Hide chat input during interview and voice testing steps (they have their own inputs)
  const shouldHideChatInput = progress.currentStep === 'interview' || progress.currentStep === 'voice_testing';

  return (
    <>
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
        hideChatInput={shouldHideChatInput}
        className="h-screen-titlebar"
      />

      {/* Dev Mode Toolbar - positioned top-right to avoid blocking UI */}
      {isDevMode() && (
        <div className="fixed top-12 right-4 z-50 flex gap-2">
          <button
            onClick={handleStartAssessment}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded shadow-lg flex items-center gap-1 border border-purple-500"
            title="Start assessment (Dev Mode)"
          >
            <Zap className="w-3 h-3" />
            Assessment
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded shadow-lg flex items-center gap-1 border border-yellow-500"
            title="Reset all progress (Dev Mode)"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <div className="px-2 py-1 bg-gray-800 text-yellow-400 text-xs font-mono rounded shadow-lg border border-yellow-500/50">
            DEV
          </div>
        </div>
      )}
    </>
  );
}
