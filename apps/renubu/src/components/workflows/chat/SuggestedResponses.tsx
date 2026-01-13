'use client';

/**
 * SuggestedResponses Component
 *
 * Displays suggested response buttons from workflow_chat_branches table
 * User can click to send a pre-defined response
 */

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { LLMService } from '@/lib/workflows/chat/LLMService';

interface SuggestedResponsesProps {
  workflowId: string;
  stepId: string;
  onResponseClick: (response: string) => void;
  className?: string;
}

export default function SuggestedResponses({
  workflowId,
  stepId,
  onResponseClick,
  className = ''
}: SuggestedResponsesProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [workflowId, stepId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const llmService = new LLMService();
      const responses = await llmService.getSuggestedResponses(workflowId, stepId);
      setSuggestions(responses);
    } catch (error) {
      console.error('[SuggestedResponses] Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-4 border-t border-gray-200 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 border-t border-gray-200 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-medium text-gray-700">Suggested responses</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onResponseClick(suggestion)}
            className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
