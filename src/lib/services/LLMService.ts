/**
 * LLM Service
 *
 * Handles LLM response generation with Ollama + Mock fallback
 * - Calls Ollama API when enabled (localhost:11434)
 * - Falls back to mock responses on error/timeout
 * - Consistent API contract regardless of source
 */

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  content: string;
  messageType: string;
  metadata?: any;
  tokensUsed?: number;
  source: 'ollama' | 'mock';
}

interface CustomerContext {
  customerId?: string;
  domain?: string;
  arr?: number;
  renewalDate?: string;
  daysUntilRenewal?: number;
  renewalStage?: string;
  accountPlan?: string;
}

export class LLMService {
  private static useOllama = process.env.NEXT_PUBLIC_USE_OLLAMA === 'true';
  private static ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama3.1:8b';
  private static ollamaTimeout = parseInt(process.env.NEXT_PUBLIC_OLLAMA_TIMEOUT || '10000');
  private static ollamaUrl = 'http://localhost:11434/api/chat';

  /**
   * Generate LLM response
   * Tries Ollama first (if enabled), falls back to mock on error
   */
  static async generateResponse(
    messages: Message[],
    context?: CustomerContext
  ): Promise<LLMResponse> {
    // Try Ollama if enabled
    if (this.useOllama) {
      try {
        console.log('[LLMService] Attempting Ollama API call...');
        const response = await this.callOllama(messages, context);
        console.log('[LLMService] Ollama response successful');
        return response;
      } catch (error) {
        console.warn('[LLMService] Ollama failed, falling back to mock:', error instanceof Error ? error.message : error);
        // Fall through to mock
      }
    }

    // Use mock responses
    const userMessage = messages[messages.length - 1]?.content || '';
    return this.generateMockResponse(userMessage);
  }

  /**
   * Call Ollama API
   */
  private static async callOllama(
    messages: Message[],
    context?: CustomerContext
  ): Promise<LLMResponse> {
    // Build messages array with context-enhanced system message
    const systemMessage = this.buildSystemMessage(context);
    const ollamaMessages = [
      { role: 'system', content: systemMessage },
      ...messages.filter(m => m.role !== 'system') // Remove any existing system messages
    ];

    // Call Ollama with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.ollamaTimeout);

    try {
      const response = await fetch(this.ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.ollamaModel,
          messages: ollamaMessages,
          stream: false, // Non-streaming for simplicity
          options: {
            temperature: 0.7,
            top_p: 0.9,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract response from Ollama format
      const content = data.message?.content || data.response || '';

      return {
        content,
        messageType: 'text',
        tokensUsed: data.eval_count || undefined,
        source: 'ollama'
      };

    } catch (error) {
      clearTimeout(timeoutId);

      // Check if error is timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama request timed out');
      }

      throw error;
    }
  }

  /**
   * Build system message with customer context
   */
  private static buildSystemMessage(context?: CustomerContext): string {
    let baseMessage = 'You are a helpful AI assistant helping a Customer Success Manager with renewal workflows. You have access to customer data and can answer questions, generate insights, and provide recommendations.';

    if (context) {
      baseMessage += '\n\nCurrent Customer Context:';

      if (context.domain) {
        baseMessage += `\n- Company: ${context.domain}`;
      }
      if (context.arr) {
        baseMessage += `\n- ARR: $${context.arr.toLocaleString()}`;
      }
      if (context.renewalDate) {
        baseMessage += `\n- Renewal Date: ${context.renewalDate}`;
      }
      if (context.daysUntilRenewal !== undefined) {
        baseMessage += `\n- Days Until Renewal: ${context.daysUntilRenewal}`;
      }
      if (context.renewalStage) {
        baseMessage += `\n- Renewal Stage: ${context.renewalStage}`;
      }
      if (context.accountPlan) {
        baseMessage += `\n- Account Plan: ${context.accountPlan}`;
      }

      baseMessage += '\n\nUse this context to provide personalized, relevant responses.';
    }

    return baseMessage;
  }

  /**
   * Generate mock response (fallback)
   * Same logic as before, keyword-based responses
   */
  private static generateMockResponse(userMessage: string): LLMResponse {
    const lowerMessage = userMessage.toLowerCase();

    // ROI question
    if (lowerMessage.includes('roi') || lowerMessage.includes('return on investment')) {
      return {
        content: "Based on the customer's usage data, I can provide an ROI analysis:\n\n1. **Current ARR**: $150,000\n2. **Usage Metrics**: 85% seat utilization, 12 active integrations\n3. **Estimated ROI**: 3.2x based on time saved and automation value\n\nWould you like me to generate a detailed ROI report or breakdown by department?",
        messageType: 'text',
        tokensUsed: 85,
        source: 'mock'
      };
    }

    // Chart request
    if (lowerMessage.includes('chart') || lowerMessage.includes('graph') || lowerMessage.includes('trend')) {
      return {
        content: "Here's a chart showing the renewal trend over the past 6 months:",
        messageType: 'chart',
        metadata: {
          chartType: 'line',
          chartData: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Renewal Rate',
                data: [92, 94, 91, 95, 93, 96],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)'
              }
            ]
          },
          chartOptions: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Renewal Rate Trend'
              }
            }
          }
        },
        tokensUsed: 50,
        source: 'mock'
      };
    }

    // Table request
    if (lowerMessage.includes('history') || lowerMessage.includes('table') || lowerMessage.includes('list')) {
      return {
        content: "Here's the renewal history for this customer:",
        messageType: 'table',
        metadata: {
          columns: ['Date', 'ARR', 'Status', 'Days to Close', 'CSM'],
          rows: [
            ['2024-12-01', '$100,000', 'Completed', '5', 'Sarah Johnson'],
            ['2023-12-01', '$85,000', 'Completed', '12', 'Mike Chen'],
            ['2022-12-01', '$75,000', 'Completed', '8', 'Mike Chen'],
            ['2021-12-01', '$60,000', 'Completed', '15', 'Emily Rodriguez']
          ]
        },
        tokensUsed: 60,
        source: 'mock'
      };
    }

    // Health score
    if (lowerMessage.includes('health') || lowerMessage.includes('score')) {
      return {
        content: "**Customer Health Score: 78/100** 🟢\n\n**Breakdown:**\n- Product Usage: 85/100\n- Support Satisfaction: 90/100\n- Engagement: 70/100\n- Payment History: 100/100\n\n**Recommendation**: Customer is healthy with strong usage and satisfaction. Minor concern with engagement - consider scheduling QBR.",
        messageType: 'text',
        tokensUsed: 95,
        source: 'mock'
      };
    }

    // Recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggestion') || lowerMessage.includes('next step')) {
      return {
        content: "**Recommended Next Steps:**\n\n1. ✅ **Schedule QBR** - Last QBR was 45 days ago\n2. 📊 **Share Usage Report** - Show 85% seat utilization\n3. 💡 **Identify Upsell** - Only using 3 of 7 available features\n4. 🤝 **Introduction to Success Team** - New POC started last week\n\nWould you like me to draft an email for any of these?",
        messageType: 'text',
        tokensUsed: 110,
        source: 'mock'
      };
    }

    // Draft email
    if (lowerMessage.includes('draft') || lowerMessage.includes('email') || lowerMessage.includes('write')) {
      return {
        content: "**Email Draft:**\n\n**Subject:** Let's schedule our Q1 QBR - celebrating your success!\n\n**Body:**\nHi {{customer.primary_contact}},\n\nI hope this finds you well! I've been reviewing your team's usage of our platform and I'm impressed - you're at 85% seat utilization with 12 active integrations. That's phenomenal adoption!\n\nI'd love to schedule our quarterly business review to:\n- Celebrate your wins and ROI\n- Share some advanced features that could add even more value\n- Discuss your roadmap for 2025\n\nWould next Tuesday or Thursday work for a 30-minute call?\n\nBest,\n{{csm.name}}\n\n---\nWould you like me to adjust the tone or add anything?",
        messageType: 'text',
        tokensUsed: 150,
        source: 'mock'
      };
    }

    // Generic helpful response
    return {
      content: `I understand you're asking about "${userMessage}". I'm here to help with:\n\n- Customer data analysis\n- Renewal strategies\n- Email drafts\n- ROI calculations\n- Health scores\n- Usage trends\n\nHow can I assist you with this customer's renewal?`,
      messageType: 'text',
      tokensUsed: 45,
      source: 'mock'
    };
  }
}
