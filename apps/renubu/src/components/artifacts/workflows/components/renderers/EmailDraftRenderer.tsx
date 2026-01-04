import React, { useState, useEffect } from 'react';
import { TypingText } from '../TypingText';

interface EmailDraftContent {
  to: string;
  subject: string;
  priority?: string;
  body: string;
}

interface EmailDraftRendererProps {
  content: EmailDraftContent;
}

/**
 * EmailDraftRenderer Component
 *
 * Displays a draft email with typing animation.
 * Includes edit and send buttons for interactivity.
 */
export const EmailDraftRenderer: React.FC<EmailDraftRendererProps> = ({ content }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content with typing animation after a short delay
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 text-lg">Draft Email</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
            Edit
          </button>
          <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
            Send
          </button>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 border-b border-gray-100 pb-4">
          <div>
            <span className="block font-medium">To:</span>
            <span>{showContent ? <TypingText text={content.to} speed={13} /> : ''}</span>
          </div>
          <div>
            <span className="block font-medium">Subject:</span>
            <span>{showContent ? <TypingText text={content.subject} speed={13} /> : ''}</span>
          </div>
          <div>
            <span className="block font-medium">Priority:</span>
            <span>{showContent ? <TypingText text={content.priority || 'Normal'} speed={13} /> : ''}</span>
          </div>
        </div>

        <div className="space-y-4 leading-relaxed">
          {showContent && content.body && (
            <div className="text-gray-600">
              <TypingText text={content.body} speed={10} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
