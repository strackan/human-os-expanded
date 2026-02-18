'use client';

import { HelpCircle } from 'lucide-react';
import type { ClarificationOption } from '@/lib/founders/types';

interface ClarificationPromptProps {
  options: ClarificationOption[];
  onSelect: (option: ClarificationOption) => void;
}

export function ClarificationPrompt({ options, onSelect }: ClarificationPromptProps) {
  if (!options.length) return null;
  return (
    <div className="flex flex-col gap-2 px-4 py-3 mx-4 my-1 rounded-lg border border-blue-500/30 bg-blue-500/5 animate-founders-fade-in">
      <div className="flex items-center gap-2 text-sm text-blue-400">
        <HelpCircle className="w-4 h-4" />
        <span>Did you mean:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option.entitySlug} onClick={() => onSelect(option)}
            className="px-3 py-1.5 text-sm text-gray-300 bg-[var(--gh-dark-700)] hover:bg-[var(--gh-dark-600)] hover:text-white rounded-lg border border-[var(--gh-dark-600)] transition-colors">
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
