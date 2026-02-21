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
    icon: '\u{1F3AF}',
  },
  {
    key: 'B' as const,
    title: 'Help me prep for a customer meeting',
    description: 'AI-powered meeting prep with talking points',
    icon: '\u{1F91D}',
  },
  {
    key: 'C' as const,
    title: 'Walk me through a renewal workflow',
    description: 'See the full workflow system in action',
    icon: '\u{1F504}',
  },
  {
    key: 'D' as const,
    title: 'Just let me explore',
    description: 'Go straight to the dashboard',
    icon: '\u{1F9ED}',
  },
];

export default function OnboardingOptionCards({ onSelect, disabled }: OnboardingOptionCardsProps) {
  return (
    <div id="onboarding-options">
      {OPTIONS.map((option, index) => (
        <motion.button
          key={option.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          onClick={() => onSelect(option.key)}
          disabled={disabled}
          className="option-card"
        >
          <div className="option-inner">
            <span className="option-icon">{option.icon}</span>
            <div>
              <h3 className="option-title">{option.title}</h3>
              <p className="option-desc">{option.description}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
