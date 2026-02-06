/**
 * Tutorial API Client
 *
 * API methods for the tutorial chat flow.
 */

import { post } from './client';
import { streamingFetch, type StreamingCallbacks, type StreamingRequestOptions } from './streaming';
import type { Message, ExecutiveReport, TutorialProgress } from '../types';

// =============================================================================
// REQUEST TYPES
// =============================================================================

export interface TutorialChatRequest {
  message: string;
  conversation_history: Array<{ role: string; content: string }>;
  session_id: string;
  progress: TutorialProgress;
  action: 'init' | 'message' | 'persist_report';
  pending_report?: ExecutiveReport;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface TutorialChatResponse {
  content: string;
  progress?: TutorialProgress;
  report?: ExecutiveReport;
  questions?: Array<{
    id: string;
    title: string;
    prompt: string;
    category: string;
  }>;
  currentQuestion?: {
    id: string;
    title: string;
    prompt: string;
  };
  action?: string;
  character?: {
    race: string;
    characterClass: string;
    alignment: string;
    title?: string;
    attributes?: Record<string, number>;
  };
}

// =============================================================================
// API METHODS
// =============================================================================

/**
 * Initialize tutorial or send a message
 */
export async function sendTutorialChat(
  request: TutorialChatRequest,
  token?: string | null
): Promise<TutorialChatResponse> {
  return post<TutorialChatResponse>('/api/tutorial/chat', request, token);
}

/**
 * Initialize tutorial step
 */
export async function initializeTutorial(
  sessionId: string,
  progress: TutorialProgress,
  token?: string | null
): Promise<TutorialChatResponse> {
  return sendTutorialChat(
    {
      message: '',
      conversation_history: [],
      session_id: sessionId,
      progress,
      action: 'init',
    },
    token
  );
}

/**
 * Send a chat message in tutorial
 */
export async function sendTutorialMessage(
  sessionId: string,
  message: string,
  messages: Message[],
  progress: TutorialProgress,
  token?: string | null
): Promise<TutorialChatResponse> {
  return sendTutorialChat(
    {
      message,
      conversation_history: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      session_id: sessionId,
      progress,
      action: 'message',
    },
    token
  );
}

/**
 * Persist confirmed report to database
 */
export async function persistReport(
  sessionId: string,
  report: ExecutiveReport,
  progress: TutorialProgress,
  token?: string | null
): Promise<TutorialChatResponse> {
  return sendTutorialChat(
    {
      message: '',
      conversation_history: [],
      session_id: sessionId,
      progress,
      action: 'persist_report',
      pending_report: report,
    },
    token
  );
}

// =============================================================================
// STREAMING API METHODS
// =============================================================================

export interface TutorialStreamingCallbacks extends StreamingCallbacks {
  /** Called when streaming completes with parsed response data */
  onResponse?: (response: TutorialChatResponse) => void;
}

/**
 * Send a chat message in tutorial with SSE streaming
 *
 * @param sessionId - Session ID
 * @param message - User message
 * @param messages - Conversation history
 * @param progress - Tutorial progress
 * @param callbacks - Streaming callbacks
 * @param options - Request options including token
 */
export async function sendTutorialMessageStreaming(
  sessionId: string,
  message: string,
  messages: Message[],
  progress: TutorialProgress,
  callbacks: TutorialStreamingCallbacks,
  options?: StreamingRequestOptions & { token?: string | null }
): Promise<void> {
  const result = await streamingFetch(
    '/api/tutorial/chat/stream',
    {
      message,
      conversation_history: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      session_id: sessionId,
      progress,
    },
    {
      onToken: callbacks.onToken,
      onError: callbacks.onError,
      onStart: callbacks.onStart,
      onComplete: (event) => {
        callbacks.onComplete?.(event);

        // Parse metadata into TutorialChatResponse
        const metadata = event.metadata || {};
        const response: TutorialChatResponse = {
          content: event.content,
          action: metadata.action as string | undefined,
          progress: metadata.progress as TutorialProgress | undefined,
          questions: metadata.questions as TutorialChatResponse['questions'],
          report: metadata.report as ExecutiveReport | undefined,
          currentQuestion: metadata.currentQuestion as TutorialChatResponse['currentQuestion'],
        };

        callbacks.onResponse?.(response);
      },
    },
    { token: options?.token, signal: options?.signal, timeout: options?.timeout }
  );

  if (!result && !callbacks.onError) {
    console.warn('[tutorial] Streaming completed without result');
  }
}

// =============================================================================
// TOOLS TESTING API METHODS
// =============================================================================

export interface ExtractedPerson {
  name: string;
  relationship_type?: string;
  context: string;
  confidence: number;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  due_date?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  context_tags: string[];
}

export interface ExtractedProject {
  name: string;
  description: string;
  status: string;
}

export interface ExtractedGoal {
  title: string;
  timeframe?: string;
}

export interface ExtractedParkingLot {
  raw_input: string;
  cleaned_text: string;
  capture_mode: 'project' | 'brainstorm' | 'expand' | 'passive';
}

export interface ExtractBrainDumpResponse {
  people: ExtractedPerson[];
  tasks: ExtractedTask[];
  projects: ExtractedProject[];
  goals: ExtractedGoal[];
  parking_lot: ExtractedParkingLot[];
  summary: string;
}

export interface PopulateEntitiesResponse {
  tasks_created: number;
  relationships_created: number;
  projects_added: number;
  goals_added: number;
  parking_lot_items: number;
  entity_ids: string[];
}

export interface VerifyToolsSetupResponse {
  tasks: { count: number; urgent: unknown[]; preview: unknown[] };
  relationships: { count: number; names: string[] };
  parking_lot: { count: number; items: string[] };
  work_context: { projects: string[]; goals: string[] };
}

/**
 * Extract entities from a brain dump text
 */
export async function extractBrainDump(
  brainDump: string,
  sessionId: string,
  userId: string,
  commandments?: Record<string, string>
): Promise<ExtractBrainDumpResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/tutorial/tools-testing/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brain_dump: brainDump,
      session_id: sessionId,
      user_id: userId,
      commandments,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Extraction failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Populate database with confirmed entities
 */
export async function populateEntities(
  entities: {
    people: ExtractedPerson[];
    tasks: ExtractedTask[];
    projects: ExtractedProject[];
    goals: ExtractedGoal[];
    parking_lot: ExtractedParkingLot[];
  },
  sessionId: string,
  userId: string
): Promise<PopulateEntitiesResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/tutorial/tools-testing/populate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entities,
      session_id: sessionId,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Population failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Verify tools setup and get dashboard data
 */
export async function verifyToolsSetup(
  sessionId: string,
  userId: string
): Promise<VerifyToolsSetupResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const response = await fetch(
    `${baseUrl}/api/tutorial/tools-testing/verify?session_id=${sessionId}&user_id=${userId}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Verification failed: ${response.status}`);
  }

  return response.json();
}
