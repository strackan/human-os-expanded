'use client';

/**
 * Tutorial Mode with Workflow Layout
 *
 * Port of desktop's tutorial-workflow.tsx to Next.js App Router.
 * Uses WorkflowModeLayout with chat in the sidebar.
 */

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, RotateCcw } from 'lucide-react';

import VoiceCalibration from '@/components/founders/tutorial/VoiceCalibration';
import { QuestionEAssessment } from '@/components/founders/tutorial/QuestionEAssessment';
import { SynthesisProgressArtifact } from '@/components/founders/tutorial/SynthesisProgressArtifact';
import { CommandmentsReview } from '@/components/founders/tutorial/CommandmentsReview';
import { ToolsTestingArtifact } from '@/components/founders/tutorial/ToolsTestingArtifact';
import { type GapFinalData } from '@/lib/founders/question-e-data';
import { useFoundersAuth } from '@/lib/founders/auth-context';
import { useQuestionSet } from '@/lib/founders/hooks/use-question-set';
import {
  initializeTutorial,
  sendTutorialMessage,
  persistReport as persistReportApi,
} from '@/lib/founders/tutorial-api';
import { post, isDevMode } from '@/lib/founders/api-client';
import { ReportEditor, type ReportTab, type ReportConfirmations } from '@/components/founders/report/ReportEditor';
import { WorkflowModeLayout } from '@/components/founders/workflow/WorkflowModeLayout';
import { ArtifactPanel } from '@/components/founders/workflow/ArtifactPanel';
import { AssessmentFlow, type AssessmentConfig } from '@/components/founders/assessment/AssessmentFlow';
import type {
  TutorialStep,
  TutorialProgress,
  ExecutiveReport,
  CharacterProfile,
  FounderOsExtractionResult,
  VoiceOsExtractionResult,
} from '@/lib/founders/types';
import type {
  WorkflowStep,
  WorkflowMessage,
  WorkflowModeActions,
  MessageResponse,
} from '@/lib/founders/workflow-types';
import { TUTORIAL_STEPS, getStepIndex, getResumeStep, getAllCompletionKeys } from '@/lib/founders/tutorial-steps';

// =============================================================================
// CONSTANTS
// =============================================================================

const ASSESSMENT_STORAGE_KEY = 'fos-consolidated-interview-progress';
const QUESTION_SET_SLUG = 'fos-consolidated-interview';

// =============================================================================
// HELPER: Convert tutorial steps to workflow steps
// =============================================================================

function convertToWorkflowSteps(
  tutorialSteps: typeof TUTORIAL_STEPS,
  currentIndex: number
): WorkflowStep[] {
  return tutorialSteps.map((step, index) => ({
    id: step.id,
    label: step.label,
    description: step.description,
    required: true,
    status:
      index < currentIndex
        ? 'completed'
        : index === currentIndex
        ? 'in_progress'
        : 'locked',
    iconName: step.iconName,
    ...(step.completionKey ? { completionKey: step.completionKey } : {}),
  }));
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TutorialWorkflowPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <TutorialWorkflowMode />
    </Suspense>
  );
}

function TutorialWorkflowMode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, userId, status, statusLoading } = useFoundersAuth();
  const initializedRef = useRef(false);
  const workflowActionsRef = useRef<WorkflowModeActions | null>(null);
  const hasShownReportCompleteRef = useRef(false);
  const synthesizeHandlerRef = useRef<((answers: Record<string, string>) => void) | null>(null);

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
  const [, setQuestions] = useState<Array<{ id: string; title: string; prompt: string; category: string }>>([]);
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

  // Loading state
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Artifact phase
  type ArtifactPhase = 'interview' | 'generating' | 'report';
  const [artifactPhase, setArtifactPhase] = useState<ArtifactPhase>('interview');

  // Inline assessment
  const [showInlineAssessment, setShowInlineAssessment] = useState(false);

  // Question E state
  const [gapFinalData, setGapFinalData] = useState<GapFinalData | null>(null);
  const [questionEAnswers, setQuestionEAnswers] = useState<Record<string, string>>({});
  const [isLoadingGapFinal, setIsLoadingGapFinal] = useState(false);
  const hasAttemptedGapFinalRef = useRef(false);

  // Synthesis state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [synthesisResult, setSynthesisResult] = useState<{
    executive_report: ExecutiveReport;
    character_profile: CharacterProfile;
    founder_os: FounderOsExtractionResult;
    voice_os: VoiceOsExtractionResult;
  } | null>(null);
  const [showReportReview, setShowReportReview] = useState(false);
  const [showCommandmentsReview, setShowCommandmentsReview] = useState(false);

  // Voice calibration feedback
  const [, setVoiceCalibrationFeedback] = useState<Record<string, unknown>>({});

  // Session context
  const sessionId = searchParams.get('session') || status?.contexts?.active;

  // Fetch questions from database API
  const { sections: questionSections, isLoading: isLoadingQuestions, error: questionsError } = useQuestionSet(QUESTION_SET_SLUG, token);

  // Build assessment config
  const assessmentConfig: AssessmentConfig | null = useMemo(() => {
    if (isLoadingQuestions || questionsError || questionSections.length === 0) return null;
    return {
      storageKey: ASSESSMENT_STORAGE_KEY,
      sections: questionSections,
      themeColor: 'purple',
      title: 'Profile Interview',
      subtitle: 'Getting to Know You',
      completionTitle: "Interview complete!",
      completionDescription: "Great job! Next we'll calibrate your AI voice so it can write content that sounds like you.",
      submitButtonText: 'Continue to Voice Calibration',
    };
  }, [questionSections, isLoadingQuestions, questionsError]);

  // Convert tutorial steps to workflow steps
  const workflowSteps = convertToWorkflowSteps(TUTORIAL_STEPS, progress.stepIndex);

  // =============================================================================
  // QUICK ACTIONS
  // =============================================================================

  const getQuickActionsForStep = useCallback((step: TutorialStep) => {
    if (step === 'complete') return [{ label: 'Show me my Founder OS!', value: 'go_to_dashboard' }];
    return [];
  }, []);

  // =============================================================================
  // MESSAGE HANDLER
  // =============================================================================

  const handleMessage = useCallback(
    async (message: WorkflowMessage): Promise<MessageResponse | null> => {
      const actionValue = (message.metadata?.actionValue as string) || message.content;

      // Handle navigation quick actions
      if (actionValue === 'go_to_dashboard') {
        localStorage.setItem('founder-os-tutorial-completed', new Date().toISOString());
        router.push('/founders/production');
        return null;
      }

      if (actionValue === 'retry_synthesis') {
        const storedAnswers = JSON.parse(localStorage.getItem('fos-question-e-answers') || '{}');
        if (synthesizeHandlerRef.current) synthesizeHandlerRef.current(storedAnswers);
        return null;
      }

      if (actionValue === 'approve_synthesis') {
        setShowCommandmentsReview(false);
        const toolStepIndex = getStepIndex('tool_testing');
        setProgress(prev => ({ ...prev, currentStep: 'tool_testing' as TutorialStep, stepIndex: toolStepIndex }));
        return { content: "Your Human OS profile is saved. Now let's make sure your tools are set up correctly.", quickActions: getQuickActionsForStep('tool_testing' as TutorialStep) };
      }

      if (actionValue === 'skip_synthesis') {
        setSynthesisError(null);
        setIsSynthesizing(false);
        setShowCommandmentsReview(false);
        const toolStepIndex = getStepIndex('tool_testing');
        setProgress(prev => ({ ...prev, currentStep: 'tool_testing' as TutorialStep, stepIndex: toolStepIndex }));
        return { content: "No problem! Your answers are saved. Let's test your tools.", quickActions: getQuickActionsForStep('tool_testing' as TutorialStep) };
      }

      if (actionValue === 'continue_from_report') {
        if (report && sessionId) {
          try {
            await persistReportApi(sessionId, report, progress, token);
            setOriginalReport(report);
          } catch (error) {
            console.error('[tutorial] Error persisting report:', error);
          }
        }
        localStorage.setItem('founder-os-interview-completed', new Date().toISOString());
        const voiceStepIndex = getStepIndex('voice_testing');
        setProgress(prev => ({ ...prev, currentStep: 'voice_testing' as TutorialStep, stepIndex: voiceStepIndex, viewedReport: true }));
        return { content: "Your profile is saved! Now let's calibrate your AI voice.", quickActions: getQuickActionsForStep('voice_testing' as TutorialStep) };
      }

      if (actionValue === 'show_report') setIsLoadingReport(true);

      if (!sessionId) {
        setIsLoadingReport(false);
        return { content: "I'm having trouble connecting. Please try again.", quickActions: getQuickActionsForStep('interview') };
      }

      try {
        let apiMessage = message.content;
        if (actionValue === 'show_report') apiMessage = 'Sure, show me!';
        else if (actionValue === 'skip_report') apiMessage = 'Skip for now';
        else if (actionValue === 'continue_to_complete') apiMessage = "Let's continue";

        const data = await sendTutorialMessage(sessionId, apiMessage, [], progress, token);

        if (data.questions) setQuestions(data.questions);
        if (data.report) {
          setOriginalReport(data.report);
          setReport(data.report);
          setIsLoadingReport(false);
        }
        if (data.progress) setProgress(data.progress);
        if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
        if (data.action === 'tutorial_complete') {
          localStorage.setItem('founder-os-tutorial-completed', new Date().toISOString());
        }

        const newStep = data.progress?.currentStep || progress.currentStep;
        const quickActions = getQuickActionsForStep(newStep);
        return { content: data.content || '', ...(quickActions.length > 0 ? { quickActions } : {}) };
      } catch (error) {
        console.error('[tutorial] Error:', error);
        setIsLoadingReport(false);
        return { content: "Something went wrong. Let's try that again.", quickActions: getQuickActionsForStep(progress.currentStep) };
      }
    },
    [sessionId, progress, token, router, getQuickActionsForStep, report]
  );

  // =============================================================================
  // STEP HANDLERS
  // =============================================================================

  const handleStepComplete = useCallback((stepId: string) => {
    const step = TUTORIAL_STEPS.find(s => s.id === stepId);
    if (step?.completionKey) localStorage.setItem(step.completionKey, new Date().toISOString());
  }, []);

  const handleStepChange = useCallback((_fromIndex: number, toIndex: number) => {
    setProgress(prev => ({
      ...prev,
      currentStep: TUTORIAL_STEPS[toIndex]?.id as TutorialStep,
      stepIndex: toIndex,
    }));
  }, []);

  const handleWorkflowComplete = useCallback(() => {
    localStorage.setItem('founder-os-tutorial-completed', new Date().toISOString());
    router.push('/founders/production');
  }, [router]);

  const handleReset = useCallback(async () => {
    getAllCompletionKeys().forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('founder-os-tutorial-tutorial');
    localStorage.removeItem('founder-os-tutorial-completed');
    localStorage.removeItem('founder-os-tutorial-progress');
    localStorage.removeItem('workflow-mode-tutorial');
    localStorage.removeItem('founder-os-tutorial');
    localStorage.removeItem(ASSESSMENT_STORAGE_KEY);

    if (userId) {
      try {
        await post('/api/assessment/reset', { user_id: userId }, token);
      } catch (error) {
        console.error('[tutorial] Error resetting assessment:', error);
      }
    }

    setCharacterProfile(null);
    setReportConfirmations({ status: false, personality: false, voice: false, character: false });
    setShowInlineAssessment(false);
    setArtifactPhase('interview');
    setGapFinalData(null);
    setQuestionEAnswers({});
    setSynthesisResult(null);
    setShowReportReview(false);
    setShowCommandmentsReview(false);
    setIsSynthesizing(false);
    setSynthesisError(null);
    hasShownReportCompleteRef.current = false;
    hasAttemptedGapFinalRef.current = false;
    workflowActionsRef.current = null;

    window.location.reload();
  }, [userId, token]);

  // Effect: show Continue when all report sections confirmed
  useEffect(() => {
    const allConfirmed = reportConfirmations.status && reportConfirmations.personality && reportConfirmations.voice && reportConfirmations.character;
    if (allConfirmed && !hasShownReportCompleteRef.current && workflowActionsRef.current && progress.currentStep === 'interview') {
      hasShownReportCompleteRef.current = true;
      workflowActionsRef.current.addAssistantMessage("Great, all set? Let's continue.", [{ label: 'Continue', value: 'continue_from_report' }]);
    }
  }, [reportConfirmations, progress.currentStep]);

  // =============================================================================
  // INITIALIZE
  // =============================================================================

  const handleInitialize = useCallback(async (actions: WorkflowModeActions) => {
    workflowActionsRef.current = actions;
    const currentSessionId = searchParams.get('session') || status?.contexts?.active;

    if (!currentSessionId) {
      actions.addAssistantMessage("Welcome! I couldn't find your session. Please try signing in again.");
      return;
    }

    actions.addAssistantMessage("Hello! Let's get started...");

    try {
      const data = await initializeTutorial(currentSessionId, progress, token);
      if (data.questions) setQuestions(data.questions);

      // Always store report if available (for later use after interview)
      if (data.report) {
        setOriginalReport(data.report);
        setReport(data.report);
      }

      // Always start with the FOS consolidated interview, regardless of
      // GoodHang assessment status. The FOS interview is a separate set of
      // questions that feeds into the synthesis pipeline.
      setIsLoadingReport(false);
      setArtifactPhase('interview');
      setShowInlineAssessment(true);
      setTimeout(() => {
        actions.addAssistantMessage("Welcome! Let's get to know you through a brief interview.");
      }, 500);

      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
    } catch (error) {
      console.error('[tutorial] Error initializing:', error);
      setIsLoadingReport(false);
      setArtifactPhase('interview');
      setShowInlineAssessment(true);
      actions.addAssistantMessage("Let's get started with your interview.");
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

      if (field === 'summary') { setReport({ ...report, summary: value }); return; }
      if (field === 'communication.style') { setReport({ ...report, communication: { ...report.communication, style: value } }); return; }
      if (field === 'communication.preferences') {
        const updated = [...report.communication.preferences];
        updated[index] = value;
        setReport({ ...report, communication: { ...report.communication, preferences: updated } });
        return;
      }
      if (parts[0] === 'personality' && parts.length === 3 && report.personality) {
        const fieldName = parts[2] as 'trait' | 'description' | 'insight';
        const updated = [...report.personality];
        const existing = updated[index];
        if (existing) {
          updated[index] = { ...existing, [fieldName]: value };
          setReport({ ...report, personality: updated });
        }
        return;
      }
      if (field === 'voice.tone' && report.voice) { setReport({ ...report, voice: { ...report.voice, tone: value } }); return; }
      if (field === 'voice.style' && report.voice) { setReport({ ...report, voice: { ...report.voice, style: value } }); return; }
      if (field === 'voice.characteristics' && report.voice) {
        const updated = [...report.voice.characteristics];
        updated[index] = value;
        setReport({ ...report, voice: { ...report.voice, characteristics: updated } });
        return;
      }
    },
    [report]
  );

  const confirmReportSection = useCallback(() => {
    setReportConfirmations(prev => ({ ...prev, [activeReportTab]: true }));
    if (activeReportTab === 'status' && !reportConfirmations.personality) setActiveReportTab('personality');
    else if (activeReportTab === 'personality' && !reportConfirmations.voice) setActiveReportTab('voice');
    else if (activeReportTab === 'voice' && !reportConfirmations.character) setActiveReportTab('character');
  }, [activeReportTab, reportConfirmations]);

  // =============================================================================
  // ASSESSMENT HANDLERS
  // =============================================================================

  const handleStartAssessment = useCallback(() => {
    setShowInlineAssessment(true);
    setArtifactPhase('interview');
  }, []);

  const handleAssessmentComplete = useCallback(async (answers: Record<string, string>) => {
    localStorage.setItem('fos-interview-answers', JSON.stringify(answers));
    localStorage.setItem('founder-os-interview-completed', new Date().toISOString());
    setShowInlineAssessment(false);
    setArtifactPhase('report');

    const voiceStepIndex = getStepIndex('voice_testing');
    setProgress(prev => ({ ...prev, currentStep: 'voice_testing' as TutorialStep, stepIndex: voiceStepIndex }));

    if (workflowActionsRef.current) {
      workflowActionsRef.current.addAssistantMessage(
        "Interview complete! Now let's calibrate your AI voice.",
        getQuickActionsForStep('voice_testing' as TutorialStep)
      );
    }
  }, [getQuickActionsForStep]);

  const handleAssessmentExit = useCallback(() => {
    setShowInlineAssessment(false);
    setArtifactPhase('report');
  }, []);

  // =============================================================================
  // GAP FINAL DATA
  // =============================================================================

  const fetchGapFinalData = useCallback(async () => {
    if (hasAttemptedGapFinalRef.current || !sessionId) {
      setGapFinalData(null);
      setIsLoadingGapFinal(false);
      return;
    }

    hasAttemptedGapFinalRef.current = true;
    setIsLoadingGapFinal(true);

    try {
      const response = await fetch(`/api/tutorial/gap-final?session_id=${sessionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`Gap-final API returned ${response.status}`);
      const data = await response.json();

      setGapFinalData({
        status: data.has_file ? 'complete' : 'partial',
        entity_slug: '',
        session_id: sessionId,
        outstanding_questions: data.outstanding_questions.map((q: { id: string }) => q.id),
        questions_answered: data.questions_answered,
        questions_total: data.questions_total,
      });
    } catch (error) {
      console.error('[tutorial] Gap-final error:', error);
      setGapFinalData(null);
    } finally {
      setIsLoadingGapFinal(false);
    }
  }, [sessionId, token]);

  // =============================================================================
  // VOICE CALIBRATION
  // =============================================================================

  const handleVoiceCalibrationComplete = useCallback(async (feedback: Record<string, unknown>) => {
    setVoiceCalibrationFeedback(feedback);
    localStorage.setItem('fos-voice-calibration-feedback', JSON.stringify(feedback));
    localStorage.setItem('founder-os-voice-test-completed', new Date().toISOString());

    // Fire-and-forget Tier 3 finalize
    if (sessionId) {
      fetch('/api/voice/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ session_id: sessionId, voice_calibration_feedback: feedback }),
      }).catch(err => console.warn('[tutorial] Voice finalize error (non-fatal):', err));
    }

    const questionEStepIndex = getStepIndex('question_e');
    setProgress(prev => ({ ...prev, currentStep: 'question_e' as TutorialStep, stepIndex: questionEStepIndex }));
    fetchGapFinalData();

    if (workflowActionsRef.current) {
      workflowActionsRef.current.addAssistantMessage(
        "Voice calibration complete! Now let's capture your personality baseline.",
        getQuickActionsForStep('question_e' as TutorialStep)
      );
    }
  }, [getQuickActionsForStep, fetchGapFinalData, sessionId, token]);

  // =============================================================================
  // QUESTION E
  // =============================================================================

  const handleQuestionEComplete = useCallback(async (answers: Record<string, string>) => {
    setQuestionEAnswers(answers);
    localStorage.setItem('founder-os-question-e-completed', new Date().toISOString());
    localStorage.setItem('fos-question-e-answers', JSON.stringify(answers));

    setIsSynthesizing(true);
    setSynthesisError(null);

    if (workflowActionsRef.current) {
      workflowActionsRef.current.addAssistantMessage("Building your complete Human OS profile...");
    }

    try {
      const fosInterviewAnswers = JSON.parse(localStorage.getItem('fos-interview-answers') || '{}');
      const voiceFeedback = JSON.parse(localStorage.getItem('fos-voice-calibration-feedback') || '{}');

      const response = await fetch('/api/tutorial/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          fos_interview_answers: fosInterviewAnswers,
          question_e_answers: answers,
          voice_calibration_feedback: voiceFeedback,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Synthesis failed: ${response.status}`);
      }

      const result = await response.json();

      setSynthesisResult({
        executive_report: result.executive_report,
        character_profile: result.character_profile,
        founder_os: result.founder_os,
        voice_os: result.voice_os,
      });

      if (result.executive_report) {
        setReport(result.executive_report);
        setOriginalReport(result.executive_report);
      }
      if (result.character_profile) {
        setCharacterProfile({
          ...result.character_profile,
          attributes: result.attributes || result.character_profile.attributes,
          signals: result.signals || result.character_profile.signals,
          matching: result.matching || result.character_profile.matching,
          summary: result.summary || result.character_profile.summary,
        });
      }

      setIsSynthesizing(false);
      setShowReportReview(true);

      const assessmentReviewStepIndex = getStepIndex('assessment_review');
      setProgress(prev => ({ ...prev, currentStep: 'assessment_review' as TutorialStep, stepIndex: assessmentReviewStepIndex }));

      if (workflowActionsRef.current) {
        workflowActionsRef.current.addAssistantMessage("Your Personal Assessment is ready! Review each section and confirm.");
      }
    } catch (error) {
      console.error('[tutorial] Synthesis error:', error);
      setIsSynthesizing(false);
      setSynthesisError(error instanceof Error ? error.message : 'Unknown error');

      if (workflowActionsRef.current) {
        workflowActionsRef.current.addAssistantMessage(
          "There was an issue generating your profile. You can retry or skip.",
          [{ label: 'Retry Synthesis', value: 'retry_synthesis' }, { label: 'Skip for Now', value: 'skip_synthesis' }]
        );
      }
    }
  }, [token, sessionId, userId]);

  synthesizeHandlerRef.current = handleQuestionEComplete;

  // =============================================================================
  // REVIEW HANDLERS
  // =============================================================================

  const handleReportReviewConfirm = useCallback(() => {
    setShowReportReview(false);
    setShowCommandmentsReview(true);
    if (workflowActionsRef.current) {
      workflowActionsRef.current.addAssistantMessage("Now review your Ten Commandments. Confirm each tab when satisfied.");
    }
  }, []);

  const handleCommandmentsConfirm = useCallback(() => {
    setShowCommandmentsReview(false);
    localStorage.setItem('founder-os-assessment-review-completed', new Date().toISOString());
    const toolStepIndex = getStepIndex('tool_testing');
    setProgress(prev => ({ ...prev, currentStep: 'tool_testing' as TutorialStep, stepIndex: toolStepIndex }));
    if (workflowActionsRef.current) {
      workflowActionsRef.current.addAssistantMessage(
        "Your Human OS profile is saved. Now let's make sure your tools are set up correctly.",
        getQuickActionsForStep('tool_testing' as TutorialStep)
      );
    }
  }, [getQuickActionsForStep]);

  // =============================================================================
  // TOOLS TESTING
  // =============================================================================

  const handleToolsTestingComplete = useCallback(() => {
    localStorage.setItem('founder-os-tool-testing-completed', new Date().toISOString());
    const completeStepIndex = getStepIndex('complete');
    setProgress(prev => ({ ...prev, currentStep: 'complete' as TutorialStep, stepIndex: completeStepIndex }));
    if (workflowActionsRef.current) {
      workflowActionsRef.current.addAssistantMessage("Your tools are set up! You're ready to use Founder OS.", getQuickActionsForStep('complete' as TutorialStep));
    }
  }, [getQuickActionsForStep]);

  // =============================================================================
  // INITIALIZATION EFFECTS
  // =============================================================================

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const tutorialComplete = localStorage.getItem('founder-os-tutorial-completed');
    if (tutorialComplete) {
      router.push('/founders/production');
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
  }, [router]);

  // Load gap-final data on resume
  useEffect(() => {
    if (progress.currentStep === 'question_e' && !hasAttemptedGapFinalRef.current) {
      fetchGapFinalData();
    }
  }, [progress.currentStep, fetchGapFinalData]);

  // Load report on mount (independent of workflow initialization)
  const hasLoadedReportRef = useRef(false);

  useEffect(() => {
    if (hasLoadedReportRef.current || report || isLoadingReport) return;
    const currentSessionId = searchParams.get('session') || status?.contexts?.active;
    if (!currentSessionId || statusLoading) return;

    hasLoadedReportRef.current = true;

    const loadReport = async () => {
      setIsLoadingReport(true);
      try {
        const data = await initializeTutorial(currentSessionId, progress, token);
        if (data.report) { setOriginalReport(data.report); setReport(data.report); }
        if (data.questions) setQuestions(data.questions);
      } catch (error) {
        console.error('[tutorial] Error loading report:', error);
      } finally {
        setIsLoadingReport(false);
      }
    };

    loadReport();
  }, [searchParams, status, statusLoading, report, isLoadingReport, progress, token]);

  // Auto-save report edits
  useEffect(() => {
    if (!report || !sessionId) return;
    if (JSON.stringify(report) === JSON.stringify(originalReport)) return;

    const timeout = setTimeout(async () => {
      try {
        await persistReportApi(sessionId, report, progress, token);
        setOriginalReport(report);
      } catch (error) {
        console.error('[tutorial] Auto-save error:', error);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [report, originalReport, sessionId, progress, token]);

  // =============================================================================
  // RENDER: Artifact Content
  // =============================================================================

  const hasCompletedAssessment = status?.products?.goodhang?.assessment?.completed ?? false;

  const getArtifactContent = () => {
    if (isLoadingReport) {
      return (
        <ArtifactPanel showStepProgress={false}>
          <div className="h-full flex flex-col items-center justify-center p-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Preparing your profile...</p>
          </div>
        </ArtifactPanel>
      );
    }

    // Interview phase
    if (artifactPhase === 'interview' || showInlineAssessment) {
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
            <AssessmentFlow config={assessmentConfig} onComplete={handleAssessmentComplete} onExit={handleAssessmentExit} autoSubmit />
          </div>
        </ArtifactPanel>
      );
    }

    // Report review (interview step)
    if (report && progress.currentStep === 'interview') {
      return (
        <ArtifactPanel showStepProgress={false}>
          <ReportEditor
            report={report} characterProfile={characterProfile} activeTab={activeReportTab}
            onTabChange={setActiveReportTab} confirmations={reportConfirmations}
            onConfirmSection={confirmReportSection} originalReport={originalReport}
            onResetEdits={resetReportEdits} onTakeAssessment={handleStartAssessment}
            onFieldEdit={handleFieldEdit} hasCompletedAssessment={hasCompletedAssessment}
            className="h-full"
          />
        </ArtifactPanel>
      );
    }

    // Voice testing
    if (progress.currentStep === 'voice_testing') {
      const savedAnswers = localStorage.getItem('fos-interview-answers');
      const parsedAnswers = savedAnswers ? JSON.parse(savedAnswers) : undefined;
      return (
        <ArtifactPanel showStepProgress={false}>
          <VoiceCalibration sessionId={sessionId || ''} token={token} interviewAnswers={parsedAnswers} onComplete={handleVoiceCalibrationComplete} />
        </ArtifactPanel>
      );
    }

    // Question E
    if (progress.currentStep === 'question_e') {
      if (isSynthesizing) {
        return <ArtifactPanel showStepProgress={false}><SynthesisProgressArtifact isRunning={true} error={null} /></ArtifactPanel>;
      }
      if (synthesisError) {
        return (
          <ArtifactPanel showStepProgress={false}>
            <SynthesisProgressArtifact isRunning={false} error={synthesisError}
              onRetry={() => { const stored = JSON.parse(localStorage.getItem('fos-question-e-answers') || '{}'); handleQuestionEComplete(stored); }} />
          </ArtifactPanel>
        );
      }
      return (
        <ArtifactPanel showStepProgress={false}>
          <QuestionEAssessment gapFinalData={gapFinalData} onComplete={handleQuestionEComplete} initialAnswers={questionEAnswers} isLoading={isLoadingGapFinal} />
        </ArtifactPanel>
      );
    }

    // Assessment Review
    if (progress.currentStep === 'assessment_review') {
      if (showReportReview && report) {
        return (
          <ArtifactPanel showStepProgress={false}>
            <ReportEditor report={report} characterProfile={characterProfile} activeTab={activeReportTab}
              onTabChange={setActiveReportTab} confirmations={reportConfirmations}
              onConfirmSection={confirmReportSection} originalReport={originalReport}
              onResetEdits={resetReportEdits} onFieldEdit={handleFieldEdit}
              hasCompletedAssessment={true} onContinue={handleReportReviewConfirm} className="h-full" />
          </ArtifactPanel>
        );
      }
      if (showCommandmentsReview && synthesisResult) {
        return (
          <ArtifactPanel showStepProgress={false}>
            <CommandmentsReview founderOs={synthesisResult.founder_os} voiceOs={synthesisResult.voice_os} onConfirm={handleCommandmentsConfirm} />
          </ArtifactPanel>
        );
      }
      return (
        <ArtifactPanel showStepProgress={false}>
          <div className="h-full flex flex-col items-center justify-center p-4">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Loading your assessment...</p>
          </div>
        </ArtifactPanel>
      );
    }

    // Tool Testing
    if (progress.currentStep === 'tool_testing') {
      return (
        <ArtifactPanel showStepProgress={false}>
          <ToolsTestingArtifact sessionId={sessionId || ''} userId={userId || ''} {...(synthesisResult?.founder_os ? { founderOs: synthesisResult.founder_os } : {})} {...(synthesisResult?.voice_os ? { voiceOs: synthesisResult.voice_os } : {})} onComplete={handleToolsTestingComplete} />
        </ArtifactPanel>
      );
    }

    return null;
  };

  const artifactContent = getArtifactContent();

  // Wait for session
  const effectiveSessionId = searchParams.get('session') || status?.contexts?.active;

  if (!effectiveSessionId) {
    if (statusLoading) {
      return (
        <div className="h-screen flex items-center justify-center bg-[var(--gh-dark-900)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your session...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--gh-dark-900)]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Could not find your session.</p>
          <button onClick={() => router.push('/founders')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  const shouldHideChatInput = progress.currentStep === 'interview' || progress.currentStep === 'voice_testing' || progress.currentStep === 'question_e' || progress.currentStep === 'assessment_review';

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
        className="h-screen"
      />

      {/* Dev Mode Reset Button */}
      {isDevMode() && (
        <div className="fixed top-4 right-4 z-50">
          <button onClick={handleReset}
            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded shadow-lg flex items-center gap-1 border border-yellow-500">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}
    </>
  );
}
