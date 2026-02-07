/**
 * Human-OS Definitions API
 *
 * Provides centralized definitions for:
 * - Commandment files (Voice OS + Founder OS)
 * - Question sets (E01-E24, a1-c5, etc.)
 * - Registry schemas (Stories, Anecdotes, Events, People)
 *
 * Edge functions and clients should load from here rather than hardcoding.
 */

import { NextResponse } from 'next/server';

// =============================================================================
// COMMANDMENT DEFINITIONS
// =============================================================================

export interface CommandmentDef {
  name: string;
  description: string;
  category: 'voice' | 'founder-os';
  mustInclude: string[];
  mayInclude: string[];
  mustNotInclude: string[];
  populatedBy: string[]; // Question IDs that help fill this
}

const VOICE_COMMANDMENTS: CommandmentDef[] = [
  {
    name: 'VOICE.md',
    description: 'Always/never rules, signature phrases, rhythm patterns, punctuation signatures',
    category: 'voice',
    mustInclude: ['tone_baseline', 'signature_phrases', 'punctuation_patterns', 'emotional_registers'],
    mayInclude: ['metaphor_usage', 'humor_style'],
    mustNotInclude: ['stories_full_text', 'anecdotes_full_text'],
    populatedBy: ['voice_test_1', 'voice_test_2', 'voice_test_3'],
  },
  {
    name: 'THEMES.md',
    description: 'Core beliefs, recurring habits, internal tensions, values',
    category: 'voice',
    mustInclude: ['core_beliefs', 'recurring_themes', 'internal_tensions', 'values_hierarchy'],
    mayInclude: ['evolution_over_time'],
    mustNotInclude: ['specific_stories'],
    populatedBy: ['a1', 'b1', 'b2'],
  },
  {
    name: 'GUARDRAILS.md',
    description: 'Topics to avoid, tones to avoid, sacred cows, hard NOs',
    category: 'voice',
    mustInclude: ['never_mention', 'never_joke_about', 'sacred_topics', 'tone_limits'],
    mayInclude: ['context_dependent_caution'],
    mustNotInclude: [],
    populatedBy: ['sculptor_corrections'],
  },
  {
    name: 'OPENINGS.md',
    description: 'Opening hook patterns, first-line strategies, attention grabbers',
    category: 'voice',
    mustInclude: ['hook_types', 'opening_structures', 'tone_starters'],
    mayInclude: ['platform_variations'],
    mustNotInclude: ['full_content_examples'],
    populatedBy: ['voice_test_1', 'corpus_analysis'],
  },
  {
    name: 'MIDDLES.md',
    description: 'Argument structures, evidence patterns, transition styles',
    category: 'voice',
    mustInclude: ['argument_patterns', 'evidence_types', 'transition_phrases'],
    mayInclude: ['length_calibration'],
    mustNotInclude: ['full_content_examples'],
    populatedBy: ['corpus_analysis'],
  },
  {
    name: 'ENDINGS.md',
    description: 'Closing patterns, CTA styles, mic-drop lines',
    category: 'voice',
    mustInclude: ['closing_patterns', 'cta_styles', 'mic_drop_examples'],
    mayInclude: ['platform_variations'],
    mustNotInclude: ['full_content_examples'],
    populatedBy: ['voice_test_3', 'corpus_analysis'],
  },
  {
    name: 'BLENDS.md',
    description: 'Content type recipes, format preferences, mixing patterns',
    category: 'voice',
    mustInclude: ['content_type_preferences', 'format_ratios', 'mixing_rules'],
    mayInclude: ['platform_specific_blends'],
    mustNotInclude: [],
    populatedBy: ['corpus_analysis'],
  },
  {
    name: 'EXAMPLES.md',
    description: 'Reference outputs across formats (thought leadership, story, connection)',
    category: 'voice',
    mustInclude: ['thought_leadership_sample', 'personal_story_sample', 'connection_sample'],
    mayInclude: ['email_sample', 'social_sample'],
    mustNotInclude: [],
    populatedBy: ['voice_test_1', 'voice_test_2', 'voice_test_3'],
  },
];

const FOUNDER_COMMANDMENTS: CommandmentDef[] = [
  {
    name: 'CONVERSATION_PROTOCOLS.md',
    description: 'How to interact - tone, length, when to ask vs decide',
    category: 'founder-os',
    mustInclude: ['tone_baseline', 'length_calibration', 'decision_matrix', 'push_back_protocols'],
    mayInclude: ['energy_pattern_response'],
    mustNotInclude: ['crisis_details', 'personal_stories'],
    populatedBy: ['E11', 'E12', 'E13', 'E14', 'c3', 'c4'],
  },
  {
    name: 'CRISIS_PROTOCOLS.md',
    description: 'Emergency response, what to do when things go wrong',
    category: 'founder-os',
    mustInclude: ['crisis_indicators', 'escalation_triggers', 'recovery_support'],
    mayInclude: ['historical_patterns'],
    mustNotInclude: ['conversation_protocols'],
    populatedBy: ['E15', 'E16', 'E17', 'E18', 'E19', 'a3', 'a4'],
  },
  {
    name: 'CURRENT_STATE.md',
    description: 'Live context, current priorities, active projects',
    category: 'founder-os',
    mustInclude: ['active_projects', 'current_priorities', 'key_relationships'],
    mayInclude: ['recent_changes'],
    mustNotInclude: ['historical_context'],
    populatedBy: ['context_building'],
  },
  {
    name: 'STRATEGIC_THOUGHT_PARTNER.md',
    description: 'Decision frameworks, how to help think through problems',
    category: 'founder-os',
    mustInclude: ['decision_frameworks', 'thinking_preferences', 'blind_spots'],
    mayInclude: ['historical_decisions'],
    mustNotInclude: ['operational_details'],
    populatedBy: ['a1', 'a4', 'E01', 'E02', 'E03'],
  },
  {
    name: 'DECISION_MAKING.md',
    description: 'Decision patterns, what drains vs energizes decisions',
    category: 'founder-os',
    mustInclude: ['decision_style', 'paralysis_triggers', 'energizing_decisions', 'draining_decisions'],
    mayInclude: ['support_preferences'],
    mustNotInclude: ['crisis_protocols'],
    populatedBy: ['E01', 'E02', 'E03', 'E04'],
  },
  {
    name: 'ENERGY_PATTERNS.md',
    description: 'What energizes/drains, optimal conditions, physical realities',
    category: 'founder-os',
    mustInclude: ['peak_times', 'energy_drains', 'optimal_conditions', 'physical_factors'],
    mayInclude: ['seasonal_patterns'],
    mustNotInclude: ['work_style_details'],
    populatedBy: ['E05', 'E06', 'E09', 'E10', 'c1'],
  },
  {
    name: 'WORK_STYLE.md',
    description: 'Support preferences, how they like to be helped',
    category: 'founder-os',
    mustInclude: ['support_methods', 'priority_presentation', 'autonomy_level'],
    mayInclude: ['tool_preferences'],
    mustNotInclude: ['energy_patterns'],
    populatedBy: ['E20', 'E21', 'E22', 'E23', 'E24', 'c5'],
  },
  {
    name: 'AVOIDANCE_PATTERNS.md',
    description: 'Stuck indicators, avoidance behaviors, intervention methods',
    category: 'founder-os',
    mustInclude: ['stuck_indicators', 'avoidance_behaviors', 'intervention_timing'],
    mayInclude: ['historical_patterns'],
    mustNotInclude: ['recovery_protocols'],
    populatedBy: ['E07', 'E08', 'E15'],
  },
  {
    name: 'RECOVERY_PROTOCOLS.md',
    description: 'Reset methods, timeline, what helps restore',
    category: 'founder-os',
    mustInclude: ['reset_methods', 'recovery_timeline', 'helpful_interventions', 'harmful_interventions'],
    mayInclude: ['historical_recoveries'],
    mustNotInclude: ['avoidance_patterns'],
    populatedBy: ['E16', 'E17', 'E18', 'E19', 'c2'],
  },
  {
    name: 'SUPPORT_CALIBRATION.md',
    description: 'Meta-calibration, how support needs change by state',
    category: 'founder-os',
    mustInclude: ['state_signals', 'mode_triggers', 'calibration_rules'],
    mayInclude: ['rapport_style'],
    mustNotInclude: [],
    populatedBy: ['c3', 'c4', 'c5', 'b3'],
  },
];

// =============================================================================
// REGISTRY SCHEMAS
// =============================================================================

export interface RegistrySchema {
  name: string;
  idPrefix: string;
  fields: string[];
  usedIn: string[];
}

const REGISTRY_SCHEMAS: RegistrySchema[] = [
  {
    name: 'STORIES.registry.md',
    idPrefix: 'S',
    fields: ['summary', 'core_quote', 'emotional_tone', 'tags', 'used_in'],
    usedIn: ['THEMES.md', 'CRISIS_PROTOCOLS.md', 'VOICE.md', 'EXAMPLES.md'],
  },
  {
    name: 'ANECDOTES.registry.md',
    idPrefix: 'A',
    fields: ['summary', 'quote', 'illustrates', 'tags', 'used_in'],
    usedIn: ['VOICE.md', 'EXAMPLES.md', 'BLENDS.md'],
  },
  {
    name: 'EVENTS.registry.md',
    idPrefix: 'EV',
    fields: ['date_range', 'summary', 'impact', 'tags', 'used_in'],
    usedIn: ['THEMES.md', 'CRISIS_PROTOCOLS.md', 'RECOVERY_PROTOCOLS.md'],
  },
  {
    name: 'PEOPLE.registry.md',
    idPrefix: 'P',
    fields: ['relationship', 'context', 'can_reference', 'tags'],
    usedIn: ['GUARDRAILS.md', 'STORIES.registry.md', 'ANECDOTES.registry.md'],
  },
  {
    name: 'PARKING_LOT.md',
    idPrefix: 'PL',
    fields: ['topic', 'priority', 'context', 'follow_up_by'],
    usedIn: [],
  },
];

// =============================================================================
// QUESTION SETS
// =============================================================================

export interface QuestionSet {
  id: string;
  name: string;
  questions: QuestionDef[];
  populatesFiles: string[];
}

export interface QuestionDef {
  id: string;
  section: string;
  text: string;
  populatesFiles: string[];
}

const QUESTION_E: QuestionDef[] = [
  { id: 'E01', section: 'decision-making', text: "When you're facing a big decision and feeling overwhelmed, what does that look like for you?", populatesFiles: ['DECISION_MAKING.md', 'STRATEGIC_THOUGHT_PARTNER.md'] },
  { id: 'E02', section: 'decision-making', text: "When you have too many options, what's your default response?", populatesFiles: ['DECISION_MAKING.md', 'STRATEGIC_THOUGHT_PARTNER.md'] },
  { id: 'E03', section: 'decision-making', text: 'Do you prefer someone to present options, make recommendations, or just make the call?', populatesFiles: ['DECISION_MAKING.md', 'STRATEGIC_THOUGHT_PARTNER.md'] },
  { id: 'E04', section: 'decision-making', text: 'What kinds of decisions drain you the most? What kinds energize you?', populatesFiles: ['DECISION_MAKING.md'] },
  { id: 'E05', section: 'energy-cognitive', text: "When are you at your best? Time of day, conditions, context?", populatesFiles: ['ENERGY_PATTERNS.md'] },
  { id: 'E06', section: 'energy-cognitive', text: 'What drains you faster than people might expect?', populatesFiles: ['ENERGY_PATTERNS.md'] },
  { id: 'E07', section: 'energy-cognitive', text: "How do you know when you're avoiding something? What does that look like?", populatesFiles: ['AVOIDANCE_PATTERNS.md'] },
  { id: 'E08', section: 'energy-cognitive', text: 'What does your "overwhelm spiral" look like?', populatesFiles: ['AVOIDANCE_PATTERNS.md', 'CRISIS_PROTOCOLS.md'] },
  { id: 'E09', section: 'energy-cognitive', text: 'Do you have any neurodivergent patterns that affect how you work?', populatesFiles: ['ENERGY_PATTERNS.md', 'WORK_STYLE.md'] },
  { id: 'E10', section: 'energy-cognitive', text: 'What kind of structure helps you? What kind feels constraining?', populatesFiles: ['ENERGY_PATTERNS.md', 'WORK_STYLE.md'] },
  { id: 'E11', section: 'communication', text: 'When working with someone, do you prefer direct recommendations, facilitated thinking, or minimal check-ins?', populatesFiles: ['CONVERSATION_PROTOCOLS.md'] },
  { id: 'E12', section: 'communication', text: 'What kind of input feels helpful vs. annoying?', populatesFiles: ['CONVERSATION_PROTOCOLS.md'] },
  { id: 'E13', section: 'communication', text: "How should someone push back on you if they think you're wrong?", populatesFiles: ['CONVERSATION_PROTOCOLS.md'] },
  { id: 'E14', section: 'communication', text: "When you're not feeling great, how should that change how people interact with you?", populatesFiles: ['CONVERSATION_PROTOCOLS.md', 'SUPPORT_CALIBRATION.md'] },
  { id: 'E15', section: 'crisis-recovery', text: 'What does "stuck" look like for you? How do you know when you\'re there?', populatesFiles: ['AVOIDANCE_PATTERNS.md', 'CRISIS_PROTOCOLS.md'] },
  { id: 'E16', section: 'crisis-recovery', text: "What helps you get unstuck? What's worked in the past?", populatesFiles: ['RECOVERY_PROTOCOLS.md'] },
  { id: 'E17', section: 'crisis-recovery', text: "What makes things worse when you're struggling? What should people NOT do?", populatesFiles: ['RECOVERY_PROTOCOLS.md', 'CRISIS_PROTOCOLS.md'] },
  { id: 'E18', section: 'crisis-recovery', text: 'How does chronic pain (or health issues) affect your availability and focus?', populatesFiles: ['ENERGY_PATTERNS.md', 'RECOVERY_PROTOCOLS.md'] },
  { id: 'E19', section: 'crisis-recovery', text: "When you're in crisis mode, do you want space, help carrying the load, or distraction?", populatesFiles: ['CRISIS_PROTOCOLS.md', 'RECOVERY_PROTOCOLS.md'] },
  { id: 'E20', section: 'work-style', text: 'How do you like to be helped? What does good support look like?', populatesFiles: ['WORK_STYLE.md'] },
  { id: 'E21', section: 'work-style', text: 'How should priorities be presented to you?', populatesFiles: ['WORK_STYLE.md'] },
  { id: 'E22', section: 'work-style', text: "What's your relationship with time? Are deadlines helpful pressure or unhelpful stress?", populatesFiles: ['WORK_STYLE.md'] },
  { id: 'E23', section: 'work-style', text: 'What does "done enough" look like for you?', populatesFiles: ['WORK_STYLE.md'] },
  { id: 'E24', section: 'work-style', text: 'Is there anything else about how you work that would be helpful to know?', populatesFiles: ['WORK_STYLE.md'] },
];

const FOS_INTERVIEW: QuestionDef[] = [
  { id: 'a1', section: 'your-story', text: 'Tell me about a moment that fundamentally changed you.', populatesFiles: ['THEMES.md', 'STRATEGIC_THOUGHT_PARTNER.md'] },
  { id: 'a2', section: 'your-story', text: "What's your single happiest memory?", populatesFiles: ['THEMES.md'] },
  { id: 'a3', section: 'your-story', text: 'Tell me about a difficult time and how you got through it.', populatesFiles: ['CRISIS_PROTOCOLS.md', 'RECOVERY_PROTOCOLS.md'] },
  { id: 'a4', section: 'your-story', text: 'Tell me about something bad that led to something good.', populatesFiles: ['THEMES.md', 'CRISIS_PROTOCOLS.md', 'STRATEGIC_THOUGHT_PARTNER.md'] },
  { id: 'b1', section: 'who-you-are', text: 'If job, relationships, and achievements were stripped away, what remains?', populatesFiles: ['THEMES.md'] },
  { id: 'b2', section: 'who-you-are', text: 'What simple thing matters a lot to you?', populatesFiles: ['THEMES.md'] },
  { id: 'b3', section: 'who-you-are', text: 'What do you need from relationships but rarely ask for?', populatesFiles: ['SUPPORT_CALIBRATION.md'] },
  { id: 'c1', section: 'work-ai', text: "When are you at your best vs worst?", populatesFiles: ['ENERGY_PATTERNS.md'] },
  { id: 'c2', section: 'work-ai', text: 'What helps you recover when things get hard?', populatesFiles: ['RECOVERY_PROTOCOLS.md'] },
  { id: 'c3', section: 'work-ai', text: 'How do you prefer to receive feedback and being challenged?', populatesFiles: ['CONVERSATION_PROTOCOLS.md', 'SUPPORT_CALIBRATION.md'] },
  { id: 'c4', section: 'work-ai', text: 'What makes you want to hang out vs just work with someone?', populatesFiles: ['CONVERSATION_PROTOCOLS.md', 'SUPPORT_CALIBRATION.md'] },
  { id: 'c5', section: 'work-ai', text: 'What are 3-4 most important considerations for your ideal AI assistant?', populatesFiles: ['WORK_STYLE.md', 'SUPPORT_CALIBRATION.md'] },
];

const VOICE_TEST: QuestionDef[] = [
  { id: 'voice_test_1', section: 'voice', text: 'Thought leadership sample - tests expertise voice', populatesFiles: ['VOICE.md', 'OPENINGS.md', 'EXAMPLES.md'] },
  { id: 'voice_test_2', section: 'voice', text: 'Personal story sample - tests vulnerability and humor', populatesFiles: ['VOICE.md', 'EXAMPLES.md'] },
  { id: 'voice_test_3', section: 'voice', text: 'Connection request sample - tests brevity and warmth', populatesFiles: ['VOICE.md', 'ENDINGS.md', 'EXAMPLES.md'] },
];

const QUESTION_SETS: QuestionSet[] = [
  {
    id: 'question-e',
    name: 'Question E: Personality Baseline',
    questions: QUESTION_E,
    populatesFiles: ['DECISION_MAKING.md', 'ENERGY_PATTERNS.md', 'CONVERSATION_PROTOCOLS.md', 'AVOIDANCE_PATTERNS.md', 'RECOVERY_PROTOCOLS.md', 'CRISIS_PROTOCOLS.md', 'WORK_STYLE.md', 'SUPPORT_CALIBRATION.md'],
  },
  {
    id: 'fos-interview',
    name: 'Founder-OS Interview (12 Questions)',
    questions: FOS_INTERVIEW,
    populatesFiles: ['THEMES.md', 'CRISIS_PROTOCOLS.md', 'RECOVERY_PROTOCOLS.md', 'STRATEGIC_THOUGHT_PARTNER.md', 'CONVERSATION_PROTOCOLS.md', 'SUPPORT_CALIBRATION.md', 'ENERGY_PATTERNS.md', 'WORK_STYLE.md'],
  },
  {
    id: 'voice-test',
    name: 'Voice Calibration (3 Samples)',
    questions: VOICE_TEST,
    populatesFiles: ['VOICE.md', 'OPENINGS.md', 'ENDINGS.md', 'EXAMPLES.md'],
  },
];

// =============================================================================
// API HANDLER
// =============================================================================

export async function GET() {
  return NextResponse.json({
    commandments: {
      voice: VOICE_COMMANDMENTS,
      founder: FOUNDER_COMMANDMENTS,
    },
    registries: REGISTRY_SCHEMAS,
    questionSets: QUESTION_SETS,
    version: '1.0',
    lastUpdated: '2026-02-02',
  });
}

// Enable CORS for edge functions
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}
