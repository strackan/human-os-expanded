// Badge Definitions for Good Hang Assessments
// Supports both personality (Module A/B) and work (Module C/D) badges

import { BadgeDefinition } from './badge-types';

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
    assessment_type: 'work',
    created_at: new Date().toISOString(),
  },

  // ============================================================
  // PERSONALITY BADGES (Module A/B - Social Assessment)
  // ============================================================

  // --- Single Attribute Badges (9+ score) ---
  {
    id: 'curious_mind',
    name: 'Curious Mind',
    description: 'Exceptional intellectual curiosity and depth of thought (INT 9+)',
    icon: '🧠',
    category: 'attribute',
    criteria: {
      type: 'single_attribute',
      conditions: [{ attribute: 'INT', min_score: 9 }],
    },
    assessment_type: 'personality',
    rarity: 'rare',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Profound self-awareness and emotional intelligence (WIS 9+)',
    icon: '🦉',
    category: 'attribute',
    criteria: {
      type: 'single_attribute',
      conditions: [{ attribute: 'WIS', min_score: 9 }],
    },
    assessment_type: 'personality',
    rarity: 'rare',
  },
  {
    id: 'life_of_the_party',
    name: 'Life of the Party',
    description: 'Natural social magnetism and presence (CHA 9+)',
    icon: '🎉',
    category: 'attribute',
    criteria: {
      type: 'single_attribute',
      conditions: [{ attribute: 'CHA', min_score: 9 }],
    },
    assessment_type: 'personality',
    rarity: 'rare',
  },
  {
    id: 'rock_solid',
    name: 'Rock Solid',
    description: 'Exceptional consistency and follow-through (CON 9+)',
    icon: '🪨',
    category: 'attribute',
    criteria: {
      type: 'single_attribute',
      conditions: [{ attribute: 'CON', min_score: 9 }],
    },
    assessment_type: 'personality',
    rarity: 'rare',
  },
  {
    id: 'fearless',
    name: 'Fearless',
    description: 'Remarkable assertiveness and drive (STR 9+)',
    icon: '💪',
    category: 'attribute',
    criteria: {
      type: 'single_attribute',
      conditions: [{ attribute: 'STR', min_score: 9 }],
    },
    assessment_type: 'personality',
    rarity: 'rare',
  },
  {
    id: 'free_spirit',
    name: 'Free Spirit',
    description: 'Exceptional adaptability and spontaneity (DEX 9+)',
    icon: '🦋',
    category: 'attribute',
    criteria: {
      type: 'single_attribute',
      conditions: [{ attribute: 'DEX', min_score: 9 }],
    },
    assessment_type: 'personality',
    rarity: 'rare',
  },

  // --- Alignment Badges ---
  {
    id: 'rebel_with_heart',
    name: 'Rebel with Heart',
    description: 'Breaks rules for the greater good (Chaotic Good)',
    icon: '🔥',
    category: 'alignment',
    criteria: {
      type: 'alignment',
      conditions: [{ alignment: 'Chaotic Good' }],
    },
    assessment_type: 'personality',
    rarity: 'uncommon',
  },
  {
    id: 'paragon',
    name: 'Paragon',
    description: 'Principled protector who follows the code (Lawful Good)',
    icon: '⚔️',
    category: 'alignment',
    criteria: {
      type: 'alignment',
      conditions: [{ alignment: 'Lawful Good' }],
    },
    assessment_type: 'personality',
    rarity: 'uncommon',
  },
  {
    id: 'wild_card',
    name: 'Wild Card',
    description: 'Unpredictable free spirit (Chaotic Neutral)',
    icon: '🃏',
    category: 'alignment',
    criteria: {
      type: 'alignment',
      conditions: [{ alignment: 'Chaotic Neutral' }],
    },
    assessment_type: 'personality',
    rarity: 'uncommon',
  },
  {
    id: 'the_balanced',
    name: 'The Balanced',
    description: 'Adapts to any situation with equilibrium (True Neutral)',
    icon: '⚖️',
    category: 'alignment',
    criteria: {
      type: 'alignment',
      conditions: [{ alignment: 'True Neutral' }],
    },
    assessment_type: 'personality',
    rarity: 'common',
  },
  {
    id: 'pragmatic_helper',
    name: 'Pragmatic Helper',
    description: 'Does good however it works best (Neutral Good)',
    icon: '🤝',
    category: 'alignment',
    criteria: {
      type: 'alignment',
      conditions: [{ alignment: 'Neutral Good' }],
    },
    assessment_type: 'personality',
    rarity: 'common',
  },
  {
    id: 'disciplined',
    name: 'Disciplined',
    description: 'Values order and structure above all (Lawful Neutral)',
    icon: '📐',
    category: 'alignment',
    criteria: {
      type: 'alignment',
      conditions: [{ alignment: 'Lawful Neutral' }],
    },
    assessment_type: 'personality',
    rarity: 'uncommon',
  },

  // --- Personality Combo Badges (multiple attributes 8+) ---
  {
    id: 'philosopher',
    name: 'Philosopher',
    description: 'Deep thinker with profound wisdom (INT 8+ AND WIS 8+)',
    icon: '📚',
    category: 'personality',
    criteria: {
      type: 'multiple_attributes',
      conditions: [
        { attribute: 'INT', min_score: 8 },
        { attribute: 'WIS', min_score: 8 },
      ],
      requires_all: true,
    },
    assessment_type: 'personality',
    rarity: 'legendary',
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Charming and adaptable in any social setting (CHA 8+ AND DEX 8+)',
    icon: '🦋',
    category: 'personality',
    criteria: {
      type: 'multiple_attributes',
      conditions: [
        { attribute: 'CHA', min_score: 8 },
        { attribute: 'DEX', min_score: 8 },
      ],
      requires_all: true,
    },
    assessment_type: 'personality',
    rarity: 'legendary',
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Powerful drive with unshakeable consistency (STR 8+ AND CON 8+)',
    icon: '🏔️',
    category: 'personality',
    criteria: {
      type: 'multiple_attributes',
      conditions: [
        { attribute: 'STR', min_score: 8 },
        { attribute: 'CON', min_score: 8 },
      ],
      requires_all: true,
    },
    assessment_type: 'personality',
    rarity: 'legendary',
  },
  {
    id: 'quick_wit',
    name: 'Quick Wit',
    description: 'Sharp mind with lightning adaptability (INT 8+ AND DEX 8+)',
    icon: '⚡',
    category: 'personality',
    criteria: {
      type: 'multiple_attributes',
      conditions: [
        { attribute: 'INT', min_score: 8 },
        { attribute: 'DEX', min_score: 8 },
      ],
      requires_all: true,
    },
    assessment_type: 'personality',
    rarity: 'legendary',
  },
  {
    id: 'natural_leader',
    name: 'Natural Leader',
    description: 'Commanding presence with inner strength (CHA 8+ AND STR 8+)',
    icon: '👑',
    category: 'personality',
    criteria: {
      type: 'multiple_attributes',
      conditions: [
        { attribute: 'CHA', min_score: 8 },
        { attribute: 'STR', min_score: 8 },
      ],
      requires_all: true,
    },
    assessment_type: 'personality',
    rarity: 'legendary',
  },
  {
    id: 'empathic_anchor',
    name: 'Empathic Anchor',
    description: 'Wise and reliable friend (WIS 8+ AND CON 8+)',
    icon: '⚓',
    category: 'personality',
    criteria: {
      type: 'multiple_attributes',
      conditions: [
        { attribute: 'WIS', min_score: 8 },
        { attribute: 'CON', min_score: 8 },
      ],
      requires_all: true,
    },
    assessment_type: 'personality',
    rarity: 'legendary',
  },

  // --- Social Style Badges ---
  {
    id: 'deep_connector',
    name: 'Deep Connector',
    description: 'Forms meaningful, lasting bonds',
    icon: '🔗',
    category: 'social',
    criteria: {
      type: 'social_pattern',
      conditions: [{ relationship_style: 'depth_seeking' }],
    },
    assessment_type: 'personality',
    rarity: 'common',
  },
  {
    id: 'social_explorer',
    name: 'Social Explorer',
    description: 'Builds wide networks and knows everyone',
    icon: '🌐',
    category: 'social',
    criteria: {
      type: 'social_pattern',
      conditions: [{ relationship_style: 'breadth_seeking' }],
    },
    assessment_type: 'personality',
    rarity: 'common',
  },
  {
    id: 'selective_socialite',
    name: 'Selective Socialite',
    description: 'Extroverted with the right people',
    icon: '✨',
    category: 'social',
    criteria: {
      type: 'social_pattern',
      conditions: [{ social_energy: 'selective_extrovert' }],
    },
    assessment_type: 'personality',
    rarity: 'uncommon',
  },
  {
    id: 'spontaneous_soul',
    name: 'Spontaneous Soul',
    description: 'Lives for the moment and unexpected adventures',
    icon: '🎲',
    category: 'social',
    criteria: {
      type: 'social_pattern',
      conditions: [{ energy_pattern: 'spontaneous' }],
    },
    assessment_type: 'personality',
    rarity: 'common',
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

// Helper to get badges by assessment type
export function getBadgesByAssessmentType(type: 'personality' | 'work' | 'both'): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((badge) =>
    badge.assessment_type === type || badge.assessment_type === 'both' || !badge.assessment_type
  );
}

// Get all personality badges (for Module A/B)
export function getPersonalityBadges(): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.assessment_type === 'personality');
}

// Get all work badges (for future Module C/D)
export function getWorkBadges(): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((badge) =>
    badge.assessment_type === 'work' || !badge.assessment_type
  );
}

// Get badges by rarity
export function getBadgesByRarity(rarity: BadgeDefinition['rarity']): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.rarity === rarity);
}
