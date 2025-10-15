'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface EmailArtifactProps {
  to: string;
  subject: string;
  body: string;
  onCompose: () => void;
  onBack?: () => void;
  sendButtonLabel?: string;
}

export default function EmailArtifact({
  to,
  subject,
  body,
  onCompose,
  onBack,
  sendButtonLabel = 'Continue'
}: EmailArtifactProps) {
  const [emailTo, setEmailTo] = useState(to);
  const [emailSubject, setEmailSubject] = useState(subject);
  const [emailBody, setEmailBody] = useState(body);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <h2 className="text-base font-medium text-gray-900">Compose Email</h2>
        <p className="text-sm text-gray-500">Draft your response</p>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-4 max-w-2xl">
          {/* To */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">To</label>
            <input
              type="text"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Message</label>
            <textarea
              rows={14}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono leading-relaxed resize-none"
            />
          </div>
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

        <button
          onClick={onCompose}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          {sendButtonLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
