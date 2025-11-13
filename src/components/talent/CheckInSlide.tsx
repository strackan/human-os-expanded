/**
 * Check-In Slide Component
 *
 * Lightweight UI for conducting 5-10 minute check-in conversations
 * with returning candidates. Shows their history and captures updates.
 *
 * Release 1.6: Return Visit System - Phase 2
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SessionTimeline } from './SessionTimeline';
import { getCheckInOpeningMessage } from '@/lib/prompts/checkInPrompts';
import type { IntelligenceFile, InterviewMessage } from '@/types/talent';

interface CheckInSlideProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  intelligenceFile: IntelligenceFile;
  onComplete: (transcript: InterviewMessage[], updates: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function CheckInSlide(props: CheckInSlideProps) {
  const { candidateName, intelligenceFile, onComplete, onCancel } = props;
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate days since last contact
  const daysSinceLastContact = Math.floor(
    (Date.now() - new Date(intelligenceFile.last_contact).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Initialize with opening message
  useEffect(() => {
    const openingMessage = getCheckInOpeningMessage({
      candidateName: candidateName.split(' ')[0], // First name only
      lastSessionDate: intelligenceFile.last_contact,
      daysSinceLastContact,
      relationshipStrength: intelligenceFile.relationship_strength,
      intelligenceFile,
      sessionNumber: intelligenceFile.total_sessions + 1,
    });

    setMessages([
      {
        role: 'assistant',
        content: openingMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
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
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual Claude API call
      // For now, simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const aiResponse: InterviewMessage = {
        role: 'assistant',
        content: generateMockResponse(userMessage.content, messages.length),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    // Extract updates from conversation
    const updates = {
      session_type: 'check_in',
      duration_minutes: Math.floor((Date.now() - new Date(messages[0].timestamp).getTime()) / (1000 * 60)),
      sentiment: 'content', // TODO: Detect from conversation
    };

    onComplete(messages, updates);
  };

  // Mock response generator (replace with Claude API)
  function generateMockResponse(userInput: string, messageCount: number): string {
    if (messageCount < 3) {
      return "That's really interesting! Tell me more about that.";
    }
    if (messageCount < 5) {
      return "Thanks for sharing that update. Any other big changes since we last talked?";
    }
    return "This has been a great catch-up! I really appreciate you taking the time to stay in touch. I'll keep you on my radar and reach out when something interesting comes up. Feel free to ping me anytime things change on your end.";
  }

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
