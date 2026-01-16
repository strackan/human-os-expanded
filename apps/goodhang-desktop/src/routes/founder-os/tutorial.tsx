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
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [, setQuestions] = useState<OutstandingQuestion[]>([]);
  const [, setCurrentQuestion] = useState<OutstandingQuestion | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState<{ label: string; value: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
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
      if (data.report) setReport(data.report);
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
      setReport(data.report);
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

  // Handle report feedback submission
  const handleReportFeedback = async () => {
    if (!reportFeedback.trim()) return;

    // Send feedback as a message - the agent can incorporate or queue it
    const feedbackMessage = `Feedback on "${activeReportTab}" section: ${reportFeedback}`;
    setReportFeedback('');
    await sendMessage(feedbackMessage);
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

  // Handle quick action button click
  const handleQuickAction = (value: string) => {
    switch (value) {
      case 'go_to_dashboard':
        navigate('/founder-os/dashboard');
        return;
      case 'show_report':
        sendMessage('Sure, show me!');
        break;
      case 'skip_report':
        sendMessage('Skip for now');
        break;
      case 'start_questions':
        sendMessage("Let's do it");
        break;
      case 'pause':
        sendMessage('Not right now');
        break;
      case 'confirm_report':
        // All sections confirmed, proceed to next step
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
            <div className="text-xs text-gray-500">
              {Object.values(reportConfirmations).filter(Boolean).length} of 4 confirmed
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gh-dark-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-white truncate">Founder OS Setup</h1>
              <p className="text-sm text-gray-400 truncate">
                {STEP_CONFIG[progress.stepIndex]?.label || 'Getting started'}
                {progress.currentStep === 'questions' && progress.totalQuestions > 0 && (
                  <span className="ml-2">({progress.questionsAnswered + 1}/{progress.totalQuestions})</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gh-dark-700 text-white'
                  }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Report Display (for About You step) */}
          {progress.currentStep === 'about_you' && report && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              {renderReportTabs()}
            </motion.div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gh-dark-700 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && !isLoading && (
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="flex gap-3 flex-wrap">
              {quickActions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => handleQuickAction(action.value)}
                  className={`px-4 py-3 rounded-xl transition-colors ${
                    action.value.includes('skip') || action.value.includes('pause')
                      ? 'bg-gh-dark-700 hover:bg-gh-dark-600 text-gray-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gh-dark-700 flex-shrink-0">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center bg-gh-dark-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-white px-4 py-3 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={toggleListening}
                disabled={isLoading}
                className={`px-3 py-3 transition-colors disabled:opacity-50 ${
                  isListening
                    ? 'text-red-400 hover:text-red-300 animate-pulse'
                    : 'text-blue-400 hover:text-blue-300'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                <Mic className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
