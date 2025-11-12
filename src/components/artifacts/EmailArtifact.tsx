'use client';

import React, { useState, useEffect } from 'react';
import { Send, Save, Sparkles } from 'lucide-react';
import { EmailTypeSelector } from '@/components/ui/EmailTypeSelector';
import type { EmailType, GenerateEmailResponse } from '@/types/email';

interface EmailArtifactProps {
  to: string;
  subject: string;
  body: string;
  onCompose: () => void;
  onBack?: () => void;
  sendButtonLabel?: string;
  cc?: string;
  attachments?: string[];
  customerId?: string; // For AI generation
  enableAIGeneration?: boolean; // Flag to enable AI features
}

export default function EmailArtifact({
  to,
  subject,
  body,
  onCompose,
  onBack,
  sendButtonLabel = 'Send',
  cc,
  attachments,
  customerId,
  enableAIGeneration = false,
}: EmailArtifactProps) {
  const [emailTo, setEmailTo] = useState(to);
  const [emailSubject, setEmailSubject] = useState(subject);
  const [emailBody, setEmailBody] = useState('');
  const [displayBody, setDisplayBody] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const [savedToDrafts, setSavedToDrafts] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // AI Generation state
  const [showEmailTypeSelector, setShowEmailTypeSelector] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Typing animation effect
  useEffect(() => {
    let index = 0;
    setDisplayBody('');
    setTypingComplete(false);

    const interval = setInterval(() => {
      if (index < body.length) {
        setDisplayBody(body.slice(0, index + 1));
        index++;
      } else {
        setTypingComplete(true);
        setEmailBody(body);
        clearInterval(interval);
      }
    }, 6); // Faster typing speed (~30% faster than 8ms)

    return () => clearInterval(interval);
  }, [body]);

  // Convert markdown-style formatting to HTML
  const formatTextToHTML = (text: string): string => {
    let formatted = text;

    // Replace template variables
    formatted = formatted.replace(/<User\.First>/g, 'Justin');

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert *italic* to <em> (but not ** which was already handled)
    formatted = formatted.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');

    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
  };

  const handleSaveToDrafts = () => {
    setSavedToDrafts(true);
    setTimeout(() => setSavedToDrafts(false), 2000);
    // In real implementation, this would save to backend
  };

  const handleSendClick = () => {
    if (!showConfirmation && !emailSent) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmSend = () => {
    setShowConfirmation(false);
    setEmailSent(true);
    setShowSuccessToast(true);

    // Hide toast and proceed after 2 seconds
    setTimeout(() => {
      setShowSuccessToast(false);
      if (onCompose) {
        onCompose();
      }
    }, 2000);
  };

  // Handle AI email generation
  const handleGenerateEmail = async (emailType: EmailType, customInstructions?: string) => {
    if (!customerId) {
      setGenerationError('Customer ID is required for AI generation');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setShowEmailTypeSelector(false);

    try {
      const response = await fetch('/api/workflows/email/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          emailType,
          customInstructions,
        }),
      });

      const data: GenerateEmailResponse = await response.json();

      if (!data.success || !data.email) {
        throw new Error(data.error || 'Failed to generate email');
      }

      // Set the generated email content
      setEmailSubject(data.email.subject);
      // The body will trigger typing animation via useEffect
      setEmailBody(data.email.body);
      setDisplayBody('');
      setTypingComplete(false);

      // Trigger typing animation manually
      let index = 0;
      const interval = setInterval(() => {
        if (index < data.email!.body.length) {
          setDisplayBody(data.email!.body.slice(0, index + 1));
          index++;
        } else {
          setTypingComplete(true);
          setEmailBody(data.email!.body);
          clearInterval(interval);
        }
      }, 6);

    } catch (error) {
      console.error('Email generation error:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-gray-900">Compose Email</h2>
            <p className="text-sm text-gray-500">Draft your response</p>
          </div>

          {/* AI Generation Button */}
          {enableAIGeneration && customerId && !emailSent && (
            <button
              onClick={() => setShowEmailTypeSelector(true)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          )}
        </div>

        {/* Error Message */}
        {generationError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{generationError}</p>
          </div>
        )}
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-4 max-w-2xl">
          {/* To */}
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">To</label>
            <input
              type="text"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Message</label>
            {typingComplete ? (
              <div
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 leading-relaxed min-h-[336px] whitespace-pre-wrap cursor-text"
                dangerouslySetInnerHTML={{ __html: formatTextToHTML(emailBody) }}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setEmailBody(e.currentTarget.textContent || '')}
              />
            ) : (
              <div
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 leading-relaxed min-h-[336px] whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatTextToHTML(displayBody) + '<span className="inline-block w-0.5 h-4 bg-blue-600 animate-pulse ml-0.5">|</span>' }}
              />
            )}
          </div>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Attachments</label>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, idx) => (
                  <div key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {attachment}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
          >
            Back
          </button>
        )}

        <div className="flex-1"></div>

        <div className="flex gap-3 items-center">
          <button
            onClick={handleSaveToDrafts}
            className={`px-5 py-2.5 ${savedToDrafts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg text-sm font-medium flex items-center gap-2 transition-colors`}
            disabled={!typingComplete || emailSent}
          >
            <Save className="w-4 h-4" />
            {savedToDrafts ? 'Saved!' : 'Save to Drafts'}
          </button>
          <button
            onClick={handleSendClick}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors ${
              emailSent
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={!typingComplete || emailSent}
          >
            <Send className="w-4 h-4" />
            {emailSent ? 'Sent!' : sendButtonLabel}
          </button>
        </div>
      </div>

      {/* Confirmation Overlay */}
      {showConfirmation && (
        <div className="fixed bottom-20 right-8 z-50 animate-slide-up">
          <div className="bg-amber-50 border border-amber-200 px-5 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-amber-900">Send this email to {emailTo}?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <span className="font-medium">Message Sent!</span>
          </div>
        </div>
      )}

      {/* Email Type Selector Modal */}
      {enableAIGeneration && (
        <EmailTypeSelector
          isOpen={showEmailTypeSelector}
          onClose={() => setShowEmailTypeSelector(false)}
          onSelect={handleGenerateEmail}
          isLoading={isGenerating}
        />
      )}
    </div>
  );
}
