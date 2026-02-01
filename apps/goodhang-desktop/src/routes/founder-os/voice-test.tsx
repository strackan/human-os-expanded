/**
 * Voice Test Route
 *
 * Interactive voice calibration flow that allows users to test and refine
 * their AI-generated voice through content generation across multiple types.
 * Uses a rating-based feedback loop to capture preferences and generates
 * a final "10 Commandments" document.
 *
 * Layout matches AssessmentFlow: top timeline + centered content area.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { X, Zap, Check } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { isDevMode } from '@/lib/api/client';
import {
  type VoiceTestStage,
  type VoiceTestProgress,
  type GenerationAttempt,
  type VoiceFeedback,
  type VoiceCommandment,
  type ContentTypeConfig,
  type SculptorVoiceData,
  type PersonaFingerprint,
  CONTENT_TYPES,
  STORAGE_KEYS,
} from '@/lib/types/voice-test';

// =============================================================================
// CONTENT TYPE TIMELINE COMPONENT
// =============================================================================

interface ContentTypeTimelineProps {
  contentTypes: ContentTypeConfig[];
  currentIndex: number;
  completedTypes: string[];
  onTypeClick: (index: number) => void;
}

function ContentTypeTimeline({
  contentTypes,
  currentIndex,
  completedTypes,
  onTypeClick,
}: ContentTypeTimelineProps) {
  // With 3 essential tests, show all in a single row
  const categories = [
    { label: 'Voice Tests', types: contentTypes },
  ];

  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4">
      {categories.map((category, catIndex) => (
        <div key={category.label} className="flex items-center">
          {catIndex > 0 && <div className="w-4 h-px bg-gray-700 mx-1" />}
          <div className="flex items-center gap-1">
            {category.types.map((ct) => {
              const globalIndex = contentTypes.findIndex(c => c.id === ct.id);
              const isCompleted = completedTypes.includes(ct.id);
              const isCurrent = globalIndex === currentIndex;
              const isPast = globalIndex < currentIndex || isCompleted;

              return (
                <button
                  key={ct.id}
                  onClick={() => onTypeClick(globalIndex)}
                  disabled={!isPast && !isCurrent}
                  title={ct.label}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full transition-all
                    ${isCurrent ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-black' : ''}
                    ${isCompleted && !isCurrent ? 'bg-green-600/20 text-green-400' : ''}
                    ${!isCurrent && !isCompleted ? 'bg-gray-800 text-gray-500' : ''}
                    ${isPast && !isCurrent ? 'hover:bg-gray-700 cursor-pointer' : ''}
                    ${!isPast && !isCurrent ? 'cursor-not-allowed' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <span className="text-xs font-bold">{globalIndex + 1}</span>
                  ) : (
                    <span className="text-xs">{globalIndex + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MOCK DATA FOR DEV MODE
// =============================================================================

const MOCK_VOICE_TEST_DATA = {
  prompts: {
    linkedin_thought: 'Share a contrarian take on productivity culture',
    linkedin_personal: 'Reflect on a failure that taught me something',
    connection_request: 'Connect with a VP of Engineering at a Series B startup',
  },
  ratings: [9, 8, 9], // Predetermined ratings for 3 tests
  feedback: {
    whatDidntWork: 'The tone was a bit too formal for my style',
    whatTenLooksLike: 'More casual, punchy, with a touch of humor',
    helpfulInstruction: 'Use shorter sentences and more personality',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function VoiceTestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Session ID and return path from URL
  const sessionId = searchParams.get('session') || '';
  const returnPath = searchParams.get('return') || '/founder-os/dashboard';

  // State
  const [stage, setStage] = useState<VoiceTestStage>('intro');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Progress tracking
  const [currentContentTypeIndex, setCurrentContentTypeIndex] = useState(0);
  const [completedContentTypes, setCompletedContentTypes] = useState<string[]>([]);
  const [allAttempts, setAllAttempts] = useState<GenerationAttempt[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<Partial<GenerationAttempt> | null>(null);

  // Content generation state
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [currentRating, setCurrentRating] = useState<number>(7);
  const [feedbackForm, setFeedbackForm] = useState<VoiceFeedback>({
    whatDidntWork: '',
    whatTenLooksLike: '',
    helpfulInstruction: '',
  });

  // Final commandments
  const [commandments, setCommandments] = useState<VoiceCommandment[]>([]);
  const [commandmentsSummary, setCommandmentsSummary] = useState<string>('');

  // Sculptor voice data (v0 baseline) - fetched for future use in UI display
  const [_sculptorVoice, setSculptorVoice] = useState<SculptorVoiceData | null>(null);
  const [_personaFingerprint, setPersonaFingerprint] = useState<PersonaFingerprint | null>(null);

  // Current content type
  const currentContentType = CONTENT_TYPES[currentContentTypeIndex];
  const progress = ((completedContentTypes.length) / CONTENT_TYPES.length) * 100;

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Try to restore progress from localStorage
    const savedProgress = loadProgress();
    if (savedProgress && savedProgress.sessionId === sessionId) {
      restoreProgress(savedProgress);
    } else {
      // Fresh start
      addAssistantMessage(getIntroMessage());
    }

    // Fetch sculptor voice data
    if (sessionId) {
      fetchSculptorData();
    }
  }, [sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save progress on state changes
  useEffect(() => {
    if (stage !== 'intro' && stage !== 'complete') {
      saveProgress();
    }
  }, [stage, currentContentTypeIndex, completedContentTypes, allAttempts]);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchSculptorData = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';

      // Fetch report for voice data
      const reportResponse = await fetch(`${baseUrl}/api/sculptor/sessions/${sessionId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: 'executive' }),
      });

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        if (reportData.report?.voice) {
          setSculptorVoice(reportData.report.voice);
        }
      }

      // Fetch finalize data for persona fingerprint
      const finalizeResponse = await fetch(`${baseUrl}/api/sculptor/sessions/${sessionId}/finalize`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (finalizeResponse.ok) {
        const finalizeData = await finalizeResponse.json();
        if (finalizeData.persona_fingerprint) {
          setPersonaFingerprint(finalizeData.persona_fingerprint);
        }
      }
    } catch (error) {
      console.error('[voice-test] Error fetching sculptor data:', error);
    }
  };

  // =============================================================================
  // PERSISTENCE
  // =============================================================================

  const loadProgress = (): VoiceTestProgress | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[voice-test] Error loading progress:', error);
    }
    return null;
  };

  const saveProgress = () => {
    try {
      const progress: VoiceTestProgress = {
        sessionId,
        stage,
        currentContentTypeIndex,
        completedContentTypes,
        allAttempts,
        currentAttempt,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('[voice-test] Error saving progress:', error);
    }
  };

  const restoreProgress = (progress: VoiceTestProgress) => {
    setStage(progress.stage);
    setCurrentContentTypeIndex(progress.currentContentTypeIndex);
    setCompletedContentTypes(progress.completedContentTypes);
    setAllAttempts(progress.allAttempts);
    setCurrentAttempt(progress.currentAttempt);

    // Add resume message
    addAssistantMessage(getResumeMessage(progress));
  };

  const markCompleted = () => {
    localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify({
      sessionId,
      completedAt: new Date().toISOString(),
      commandments,
      summary: commandmentsSummary,
      totalAttempts: allAttempts.length,
      averageRating: allAttempts.reduce((sum, a) => sum + (a.rating || 0), 0) / allAttempts.length,
    }));
    localStorage.setItem('founder-os-voice-test-completed', new Date().toISOString());
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  };

  // =============================================================================
  // MESSAGE HELPERS
  // =============================================================================

  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    }]);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }]);
  };

  // =============================================================================
  // MESSAGE TEMPLATES
  // =============================================================================

  const getIntroMessage = (): string => {
    return `Welcome to Voice Test! This is where we calibrate your AI voice.

Here's how it works:
1. I'll generate content in your voice for different scenarios
2. You rate each piece from 1-10
3. For anything under 9, you'll tell me what to fix
4. After testing all content types, I'll create your "10 Commandments" - the definitive guide to writing in your voice

Ready to get started?`;
  };

  const getResumeMessage = (progress: VoiceTestProgress): string => {
    const completed = progress.completedContentTypes.length;
    const total = CONTENT_TYPES.length;
    const currentType = CONTENT_TYPES[progress.currentContentTypeIndex];

    return `Welcome back! You've completed ${completed}/${total} content types.

Let's continue with: **${currentType?.label}**

${currentType?.promptHint}`;
  };

  const getContentTypeIntroMessage = (ct: ContentTypeConfig): string => {
    return `Great! Let's work on a **${ct.label}**.

${ct.description}.

${ct.promptHint}`;
  };

  // =============================================================================
  // DEV MODE: MOCK FILL
  // =============================================================================

  const handleMockFill = useCallback(async () => {
    if (!isDevMode()) return;

    setIsLoading(true);
    addAssistantMessage("🚀 Dev mode: Running mock voice test...");

    // Simulate going through all content types
    for (let i = 0; i < CONTENT_TYPES.length; i++) {
      const ct = CONTENT_TYPES[i];
      const mockPrompt = MOCK_VOICE_TEST_DATA.prompts[ct.id as keyof typeof MOCK_VOICE_TEST_DATA.prompts] || 'Test content';
      const mockRating = MOCK_VOICE_TEST_DATA.ratings[i] || 9;

      const attempt: GenerationAttempt = {
        id: crypto.randomUUID(),
        contentTypeId: ct.id,
        userPrompt: mockPrompt,
        generatedContent: `[Mock generated ${ct.label} content for: ${mockPrompt}]`,
        rating: mockRating,
        feedback: mockRating < 9 ? MOCK_VOICE_TEST_DATA.feedback : null,
        timestamp: new Date().toISOString(),
      };

      setAllAttempts(prev => [...prev, attempt]);
      setCompletedContentTypes(prev => [...prev, ct.id]);
    }

    setCurrentContentTypeIndex(CONTENT_TYPES.length - 1);

    // Generate mock commandments
    const mockCommandments: VoiceCommandment[] = [
      { number: 1, title: 'Be Direct', description: 'Get to the point quickly', examples: ['Lead with the key insight'], contentTypes: ['linkedin_post'] },
      { number: 2, title: 'Use Short Sentences', description: 'Punchy is better', examples: ['Break up long thoughts'], contentTypes: ['email'] },
      { number: 3, title: 'Show Personality', description: 'Let your voice shine through', examples: ['Add humor when appropriate'], contentTypes: ['linkedin_post', 'email'] },
    ];

    setCommandments(mockCommandments);
    setCommandmentsSummary('Your voice is direct, punchy, and personable. You prefer short sentences and getting to the point quickly.');
    setStage('complete');
    markCompleted();

    addAssistantMessage(`✅ Mock voice test complete! Generated ${CONTENT_TYPES.length} content pieces with an average rating of 8.4.`);
    setIsLoading(false);
  }, []);

  // =============================================================================
  // STAGE HANDLERS
  // =============================================================================

  const handleChoiceStart = () => {
    addUserMessage("Let's do it");
    setStage('content_prompt');
    addAssistantMessage(getContentTypeIntroMessage(currentContentType));
  };

  const handleChoiceLater = () => {
    addUserMessage("I'll do this later");
    navigate(-1);
  };

  const handleContentPromptSubmit = async () => {
    if (!inputValue.trim()) return;

    const prompt = inputValue.trim();
    setInputValue('');
    addUserMessage(prompt);

    // Start generation
    setStage('generating');
    setCurrentAttempt({
      id: crypto.randomUUID(),
      contentTypeId: currentContentType.id,
      userPrompt: prompt,
      timestamp: new Date().toISOString(),
    });

    await generateContent(prompt);
  };

  const generateContent = async (prompt: string) => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';

      // Get previous attempts for this content type for context
      const previousAttempts = allAttempts
        .filter(a => a.contentTypeId === currentContentType.id && a.rating !== null)
        .map(a => ({
          content: a.generatedContent,
          rating: a.rating!,
          feedback: a.feedback!,
        }));

      const response = await fetch(`${baseUrl}/api/voice-test/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          content_type: currentContentType.type,
          style: currentContentType.style,
          user_prompt: prompt,
          previous_attempts: previousAttempts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      setStage('rating');
      setCurrentRating(7);

      addAssistantMessage(`Here's what I came up with:\n\n---\n\n${data.content}\n\n---\n\nHow does this sound? Rate it from 1-10.`);
    } catch (error) {
      console.error('[voice-test] Generation error:', error);
      addAssistantMessage("Something went wrong generating that content. Let's try again - give me another prompt.");
      setStage('content_prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingSubmit = () => {
    addUserMessage(`${currentRating}/10`);

    if (currentRating >= 9) {
      // Great rating! Save attempt and move on
      const attempt: GenerationAttempt = {
        id: currentAttempt?.id || crypto.randomUUID(),
        contentTypeId: currentContentType.id,
        userPrompt: currentAttempt?.userPrompt || '',
        generatedContent,
        rating: currentRating,
        feedback: null,
        timestamp: new Date().toISOString(),
      };

      setAllAttempts(prev => [...prev, attempt]);
      handleCompleteContentType();
    } else {
      // Need feedback
      setStage('feedback');
      addAssistantMessage(`Got it, ${currentRating}/10. Help me understand what would make this better.`);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackForm.whatDidntWork.trim()) return;

    // Save feedback
    addUserMessage(`What didn't work: ${feedbackForm.whatDidntWork}
What a 10 looks like: ${feedbackForm.whatTenLooksLike}
Helpful instruction: ${feedbackForm.helpfulInstruction}`);

    // Save attempt with feedback
    const attempt: GenerationAttempt = {
      id: currentAttempt?.id || crypto.randomUUID(),
      contentTypeId: currentContentType.id,
      userPrompt: currentAttempt?.userPrompt || '',
      generatedContent,
      rating: currentRating,
      feedback: feedbackForm,
      timestamp: new Date().toISOString(),
    };

    setAllAttempts(prev => [...prev, attempt]);

    // Store the original prompt before resetting
    const originalPrompt = currentAttempt?.userPrompt || '';

    // Reset feedback form
    setFeedbackForm({
      whatDidntWork: '',
      whatTenLooksLike: '',
      helpfulInstruction: '',
    });

    // Automatically regenerate with the same prompt using the feedback
    addAssistantMessage("Got it! Let me try again with your feedback...");
    setStage('generating');

    // Create new attempt with same prompt
    setCurrentAttempt({
      id: crypto.randomUUID(),
      contentTypeId: currentContentType.id,
      userPrompt: originalPrompt,
      timestamp: new Date().toISOString(),
    });

    await generateContent(originalPrompt);
  };

  const handleTryAgain = () => {
    addUserMessage("Try again");
    setStage('content_prompt');
    addAssistantMessage(`Let's give it another shot. ${currentContentType.promptHint}`);
  };

  const handleMoveOn = () => {
    addUserMessage("Move on");
    handleCompleteContentType();
  };

  const handleCompleteContentType = () => {
    // Mark current type as completed
    setCompletedContentTypes(prev => [...prev, currentContentType.id]);

    // Check if we're done with all content types
    const nextIndex = currentContentTypeIndex + 1;
    if (nextIndex >= CONTENT_TYPES.length) {
      // All done - generate commandments
      setStage('generating_commandments');
      addAssistantMessage("Excellent! You've gone through all the content types. Let me synthesize your feedback into your 10 Commandments...");
      generateCommandments();
    } else {
      // Move to next content type
      setCurrentContentTypeIndex(nextIndex);
      setCurrentAttempt(null);
      setGeneratedContent('');

      const nextContentType = CONTENT_TYPES[nextIndex];
      setStage('content_prompt');
      addAssistantMessage(`Great progress! Next up: **${nextContentType.label}**\n\n${nextContentType.promptHint}`);
    }
  };

  const generateCommandments = async () => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';

      const response = await fetch(`${baseUrl}/api/voice-test/commandments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          all_attempts: allAttempts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate commandments');
      }

      const data = await response.json();
      setCommandments(data.commandments);
      setCommandmentsSummary(data.summary);
      setStage('complete');
      markCompleted();

      addAssistantMessage(`Done! Here are your **10 Commandments of Voice**.

${data.summary}

Your commandments have been saved to your voice profile. You can view and edit them anytime from your dashboard.`);
    } catch (error) {
      console.error('[voice-test] Commandments error:', error);
      addAssistantMessage("Something went wrong generating your commandments. Don't worry - your feedback has been saved. Let me try again.");
      // Retry after a delay
      setTimeout(generateCommandments, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // INPUT HANDLING
  // =============================================================================

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    switch (stage) {
      case 'content_prompt':
        await handleContentPromptSubmit();
        break;
      default:
        // Free-form response handling
        addUserMessage(inputValue.trim());
        setInputValue('');
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // =============================================================================
  // NAVIGATION
  // =============================================================================

  const handleTypeClick = useCallback((index: number) => {
    // Only allow navigating to completed types or current
    if (index <= currentContentTypeIndex || completedContentTypes.includes(CONTENT_TYPES[index].id)) {
      // Could implement jumping - for now just highlight
    }
  }, [currentContentTypeIndex, completedContentTypes]);

  const handleExit = useCallback(() => {
    navigate(returnPath);
  }, [navigate, returnPath]);

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.COMPLETED);
    localStorage.removeItem('founder-os-voice-test-completed');
    window.location.reload();
  }, []);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header with Progress - matches AssessmentFlow layout */}
      <div className="border-b border-purple-500/30 bg-gray-900/95 relative flex-shrink-0">
        {/* Exit button */}
        <button
          onClick={handleExit}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 border border-gray-700 hover:border-gray-600"
          title="Save & Exit"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dev mode buttons */}
        {isDevMode() && (
          <div className="absolute top-4 right-16 z-10 flex gap-2">
            <button
              onClick={handleMockFill}
              className="px-3 py-2 rounded-full bg-yellow-600/80 hover:bg-yellow-500 text-white text-xs font-medium transition-all duration-200 border border-yellow-500 flex items-center gap-1"
              title="Fill with mock data (Dev Mode)"
            >
              <Zap className="w-4 h-4" />
              Mock Fill
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-full bg-orange-600/80 hover:bg-orange-500 text-white text-xs font-medium transition-all duration-200 border border-orange-500"
              title="Reset voice test (Dev Mode)"
            >
              Reset
            </button>
          </div>
        )}

        {/* Content Type Timeline - matches SectionTimeline style */}
        <ContentTypeTimeline
          contentTypes={CONTENT_TYPES}
          currentIndex={currentContentTypeIndex}
          completedTypes={completedContentTypes}
          onTypeClick={handleTypeClick}
        />

        {/* Progress Bar - matches AssessmentFlow */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {stage === 'intro' ? 'Voice Calibration' : currentContentType?.label}
              </span>
              <button
                onClick={handleExit}
                className="text-xs text-purple-400 hover:opacity-80 transition-colors"
              >
                Save & Exit
              </button>
            </div>
            <span className="text-sm text-purple-400">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Main Content - matches AssessmentFlow layout */}
      <div className="flex-1 overflow-y-auto pt-8 pb-12 px-4 min-h-0">
        <div className="max-w-3xl mx-auto space-y-4">
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
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-white border border-gray-700'
                  }`}
                >
                  <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'text-white prose-invert' : 'text-white prose-invert'}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Area - inline with content */}
          <div className="mt-8">
          {/* Intro: Start/Later buttons */}
          {stage === 'intro' && messages.length === 1 && (
            <div className="flex gap-3">
              <button
                onClick={handleChoiceStart}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
              >
                Let's Do It
              </button>
              <button
                onClick={handleChoiceLater}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors border border-gray-700"
              >
                Later
              </button>
            </div>
          )}

          {/* Rating UI */}
          {stage === 'rating' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <label className="text-sm text-gray-400 block mb-3">Rate this content (1-10)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentRating}
                    onChange={(e) => setCurrentRating(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <span className={`text-3xl font-bold min-w-[3rem] text-center ${
                    currentRating >= 9 ? 'text-green-400' : currentRating >= 7 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {currentRating}
                  </span>
                </div>
              </div>
              <button
                onClick={handleRatingSubmit}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
              >
                Submit Rating
              </button>
            </div>
          )}

          {/* Feedback Form */}
          {stage === 'feedback' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4 space-y-4 border border-gray-700">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">What specifically didn't work?</label>
                  <textarea
                    value={feedbackForm.whatDidntWork}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, whatDidntWork: e.target.value }))}
                    placeholder="The tone was too formal, the opening felt weak..."
                    rows={2}
                    className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">What would a 10/10 version look like?</label>
                  <textarea
                    value={feedbackForm.whatTenLooksLike}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, whatTenLooksLike: e.target.value }))}
                    placeholder="It would start with a bold statement, use more casual language..."
                    rows={2}
                    className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">What question or instruction would have helped me get it right?</label>
                  <textarea
                    value={feedbackForm.helpfulInstruction}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, helpfulInstruction: e.target.value }))}
                    placeholder="Ask me about my target audience, remind me to be provocative..."
                    rows={2}
                    className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
                  />
                </div>
              </div>
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackForm.whatDidntWork.trim()}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
              >
                Submit Feedback
              </button>
            </div>
          )}

          {/* Try Again / Move On */}
          {stage === 'complete_type' && (
            <div className="flex gap-3">
              <button
                onClick={handleTryAgain}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors border border-gray-700"
              >
                Try Again
              </button>
              <button
                onClick={handleMoveOn}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
              >
                Move On
              </button>
            </div>
          )}

          {/* Commandments Display */}
          {stage === 'complete' && commandments.length > 0 && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-6 max-h-80 overflow-y-auto border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Your 10 Commandments</h3>
                <div className="space-y-4">
                  {commandments.map((cmd, index) => (
                    <div key={index} className="border-l-2 border-purple-500 pl-4">
                      <h4 className="font-medium text-white">
                        {cmd.number}. {cmd.title}
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">{cmd.description}</p>
                      {cmd.examples.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Examples:</p>
                          <ul className="text-xs text-gray-400 list-disc list-inside">
                            {cmd.examples.map((ex, i) => (
                              <li key={i}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('founder-os-voice-test-completed', new Date().toISOString());
                  navigate(returnPath);
                }}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
              >
                Continue
              </button>
            </div>
          )}

          {/* Text Input - shown for content_prompt stage */}
          {stage === 'content_prompt' && (
            <div className="flex gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentContentType?.promptHint || "Type your message..."}
                rows={1}
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          )}
          </div>
          {/* End Action Area */}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
