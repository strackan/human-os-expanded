'use client';

import React, { useState } from 'react';
import { Target, ChevronRight, Mic } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface ExecutiveEngagementStrategyArtifactProps {
  customerName?: string;
  onSubmit?: (strategy: {
    primaryObjective: 'rebuild-trust' | 'acknowledge-issue' | 'set-expectations';
    tone: number;
    urgency: 'immediate' | 'this-week' | 'flexible';
    keyMessage: string;
  }) => void;
  onBack?: () => void;
}

export default function ExecutiveEngagementStrategyArtifact({
  customerName = 'Customer',
  onSubmit,
  onBack
}: ExecutiveEngagementStrategyArtifactProps) {
  const { showToast } = useToast();
  const [primaryObjective, setPrimaryObjective] = useState<'rebuild-trust' | 'acknowledge-issue' | 'set-expectations'>('rebuild-trust');
  const [tone, setTone] = useState<number>(6);
  const [urgency, setUrgency] = useState<'immediate' | 'this-week' | 'flexible'>('this-week');
  const [keyMessage, setKeyMessage] = useState('');

  const handleMicClick = () => {
    showToast({
      message: 'Voice transcription coming soon!',
      type: 'info',
      icon: 'none',
      duration: 2000
    });
  };

  const handleSubmit = () => {
    onSubmit?.({
      primaryObjective,
      tone,
      urgency,
      keyMessage: keyMessage.trim()
    });
  };

  const getObjectiveButtonClass = (objective: 'rebuild-trust' | 'acknowledge-issue' | 'set-expectations') => {
    const isSelected = primaryObjective === objective;
    return `px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
      isSelected
        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
        : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
    }`;
  };

  const getUrgencyButtonClass = (level: 'immediate' | 'this-week' | 'flexible') => {
    const isSelected = urgency === level;
    return `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isSelected
        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
        : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
    }`;
  };

  const getToneLabel = () => {
    if (tone <= 3) return 'Apologetic & Humble';
    if (tone <= 7) return 'Balanced & Professional';
    return 'Confident & Forward-Looking';
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-medium text-gray-900">Engagement Strategy</h2>
        </div>
        <p className="text-sm text-gray-500">
          Define your approach for engaging with {customerName}
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-8 max-w-2xl">
          {/* Question 1: Primary Objective */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                1
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                What&apos;s your primary objective for this engagement?
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="pl-9 space-y-2">
              <button
                onClick={() => setPrimaryObjective('rebuild-trust')}
                className={getObjectiveButtonClass('rebuild-trust')}
              >
                <div className="font-medium mb-1">Rebuild Trust</div>
                <div className="text-xs opacity-80">Acknowledge failures, take accountability, show commitment to improvement</div>
              </button>
              <button
                onClick={() => setPrimaryObjective('acknowledge-issue')}
                className={getObjectiveButtonClass('acknowledge-issue')}
              >
                <div className="font-medium mb-1">Acknowledge Issue</div>
                <div className="text-xs opacity-80">Address the specific incident without over-apologizing, focus on resolution</div>
              </button>
              <button
                onClick={() => setPrimaryObjective('set-expectations')}
                className={getObjectiveButtonClass('set-expectations')}
              >
                <div className="font-medium mb-1">Set Expectations</div>
                <div className="text-xs opacity-80">Outline next steps, establish clear commitments, define success metrics</div>
              </button>
            </div>
          </div>

          {/* Question 2: Tone */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                2
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                What&apos;s the one key message you want to convey?
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="pl-9 space-y-2">
              <input
                type="range"
                min="1"
                max="10"
                value={tone}
                onChange={(e) => setTone(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Apologetic</span>
                <span className="text-base font-medium text-blue-700">{getToneLabel()}</span>
                <span>Confident</span>
              </div>
            </div>
          </div>

          {/* Question 3: Urgency */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                3
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                How urgently should you respond?
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="pl-9 flex gap-2">
              <button
                onClick={() => setUrgency('immediate')}
                className={getUrgencyButtonClass('immediate')}
              >
                Immediate
              </button>
              <button
                onClick={() => setUrgency('this-week')}
                className={getUrgencyButtonClass('this-week')}
              >
                This Week
              </button>
              <button
                onClick={() => setUrgency('flexible')}
                className={getUrgencyButtonClass('flexible')}
              >
                Flexible
              </button>
            </div>
          </div>

          {/* Question 4: Key Message */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                4
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                What's the one key message you want to convey?
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="pl-9">
              <textarea
                value={keyMessage}
                onChange={(e) => setKeyMessage(e.target.value)}
                placeholder="E.g., 'We take full accountability and are committed to earning back your trust through consistent execution.'"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center gap-3">
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
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
