/**
 * Check-In Slide Component
 *
 * Lightweight UI for conducting 5-10 minute check-in conversations
 * with returning candidates. Shows their history and captures updates.
 *
 * Release 1.6: Return Visit System - Phase 2
 * Updated: Now uses LLM-powered responses via /api/talent/chat
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SessionTimeline } from './SessionTimeline';
import type { IntelligenceFile, InterviewMessage } from '@/types/talent';

/**
 * Fetch LLM response from talent chat API
 */
async function fetchTalentChat(params: {
  action: 'opening' | 'respond';
  candidateId: string;
  candidateName: string;
  intelligenceFile: IntelligenceFile;
  sessionType?: 'initial' | 'check_in' | 'deep_dive';
  conversationHistory?: InterviewMessage[];
  userMessage?: string;
}): Promise<{
  text: string;
  tokensUsed: number;
  sentiment?: string;
  cached?: boolean;
}> {
  const response = await fetch('/api/talent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Talent chat API failed: ${response.status}`);
  }

  return response.json();
}

interface CheckInSlideProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  intelligenceFile: IntelligenceFile;
  onComplete: (transcript: InterviewMessage[], updates: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function CheckInSlide(props: CheckInSlideProps) {
  const { candidateId, candidateName, intelligenceFile, onComplete, onCancel } = props;
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [detectedSentiment, setDetectedSentiment] = useState<string>('content');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate days since last contact
  const daysSinceLastContact = Math.floor(
    (Date.now() - new Date(intelligenceFile.last_contact).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Initialize with LLM-generated opening message
  useEffect(() => {
    const fetchOpening = async () => {
      setIsLoading(true);
      try {
        const result = await fetchTalentChat({
          action: 'opening',
          candidateId,
          candidateName,
          intelligenceFile,
          sessionType: 'check_in',
        });

        setMessages([
          {
            role: 'assistant',
            content: result.text,
            timestamp: new Date().toISOString(),
          },
        ]);
        setTotalTokensUsed(result.tokensUsed);
      } catch (error) {
        console.error('[CheckInSlide] Error fetching opening:', error);
        // Fallback to a simple greeting
        setMessages([
          {
            role: 'assistant',
            content: `Hey ${candidateName.split(' ')[0]}! Great to catch up again. What's been happening since we last talked?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: InterviewMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = currentMessage;
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Call the talent chat API for LLM response
      const result = await fetchTalentChat({
        action: 'respond',
        candidateId,
        candidateName,
        intelligenceFile,
        sessionType: 'check_in',
        conversationHistory: [...messages, userMessage],
        userMessage: messageText,
      });

      const aiResponse: InterviewMessage = {
        role: 'assistant',
        content: result.text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setTotalTokensUsed((prev) => prev + result.tokensUsed);
      if (result.sentiment) {
        setDetectedSentiment(result.sentiment);
      }
    } catch (error) {
      console.error('[CheckInSlide] Error generating response:', error);
      // Fallback response on error
      const fallbackResponse: InterviewMessage = {
        role: 'assistant',
        content: "That's really interesting! Tell me more about that.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    // Extract updates from conversation with LLM-detected sentiment
    const updates = {
      session_type: 'check_in',
      duration_minutes: Math.floor((Date.now() - new Date(messages[0]?.timestamp || Date.now()).getTime()) / (1000 * 60)),
      sentiment: detectedSentiment,
      tokens_used: totalTokensUsed,
    };

    onComplete(messages, updates);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Check-in: {candidateName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {intelligenceFile.relationship_strength === 'hot' && '🔥 '}
              {intelligenceFile.relationship_strength === 'warm' && '☀️ '}
              {intelligenceFile.relationship_strength === 'cold' && '❄️ '}
              Session #{intelligenceFile.total_sessions + 1} • {daysSinceLastContact} days since last contact
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              {showTimeline ? 'Hide' : 'Show'} Timeline
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${showTimeline ? 'border-r border-gray-200' : ''}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your response..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>

            {messages.length >= 6 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Complete Check-in
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Sidebar */}
        {showTimeline && (
          <div className="w-96 bg-gray-50 overflow-y-auto p-6">
            <SessionTimeline
              sessions={intelligenceFile.session_timeline}
              relationshipStrength={intelligenceFile.relationship_strength}
              candidateName={candidateName}
            />

            {/* Quick Context */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Quick Context</h4>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Current Role:</dt>
                  <dd className="text-gray-900 font-medium">{intelligenceFile.current_role}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Company:</dt>
                  <dd className="text-gray-900 font-medium">{intelligenceFile.company}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Seeking:</dt>
                  <dd className="text-gray-900 font-medium">{intelligenceFile.current_motivation.seeking}</dd>
                </div>
                {intelligenceFile.life_context.family && intelligenceFile.life_context.family.length > 0 && (
                  <div>
                    <dt className="text-gray-600">Family:</dt>
                    <dd className="text-gray-900 font-medium">
                      {intelligenceFile.life_context.family.join(', ')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
