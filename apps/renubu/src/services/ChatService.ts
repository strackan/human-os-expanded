/**
 * Chat Service
 *
 * Provides chat functionality with real backend API integration.
 * Includes fallback to mock data if APIs are unavailable.
 *
 * Phase 2.2b: Real API Integration
 */

import { ChatBranch } from '@/components/workflows/BranchRenderer';
import { API_ROUTES } from '@/lib/constants/api-routes';

// Feature flag for mock mode (can be toggled for testing)
const USE_MOCK_MODE = process.env.NEXT_PUBLIC_CHAT_MOCK_MODE === 'true';

// =====================================================
// Types
// =====================================================

export interface ChatThread {
  id: string;
  workflow_execution_id: string;
  step_id: string;
  thread_type: 'llm' | 'rag';
  created_at: string;
  updated_at: string;
}

export interface ChatMessageData {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: any;
}

export interface SavedActionResult {
  success: boolean;
  message: string;
  action_type: string;
  metadata?: any;
}

// =====================================================
// Mock Data Generators
// =====================================================

/**
 * Generate mock branches for a given workflow step
 */
const generateMockBranches = (workflowId: string, stepId: string): ChatBranch[] => {
  // Different branches based on step ID
  const stepNumber = parseInt(stepId.replace('step-', '')) || 1;

  const commonBranches: ChatBranch[] = [
    {
      branch_id: 'ask-question',
      branch_label: 'Ask a question',
      branch_type: 'llm',
      allow_off_script: true,
      return_to_step: stepId
    }
  ];

  if (stepNumber === 1) {
    return [
      {
        branch_id: 'proceed',
        branch_label: "Let's do it",
        branch_type: 'fixed',
        response_text: "Great! Let's proceed with this step.",
        next_step_id: 'step-2'
      },
      {
        branch_id: 'need-info',
        branch_label: 'I need more information',
        branch_type: 'fixed',
        response_text: "No problem. Let me gather additional context for you.",
        next_step_id: 'step-1' // Stay on same step
      },
      ...commonBranches,
      {
        branch_id: 'snooze',
        branch_label: 'Snooze 7 days',
        branch_type: 'saved_action',
        saved_action_id: 'snooze-7-days',
        response_text: 'Workflow snoozed for 7 days. You will receive a reminder.'
      }
    ];
  }

  if (stepNumber === 2) {
    return [
      {
        branch_id: 'continue',
        branch_label: 'Continue to next step',
        branch_type: 'fixed',
        response_text: "Moving forward!",
        next_step_id: 'step-3'
      },
      {
        branch_id: 'go-back',
        branch_label: 'Go back to previous step',
        branch_type: 'fixed',
        response_text: "Going back to review.",
        next_step_id: 'step-1'
      },
      ...commonBranches,
      {
        branch_id: 'escalate',
        branch_label: 'Escalate to manager',
        branch_type: 'saved_action',
        saved_action_id: 'escalate-to-manager',
        response_text: 'Escalation request sent to your manager.'
      }
    ];
  }

  // Default branches for other steps
  return [
    {
      branch_id: 'proceed',
      branch_label: "Continue",
      branch_type: 'fixed',
      response_text: "Let's keep going!",
      next_step_id: `step-${stepNumber + 1}`
    },
    ...commonBranches,
    {
      branch_id: 'skip',
      branch_label: 'Skip this step',
      branch_type: 'saved_action',
      saved_action_id: 'skip-step',
      response_text: 'Step skipped. Moving to next step.',
      next_step_id: `step-${stepNumber + 1}`
    }
  ];
};

/**
 * Generate mock AI response based on user input
 */
const generateMockAIResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  // Pattern-based responses
  if (lowerMessage.includes('customer') || lowerMessage.includes('account')) {
    return "Based on the workflow context, this customer has an ARR of $250K and their renewal is coming up in 45 days. Their health score is 72%, which indicates they're generally healthy but could use some attention. Would you like me to pull up their recent activity or usage metrics?";
  }

  if (lowerMessage.includes('next step') || lowerMessage.includes('what should')) {
    return "The next recommended step is to review the customer's usage metrics and identify any potential concerns. Based on their current health score, I'd suggest scheduling a check-in call within the next week.";
  }

  if (lowerMessage.includes('risk') || lowerMessage.includes('concern')) {
    return "Looking at the data, the main risk factors are: 1) Declining product usage over the last 30 days (down 15%), 2) No executive sponsor engagement in 60 days, and 3) Contract renewal in 45 days. I recommend prioritizing executive alignment.";
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return "I can help you with various aspects of this workflow:\n\n- Explain customer metrics and health scores\n- Suggest next best actions\n- Provide historical context\n- Search for similar renewal scenarios\n- Draft communication templates\n\nWhat would you like to know more about?";
  }

  if (lowerMessage.includes('email') || lowerMessage.includes('draft') || lowerMessage.includes('message')) {
    return "I can help you draft a message. Here's a suggested template:\n\n---\n\nHi [Customer Name],\n\nI wanted to reach out as your renewal date is approaching. I'd love to schedule a quick call to discuss how things are going and ensure we're delivering maximum value.\n\nWould next Tuesday or Thursday work for a 30-minute call?\n\nBest,\n[Your Name]\n\n---\n\nWould you like me to customize this further?";
  }

  // Default response
  return `I understand you're asking about "${userMessage}". In a production environment, I would use the full workflow context, customer history, and our knowledge base to provide a detailed answer. For now, this is a mock response demonstrating the chat functionality.`;
};

// =====================================================
// Mock API Functions
// =====================================================

/**
 * Fetch available branches for a workflow step
 * Real endpoint: GET /api/workflows/[workflowId]/branches?stepId={stepId}
 */
export const fetchBranches = async (
  workflowId: string,
  stepId: string
): Promise<ChatBranch[]> => {
  if (USE_MOCK_MODE) {
    // Mock mode
    await new Promise(resolve => setTimeout(resolve, 300));
    const branches = generateMockBranches(workflowId, stepId);
    console.log('[ChatService] fetchBranches (MOCK):', { workflowId, stepId, branches });
    return branches;
  }

  try {
    // Real API call
    const response = await fetch(API_ROUTES.WORKFLOWS.BRANCHES(workflowId, stepId));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch branches');
    }

    // Map API response to ChatBranch format
    const branches: ChatBranch[] = (data.branches || []).map((b: any) => ({
      branch_id: b.branchId,
      branch_label: b.branchLabel,
      branch_type: b.branchType,
      response_text: b.responseText,
      next_step_id: b.nextStepId,
      saved_action_id: b.savedActionId,
      return_to_step: b.returnToStep,
      llm_handler: b.llmHandler,
      allow_off_script: b.allowOffScript
    }));

    console.log('[ChatService] fetchBranches (API):', { workflowId, stepId, branches });
    return branches;
  } catch (error) {
    console.warn('[ChatService] fetchBranches API failed, using mock:', error);
    // Fallback to mock
    const branches = generateMockBranches(workflowId, stepId);
    return branches;
  }
};

/**
 * Create a new chat thread
 * Real endpoint: POST /api/workflows/chat/threads
 */
export const createThread = async (
  workflowExecutionId: string,
  stepId: string,
  threadType: 'llm' | 'rag' = 'llm'
): Promise<ChatThread> => {
  if (USE_MOCK_MODE) {
    // Mock mode
    await new Promise(resolve => setTimeout(resolve, 200));
    const thread: ChatThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflow_execution_id: workflowExecutionId,
      step_id: stepId,
      thread_type: threadType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('[ChatService] createThread (MOCK):', thread);
    return thread;
  }

  try {
    // Real API call
    const response = await fetch(API_ROUTES.WORKFLOWS.CHAT.THREADS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowExecutionId,
        stepId,
        threadType,
        returnToStep: stepId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create thread');
    }

    const thread: ChatThread = {
      id: data.thread.id,
      workflow_execution_id: data.thread.workflowExecutionId || workflowExecutionId,
      step_id: data.thread.stepId || stepId,
      thread_type: data.thread.threadType || threadType,
      created_at: data.thread.startedAt || new Date().toISOString(),
      updated_at: data.thread.startedAt || new Date().toISOString()
    };

    console.log('[ChatService] createThread (API):', thread);
    return thread;
  } catch (error) {
    console.warn('[ChatService] createThread API failed, using mock:', error);
    // Fallback to mock
    const thread: ChatThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflow_execution_id: workflowExecutionId,
      step_id: stepId,
      thread_type: threadType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return thread;
  }
};

/**
 * Send a message to a chat thread and get AI response
 * Real endpoint: POST /api/workflows/chat/threads/[threadId]/messages
 */
export const sendMessage = async (
  threadId: string,
  content: string
): Promise<ChatMessageData> => {
  if (USE_MOCK_MODE) {
    // Mock mode
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    const aiResponse = generateMockAIResponse(content);
    const message: ChatMessageData = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      thread_id: threadId,
      role: 'assistant',
      content: aiResponse,
      created_at: new Date().toISOString()
    };
    console.log('[ChatService] sendMessage (MOCK):', { threadId, userContent: content, aiResponse: message });
    return message;
  }

  try {
    // Real API call
    const response = await fetch(API_ROUTES.WORKFLOWS.CHAT.MESSAGES(threadId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to send message');
    }

    // Return the assistant's response
    const message: ChatMessageData = {
      id: data.assistantMessage.id,
      thread_id: threadId,
      role: 'assistant',
      content: data.assistantMessage.content,
      created_at: data.assistantMessage.createdAt,
      metadata: data.assistantMessage.metadata
    };

    console.log('[ChatService] sendMessage (API):', { threadId, userContent: content, aiResponse: message });
    return message;
  } catch (error) {
    console.warn('[ChatService] sendMessage API failed, using mock:', error);
    // Fallback to mock
    const aiResponse = generateMockAIResponse(content);
    const message: ChatMessageData = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      thread_id: threadId,
      role: 'assistant',
      content: aiResponse,
      created_at: new Date().toISOString()
    };
    return message;
  }
};

/**
 * Execute a saved action
 * Real endpoint: POST /api/workflows/actions/execute
 */
export const executeAction = async (
  actionId: string,
  executionId: string
): Promise<SavedActionResult> => {
  if (USE_MOCK_MODE) {
    // Mock mode
    await new Promise(resolve => setTimeout(resolve, 500));
    let result: SavedActionResult;

    // Mock different action types
    if (actionId.includes('snooze')) {
      const days = actionId.includes('7') ? 7 : actionId.includes('14') ? 14 : 30;
      result = {
        success: true,
        message: `Workflow snoozed for ${days} days. You will receive a reminder.`,
        action_type: 'snooze',
        metadata: {
          snooze_days: days,
          reminder_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    } else if (actionId.includes('escalate')) {
      result = {
        success: true,
        message: 'Escalation request sent to your manager. They will be notified via email.',
        action_type: 'escalate',
        metadata: {
          escalated_to: 'manager',
          notification_sent: true
        }
      };
    } else if (actionId.includes('skip')) {
      result = {
        success: true,
        message: 'Step skipped. Moving to next step in workflow.',
        action_type: 'skip',
        metadata: {
          skipped_step: true
        }
      };
    } else {
      result = {
        success: true,
        message: 'Action executed successfully.',
        action_type: 'generic',
        metadata: {}
      };
    }
    console.log('[ChatService] executeAction (MOCK):', { actionId, executionId, result });
    return result;
  }

  try {
    // Real API call
    const response = await fetch(API_ROUTES.WORKFLOWS.ACTIONS.EXECUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionId,
        workflowExecutionId: executionId,
        params: {}
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to execute action');
    }

    const result: SavedActionResult = {
      success: data.result.success,
      message: data.result.message,
      action_type: data.action.actionType || 'unknown',
      metadata: data.result.data || {}
    };

    console.log('[ChatService] executeAction (API):', { actionId, executionId, result });
    return result;
  } catch (error) {
    console.warn('[ChatService] executeAction API failed, using mock:', error);
    // Fallback to mock
    const result: SavedActionResult = {
      success: true,
      message: 'Action executed successfully (mock fallback).',
      action_type: 'generic',
      metadata: {}
    };
    return result;
  }
};

/**
 * Get chat history for a thread
 * Real endpoint: GET /api/workflows/chat/threads/[threadId]/messages
 */
export const getChatHistory = async (
  threadId: string
): Promise<ChatMessageData[]> => {
  if (USE_MOCK_MODE) {
    // Mock mode
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('[ChatService] getChatHistory (MOCK):', { threadId, messages: [] });
    return [];
  }

  try {
    // Real API call
    const response = await fetch(API_ROUTES.WORKFLOWS.CHAT.MESSAGES(threadId));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch chat history');
    }

    const messages: ChatMessageData[] = (data.messages || []).map((m: any) => ({
      id: m.id,
      thread_id: threadId,
      role: m.role,
      content: m.content,
      created_at: m.createdAt,
      metadata: m.metadata
    }));

    console.log('[ChatService] getChatHistory (API):', { threadId, messages });
    return messages;
  } catch (error) {
    console.warn('[ChatService] getChatHistory API failed, returning empty:', error);
    return [];
  }
};

// =====================================================
// Utility Functions
// =====================================================

/**
 * Check if ChatService is using mock data
 */
export const isMockMode = (): boolean => {
  return USE_MOCK_MODE;
};

/**
 * Get API status for debugging
 */
export const getAPIStatus = () => {
  return {
    mode: USE_MOCK_MODE ? 'mock' : 'production',
    availableEndpoints: [
      'fetchBranches',
      'createThread',
      'sendMessage',
      'executeAction',
      'getChatHistory'
    ],
    readyForProduction: !USE_MOCK_MODE,
    phase: USE_MOCK_MODE ? '2.2a - Mock Implementation' : '2.2b - Real API Integration',
    endpoints: {
      branches: '/api/workflows/[workflowId]/branches?stepId={stepId}',
      threads: '/api/workflows/chat/threads',
      messages: '/api/workflows/chat/threads/[threadId]/messages',
      actions: '/api/workflows/actions/execute'
    }
  };
};
