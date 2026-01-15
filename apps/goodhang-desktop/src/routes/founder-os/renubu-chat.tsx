/**
 * Renubu Chat Route
 *
 * Post-Sculptor chat workflow that either:
 * - A: Covers remaining assessment questions
 * - B: Builds Founder OS context through conversation
 *
 * NPC mirrors user's personality fingerprint.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  extractedEntities?: ExtractedEntity[];
}

interface ExtractedEntity {
  type: 'person' | 'company' | 'project' | 'goal' | 'task' | 'event';
  name: string;
  context: string;
  confirmed?: boolean;
}

// Legacy format (individual questions)
interface OutstandingQuestion {
  slug: string;
  text: string;
  category: string;
}

// New format (consolidated prompts)
interface ConsolidatedPrompt {
  id: string;
  title: string;
  prompt: string;
  covers: string[];
  maps_to: string[];
}

// Union type for backwards compatibility
type QuestionOrPrompt = OutstandingQuestion | ConsolidatedPrompt;

function isConsolidatedPrompt(q: QuestionOrPrompt): q is ConsolidatedPrompt {
  return 'prompt' in q && 'title' in q;
}

interface PersonaFingerprint {
  self_deprecation: number;
  directness: number;
  warmth: number;
  intellectual_signaling: number;
  comfort_with_sincerity: number;
  absurdism_tolerance: number;
  format_awareness: number;
  vulnerability_as_tool: number;
}

export default function RenubuChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'initial' | 'questions' | 'context' | 'done'>('initial');
  const [outstandingQuestions, setOutstandingQuestions] = useState<QuestionOrPrompt[]>([]);
  const [isConsolidatedFormat, setIsConsolidatedFormat] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [personaFingerprint, setPersonaFingerprint] = useState<PersonaFingerprint | null>(null);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [pendingEntities, setPendingEntities] = useState<ExtractedEntity[]>([]);

  // Get session ID from URL params
  const sessionId = searchParams.get('session');

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize - fetch finalization data
  useEffect(() => {
    // Prevent double initialization in React strict mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log('[renubu-chat] Initializing with sessionId:', sessionId);

    if (sessionId) {
      fetchFinalizationData();
    } else {
      // No session - start in context building mode
      console.log('[renubu-chat] No sessionId, starting context building mode');
      setMode('context');
      addAssistantMessage(getContextBuildingOpening());
    }
  }, [sessionId]);

  const fetchFinalizationData = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';
      const url = `${baseUrl}/api/sculptor/sessions/${sessionId}/finalize`;
      console.log('[renubu-chat] Fetching finalization data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log('[renubu-chat] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[renubu-chat] Response error:', errorText);
        throw new Error('Failed to fetch finalization data');
      }

      const data = await response.json();
      console.log('[renubu-chat] Finalization data:', {
        status: data.status,
        questionsCount: data.outstanding_questions?.length,
        hasPersona: !!data.persona_fingerprint,
        firstQuestion: data.outstanding_questions?.[0],
      });

      const questions = data.outstanding_questions || [];
      setOutstandingQuestions(questions);
      setPersonaFingerprint(data.persona_fingerprint || null);

      // Detect if using consolidated prompt format
      const isConsolidated = questions.length > 0 && isConsolidatedPrompt(questions[0]);
      setIsConsolidatedFormat(isConsolidated);
      console.log('[renubu-chat] Format:', isConsolidated ? 'consolidated' : 'legacy', 'questions:', questions.length);

      // Start with the initial choice
      addAssistantMessage(getInitialChoiceMessage(questions.length, isConsolidated));
    } catch (error) {
      console.error('[renubu-chat] Error fetching finalization data:', error);
      // Fallback to context building mode
      setMode('context');
      addAssistantMessage(getContextBuildingOpening());
    }
  };

  const addAssistantMessage = (content: string, entities?: ExtractedEntity[]) => {
    console.log('[renubu-chat] Adding assistant message:', content.substring(0, 50) + '...');
    setMessages((prev) => {
      const newMessages = [
        ...prev,
        {
          role: 'assistant' as const,
          content,
          timestamp: new Date().toISOString(),
          extractedEntities: entities,
        },
      ];
      console.log('[renubu-chat] Messages after add:', newMessages.length);
      return newMessages;
    });
  };

  const getInitialChoiceMessage = (questionCount: number, isConsolidated: boolean): string => {
    if (questionCount === 0) {
      return `Hey, you covered everything in the Sculptor session! Pretty thorough.

So let's get started building out your world. Tell me about your day, your week, or something you're thinking about.`;
    }

    if (isConsolidated) {
      return `Hey, I've got ${questionCount} quick topics to cover so I can really understand how you work.

Want to knock those out now? Should take about 5-10 minutes.`;
    }

    return `Hey, we've got ${questionCount} more questions to really get dialed in.

Do you want to cover those now? Or just get started?`;
  };

  const getContextBuildingOpening = (): string => {
    return `Alright, let's start building out your world.

Tell me about your day, your week, or something on your mind. Could be work stuff, a project, people you're dealing with - whatever.

I'll start capturing what you share and building out your context.`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    setIsLoading(true);

    try {
      // Handle based on mode
      if (mode === 'initial') {
        await handleInitialResponse(userMessage);
      } else if (mode === 'questions') {
        await handleQuestionResponse(userMessage);
      } else if (mode === 'context') {
        await handleContextResponse(userMessage);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      addAssistantMessage("Something went wrong. Let's try that again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialResponse = async (message: string) => {
    const lower = message.toLowerCase();

    if (lower.includes('cover') || lower.includes('question') || lower.includes('now') || lower.includes('yes') || lower.includes('knock')) {
      setMode('questions');
      if (outstandingQuestions.length > 0) {
        const first = outstandingQuestions[0];
        if (isConsolidatedPrompt(first)) {
          addAssistantMessage(
            `Great, let's do it.\n\n**${first.title}**\n\n${first.prompt}`
          );
        } else {
          addAssistantMessage(
            `Great, let's knock these out. First one:\n\n**${first.text}**`
          );
        }
      } else {
        setMode('context');
        addAssistantMessage(getContextBuildingOpening());
      }
    } else {
      setMode('context');
      addAssistantMessage(getContextBuildingOpening());
    }
  };

  const handleQuestionResponse = async (message: string) => {
    const current = outstandingQuestions[currentQuestionIndex];
    const questionId = isConsolidatedPrompt(current) ? current.id : current.slug;

    // Save the answer via API
    if (sessionId) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';
      try {
        await fetch(`${baseUrl}/api/sculptor/sessions/${sessionId}/answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            question_id: questionId,
            answer: message,
            ...(isConsolidatedPrompt(current) ? {
              covers: current.covers,
              maps_to: current.maps_to,
            } : {}),
          }),
        });
        console.log('[renubu-chat] Saved answer for:', questionId);
      } catch (error) {
        console.error('[renubu-chat] Failed to save answer:', error);
      }
    }

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < outstandingQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      const next = outstandingQuestions[nextIndex];

      if (isConsolidatedPrompt(next)) {
        addAssistantMessage(
          `Got it.\n\n**${next.title}**\n\n${next.prompt}`
        );
      } else {
        addAssistantMessage(
          `Got it. Next question:\n\n**${next.text}**`
        );
      }
    } else {
      // All questions done
      setMode('context');
      addAssistantMessage(
        `That's all of them! Now I've got a solid picture of how you work.\n\nLet's start building out your world. Tell me about something on your mind - your day, a project, people you're working with.`
      );
    }
  };

  const handleContextResponse = async (message: string) => {
    // Call extraction API
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';

    try {
      const response = await fetch(`${baseUrl}/api/extraction/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message,
          conversation_history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const entities = data.entities || [];

        if (entities.length > 0) {
          setPendingEntities(entities);
          addAssistantMessage(
            `Here's what I captured:\n\n${entities
              .map((e: ExtractedEntity) => `- **${e.type}**: ${e.name}`)
              .join('\n')}\n\nDoes this look right? Anything to add or correct?`,
            entities
          );
        } else {
          addAssistantMessage(
            `Got it. Tell me more - what else is on your plate? People, projects, goals...`
          );
        }
      } else {
        // Fallback response
        addAssistantMessage(
          `Interesting. Tell me more about that. Who's involved? What's the context?`
        );
      }
    } catch {
      // Fallback response
      addAssistantMessage(
        `Got it. What else is on your mind? Keep going - I'm building out your world.`
      );
    }
  };

  const handleConfirmEntities = () => {
    // Add pending entities to confirmed list
    setExtractedEntities((prev) => [
      ...prev,
      ...pendingEntities.map((e) => ({ ...e, confirmed: true })),
    ]);
    setPendingEntities([]);

    addAssistantMessage(
      `Saved. Keep going - tell me something else. The more you share, the better I can help.`
    );
  };

  const handleDone = () => {
    // Navigate to production mode or show completion
    navigate('/founder-os/dashboard');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gh-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gh-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Renubu</h1>
            <p className="text-sm text-gray-400">
              {mode === 'questions'
                ? isConsolidatedFormat
                  ? `Topic ${currentQuestionIndex + 1} of ${outstandingQuestions.length}`
                  : `Question ${currentQuestionIndex + 1} of ${outstandingQuestions.length}`
                : 'Building your world'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {extractedEntities.length > 0 && (
            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
              {extractedEntities.length} entities captured
            </span>
          )}
          <button
            onClick={handleDone}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Debug: show message count */}
        {console.log('[renubu-chat] Rendering messages:', messages.length, 'mode:', mode)}
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
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-gh-dark-700 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Entity preview */}
                {message.extractedEntities && message.extractedEntities.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex flex-wrap gap-2">
                      {message.extractedEntities.map((entity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gh-dark-600 rounded text-sm text-gray-300"
                        >
                          {entity.type}: {entity.name}
                        </span>
                      ))}
                    </div>
                    {pendingEntities.length > 0 && (
                      <button
                        onClick={handleConfirmEntities}
                        className="mt-2 px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm hover:bg-green-600/30 transition-colors"
                      >
                        Confirm these
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gh-dark-700 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Initial choice buttons */}
      {mode === 'initial' && messages.length === 1 && outstandingQuestions.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setMessages((prev) => [
                  ...prev,
                  { role: 'user', content: 'Cover them now', timestamp: new Date().toISOString() },
                ]);
                handleInitialResponse('cover now');
              }}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              Cover Now
            </button>
            <button
              onClick={() => {
                setMessages((prev) => [
                  ...prev,
                  { role: 'user', content: 'Get started', timestamp: new Date().toISOString() },
                ]);
                handleInitialResponse('get started');
              }}
              className="flex-1 px-4 py-3 bg-gh-dark-700 hover:bg-gh-dark-600 text-white rounded-xl transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-gh-dark-700">
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 bg-gh-dark-700 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
