/**
 * Clarification Prompt
 *
 * Inline buttons shown when do() returns ambiguous entities.
 * Clicking sends the selection as a follow-up message.
 */

import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import type { ClarificationOption } from '@/lib/types/production';

interface ClarificationPromptProps {
  options: ClarificationOption[];
  onSelect: (option: ClarificationOption) => void;
}

export function ClarificationPrompt({ options, onSelect }: ClarificationPromptProps) {
  if (!options.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 px-4 py-3 mx-4 my-1 rounded-lg border border-blue-500/30 bg-blue-500/5"
    >
      <div className="flex items-center gap-2 text-sm text-blue-400">
        <HelpCircle className="w-4 h-4" />
        <span>Did you mean:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.entitySlug}
            onClick={() => onSelect(option)}
            className="px-3 py-1.5 text-sm text-gray-300 bg-gh-dark-700 hover:bg-gh-dark-600 hover:text-white rounded-lg border border-gh-dark-600 transition-colors"
          >
            {option.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default ClarificationPrompt;
