/**
 * Tutorial Mode Route
 *
 * Structured onboarding experience that locks the user into the tutorial flow.
 * The agent follows TUTORIAL.md and guides them through setup step by step.
 *
 * Steps:
 * 1. Welcome - Greet and set expectations
 * 2. About You - Show executive report (optional)
 * 3. Gather Intro - Transition to questions
 * 4. Questions - Work style questions via conversation
 * 5. Complete - Celebrate and transition to production
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore } from '@/lib/stores/user';
import { resetOnboarding } from '@/lib/dev-utils';
import { useChatState, useLoadingStages } from '@/lib/hooks';
import {
  initializeTutorial,
  sendTutorialMessage,
  persistReport as persistReportApi,
} from '@/lib/api/tutorial';
import { ReportEditor, type ReportTab } from '@/components/report';
import type {
  TutorialStep,
  TutorialProgress,
  ExecutiveReport,
  CharacterProfile,
  ReportConfirmations,
  OutstandingQuestion,
  QuickAction,
} from '@/lib/types';
import {
  Sparkles,
  User,
  ClipboardList,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mic,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// =============================================================================
// CONSTANTS
// =============================================================================

const STEP_CONFIG = [
  { id: 'welcome', label: 'Welcome', icon: User, description: 'Getting started' },
  { id: 'about_you', label: 'About You', icon: Sparkles, description: 'What I learned' },
  { id: 'gather_intro', label: 'Gather Details', icon: ClipboardList, description: 'Work style' },
  { id: 'questions', label: 'Questions', icon: MessageCircle, description: 'Quick conversation' },
  { id: 'complete', label: 'Complete', icon: CheckCircle2, description: 'Ready to go' },
];

const DEFAULT_LOADING_STAGES = [
  { message: 'Thinking...', duration: 800 },
  { message: 'Preparing your profile...', duration: 1200 },
  { message: 'Almost there...', duration: 600 },
];

const FEEDBACK_LOADING_STAGES = [
  { message: 'Processing feedback...', duration: 600 },
  { message: 'Updating your profile...', duration: 1000 },
  { message: 'Finishing up...', duration: 400 },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TutorialModePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();
  const { status } = useUserStatusStore();
  const initializedRef = useRef(false);

  // Use shared chat state hook
  const {
    messages,
    inputValue,
    isLoading,
    messagesEndRef,
    setInputValue,
    setIsLoading,
    addUserMessage,
    addAssistantMessage,
    setMessages,
  } = useChatState();

  // Use shared loading stages hook
  const loadingStages = useLoadingStages({ stages: DEFAULT_LOADING_STAGES });
  const feedbackLoadingStages = useLoadingStages({ stages: FEEDBACK_LOADING_STAGES });

  // Tutorial state
  const [progress, setProgress] = useState<TutorialProgress>({
    currentStep: 'welcome',
    stepIndex: 0,
    questionsAnswered: 0,
    totalQuestions: 5,
    viewedReport: false,
  });

  // Data from API
  const [originalReport, setOriginalReport] = useState<ExecutiveReport | null>(null);
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [, setQuestions] = useState<OutstandingQuestion[]>([]);
  const [, setCurrentQuestion] = useState<{ id: string; title: string; prompt: string } | null>(null);

  // UI state
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Report tabs (for About You step)
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('status');
  const [reportFeedback, setReportFeedback] = useState('');
  const [reportConfirmations, setReportConfirmations] = useState<ReportConfirmations>({
    status: false,
    personality: false,
    voice: false,
    character: false,
  });
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);

  // Speech recognition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Session context
  const sessionId = searchParams.get('session') || status?.contexts?.active;

  // Initialize speech recognition
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (typeof window !== 'undefined' && (win.SpeechRecognition || win.webkitSpeechRecognition)) {
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const results = event.results;
        let transcript = '';
        for (let i = 0; i < results.length; i++) {
          transcript += results[i][0].transcript;
        }
        setInputValue(transcript);
      };

      recognition.onend = () => setIsListening(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('[Speech] Recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => recognitionRef.current?.abort();
  }, [setInputValue]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Initialize tutorial
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const tutorialComplete = localStorage.getItem('founder-os-tutorial-completed');
    if (tutorialComplete) {
      navigate('/founder-os/dashboard');
      return;
    }

    const workStyleComplete = localStorage.getItem('founder-os-work-style-completed');
    if (workStyleComplete) {
      const completeProgress: TutorialProgress = {
        currentStep: 'complete',
        stepIndex: 4,
        questionsAnswered: 10,
        totalQuestions: 10,
        viewedReport: true,
      };
      setProgress(completeProgress);
      localStorage.setItem('founder-os-tutorial-progress', JSON.stringify(completeProgress));
      initializeStep(completeProgress);
      return;
    }

    const savedProgress = localStorage.getItem('founder-os-tutorial-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgress(parsed);
        initializeStep(parsed);
      } catch {
        initializeStep(progress);
      }
    } else {
      initializeStep(progress);
    }
  }, [navigate]);

  // Save progress on changes
  useEffect(() => {
    localStorage.setItem('founder-os-tutorial-progress', JSON.stringify(progress));
  }, [progress]);

  // Initialize a step by calling the API
  const initializeStep = async (currentProgress: TutorialProgress) => {
    if (!sessionId) {
      console.error('[tutorial] No session ID - showing default welcome');
      addAssistantMessage(`Welcome! Let's get you set up. Would you like to see what I learned about you?`);
      setQuickActions([
        { label: 'Sure!', value: 'show_report' },
        { label: 'Skip for now', value: 'skip_report' },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await initializeTutorial(sessionId, currentProgress, token);

      if (data.questions) setQuestions(data.questions);
      if (data.report) {
        setOriginalReport(data.report);
        setReport(data.report);
      }
      if (data.progress) setProgress(data.progress);
      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);

      addAssistantMessage(data.content);
      updateQuickActions(currentProgress.currentStep);
    } catch (error) {
      console.error('[tutorial] Error initializing:', error);
      addAssistantMessage(`Welcome! Let's get you set up. Would you like to see what I learned about you?`);
      setQuickActions([
        { label: 'Sure!', value: 'show_report' },
        { label: 'Skip for now', value: 'skip_report' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update quick actions based on current step
  const updateQuickActions = (step: TutorialStep) => {
    switch (step) {
      case 'welcome':
        setQuickActions([
          { label: 'Sure!', value: 'show_report' },
          { label: 'Skip for now', value: 'skip_report' },
        ]);
        break;
      case 'gather_intro':
        setQuickActions([
          { label: "Let's do it", value: 'start_questions' },
          { label: 'Not right now', value: 'pause' },
        ]);
        break;
      case 'complete':
        setQuickActions([{ label: 'Show me my Founder OS!', value: 'go_to_dashboard' }]);
        break;
      default:
        setQuickActions([]);
    }
  };

  // Send message to API
  const sendMessage = async (userMessage: string) => {
    if (!sessionId) return;

    addUserMessage(userMessage);
    setQuickActions([]);
    setIsLoading(true);

    try {
      const data = await sendTutorialMessage(sessionId, userMessage, messages, progress, token);
      addAssistantMessage(data.content);

      if (data.progress) {
        setProgress(data.progress);
        if (data.progress.currentStep !== progress.currentStep) {
          handleStepTransition(data.progress.currentStep, data);
        }
      }

      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
      handleAction(data.action, data);
    } catch (error) {
      console.error('[tutorial] Error sending message:', error);
      addAssistantMessage("Something went wrong. Let's try that again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle step transitions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStepTransition = (newStep: TutorialStep, data: any) => {
    updateQuickActions(newStep);

    if (newStep === 'about_you' && data.report) {
      setOriginalReport(data.report);
      setReport(data.report);
      setActiveReportTab('status');
      setReportConfirmations({ status: false, personality: false, voice: false, character: false });
      if (data.character) setCharacterProfile(data.character);
    }
  };

  // Handle report feedback submission
  const handleReportFeedback = async () => {
    if (!reportFeedback.trim()) return;

    const feedbackText = reportFeedback.trim();
    setReportFeedback('');

    addUserMessage(feedbackText);
    addAssistantMessage("Got it, updating your profile...");

    const feedbackMessage = `Feedback on "${activeReportTab}" section: ${feedbackText}`;
    const [apiResult] = await Promise.all([
      sendTutorialMessage(sessionId!, feedbackMessage, messages, progress, token).catch((err) => {
        console.error('[tutorial] Error updating report:', err);
        return null;
      }),
      feedbackLoadingStages.startLoading(),
    ]);

    if (apiResult) {
      if (apiResult.report) setReport(apiResult.report);
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i]?.role === 'assistant') {
            updated[i] = {
              ...updated[i]!,
              content: apiResult.content || "I've updated your profile.",
              timestamp: new Date().toISOString(),
            };
            break;
          }
        }
        return updated;
      });
    } else {
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i]?.role === 'assistant') {
            updated[i] = {
              ...updated[i]!,
              content: "Something went wrong updating your profile. Try again?",
              timestamp: new Date().toISOString(),
            };
            break;
          }
        }
        return updated;
      });
    }
  };

  const resetReportEdits = () => {
    if (originalReport) {
      setReport(originalReport);
      setReportConfirmations({ status: false, personality: false, voice: false, character: false });
      addAssistantMessage("I've reverted to the original profile. Let me know if you want to make any changes.");
    }
  };

  // Handle inline field edits (double-click to edit)
  const handleFieldEdit = (field: string, index: number, value: string) => {
    if (!report) return;

    // Parse field path like "personality.0.trait"
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
  };

  const persistReport = async () => {
    if (!report || !sessionId) return;

    try {
      await persistReportApi(sessionId, report, progress, token);
      console.log('[tutorial] Report persisted to database');
      setOriginalReport(report);
    } catch (error) {
      console.error('[tutorial] Error persisting report:', error);
    }
  };

  const confirmReportSection = () => {
    setReportConfirmations((prev) => ({ ...prev, [activeReportTab]: true }));

    // Auto-advance to next unconfirmed section
    if (activeReportTab === 'status' && !reportConfirmations.personality) {
      setActiveReportTab('personality');
    } else if (activeReportTab === 'personality' && !reportConfirmations.voice) {
      setActiveReportTab('voice');
    } else if (activeReportTab === 'voice' && !reportConfirmations.character) {
      setActiveReportTab('character');
    }
  };

  // Handle action from API response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAction = (action: string | undefined, data: any) => {
    switch (action) {
      case 'show_report':
        setActiveReportTab('status');
        setReportConfirmations({ status: false, personality: false, voice: false, character: false });
        break;
      case 'tutorial_complete':
        localStorage.setItem('founder-os-tutorial-completed', new Date().toISOString());
        setQuickActions([{ label: 'Show me my Founder OS!', value: 'go_to_dashboard' }]);
        break;
      case 'question_answered':
        if (data.currentQuestion) {
          setTimeout(() => {
            addAssistantMessage(`**${data.currentQuestion.title}**\n\n${data.currentQuestion.prompt}`);
          }, 500);
        }
        break;
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    sendMessage(message);
  };

  // Handle showing report with staged loading
  const handleShowReport = async () => {
    addUserMessage('Sure!');
    setQuickActions([]);
    addAssistantMessage("Great! Give me a second and I'll prepare your profile.");

    const [apiResult] = await Promise.all([
      sendTutorialMessage(sessionId!, 'Sure, show me!', messages, progress, token).catch((err) => {
        console.error('[tutorial] Error fetching report:', err);
        return null;
      }),
      loadingStages.startLoading(),
    ]);

    if (apiResult) {
      if (apiResult.report) {
        setOriginalReport(apiResult.report);
        setReport(apiResult.report);
      }
      if (apiResult.questions) setQuestions(apiResult.questions);
      if (apiResult.progress) setProgress(apiResult.progress);
      if (apiResult.content) addAssistantMessage(apiResult.content);

      if (apiResult.progress?.currentStep === 'about_you') {
        setActiveReportTab('status');
        setReportConfirmations({ status: false, personality: false, voice: false, character: false });
      }
    } else {
      addAssistantMessage("Something went wrong loading your profile. Let's try again.");
      setQuickActions([{ label: 'Try again', value: 'show_report' }]);
    }
  };

  const handleQuickAction = (value: string) => {
    switch (value) {
      case 'go_to_dashboard':
        navigate('/founder-os/dashboard');
        return;
      case 'show_report':
        handleShowReport();
        return;
      case 'skip_report':
        sendMessage('Skip for now');
        break;
      case 'start_questions':
        navigate(`/founder-os/work-style-assessment?session=${sessionId}&return=/founder-os/tutorial`);
        return;
      case 'pause':
        sendMessage('Not right now');
        break;
      case 'confirm_report':
        persistReport();
        sendMessage("Looks good, let's continue!");
        break;
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < progress.stepIndex) return 'completed';
    if (stepIndex === progress.stepIndex) return 'current';
    return 'locked';
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="flex h-screen bg-gh-dark-900 overflow-hidden">
      {/* Sidebar - Tutorial Progress */}
      <TutorialSidebar
        progress={progress}
        getStepStatus={getStepStatus}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content - Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-gh-dark-900 overflow-hidden">
        {/* Header */}
        <TutorialHeader stepLabel={STEP_CONFIG[progress.stepIndex]?.label || 'Getting started'} />

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full mx-auto px-6 py-4 flex flex-col">
            {/* Chat messages - compact area */}
            <div className="flex-shrink-0 space-y-3 mb-4">
              <AnimatePresence>
                {messages.slice(-3).map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={message.role === 'user' ? 'flex justify-end' : ''}
                  >
                    {message.role === 'user' ? (
                      <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 max-w-[85%]">
                        <div className="prose prose-invert prose-sm max-w-none break-words">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="text-white">
                        <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Report Display - takes remaining space */}
            {progress.currentStep === 'about_you' && report && (
              <div className="flex-1 min-h-0">
                <ReportEditor
                  report={report}
                  characterProfile={characterProfile}
                  activeTab={activeReportTab}
                  onTabChange={setActiveReportTab}
                  confirmations={reportConfirmations}
                  feedbackValue={reportFeedback}
                  onFeedbackChange={setReportFeedback}
                  onFeedbackSubmit={handleReportFeedback}
                  onConfirmSection={confirmReportSection}
                  onContinue={() => handleQuickAction('confirm_report')}
                  originalReport={originalReport}
                  onResetEdits={resetReportEdits}
                  onTakeAssessment={() => navigate('/goodhang/assessment?return=/founder-os/tutorial')}
                  onFieldEdit={handleFieldEdit}
                />
              </div>
            )}

            {/* Loading States */}
            {isLoading && !loadingStages.isActive && !feedbackLoadingStages.isActive && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </motion.div>
            )}

            {(loadingStages.isActive || feedbackLoadingStages.isActive) && (
              <div className="flex-shrink-0">
                <StagedLoadingBar
                  message={loadingStages.isActive ? loadingStages.currentMessage : feedbackLoadingStages.currentMessage}
                  progress={loadingStages.isActive ? loadingStages.progress : feedbackLoadingStages.progress}
                />
              </div>
            )}

            {/* Quick Actions */}
            {quickActions.length > 0 && !isLoading && !loadingStages.isActive && (
              <div className="flex-shrink-0">
                <QuickActions
                  actions={quickActions}
                  onAction={handleQuickAction}
                  disabled={isLoading || loadingStages.isActive || feedbackLoadingStages.isActive}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <TutorialInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={isLoading || loadingStages.isActive || feedbackLoadingStages.isActive}
          isListening={isListening}
          onMicToggle={toggleListening}
        />
      </div>
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

interface TutorialSidebarProps {
  progress: TutorialProgress;
  getStepStatus: (index: number) => string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function TutorialSidebar({ progress, getStepStatus, collapsed, onToggleCollapse }: TutorialSidebarProps) {
  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 56 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="bg-gh-dark-800 border-r border-gh-dark-700 flex flex-col flex-shrink-0 overflow-hidden"
    >
      {/* Header with collapse toggle */}
      <div className="p-3 border-b border-gh-dark-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-white whitespace-nowrap">Setup Mode</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gh-dark-700 rounded-lg transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Steps */}
      <div className="flex-1 p-2 space-y-1 overflow-hidden">
        {STEP_CONFIG.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                stepStatus === 'current'
                  ? 'bg-blue-600/20 border border-blue-500/50'
                  : stepStatus === 'completed'
                  ? 'bg-green-600/10'
                  : 'opacity-50'
              }`}
              title={collapsed ? step.label : undefined}
            >
              <div className="flex-shrink-0">
                {stepStatus === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : stepStatus === 'current' ? (
                  <Icon className="w-5 h-5 text-blue-400" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <span
                    className={`text-sm font-medium block truncate ${
                      stepStatus === 'completed'
                        ? 'text-green-400'
                        : stepStatus === 'current'
                        ? 'text-white'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  <p className="text-xs text-gray-500 truncate">{step.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="p-3 border-t border-gh-dark-700">
        {!collapsed && (
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>{progress.stepIndex + 1} / 5</span>
          </div>
        )}
        <div className="h-1.5 bg-gh-dark-600 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((progress.stepIndex + 1) / 5) * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
          />
        </div>
      </div>

      {/* Reset button */}
      <div className="p-3 border-t border-gh-dark-700">
        <button
          onClick={() => {
            resetOnboarding();
            window.location.reload();
          }}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-400 transition-colors"
          title="Reset Onboarding"
        >
          <RefreshCw className="w-3 h-3" />
          {!collapsed && 'Reset'}
        </button>
      </div>
    </motion.div>
  );
}

function TutorialHeader({ stepLabel }: { stepLabel: string }) {
  return (
    <div className="px-6 py-2 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-base font-medium text-white">Founder OS Setup</h1>
        <span className="text-gray-500">·</span>
        <span className="text-sm text-gray-400">{stepLabel}</span>
      </div>
    </div>
  );
}

interface TutorialInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isListening: boolean;
  onMicToggle: () => void;
}

function TutorialInput({ value, onChange, onSend, disabled, isListening, onMicToggle }: TutorialInputProps) {
  return (
    <div className="flex-shrink-0 pb-6 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gh-dark-800 rounded-2xl border border-gh-dark-600 shadow-lg">
          <div className="px-4 py-3">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSend()}
              placeholder="Reply..."
              disabled={disabled}
              className="w-full bg-transparent text-white text-base placeholder-gray-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <button
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gh-dark-700 rounded-lg transition-colors"
                title="Add attachment"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gh-dark-700 rounded-lg transition-colors"
                title="History"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onMicToggle}
                disabled={disabled}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  isListening
                    ? 'text-red-400 bg-red-500/10 animate-pulse'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gh-dark-700'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={onSend}
                disabled={!value.trim() || disabled}
                className="p-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StagedLoadingBar({ message, progress }: { message: string; progress: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        <span className="text-sm text-gray-300">{message}</span>
      </div>
      <div className="h-1.5 bg-gh-dark-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        />
      </div>
    </motion.div>
  );
}

function QuickActions({
  actions,
  onAction,
  disabled = false,
}: {
  actions: QuickAction[];
  onAction: (value: string) => void;
  disabled?: boolean;
}) {
  const [clickedAction, setClickedAction] = useState<string | null>(null);

  // Reset clicked state when actions change (e.g., new step)
  useEffect(() => {
    setClickedAction(null);
  }, [actions]);

  const handleClick = (value: string) => {
    if (disabled || clickedAction) return; // Prevent double-clicks
    setClickedAction(value);
    onAction(value);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3 pt-2">
      {actions.map((action) => {
        const isClicked = clickedAction === action.value;
        const isDisabled = disabled || clickedAction !== null;
        return (
          <button
            key={action.value}
            onClick={() => handleClick(action.value)}
            disabled={isDisabled}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-150 ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : action.value.includes('skip') || action.value.includes('pause')
                ? 'bg-gh-dark-700 hover:bg-gh-dark-600 text-gray-300 border border-gh-dark-600'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40'
            }`}
          >
            {isClicked ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {action.label}
              </span>
            ) : (
              action.label
            )}
          </button>
        );
      })}
    </motion.div>
  );
}
