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
import { Loader2, RotateCcw, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore } from '@/lib/stores/user';
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
  AssessmentSection,
} from '@/lib/types';
import { TUTORIAL_STEPS, getStepIndex, getResumeStep, getAllCompletionKeys } from '@/lib/tutorial/steps';

// =============================================================================
// GOODHANG ASSESSMENT CONFIGURATION (for inline display)
// =============================================================================

const ASSESSMENT_STORAGE_KEY = 'goodhang-dnd-assessment-progress';

const ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    id: 'your-story',
    title: 'Your Story',
    transitionMessage: "Let's start with some moments that have shaped who you are.",
    questions: [
      {
        id: 'a1-turning-point',
        text: 'Describe a moment or experience that fundamentally changed who you are or how you see the world.',
        followUp: 'Be specific about what happened and how it changed you.',
      },
      {
        id: 'a2-happiest-memory',
        text: 'Tell me about your single happiest memory.',
        followUp: 'What made this moment so special?',
      },
      {
        id: 'a3-difficult-time',
        text: 'Tell me about a difficult time in your life and how you got through it.',
        followUp: 'What did you learn about yourself?',
      },
      {
        id: 'a4-redemption',
        text: 'Tell me about something bad that happened to you that ultimately led to something good.',
        followUp: 'How did the transformation happen?',
      },
    ],
  },
  {
    id: 'who-you-are',
    title: 'Who You Are',
    transitionMessage: "Now let's explore your core identity and values.",
    questions: [
      {
        id: 'b1-failed-someone',
        text: 'Tell me about a time you failed someone you care about.',
        followUp: 'How did it affect your relationship?',
      },
      {
        id: 'b2-core-identity',
        text: "If you stripped away your job, relationships, and achievements - what would remain? What's the core 'you'?",
        followUp: 'What defines you beyond external factors?',
      },
      {
        id: 'b3-simple-thing',
        text: "What's a simple thing that matters a lot to you?",
        followUp: 'Why does this resonate so deeply?',
      },
    ],
  },
  {
    id: 'how-you-connect',
    title: 'How You Connect',
    transitionMessage: "Finally, let's understand how you relate to others.",
    questions: [
      {
        id: 'c1-relationship-need',
        text: 'What do you need from close relationships that you rarely ask for directly?',
        followUp: "What makes it hard to ask?",
      },
      {
        id: 'c2-intellectual-gap',
        text: "What's something you believe in intellectually but can't fully commit to in practice?",
        followUp: 'What holds you back?',
      },
      {
        id: 'c3-happiness-barrier',
        text: "What's really keeping you from being happy?",
        followUp: 'Be honest with yourself.',
      },
    ],
  },
];

const ASSESSMENT_LOADING_MESSAGES = [
  "Analyzing your responses...",
  "Calculating your archetype...",
  "Mapping personality dimensions...",
  "Generating your D&D profile...",
];

const ASSESSMENT_CONFIG: AssessmentConfig = {
  storageKey: ASSESSMENT_STORAGE_KEY,
  sections: ASSESSMENT_SECTIONS,
  loadingMessages: ASSESSMENT_LOADING_MESSAGES,
  themeColor: 'purple',
  title: 'Good Hang Assessment',
  subtitle: 'D&D Character Profile',
  completionTitle: "You've completed all questions!",
  completionDescription:
    "Click below to submit your assessment and generate your D&D character profile. Our AI will analyze your responses and map your personality to a unique race, class, and alignment.",
  submitButtonText: 'Submit & Generate Profile',
};

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
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);

  // Loading state for artifact
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Inline assessment state
  const [showInlineAssessment, setShowInlineAssessment] = useState(false);

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
      case 'about_you':
        // No quick actions - user confirms each tab via the report editor buttons
        // "Continue" is added by the effect when all tabs are confirmed
        return [];
      case 'work_questions':
        return [
          { label: 'Start Work Style Questions', value: 'start_work_questions' },
          { label: 'Skip for now', value: 'skip_work_questions' },
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

      if (actionValue === 'start_work_questions') {
        navigate(`/founder-os/work-style-assessment?session=${sessionId}&return=/founder-os/tutorial`);
        return null;
      }

      if (actionValue === 'skip_work_questions') {
        // Skip to voice testing step
        const voiceStepIndex = getStepIndex('voice_testing');
        setProgress(prev => ({
          ...prev,
          currentStep: 'voice_testing',
          stepIndex: voiceStepIndex,
        }));
        return {
          content: "No problem! We can always do the work style questions later. Let's move on to voice testing.",
          quickActions: getQuickActionsForStep('voice_testing'),
        };
      }

      // Handle Continue from report - persist and advance to next step
      if (actionValue === 'continue_from_report') {
        if (report && sessionId) {
          try {
            await persistReportApi(sessionId, report, progress, token);
            setOriginalReport(report);
          } catch (error) {
            console.error('[tutorial-workflow] Error persisting report:', error);
          }
        }
        // Advance to next step (work_questions)
        const nextStepIndex = progress.stepIndex + 1;
        const nextStep = TUTORIAL_STEPS[nextStepIndex];
        if (nextStep) {
          // Mark current step completion
          const currentStep = TUTORIAL_STEPS[progress.stepIndex];
          if (currentStep?.completionKey) {
            localStorage.setItem(currentStep.completionKey, new Date().toISOString());
          }
          // Update progress
          setProgress((prev) => ({
            ...prev,
            currentStep: nextStep.id as TutorialStep,
            stepIndex: nextStepIndex,
            viewedReport: true,
          }));
        }
        return {
          content: "Your profile looks great! Let me ask you a few quick questions to personalize your experience even further.",
          quickActions: getQuickActionsForStep(nextStep?.id as TutorialStep || 'work_questions'),
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
      progress.currentStep === 'about_you'
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

    // Immediately show loading state and welcome message
    setIsLoadingReport(true);
    actions.addAssistantMessage(
      "Hello! Let's start by taking a look at what I already know about you."
    );

    try {
      const data = await initializeTutorial(currentSessionId, progress, token);

      // Update state from API response
      if (data.questions) setQuestions(data.questions);
      if (data.report) {
        setOriginalReport(data.report);
        setReport(data.report);
        // Move to about_you step to show the report
        setProgress(prev => ({
          ...prev,
          currentStep: 'about_you',
          stepIndex: getStepIndex('about_you'),
          viewedReport: true,
        }));
        setIsLoadingReport(false);

        // Add follow-up message once report is loaded - no quick action yet
        // User needs to review all tabs first, then the effect will show "Continue"
        setTimeout(() => {
          actions.addAssistantMessage(
            "Here's your profile based on our conversation. Review each tab (Status, Personality, Voice, Character) and confirm them by clicking 'Looks Good' on each one."
          );
        }, 500);
      } else {
        // No report available
        setIsLoadingReport(false);
        actions.addAssistantMessage(
          "I don't have your profile yet. Let's continue with setup.",
          [{ label: 'Continue', value: 'skip_report' }]
        );
      }

      if (data.currentQuestion) {
        setCurrentQuestion(data.currentQuestion);
      }
    } catch (error) {
      console.error('[tutorial-workflow] Error initializing:', error);
      setIsLoadingReport(false);
      actions.addAssistantMessage(
        "Something went wrong loading your profile. Let's try continuing.",
        [{ label: 'Continue', value: 'skip_report' }]
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
  }, []);

  const handleAssessmentComplete = useCallback(async (answers: Record<string, string>) => {
    // Build transcript in the format the scoring API expects
    const allQuestions = ASSESSMENT_SECTIONS.flatMap((s) => s.questions);
    const transcript = allQuestions.flatMap((q) => [
      { role: 'assistant', content: q.text },
      { role: 'user', content: answers[q.id] || '' },
    ]);

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

    // Hide the assessment (but don't auto-confirm - let user review and click "Looks Good")
    setShowInlineAssessment(false);

    // Add success message in chat - prompt user to review and confirm the Character tab
    if (workflowActionsRef.current) {
      workflowActionsRef.current.addAssistantMessage(
        "Your D&D character profile has been generated! Check out the Character tab to see your results, then click 'Looks Good' to confirm."
      );
    }
  }, [userId, token, fetchStatus]);

  const handleAssessmentExit = useCallback((_answers: Record<string, string>, _currentIndex: number) => {
    // User exited assessment without completing - just hide it
    setShowInlineAssessment(false);
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
        questionsAnswered: stepId === 'complete' ? 10 : 0,
        totalQuestions: 10,
        viewedReport: stepIndex > 1,
      });
    }
  }, [navigate]);

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
    shouldShowArtifact: isLoadingReport || (report && (progress.currentStep === 'about_you' || progress.currentStep === 'welcome')),
  });

  // Artifact content (report or loading)
  // Check if user has completed the GoodHang assessment
  const hasCompletedAssessment = status?.products?.goodhang?.assessment?.completed ?? false;

  // Show artifact when loading, or when we have a report (on welcome or about_you step)
  // Note: showStepProgress=false for tutorial - step progress is shown in sidebar
  const artifactContent = isLoadingReport ? (
    <ArtifactPanel showStepProgress={false}>
      {loadingArtifact}
    </ArtifactPanel>
  ) : showInlineAssessment ? (
    // Show inline assessment when user clicks "Take Assessment"
    <ArtifactPanel showStepProgress={false}>
      <div className="h-full overflow-y-auto">
        <AssessmentFlow
          config={ASSESSMENT_CONFIG}
          onComplete={handleAssessmentComplete}
          onExit={handleAssessmentExit}
        />
      </div>
    </ArtifactPanel>
  ) : (
    report && (progress.currentStep === 'about_you' || progress.currentStep === 'welcome') ? (
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
    ) : null
  );

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

  // Hide chat input during report review steps (inline editing is used instead)
  const shouldHideChatInput = progress.currentStep === 'welcome' || progress.currentStep === 'about_you';

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
