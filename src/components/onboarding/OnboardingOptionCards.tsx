'use client';

import { motion } from 'framer-motion';

interface OnboardingOptionCardsProps {
  onSelect: (option: 'A' | 'B' | 'C' | 'D') => void;
  disabled: boolean;
}

const OPTIONS = [
  {
    key: 'A' as const,
    title: 'Show me my riskiest renewals',
    description: 'Jump into your renewal pipeline with health scores',
    icon: '🎯',
  },
  {
    key: 'B' as const,
    title: 'Help me prep for a customer meeting',
    description: 'AI-powered meeting prep with talking points',
    icon: '🤝',
  },
  {
    key: 'C' as const,
    title: 'Walk me through a renewal workflow',
    description: 'See the full workflow system in action',
    icon: '🔄',
  },
  {
    key: 'D' as const,
    title: 'Just let me explore',
    description: 'Go straight to the dashboard',
    icon: '🧭',
  },
];

export default function OnboardingOptionCards({ onSelect, disabled }: OnboardingOptionCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-4">
      {OPTIONS.map((option, index) => (
        <motion.button
          key={option.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          onClick={() => onSelect(option.key)}
          disabled={disabled}
          className="group relative rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm
            p-4 text-left transition-all hover:border-orange-300 hover:shadow-md
            hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">{option.icon}</span>
            <div>
              <h3 className="font-medium text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                {option.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
