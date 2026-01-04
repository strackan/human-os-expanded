// Badge Definitions for CS Assessment
// These match the database seed data in the migration

import { BadgeDefinition } from './types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'ai_prodigy',
    name: 'AI Prodigy',
    description: 'Exceptional AI readiness and orchestration capability (90+ AI Readiness)',
    icon: '🤖',
    category: 'dimension',
    criteria: {
      type: 'single_dimension',
      conditions: [
        {
          dimension: 'ai_readiness',
          min_score: 90,
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'technical_maestro',
    name: 'Technical Maestro',
    description: 'Outstanding technical prowess across all domains (90+ Technical category)',
    icon: '⚡',
    category: 'category',
    criteria: {
      type: 'category',
      conditions: [
        {
          category: 'technical',
          min_score: 90,
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'people_champion',
    name: 'People Champion',
    description: 'Exceptional emotional intelligence and empathy (90+ Emotional category)',
    icon: '❤️',
    category: 'category',
    criteria: {
      type: 'category',
      conditions: [
        {
          category: 'emotional',
          min_score: 90,
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'creative_genius',
    name: 'Creative Genius',
    description: 'Remarkable creativity and innovative thinking (90+ Creative category)',
    icon: '🎨',
    category: 'category',
    criteria: {
      type: 'category',
      conditions: [
        {
          category: 'creative',
          min_score: 90,
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'triple_threat',
    name: 'Triple Threat',
    description: 'Excellence across all three major categories (85+ in Technical, Emotional, and Creative)',
    icon: '🌟',
    category: 'combo',
    criteria: {
      type: 'combo',
      conditions: [
        { category: 'technical', min_score: 85 },
        { category: 'emotional', min_score: 85 },
        { category: 'creative', min_score: 85 },
      ],
      requires_all: true,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Exceptional performance with limited experience (80+ overall, <3 years)',
    icon: '⭐',
    category: 'achievement',
    criteria: {
      type: 'achievement',
      conditions: [
        { min_score: 80 },
        { experience_years: { max: 3 } },
      ],
      requires_all: true,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'veteran_pro',
    name: 'Veteran Pro',
    description: 'Sustained excellence over long career (85+ overall, 10+ years)',
    icon: '🏆',
    category: 'achievement',
    criteria: {
      type: 'achievement',
      conditions: [
        { min_score: 85 },
        { experience_years: { min: 10 } },
      ],
      requires_all: true,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'strategic_mind',
    name: 'Strategic Mind',
    description: 'Outstanding go-to-market strategy and leadership (90+ GTM and Executive Leadership)',
    icon: '🧠',
    category: 'combo',
    criteria: {
      type: 'multiple_dimensions',
      conditions: [
        { dimension: 'gtm', min_score: 90 },
        { dimension: 'executive_leadership', min_score: 90 },
      ],
      requires_all: true,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'technical_empath',
    name: 'Technical Empath',
    description: 'Rare combination of technical excellence and deep empathy (85+ Technical and Empathy)',
    icon: '💡',
    category: 'combo',
    criteria: {
      type: 'multiple_dimensions',
      conditions: [
        { dimension: 'technical', min_score: 85 },
        { dimension: 'empathy', min_score: 85 },
      ],
      requires_all: true,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'organized_mind',
    name: 'Organized Mind',
    description: 'Exceptional organizational and systems thinking (90+ Organization)',
    icon: '📋',
    category: 'dimension',
    criteria: {
      type: 'single_dimension',
      conditions: [
        {
          dimension: 'organization',
          min_score: 90,
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'self_aware_leader',
    name: 'Self-Aware Leader',
    description: 'Deep self-awareness combined with leadership capability (90+ Self-Awareness and Executive Leadership)',
    icon: '🌱',
    category: 'combo',
    criteria: {
      type: 'multiple_dimensions',
      conditions: [
        { dimension: 'self_awareness', min_score: 90 },
        { dimension: 'executive_leadership', min_score: 90 },
      ],
      requires_all: true,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'cultural_fit_star',
    name: 'Cultural Fit Star',
    description: 'Outstanding cultural alignment and team fit (95+ Culture Fit)',
    icon: '✨',
    category: 'dimension',
    criteria: {
      type: 'single_dimension',
      conditions: [
        {
          dimension: 'culture_fit',
          min_score: 95,
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'motivation_master',
    name: 'Motivation Master',
    description: 'Exceptional drive and internal motivation (95+ Motivation)',
    icon: '🔥',
    category: 'dimension',
    criteria: {
      type: 'single_dimension',
      conditions: [
        {
          dimension: 'motivation',
          min_score: 95,
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
];

// Helper to get badge by ID
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.id === id);
}

// Helper to get badges by category
export function getBadgesByCategory(category: BadgeDefinition['category']): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.category === category);
}
