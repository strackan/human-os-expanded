'use client';

import React, { useState } from 'react';
import { Mic, ChevronRight, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface GrowthAssessmentArtifactProps {
  title?: string;
  subtitle?: string;
  customerName?: string;
  onSubmit?: (answers: {
    usageTrajectory: number;
    usageReason: string;
    priceSensitivity: 'low' | 'medium' | 'high';
    sensitivityReason: string;
    competitiveRisk: 'low' | 'medium' | 'high';
    competitiveReason: string;
  }) => void;
  onBack?: () => void;
}

export default function GrowthAssessmentArtifact({
  title = 'Growth Assessment',
  subtitle = 'Help me understand the expansion context',
  customerName,
  onSubmit,
  onBack
}: GrowthAssessmentArtifactProps) {
  const { showToast } = useToast();
  const [usageTrajectory, setUsageTrajectory] = useState<number>(7);
  const [usageReason, setUsageReason] = useState('');
  const [priceSensitivity, setPriceSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [sensitivityReason, setSensitivityReason] = useState('');
  const [competitiveRisk, setCompetitiveRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [competitiveReason, setCompetitiveReason] = useState('');

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
      usageTrajectory,
      usageReason: usageReason.trim(),
      priceSensitivity,
      sensitivityReason: sensitivityReason.trim(),
      competitiveRisk,
      competitiveReason: competitiveReason.trim()
    });
  };

  const getSensitivityButtonClass = (level: 'low' | 'medium' | 'high') => {
    const isSelected = priceSensitivity === level;
    return `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isSelected
        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
        : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
    }`;
  };

  const getRiskButtonClass = (level: 'low' | 'medium' | 'high') => {
    const isSelected = competitiveRisk === level;
    return `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isSelected
        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
        : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
    }`;
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-medium text-gray-900">{title}</h2>
        </div>
        {customerName && (
          <p className="text-sm text-gray-500">
            {subtitle} for {customerName}
          </p>
        )}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-8 max-w-2xl">
          {/* Question 1: Usage Trajectory */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                1
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                How fast is their usage growing? (1-10)
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Score Slider */}
            <div className="space-y-2 pl-9">
              <input
                type="range"
                min="1"
                max="10"
                value={usageTrajectory}
                onChange={(e) => setUsageTrajectory(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slow (1)</span>
                <span className="text-base font-medium text-blue-700">{usageTrajectory}</span>
                <span>Fast (10)</span>
              </div>
            </div>

            {/* Why? */}
            <div className="pl-9">
              <label className="text-xs text-gray-600 mb-1 block">Why?</label>
              <textarea
                value={usageReason}
                onChange={(e) => setUsageReason(e.target.value)}
                placeholder="E.g., 'New funding round, expanding sales team by 50%'"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
                rows={2}
              />
            </div>
          </div>

          {/* Question 2: Price Sensitivity */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                2
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                How price-sensitive are they?
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Button Group */}
            <div className="pl-9 flex gap-2">
              <button
                onClick={() => setPriceSensitivity('low')}
                className={getSensitivityButtonClass('low')}
              >
                Low
              </button>
              <button
                onClick={() => setPriceSensitivity('medium')}
                className={getSensitivityButtonClass('medium')}
              >
                Medium
              </button>
              <button
                onClick={() => setPriceSensitivity('high')}
                className={getSensitivityButtonClass('high')}
              >
                High
              </button>
            </div>

            {/* Why? */}
            <div className="pl-9">
              <label className="text-xs text-gray-600 mb-1 block">Why?</label>
              <textarea
                value={sensitivityReason}
                onChange={(e) => setSensitivityReason(e.target.value)}
                placeholder="E.g., 'CFO mentioned budget flexibility' or 'Finance team pushing back on costs'"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
                rows={2}
              />
            </div>
          </div>

          {/* Question 3: Competitive Risk */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                3
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                Are they likely shopping around?
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Button Group */}
            <div className="pl-9 flex gap-2">
              <button
                onClick={() => setCompetitiveRisk('low')}
                className={getRiskButtonClass('low')}
              >
                Low
              </button>
              <button
                onClick={() => setCompetitiveRisk('medium')}
                className={getRiskButtonClass('medium')}
              >
                Medium
              </button>
              <button
                onClick={() => setCompetitiveRisk('high')}
                className={getRiskButtonClass('high')}
              >
                High
              </button>
            </div>

            {/* Why? */}
            <div className="pl-9">
              <label className="text-xs text-gray-600 mb-1 block">Why?</label>
              <textarea
                value={competitiveReason}
                onChange={(e) => setCompetitiveReason(e.target.value)}
                placeholder="E.g., 'Champion mentioned evaluating alternatives' or 'Strong relationship, no concerns'"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
                rows={2}
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
