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
import {
  ChevronRight,
  Sparkles,
  User,
  ClipboardList,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mic,
  Brain,
  Sword,
  RefreshCw,
} from 'lucide-react';

// Tutorial steps (must match backend)
type TutorialStep =
  | 'welcome'
  | 'about_you'
  | 'gather_intro'
  | 'questions'
  | 'complete';

interface TutorialProgress {
  currentStep: TutorialStep;
  stepIndex: number;
  questionsAnswered: number;
  totalQuestions: number;
  viewedReport: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ExecutiveReport {
  summary: string;
  personality: { trait: string; description: string; insight: string }[];
  communication: { style: string; preferences: string[] };
  workStyle: { approach: string; strengths: string[] };
  keyInsights: string[];
  voice?: {
    tone: string;
    style: string;
    characteristics: string[];
    examples?: string[];
  };
}

// D&D Character data
interface CharacterProfile {
  race: string;
  characterClass: string;
  alignment: string;
  title?: string;
  attributes?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

// Track which report pages have been confirmed
interface ReportConfirmations {
  status: boolean;
  personality: boolean;
  voice: boolean;
  character: boolean;
}

interface OutstandingQuestion {
  id: string;
  title: string;
  prompt: string;
  category: string;
}

const STEP_CONFIG = [
  { id: 'welcome', label: 'Welcome', icon: User, description: 'Getting started' },
  { id: 'about_you', label: 'About You', icon: Sparkles, description: 'What I learned' },
  { id: 'gather_intro', label: 'Gather Details', icon: ClipboardList, description: 'Work style' },
  { id: 'questions', label: 'Questions', icon: MessageCircle, description: 'Quick conversation' },
  { id: 'complete', label: 'Complete', icon: CheckCircle2, description: 'Ready to go' },
];

export default function TutorialModePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();
  const { status } = useUserStatusStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Tutorial state
  const [progress, setProgress] = useState<TutorialProgress>({
    currentStep: 'welcome',
    stepIndex: 0,
    questionsAnswered: 0,
    totalQuestions: 5,
    viewedReport: false,
  });

  // Data from API
  const [originalReport, setOriginalReport] = useState<ExecutiveReport | null>(null); // Original from DB
  const [report, setReport] = useState<ExecutiveReport | null>(null); // Working copy with edits
  const [, setQuestions] = useState<OutstandingQuestion[]>([]);
  const [, setCurrentQuestion] = useState<OutstandingQuestion | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState<{ label: string; value: string }[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Loading stages for report generation
  const [loadingStage, setLoadingStage] = useState<{
    active: boolean;
    stage: number;
    message: string;
  }>({ active: false, stage: 0, message: '' });

  const LOADING_STAGES = [
    { message: 'Thinking...', duration: 800 },
    { message: 'Preparing your profile...', duration: 1200 },
    { message: 'Almost there...', duration: 600 },
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Report tabs (for About You step)
  const [activeReportTab, setActiveReportTab] = useState<'status' | 'personality' | 'voice' | 'character'>('status');
  const [reportFeedback, setReportFeedback] = useState('');
  const [reportConfirmations, setReportConfirmations] = useState<ReportConfirmations>({
    status: false,
    personality: false,
    voice: false,
    character: false,
  });
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);

  // Session context
  const sessionId = searchParams.get('session') || status?.contexts?.active;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      recognition.onend = () => {
        setIsListening(false);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('[Speech] Recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.warn('[Speech] Speech recognition not available');
      return;
    }

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

    // Check if tutorial was already completed
    const tutorialComplete = localStorage.getItem('founder-os-tutorial-completed');
    if (tutorialComplete) {
      navigate('/founder-os/dashboard');
      return;
    }

    // Check if work style assessment was just completed - skip to complete step
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

    // Check for saved progress
    const savedProgress = localStorage.getItem('founder-os-tutorial-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgress(parsed);
        // Initialize from saved step
        initializeStep(parsed);
      } catch {
        // Start fresh
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
      console.error('[tutorial] No session ID');
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';
      const response = await fetch(`${baseUrl}/api/tutorial/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: '',
          conversation_history: [],
          session_id: sessionId,
          progress: currentProgress,
          action: 'init',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize tutorial');
      }

      const data = await response.json();

      // Update state from API response
      if (data.questions) setQuestions(data.questions);
      if (data.report) {
        setOriginalReport(data.report); // Keep original for reset
        setReport(data.report); // Working copy
      }
      if (data.progress) setProgress(data.progress);
      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);

      // Add initial message
      addAssistantMessage(data.content);

      // Set up quick actions based on step
      updateQuickActions(currentProgress.currentStep);

    } catch (error) {
      console.error('[tutorial] Error initializing:', error);
      // Fallback to hardcoded message
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
        setQuickActions([
          { label: 'Show me my Founder OS!', value: 'go_to_dashboard' },
        ]);
        break;
      default:
        setQuickActions([]);
    }
  };

  // Add assistant message
  const addAssistantMessage = (content: string) => {
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content, timestamp: new Date().toISOString() },
    ]);
  };

  // Send message to API
  const sendMessage = async (userMessage: string) => {
    if (!sessionId) return;

    // Add user message to chat
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    ]);
    setQuickActions([]);
    setIsLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';
      const response = await fetch(`${baseUrl}/api/tutorial/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
          session_id: sessionId,
          progress,
          action: 'message',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add assistant response
      addAssistantMessage(data.content);

      // Update progress and state
      if (data.progress) {
        setProgress(data.progress);

        // Handle step transitions
        if (data.progress.currentStep !== progress.currentStep) {
          handleStepTransition(data.progress.currentStep, data);
        }
      }

      if (data.currentQuestion) {
        setCurrentQuestion(data.currentQuestion);
      }

      // Handle specific actions
      handleAction(data.action, data);

    } catch (error) {
      console.error('[tutorial] Error sending message:', error);
      addAssistantMessage("Something went wrong. Let's try that again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle step transitions
  const handleStepTransition = (newStep: TutorialStep, data: any) => {
    updateQuickActions(newStep);

    // Special handling for about_you step - show report
    if (newStep === 'about_you' && data.report) {
      setOriginalReport(data.report); // Keep original for reset
      setReport(data.report); // Working copy
      setActiveReportTab('status');
      setReportConfirmations({ status: false, personality: false, voice: false, character: false });
      // Character profile will be fetched separately or from GoodHang assessment
      if (data.character) {
        setCharacterProfile(data.character);
      }
    }

    // For questions step, show the first question context
    if (newStep === 'questions' && data.currentQuestion) {
      // The API response should include the question prompt
    }
  };

  // Check if all report sections are confirmed
  const allReportSectionsConfirmed =
    reportConfirmations.status &&
    reportConfirmations.personality &&
    reportConfirmations.voice &&
    reportConfirmations.character;

  // Handle report feedback submission with staged loading
  const handleReportFeedback = async () => {
    if (!reportFeedback.trim()) return;

    const feedbackText = reportFeedback.trim();
    const section = activeReportTab;
    setReportFeedback('');

    // Immediately show user message
    setMessages(prev => [
      ...prev,
      { role: 'user', content: feedbackText, timestamp: new Date().toISOString() },
    ]);

    // Immediately acknowledge
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: "Got it, updating your profile...", timestamp: new Date().toISOString() },
    ]);

    // Start loading stages
    const FEEDBACK_STAGES = [
      { message: 'Processing feedback...', duration: 600 },
      { message: 'Updating your profile...', duration: 1000 },
      { message: 'Finishing up...', duration: 400 },
    ];
    setLoadingStage({ active: true, stage: 0, message: FEEDBACK_STAGES[0]?.message || 'Updating...' });

    // Progress through stages
    const progressStages = async () => {
      for (let i = 0; i < FEEDBACK_STAGES.length; i++) {
        const stage = FEEDBACK_STAGES[i];
        if (!stage) continue;
        setLoadingStage({ active: true, stage: i, message: stage.message });
        await new Promise(resolve => setTimeout(resolve, stage.duration));
      }
    };

    // Run API call and stage progression in parallel
    const feedbackMessage = `Feedback on "${section}" section: ${feedbackText}`;
    const [apiResult] = await Promise.all([
      (async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';
          const response = await fetch(`${baseUrl}/api/tutorial/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              message: feedbackMessage,
              conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
              session_id: sessionId,
              progress,
              action: 'message',
            }),
          });
          if (!response.ok) throw new Error('Failed to update report');
          return response.json();
        } catch (error) {
          console.error('[tutorial] Error updating report:', error);
          return null;
        }
      })(),
      progressStages(),
    ]);

    // Clear loading state
    setLoadingStage({ active: false, stage: 0, message: '' });

    if (apiResult) {
      // Update the report if returned
      if (apiResult.report) {
        setReport(apiResult.report);
      }

      // Replace the acknowledgment with the actual response
      setMessages(prev => {
        const updated = [...prev];
        // Find and update the last assistant message (the acknowledgment)
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i]?.role === 'assistant') {
            updated[i] = {
              ...updated[i],
              content: apiResult.content || "I've updated your profile.",
              timestamp: new Date().toISOString(),
            } as Message;
            break;
          }
        }
        return updated;
      });
    } else {
      // Update acknowledgment with error
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i]?.role === 'assistant') {
            updated[i] = {
              ...updated[i],
              content: "Something went wrong updating your profile. Try again?",
              timestamp: new Date().toISOString(),
            } as Message;
            break;
          }
        }
        return updated;
      });
    }
  };

  // Reset report edits back to original
  const resetReportEdits = () => {
    if (originalReport) {
      setReport(originalReport);
      setReportConfirmations({ status: false, personality: false, voice: false, character: false });
      addAssistantMessage("I've reverted to the original profile. Let me know if you want to make any changes.");
    }
  };

  // Persist confirmed report to database
  const persistReport = async () => {
    if (!report || !sessionId) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';
      await fetch(`${baseUrl}/api/tutorial/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: '',
          conversation_history: [],
          session_id: sessionId,
          progress,
          action: 'persist_report',
          pending_report: report,
        }),
      });
      console.log('[tutorial] Report persisted to database');
      // Update original to match now that it's persisted
      setOriginalReport(report);
    } catch (error) {
      console.error('[tutorial] Error persisting report:', error);
    }
  };

  // Confirm current report section
  const confirmReportSection = () => {
    setReportConfirmations(prev => ({
      ...prev,
      [activeReportTab]: true,
    }));

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
  const handleAction = (action: string, data: any) => {
    switch (action) {
      case 'show_report':
        setActiveReportTab('status');
        setReportConfirmations({ status: false, personality: false, voice: false, character: false });
        break;
      case 'tutorial_complete':
        localStorage.setItem('founder-os-tutorial-completed', new Date().toISOString());
        setQuickActions([{ label: 'Show me my Founder OS!', value: 'go_to_dashboard' }]);
        break;
      case 'pause_tutorial':
        // They can come back later
        break;
      case 'question_answered':
        // If there's a next question, it will be in data.currentQuestion
        if (data.currentQuestion) {
          // Add the next question to the conversation
          setTimeout(() => {
            addAssistantMessage(`**${data.currentQuestion.title}**\n\n${data.currentQuestion.prompt}`);
          }, 500);
        }
        break;
    }
  };

  // Handle user text input
  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    sendMessage(message);
  };

  // Handle showing report with staged loading
  const handleShowReport = async () => {
    // Immediately show acknowledgment message
    setMessages(prev => [
      ...prev,
      { role: 'user', content: 'Sure!', timestamp: new Date().toISOString() },
    ]);
    setQuickActions([]);

    // Add assistant acknowledgment
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: "Great! Give me a second and I'll prepare your profile.", timestamp: new Date().toISOString() },
    ]);

    // Start loading stages
    setLoadingStage({ active: true, stage: 0, message: LOADING_STAGES[0]?.message || 'Loading...' });

    // Progress through stages
    const progressStages = async () => {
      for (let i = 0; i < LOADING_STAGES.length; i++) {
        const stage = LOADING_STAGES[i];
        if (!stage) continue;
        setLoadingStage({ active: true, stage: i, message: stage.message });
        await new Promise(resolve => setTimeout(resolve, stage.duration));
      }
    };

    // Run API call and stage progression in parallel
    const [apiResult] = await Promise.all([
      (async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';
          const response = await fetch(`${baseUrl}/api/tutorial/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              message: 'Sure, show me!',
              conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
              session_id: sessionId,
              progress,
              action: 'message',
            }),
          });
          if (!response.ok) throw new Error('Failed to fetch report');
          return response.json();
        } catch (error) {
          console.error('[tutorial] Error fetching report:', error);
          return null;
        }
      })(),
      progressStages(),
    ]);

    // Clear loading state
    setLoadingStage({ active: false, stage: 0, message: '' });

    if (apiResult) {
      // Update state from API response
      if (apiResult.report) {
        setOriginalReport(apiResult.report); // Keep original for reset
        setReport(apiResult.report); // Working copy
      }
      if (apiResult.questions) setQuestions(apiResult.questions);
      if (apiResult.progress) setProgress(apiResult.progress);

      // Add the actual response message
      if (apiResult.content) {
        addAssistantMessage(apiResult.content);
      }

      // Handle step transition
      if (apiResult.progress?.currentStep === 'about_you') {
        setActiveReportTab('status');
        setReportConfirmations({ status: false, personality: false, voice: false, character: false });
      }
    } else {
      addAssistantMessage("Something went wrong loading your profile. Let's try again.");
      setQuickActions([{ label: 'Try again', value: 'show_report' }]);
    }
  };

  // Handle quick action button click
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
        // Navigate to the assessment screen instead of doing questions in chat
        navigate(`/founder-os/work-style-assessment?session=${sessionId}&return=/founder-os/tutorial`);
        return;
      case 'pause':
        sendMessage('Not right now');
        break;
      case 'confirm_report':
        // All sections confirmed - persist to DB and proceed
        persistReport();
        sendMessage("Looks good, let's continue!");
        break;
      default:
        break;
    }
  };

  // Render report with tabs
  const renderReportTabs = () => {
    if (!report) return null;

    const tabs = [
      { id: 'status' as const, label: 'Status', icon: User },
      { id: 'personality' as const, label: 'Personality', icon: Brain },
      { id: 'voice' as const, label: 'Voice', icon: Mic },
      { id: 'character' as const, label: 'Character', icon: Sword },
    ];

    const renderTabContent = () => {
      switch (activeReportTab) {
        case 'status':
          return (
            <div className="space-y-4">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{report.summary}</ReactMarkdown>
              </div>
              <div className="pt-4 border-t border-gh-dark-600">
                <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Communication Style</h4>
                <p className="text-white mb-2">{report.communication.style}</p>
                <ul className="space-y-1">
                  {report.communication.preferences.map((pref, i) => (
                    <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      {pref}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        case 'personality':
          return (
            <div className="space-y-4">
              {report.personality.map((p, i) => (
                <div key={i} className="bg-gh-dark-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-1">{p.trait}</h4>
                  <p className="text-gray-300 text-sm mb-2">{p.description}</p>
                  <p className="text-blue-400 text-sm flex items-start gap-1">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {p.insight}
                  </p>
                </div>
              ))}
            </div>
          );
        case 'voice':
          return (
            <div className="space-y-4">
              {report.voice ? (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">Your Tone</h4>
                    <p className="text-white">{report.voice.tone}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">Writing Style</h4>
                    <p className="text-gray-300">{report.voice.style}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">Characteristics</h4>
                    <ul className="space-y-1">
                      {report.voice.characteristics.map((char, i) => (
                        <li key={i} className="text-gray-300 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                          {char}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {report.voice.examples && report.voice.examples.length > 0 && (
                    <div className="pt-4 border-t border-gh-dark-600">
                      <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">Example Phrases</h4>
                      <div className="space-y-2">
                        {report.voice.examples.map((example, i) => (
                          <blockquote key={i} className="border-l-2 border-purple-500 pl-3 text-gray-300 italic text-sm">
                            "{example}"
                          </blockquote>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Mic className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Voice analysis will be generated based on your conversations.</p>
                </div>
              )}
            </div>
          );
        case 'character':
          return (
            <div className="space-y-4">
              {characterProfile ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">⚔️</div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {characterProfile.title || `${characterProfile.race} ${characterProfile.characterClass}`}
                    </h3>
                    <p className="text-gray-400">{characterProfile.alignment}</p>
                  </div>
                  {characterProfile.attributes && (
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(characterProfile.attributes).map(([attr, value]) => (
                        <div key={attr} className="bg-gh-dark-700/50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-white">{value}</div>
                          <div className="text-xs text-gray-400 uppercase">{attr.substring(0, 3)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Sword className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">Your D&D character profile will be generated after completing the Good Hang assessment.</p>
                  <p className="text-gray-500 text-sm mb-4">This maps your personality to a unique race, class, and alignment.</p>
                  <button
                    onClick={() => navigate('/goodhang/assessment?return=/founder-os/tutorial')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Take The Assessment Now
                  </button>
                  <p className="text-gray-600 text-xs mt-3">Optional - Required for Good Hang Social mode</p>
                </div>
              )}
            </div>
          );
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gh-dark-800 rounded-xl overflow-hidden w-full max-w-2xl"
      >
        {/* Tabs */}
        <div className="flex border-b border-gh-dark-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReportTab === tab.id;
            const isConfirmed = reportConfirmations[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'text-white bg-gh-dark-700/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gh-dark-700/30'
                }`}
              >
                {isConfirmed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-4 max-h-80 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReportTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Feedback and Actions */}
        <div className="p-4 border-t border-gh-dark-700 space-y-3">
          {/* Feedback input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={reportFeedback}
              onChange={(e) => setReportFeedback(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleReportFeedback()}
              placeholder="Suggest any changes or corrections..."
              className="flex-1 bg-gh-dark-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {reportFeedback && (
              <button
                onClick={handleReportFeedback}
                className="px-3 py-2 bg-gh-dark-600 hover:bg-gh-dark-500 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Send
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {Object.values(reportConfirmations).filter(Boolean).length} of 4 confirmed
              </span>
              {/* Show reset if report was modified */}
              {originalReport && report && JSON.stringify(report) !== JSON.stringify(originalReport) && (
                <button
                  onClick={resetReportEdits}
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {!reportConfirmations[activeReportTab] && (
                <button
                  onClick={confirmReportSection}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Looks Good
                </button>
              )}
              {allReportSectionsConfirmed && (
                <button
                  onClick={() => handleQuickAction('confirm_report')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Get step status for sidebar
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < progress.stepIndex) return 'completed';
    if (stepIndex === progress.stepIndex) return 'current';
    return 'locked';
  };

  return (
    <div className="flex h-screen bg-gh-dark-900">
      {/* Sidebar - Tutorial Progress */}
      <div className="w-64 bg-gh-dark-800 border-r border-gh-dark-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gh-dark-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-white">Setup Mode</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {STEP_CONFIG.map((step, index) => {
            const stepStatus = getStepStatus(index);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  stepStatus === 'current'
                    ? 'bg-blue-600/20 border border-blue-500/50'
                    : stepStatus === 'completed'
                    ? 'bg-green-600/10'
                    : 'opacity-50'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {stepStatus === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : stepStatus === 'current' ? (
                    <Icon className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-500" />
                  )}
                </div>
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
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="p-4 border-t border-gh-dark-700">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>{progress.stepIndex + 1} / 5</span>
          </div>
          <div className="h-1.5 bg-gh-dark-600 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((progress.stepIndex + 1) / 5) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
            />
          </div>
        </div>

        {/* Reset button */}
        <div className="p-4 border-t border-gh-dark-700">
          <button
            onClick={() => {
              resetOnboarding();
              window.location.reload();
            }}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-400 transition-colors"
            title="Reset Onboarding"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Content - Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-gh-dark-900">
        {/* Compact Header - Claude style */}
        <div className="px-6 py-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-medium text-white">Founder OS Setup</h1>
            <span className="text-gray-500">·</span>
            <span className="text-sm text-gray-400">
              {STEP_CONFIG[progress.stepIndex]?.label || 'Getting started'}
            </span>
          </div>
        </div>

        {/* Messages - centered with max width */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${message.role === 'user' ? 'flex justify-end' : ''}`}
                >
                  {message.role === 'user' ? (
                    <div className="bg-blue-600 text-white rounded-2xl px-5 py-3 max-w-[85%]">
                      <div className="prose prose-invert prose-sm max-w-none break-words">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white">
                      <div className="prose prose-invert prose-base max-w-none break-words leading-relaxed">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Report Display (for About You step) */}
            {progress.currentStep === 'about_you' && report && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {renderReportTabs()}
              </motion.div>
            )}

            {/* Loading indicator - simple spinner */}
            {isLoading && !loadingStage.active && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </motion.div>
            )}

            {/* Staged loading bar for report generation */}
            {loadingStage.active && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm text-gray-300">{loadingStage.message}</span>
                </div>
                <div className="h-1.5 bg-gh-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((loadingStage.stage + 1) / LOADING_STAGES.length) * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {/* Quick Actions - inline with content, right-justified */}
            {quickActions.length > 0 && !isLoading && !loadingStage.active && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end gap-3 pt-2"
              >
                {quickActions.map((action) => (
                  <button
                    key={action.value}
                    onClick={() => handleQuickAction(action.value)}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                      action.value.includes('skip') || action.value.includes('pause')
                        ? 'bg-gh-dark-700 hover:bg-gh-dark-600 text-gray-300 border border-gh-dark-600'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input - Claude style floating input */}
        <div className="flex-shrink-0 pb-6 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gh-dark-800 rounded-2xl border border-gh-dark-600 shadow-lg">
              <div className="px-4 py-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Reply..."
                  disabled={isLoading || loadingStage.active}
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
                    onClick={toggleListening}
                    disabled={isLoading}
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
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
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
      </div>
    </div>
  );
}
