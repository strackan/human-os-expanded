/**
 * Renubu Chat Route
 *
 * Post-Sculptor chat workflow with Setup Mode:
 * - Collapsible sidebar with setup checklist
 * - Chat panel for conversation
 * - Artifact canvas for generated content
 *
 * NPC mirrors user's personality fingerprint.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { SetupSidebar, type ChecklistItem } from '@/components/setup-mode/SetupSidebar';
import {
  ArtifactCanvas,
  type ArtifactInstance,
} from '@/components/artifacts';
import { PersonaCardArtifact } from '@/components/artifacts/PersonaCardArtifact';

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

  // Setup Mode state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [artifactPanelCollapsed, setArtifactPanelCollapsed] = useState(true);
  const [artifacts, setArtifacts] = useState<ArtifactInstance[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | undefined>();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'sculptor',
      label: 'Sculptor Session',
      description: 'Identity clarification',
      required: true,
      status: 'completed', // Already done if we're here
    },
    {
      id: 'questions',
      label: 'Assessment',
      description: '5 key topics',
      required: true,
      status: 'pending',
    },
    {
      id: 'persona',
      label: 'Persona Profile',
      description: 'Personality matrix',
      required: false,
      status: 'pending',
      artifacts: ['persona-card'],
    },
    {
      id: 'entities',
      label: 'Core Entities',
      description: 'People & projects',
      required: false,
      status: 'pending',
    },
    {
      id: 'contexts',
      label: 'Contexts',
      description: 'Work domains',
      required: false,
      status: 'locked',
    },
  ]);
  const [currentChecklistItem, setCurrentChecklistItem] = useState<string>('questions');

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

  // Track accumulated answers for the current question (for multi-turn conversations)
  const [currentQuestionAnswers, setCurrentQuestionAnswers] = useState<string[]>([]);

  const callRenubuChat = async (
    userMessage: string,
    chatMode: 'questions' | 'context',
    currentQuestion?: QuestionOrPrompt
  ): Promise<{ content: string; next_action: string }> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';

    const response = await fetch(`${baseUrl}/api/renubu/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: userMessage,
        conversation_history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        mode: chatMode,
        current_question: currentQuestion
          ? {
              id: isConsolidatedPrompt(currentQuestion) ? currentQuestion.id : currentQuestion.slug,
              title: isConsolidatedPrompt(currentQuestion) ? currentQuestion.title : undefined,
              prompt: isConsolidatedPrompt(currentQuestion) ? currentQuestion.prompt : undefined,
              text: !isConsolidatedPrompt(currentQuestion) ? currentQuestion.text : undefined,
              slug: !isConsolidatedPrompt(currentQuestion) ? currentQuestion.slug : undefined,
            }
          : undefined,
        persona_fingerprint: personaFingerprint,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get chat response');
    }

    return response.json();
  };

  const handleQuestionResponse = async (message: string) => {
    const current = outstandingQuestions[currentQuestionIndex];

    try {
      // Call LLM for conversational response
      const chatResponse = await callRenubuChat(message, 'questions', current);

      // Track this answer
      setCurrentQuestionAnswers((prev) => [...prev, message]);

      // Check if LLM wants to move to next question
      if (chatResponse.next_action === 'next_question') {
        // Save the accumulated answers for this question
        const questionId = isConsolidatedPrompt(current) ? current.id : current.slug;
        const combinedAnswer = [...currentQuestionAnswers, message].join('\n\n');

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
                answer: combinedAnswer,
                ...(isConsolidatedPrompt(current)
                  ? {
                      covers: current.covers,
                      maps_to: current.maps_to,
                    }
                  : {}),
              }),
            });
            console.log('[renubu-chat] Saved answer for:', questionId);
          } catch (error) {
            console.error('[renubu-chat] Failed to save answer:', error);
          }
        }

        // Clear accumulated answers for next question
        setCurrentQuestionAnswers([]);

        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex < outstandingQuestions.length) {
          // Move to next question - add LLM response, then show next question
          setCurrentQuestionIndex(nextIndex);
          const next = outstandingQuestions[nextIndex];

          if (isConsolidatedPrompt(next)) {
            addAssistantMessage(`${chatResponse.content}\n\n**${next.title}**\n\n${next.prompt}`);
          } else {
            addAssistantMessage(`${chatResponse.content}\n\n**${next.text}**`);
          }
        } else {
          // All questions done - transition to context mode
          setMode('context');
          addAssistantMessage(
            `${chatResponse.content}\n\nLet's start building out your world. What's on your mind right now?`
          );
        }
      } else {
        // Continue conversation on current question
        addAssistantMessage(chatResponse.content);
      }
    } catch (error) {
      console.error('[renubu-chat] Error in question response:', error);
      // Fallback: just acknowledge and move on
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < outstandingQuestions.length) {
        setCurrentQuestionIndex(nextIndex);
        const next = outstandingQuestions[nextIndex];
        if (isConsolidatedPrompt(next)) {
          addAssistantMessage(`Got it.\n\n**${next.title}**\n\n${next.prompt}`);
        } else {
          addAssistantMessage(`Got it. Next question:\n\n**${next.text}**`);
        }
      } else {
        setMode('context');
        addAssistantMessage(
          `That's all of them! Let's start building out your world. What's on your mind?`
        );
      }
    }
  };

  const handleContextResponse = async (message: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';

    // Run LLM chat and extraction in parallel
    const [chatPromise, extractionPromise] = [
      callRenubuChat(message, 'context').catch((e) => {
        console.error('[renubu-chat] Chat error:', e);
        return null;
      }),
      fetch(`${baseUrl}/api/extraction/analyze`, {
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
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch((e) => {
          console.error('[renubu-chat] Extraction error:', e);
          return null;
        }),
    ];

    const [chatResponse, extractionData] = await Promise.all([chatPromise, extractionPromise]);

    // Get entities from extraction
    const entities = extractionData?.entities || [];

    // Build response
    let responseContent: string;

    if (chatResponse?.content) {
      // Use LLM response
      responseContent = chatResponse.content;
    } else {
      // Fallback if LLM failed
      responseContent = entities.length > 0
        ? `Here's what I captured:`
        : `Got it. Tell me more - what else is on your plate?`;
    }

    // If we have entities, show them
    if (entities.length > 0) {
      setPendingEntities(entities);
      const entityList = entities
        .map((e: ExtractedEntity) => `- **${e.type}**: ${e.name}`)
        .join('\n');
      addAssistantMessage(`${responseContent}\n\n${entityList}`, entities);
    } else {
      addAssistantMessage(responseContent);
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

  // Artifact handlers
  const handleArtifactSelect = useCallback((id: string) => {
    setActiveArtifactId(id);
    setArtifactPanelCollapsed(false);
  }, []);

  const handleArtifactClose = useCallback((id: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
    if (activeArtifactId === id) {
      setActiveArtifactId(artifacts.find((a) => a.id !== id)?.id);
    }
  }, [activeArtifactId, artifacts]);

  const handleArtifactConfirm = useCallback((id: string) => {
    setArtifacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'confirmed' as const } : a))
    );
  }, []);

  const renderArtifact = useCallback((artifact: ArtifactInstance) => {
    // For now, render PersonaCard directly
    if (artifact.type === 'persona') {
      return (
        <PersonaCardArtifact
          artifact={artifact}
          data={artifact.data as any}
          onConfirm={() => handleArtifactConfirm(artifact.id)}
        />
      );
    }
    // Fallback for unknown types
    return (
      <div className="p-4 text-gray-400">
        Unknown artifact type: {artifact.type}
      </div>
    );
  }, [handleArtifactConfirm]);

  // Checklist handlers
  const handleChecklistItemClick = useCallback((itemId: string) => {
    setCurrentChecklistItem(itemId);
    // Show related artifacts if any
    const item = checklistItems.find((i) => i.id === itemId);
    if (item?.artifacts?.length) {
      const relatedArtifact = artifacts.find((a) =>
        item.artifacts?.includes(a.id.replace('-artifact', ''))
      );
      if (relatedArtifact) {
        setActiveArtifactId(relatedArtifact.id);
        setArtifactPanelCollapsed(false);
      }
    }
  }, [checklistItems, artifacts]);

  const handleUnlockProduction = useCallback(() => {
    // Check if all required items are complete
    const allRequiredComplete = checklistItems
      .filter((i) => i.required)
      .every((i) => i.status === 'completed');

    if (allRequiredComplete) {
      navigate('/founder-os/dashboard');
    }
  }, [checklistItems, navigate]);

  const canUnlockProduction = checklistItems
    .filter((i) => i.required)
    .every((i) => i.status === 'completed');

  // Generate persona artifact when fingerprint is available
  useEffect(() => {
    if (personaFingerprint && !artifacts.find((a) => a.type === 'persona')) {
      const personaArtifact: ArtifactInstance = {
        id: 'persona-card-artifact',
        type: 'persona',
        title: 'Your Persona',
        data: {
          name: 'You',
          personality: personaFingerprint,
          summary: 'Generated from your Sculptor session',
        },
        status: 'draft',
        generatedAt: new Date().toISOString(),
        source: 'awaken',
        checklistItemId: 'persona',
      };
      setArtifacts((prev) => [...prev, personaArtifact]);
      setActiveArtifactId(personaArtifact.id);
      setArtifactPanelCollapsed(false);

      // Update checklist
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.id === 'persona' ? { ...item, status: 'in_progress' as const } : item
        )
      );
    }
  }, [personaFingerprint, artifacts]);

  // Update checklist based on mode progress
  useEffect(() => {
    if (mode === 'questions') {
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.id === 'questions' ? { ...item, status: 'in_progress' as const } : item
        )
      );
    } else if (mode === 'context' || mode === 'done') {
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.id === 'questions' ? { ...item, status: 'completed' as const } : item
        )
      );
    }
  }, [mode]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gh-dark-900">
      {/* Setup Sidebar */}
      <SetupSidebar
        items={checklistItems}
        currentItemId={currentChecklistItem}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onItemClick={handleChecklistItemClick}
        onUnlockProduction={handleUnlockProduction}
        canUnlock={canUnlockProduction}
      />

      {/* Main Content - Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
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
                {extractedEntities.length} entities
              </span>
            )}
            {artifacts.length > 0 && (
              <button
                onClick={() => setArtifactPanelCollapsed(!artifactPanelCollapsed)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  artifactPanelCollapsed
                    ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                    : 'bg-purple-600 text-white'
                }`}
              >
                {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {mode === 'questions' && outstandingQuestions.length > 0 && (
          <div className="px-6 py-2 border-b border-gh-dark-700 bg-gh-dark-800">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {currentQuestionIndex + 1}/{outstandingQuestions.length}
              </span>
              <div className="flex-1 h-1.5 bg-gh-dark-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / outstandingQuestions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

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
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-gh-dark-700 text-white'
                  }`}
                >
                  <div className={`whitespace-pre-wrap ${message.role === 'user' ? 'text-gray-900' : 'text-white'}`}>
                    {message.content}
                  </div>

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
        <div className="p-4 border-t border-gh-dark-700">
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

      {/* Artifact Canvas */}
      <ArtifactCanvas
        artifacts={artifacts}
        activeArtifactId={activeArtifactId}
        collapsed={artifactPanelCollapsed}
        onToggleCollapse={() => setArtifactPanelCollapsed(!artifactPanelCollapsed)}
        onArtifactSelect={handleArtifactSelect}
        onArtifactClose={handleArtifactClose}
        onArtifactConfirm={handleArtifactConfirm}
        renderArtifact={renderArtifact}
      />
    </div>
  );
}
