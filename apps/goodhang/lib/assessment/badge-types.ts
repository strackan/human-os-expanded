// Badge Types Module
// Reusable badge system for personality and work assessments

import type { AttributeCode, Alignment } from './types';

// Badge categories - extensible for different assessment types
export type BadgeCategory =
  // Work assessment badges (future Module C/D)
  | 'dimension'      // Single work dimension (e.g., ai_readiness)
  | 'category'       // Work category (technical, emotional, creative)
  | 'combo'          // Multiple work dimensions
  | 'achievement'    // Experience-based work badges
  // Personality assessment badges (Module A/B)
  | 'attribute'      // Single D&D attribute (INT, WIS, etc.)
  | 'alignment'      // D&D alignment-based
  | 'personality'    // Personality combo badges
  | 'social';        // Social style badges

// Badge criteria types
export type BadgeCriteriaType =
  // Work assessment criteria
  | 'single_dimension'
  | 'multiple_dimensions'
  | 'category'
  | 'combo'
  | 'achievement'
  // Personality assessment criteria
  | 'single_attribute'
  | 'multiple_attributes'
  | 'alignment'
  | 'social_pattern';

// Work dimension condition (for future use)
export interface WorkDimensionCondition {
  dimension: string;
  min_score: number;
}

// Work category condition (for future use)
export interface WorkCategoryCondition {
  category: 'technical' | 'emotional' | 'creative';
  min_score: number;
}

// D&D attribute condition
export interface AttributeCondition {
  attribute: AttributeCode;
  min_score: number;
}

// Alignment condition
export interface AlignmentCondition {
  alignment: Alignment | Alignment[];
  // Optional: require specific axis
  order_axis?: 'Lawful' | 'Neutral' | 'Chaotic';
  moral_axis?: 'Good' | 'Neutral' | 'Evil';
}

// Social pattern condition
export interface SocialPatternCondition {
  social_energy?: string;
  relationship_style?: string;
  connection_style?: string;
  energy_pattern?: string;
}

// Experience condition (for work badges)
export interface ExperienceCondition {
  experience_years?: { min?: number; max?: number };
  min_score?: number;
}

// Union of all condition types
export type BadgeCondition =
  | WorkDimensionCondition
  | WorkCategoryCondition
  | AttributeCondition
  | AlignmentCondition
  | SocialPatternCondition
  | ExperienceCondition;

// Badge criteria structure
export interface BadgeCriteria {
  type: BadgeCriteriaType;
  conditions: BadgeCondition[];
  requires_all?: boolean; // For combo badges - must meet ALL conditions
}

// Main badge definition
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria: BadgeCriteria;
  // Metadata
  assessment_type?: 'personality' | 'work' | 'both';
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  created_at?: string;
}

// Awarded badge (when a user earns a badge)
export interface AwardedBadge {
  badge_id: string;
  user_id: string;
  session_id: string;
  awarded_at: string;
  // Snapshot of badge details at time of award
  badge_name: string;
  badge_icon: string;
  badge_description: string;
}

// Helper type guards
export function isAttributeCondition(condition: BadgeCondition): condition is AttributeCondition {
  return 'attribute' in condition && 'min_score' in condition;
}

export function isAlignmentCondition(condition: BadgeCondition): condition is AlignmentCondition {
  return 'alignment' in condition || 'order_axis' in condition || 'moral_axis' in condition;
}

export function isWorkDimensionCondition(condition: BadgeCondition): condition is WorkDimensionCondition {
  return 'dimension' in condition && 'min_score' in condition;
}

export function isWorkCategoryCondition(condition: BadgeCondition): condition is WorkCategoryCondition {
  return 'category' in condition && 'min_score' in condition;
}

export function isSocialPatternCondition(condition: BadgeCondition): condition is SocialPatternCondition {
  return 'social_energy' in condition || 'relationship_style' in condition ||
         'connection_style' in condition || 'energy_pattern' in condition;
}

export function isExperienceCondition(condition: BadgeCondition): condition is ExperienceCondition {
  return 'experience_years' in condition;
}
