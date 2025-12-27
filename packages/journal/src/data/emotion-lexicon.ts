/**
 * Emotion Lexicon
 *
 * Comprehensive keyword-to-emotion mapping based on:
 * - NRCLex emotional vocabulary (adapted for Plutchik 8-emotion model)
 * - creativityjournal mood definitions
 * - Common emotional expressions and intensifiers
 *
 * Each entry maps to a PlutchikEmotion with confidence (0-1) and intensity level.
 */

import type { PlutchikEmotion } from '../types.js';

export interface LexiconEntry {
  emotion: PlutchikEmotion;
  confidence: number;       // 0-1, how strongly this word indicates the emotion
  intensity: 'mild' | 'moderate' | 'intense';
}

/**
 * The emotion lexicon - 500+ keywords mapped to Plutchik emotions
 */
export const EMOTION_LEXICON: Record<string, LexiconEntry> = {
  // ===========================================================================
  // JOY (Yellow) - Happiness, pleasure, contentment
  // ===========================================================================

  // Core joy words
  happy: { emotion: 'joy', confidence: 0.85, intensity: 'moderate' },
  joy: { emotion: 'joy', confidence: 0.95, intensity: 'intense' },
  joyful: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  joyous: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  happiness: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  ecstatic: { emotion: 'joy', confidence: 0.95, intensity: 'intense' },
  ecstasy: { emotion: 'joy', confidence: 0.95, intensity: 'intense' },
  elated: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  elation: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  euphoric: { emotion: 'joy', confidence: 0.95, intensity: 'intense' },
  euphoria: { emotion: 'joy', confidence: 0.95, intensity: 'intense' },
  blissful: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  bliss: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  delighted: { emotion: 'joy', confidence: 0.85, intensity: 'intense' },
  delight: { emotion: 'joy', confidence: 0.85, intensity: 'moderate' },
  delightful: { emotion: 'joy', confidence: 0.80, intensity: 'moderate' },
  thrilled: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  overjoyed: { emotion: 'joy', confidence: 0.95, intensity: 'intense' },
  exhilarated: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  exhilaration: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  jubilant: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  jubilation: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  exuberant: { emotion: 'joy', confidence: 0.85, intensity: 'intense' },
  exuberance: { emotion: 'joy', confidence: 0.85, intensity: 'intense' },
  gleeful: { emotion: 'joy', confidence: 0.80, intensity: 'moderate' },
  glee: { emotion: 'joy', confidence: 0.80, intensity: 'moderate' },
  rapture: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },
  rapturous: { emotion: 'joy', confidence: 0.90, intensity: 'intense' },

  // Moderate joy
  pleased: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  pleasure: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  pleasant: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },
  cheerful: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  cheery: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  merry: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  jolly: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  sunny: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },
  upbeat: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  chipper: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  buoyant: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  lighthearted: { emotion: 'joy', confidence: 0.65, intensity: 'moderate' },
  carefree: { emotion: 'joy', confidence: 0.65, intensity: 'moderate' },
  playful: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },
  festive: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },

  // Mild joy / contentment
  content: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },
  contented: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },
  contentment: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },
  satisfied: { emotion: 'joy', confidence: 0.65, intensity: 'mild' },
  satisfaction: { emotion: 'joy', confidence: 0.65, intensity: 'mild' },
  fulfillment: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  fulfilled: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  comfortable: { emotion: 'joy', confidence: 0.50, intensity: 'mild' },
  glad: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  good: { emotion: 'joy', confidence: 0.50, intensity: 'mild' },
  nice: { emotion: 'joy', confidence: 0.45, intensity: 'mild' },
  fine: { emotion: 'joy', confidence: 0.40, intensity: 'mild' },
  okay: { emotion: 'joy', confidence: 0.35, intensity: 'mild' },

  // Joy expressions
  wonderful: { emotion: 'joy', confidence: 0.80, intensity: 'moderate' },
  fantastic: { emotion: 'joy', confidence: 0.85, intensity: 'intense' },
  amazing: { emotion: 'joy', confidence: 0.80, intensity: 'moderate' },
  awesome: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  great: { emotion: 'joy', confidence: 0.65, intensity: 'moderate' },
  excellent: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  terrific: { emotion: 'joy', confidence: 0.80, intensity: 'moderate' },
  marvelous: { emotion: 'joy', confidence: 0.80, intensity: 'moderate' },
  brilliant: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  superb: { emotion: 'joy', confidence: 0.80, intensity: 'moderate' },
  splendid: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  glorious: { emotion: 'joy', confidence: 0.80, intensity: 'intense' },
  magnificent: { emotion: 'joy', confidence: 0.80, intensity: 'intense' },
  divine: { emotion: 'joy', confidence: 0.75, intensity: 'intense' },
  heavenly: { emotion: 'joy', confidence: 0.80, intensity: 'intense' },

  // Gratitude (joy-adjacent)
  grateful: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  gratitude: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  thankful: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  appreciative: { emotion: 'joy', confidence: 0.65, intensity: 'moderate' },
  blessed: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  fortunate: { emotion: 'joy', confidence: 0.65, intensity: 'moderate' },
  lucky: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },

  // Pride (joy variant)
  proud: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  pride: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  accomplished: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  achievement: { emotion: 'joy', confidence: 0.65, intensity: 'moderate' },
  successful: { emotion: 'joy', confidence: 0.65, intensity: 'moderate' },
  triumph: { emotion: 'joy', confidence: 0.80, intensity: 'intense' },
  triumphant: { emotion: 'joy', confidence: 0.80, intensity: 'intense' },
  victorious: { emotion: 'joy', confidence: 0.80, intensity: 'intense' },
  victory: { emotion: 'joy', confidence: 0.75, intensity: 'intense' },

  // Amusement (joy variant)
  amused: { emotion: 'joy', confidence: 0.65, intensity: 'mild' },
  amusement: { emotion: 'joy', confidence: 0.65, intensity: 'mild' },
  entertained: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },
  fun: { emotion: 'joy', confidence: 0.65, intensity: 'moderate' },
  funny: { emotion: 'joy', confidence: 0.60, intensity: 'mild' },
  hilarious: { emotion: 'joy', confidence: 0.75, intensity: 'moderate' },
  laughing: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },
  laughter: { emotion: 'joy', confidence: 0.70, intensity: 'moderate' },

  // ===========================================================================
  // TRUST (Green) - Acceptance, admiration, security
  // ===========================================================================

  // Core trust words
  trust: { emotion: 'trust', confidence: 0.90, intensity: 'moderate' },
  trusting: { emotion: 'trust', confidence: 0.85, intensity: 'moderate' },
  trustworthy: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  reliable: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  dependable: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  faithful: { emotion: 'trust', confidence: 0.85, intensity: 'moderate' },
  loyalty: { emotion: 'trust', confidence: 0.85, intensity: 'moderate' },
  loyal: { emotion: 'trust', confidence: 0.85, intensity: 'moderate' },
  devoted: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  devotion: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  honest: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  honesty: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  sincere: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  sincerity: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  genuine: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  authentic: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },

  // Admiration (intense trust)
  admire: { emotion: 'trust', confidence: 0.80, intensity: 'intense' },
  admiration: { emotion: 'trust', confidence: 0.80, intensity: 'intense' },
  admiring: { emotion: 'trust', confidence: 0.80, intensity: 'intense' },
  respect: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  respectable: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  respected: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  revere: { emotion: 'trust', confidence: 0.85, intensity: 'intense' },
  reverence: { emotion: 'trust', confidence: 0.85, intensity: 'intense' },
  esteem: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  esteemed: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },
  honor: { emotion: 'trust', confidence: 0.80, intensity: 'intense' },
  honorable: { emotion: 'trust', confidence: 0.80, intensity: 'moderate' },

  // Acceptance (mild trust)
  accept: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },
  accepting: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },
  acceptance: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },
  tolerant: { emotion: 'trust', confidence: 0.60, intensity: 'mild' },
  tolerance: { emotion: 'trust', confidence: 0.60, intensity: 'mild' },
  understanding: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },
  empathetic: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  empathy: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  compassionate: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  compassion: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  forgiving: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  forgiveness: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },

  // Security (trust state)
  safe: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  safety: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  secure: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  security: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  protected: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  sheltered: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },
  stable: { emotion: 'trust', confidence: 0.65, intensity: 'moderate' },
  stability: { emotion: 'trust', confidence: 0.65, intensity: 'moderate' },
  grounded: { emotion: 'trust', confidence: 0.65, intensity: 'moderate' },
  anchored: { emotion: 'trust', confidence: 0.60, intensity: 'moderate' },

  // Calm (trust-adjacent)
  calm: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },
  calming: { emotion: 'trust', confidence: 0.60, intensity: 'mild' },
  peaceful: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  peace: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  serene: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  serenity: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  tranquil: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  tranquility: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  relaxed: { emotion: 'trust', confidence: 0.60, intensity: 'mild' },
  soothing: { emotion: 'trust', confidence: 0.60, intensity: 'mild' },
  comforting: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },
  reassuring: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  reassured: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },

  // Connection (trust in relationships)
  connected: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  connection: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  belonging: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  included: { emotion: 'trust', confidence: 0.65, intensity: 'moderate' },
  supported: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  supportive: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  valued: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  cherished: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  appreciated: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },

  // ===========================================================================
  // FEAR (Purple) - Anxiety, worry, terror
  // ===========================================================================

  // Core fear words
  fear: { emotion: 'fear', confidence: 0.90, intensity: 'moderate' },
  fearful: { emotion: 'fear', confidence: 0.85, intensity: 'moderate' },
  afraid: { emotion: 'fear', confidence: 0.85, intensity: 'moderate' },
  scared: { emotion: 'fear', confidence: 0.85, intensity: 'moderate' },
  frightened: { emotion: 'fear', confidence: 0.85, intensity: 'moderate' },
  terrified: { emotion: 'fear', confidence: 0.95, intensity: 'intense' },
  terror: { emotion: 'fear', confidence: 0.95, intensity: 'intense' },
  horrified: { emotion: 'fear', confidence: 0.95, intensity: 'intense' },
  horror: { emotion: 'fear', confidence: 0.90, intensity: 'intense' },
  petrified: { emotion: 'fear', confidence: 0.95, intensity: 'intense' },
  panicked: { emotion: 'fear', confidence: 0.90, intensity: 'intense' },
  panic: { emotion: 'fear', confidence: 0.90, intensity: 'intense' },
  panicking: { emotion: 'fear', confidence: 0.90, intensity: 'intense' },
  phobia: { emotion: 'fear', confidence: 0.85, intensity: 'intense' },
  dread: { emotion: 'fear', confidence: 0.85, intensity: 'intense' },
  dreading: { emotion: 'fear', confidence: 0.80, intensity: 'moderate' },

  // Anxiety (fear variant)
  anxious: { emotion: 'fear', confidence: 0.80, intensity: 'moderate' },
  anxiety: { emotion: 'fear', confidence: 0.80, intensity: 'moderate' },
  nervous: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  nervousness: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  worried: { emotion: 'fear', confidence: 0.75, intensity: 'moderate' },
  worry: { emotion: 'fear', confidence: 0.75, intensity: 'moderate' },
  worrying: { emotion: 'fear', confidence: 0.75, intensity: 'moderate' },
  worries: { emotion: 'fear', confidence: 0.75, intensity: 'moderate' },
  apprehensive: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  apprehension: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  uneasy: { emotion: 'fear', confidence: 0.65, intensity: 'mild' },
  unease: { emotion: 'fear', confidence: 0.65, intensity: 'mild' },
  tense: { emotion: 'fear', confidence: 0.60, intensity: 'mild' },
  tension: { emotion: 'fear', confidence: 0.60, intensity: 'mild' },
  stressed: { emotion: 'fear', confidence: 0.65, intensity: 'moderate' },
  stress: { emotion: 'fear', confidence: 0.65, intensity: 'moderate' },
  stressful: { emotion: 'fear', confidence: 0.65, intensity: 'moderate' },

  // Overwhelm (fear response)
  overwhelmed: { emotion: 'fear', confidence: 0.75, intensity: 'intense' },
  overwhelming: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  paralyzed: { emotion: 'fear', confidence: 0.80, intensity: 'intense' },
  frozen: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  helpless: { emotion: 'fear', confidence: 0.75, intensity: 'intense' },
  helplessness: { emotion: 'fear', confidence: 0.75, intensity: 'intense' },
  powerless: { emotion: 'fear', confidence: 0.75, intensity: 'intense' },
  vulnerable: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  vulnerability: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  exposed: { emotion: 'fear', confidence: 0.60, intensity: 'moderate' },
  threatened: { emotion: 'fear', confidence: 0.75, intensity: 'moderate' },
  threatening: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  threat: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },
  danger: { emotion: 'fear', confidence: 0.75, intensity: 'moderate' },
  dangerous: { emotion: 'fear', confidence: 0.70, intensity: 'moderate' },

  // Mild fear / concern
  concerned: { emotion: 'fear', confidence: 0.55, intensity: 'mild' },
  concern: { emotion: 'fear', confidence: 0.55, intensity: 'mild' },
  hesitant: { emotion: 'fear', confidence: 0.50, intensity: 'mild' },
  hesitation: { emotion: 'fear', confidence: 0.50, intensity: 'mild' },
  doubtful: { emotion: 'fear', confidence: 0.55, intensity: 'mild' },
  doubt: { emotion: 'fear', confidence: 0.55, intensity: 'mild' },
  uncertain: { emotion: 'fear', confidence: 0.55, intensity: 'mild' },
  uncertainty: { emotion: 'fear', confidence: 0.55, intensity: 'mild' },
  insecure: { emotion: 'fear', confidence: 0.65, intensity: 'moderate' },
  insecurity: { emotion: 'fear', confidence: 0.65, intensity: 'moderate' },
  timid: { emotion: 'fear', confidence: 0.55, intensity: 'mild' },
  shy: { emotion: 'fear', confidence: 0.45, intensity: 'mild' },
  cautious: { emotion: 'fear', confidence: 0.45, intensity: 'mild' },
  wary: { emotion: 'fear', confidence: 0.55, intensity: 'mild' },

  // ===========================================================================
  // SURPRISE (Pink) - Amazement, confusion, shock
  // ===========================================================================

  // Core surprise words
  surprise: { emotion: 'surprise', confidence: 0.90, intensity: 'moderate' },
  surprised: { emotion: 'surprise', confidence: 0.85, intensity: 'moderate' },
  surprising: { emotion: 'surprise', confidence: 0.80, intensity: 'moderate' },
  amazed: { emotion: 'surprise', confidence: 0.85, intensity: 'intense' },
  amazement: { emotion: 'surprise', confidence: 0.85, intensity: 'intense' },
  astonished: { emotion: 'surprise', confidence: 0.90, intensity: 'intense' },
  astonishment: { emotion: 'surprise', confidence: 0.90, intensity: 'intense' },
  astounded: { emotion: 'surprise', confidence: 0.90, intensity: 'intense' },
  shocked: { emotion: 'surprise', confidence: 0.85, intensity: 'intense' },
  shock: { emotion: 'surprise', confidence: 0.80, intensity: 'intense' },
  shocking: { emotion: 'surprise', confidence: 0.80, intensity: 'moderate' },
  stunned: { emotion: 'surprise', confidence: 0.85, intensity: 'intense' },
  startled: { emotion: 'surprise', confidence: 0.75, intensity: 'moderate' },
  flabbergasted: { emotion: 'surprise', confidence: 0.90, intensity: 'intense' },
  dumbfounded: { emotion: 'surprise', confidence: 0.85, intensity: 'intense' },
  speechless: { emotion: 'surprise', confidence: 0.80, intensity: 'intense' },
  awestruck: { emotion: 'surprise', confidence: 0.85, intensity: 'intense' },
  awe: { emotion: 'surprise', confidence: 0.80, intensity: 'intense' },

  // Wonder (positive surprise)
  wonder: { emotion: 'surprise', confidence: 0.75, intensity: 'moderate' },
  wondrous: { emotion: 'surprise', confidence: 0.75, intensity: 'moderate' },
  fascinated: { emotion: 'surprise', confidence: 0.70, intensity: 'moderate' },
  fascination: { emotion: 'surprise', confidence: 0.70, intensity: 'moderate' },
  fascinating: { emotion: 'surprise', confidence: 0.65, intensity: 'moderate' },
  intrigued: { emotion: 'surprise', confidence: 0.65, intensity: 'moderate' },
  intriguing: { emotion: 'surprise', confidence: 0.60, intensity: 'mild' },
  curious: { emotion: 'surprise', confidence: 0.55, intensity: 'mild' },
  curiosity: { emotion: 'surprise', confidence: 0.55, intensity: 'mild' },
  captivated: { emotion: 'surprise', confidence: 0.70, intensity: 'moderate' },
  mesmerized: { emotion: 'surprise', confidence: 0.75, intensity: 'moderate' },
  spellbound: { emotion: 'surprise', confidence: 0.75, intensity: 'moderate' },

  // Confusion (neutral surprise)
  confused: { emotion: 'surprise', confidence: 0.60, intensity: 'mild' },
  confusion: { emotion: 'surprise', confidence: 0.60, intensity: 'mild' },
  bewildered: { emotion: 'surprise', confidence: 0.70, intensity: 'moderate' },
  bewilderment: { emotion: 'surprise', confidence: 0.70, intensity: 'moderate' },
  perplexed: { emotion: 'surprise', confidence: 0.65, intensity: 'moderate' },
  puzzled: { emotion: 'surprise', confidence: 0.60, intensity: 'mild' },
  baffled: { emotion: 'surprise', confidence: 0.70, intensity: 'moderate' },
  disoriented: { emotion: 'surprise', confidence: 0.60, intensity: 'moderate' },
  unexpected: { emotion: 'surprise', confidence: 0.70, intensity: 'moderate' },
  unprepared: { emotion: 'surprise', confidence: 0.55, intensity: 'mild' },
  blindsided: { emotion: 'surprise', confidence: 0.80, intensity: 'intense' },

  // ===========================================================================
  // SADNESS (Blue) - Grief, loneliness, despair
  // ===========================================================================

  // Core sadness words
  sad: { emotion: 'sadness', confidence: 0.85, intensity: 'moderate' },
  sadness: { emotion: 'sadness', confidence: 0.85, intensity: 'moderate' },
  unhappy: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  sorrow: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  sorrowful: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  grief: { emotion: 'sadness', confidence: 0.95, intensity: 'intense' },
  grieving: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  mourning: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  mourn: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  heartbroken: { emotion: 'sadness', confidence: 0.95, intensity: 'intense' },
  heartbreak: { emotion: 'sadness', confidence: 0.95, intensity: 'intense' },
  devastated: { emotion: 'sadness', confidence: 0.95, intensity: 'intense' },
  devastation: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  crushed: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  shattered: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  anguish: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  anguished: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  despair: { emotion: 'sadness', confidence: 0.95, intensity: 'intense' },
  despairing: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  desolate: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  desolation: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  miserable: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  misery: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  wretched: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  tormented: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  suffering: { emotion: 'sadness', confidence: 0.80, intensity: 'intense' },
  suffer: { emotion: 'sadness', confidence: 0.80, intensity: 'intense' },

  // Depression (intense sadness)
  depressed: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  depression: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  hopeless: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  hopelessness: { emotion: 'sadness', confidence: 0.90, intensity: 'intense' },
  dejected: { emotion: 'sadness', confidence: 0.80, intensity: 'moderate' },
  despondent: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  melancholy: { emotion: 'sadness', confidence: 0.80, intensity: 'moderate' },
  melancholic: { emotion: 'sadness', confidence: 0.80, intensity: 'moderate' },
  gloomy: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  gloom: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  bleak: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  dismal: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  dreary: { emotion: 'sadness', confidence: 0.60, intensity: 'mild' },
  somber: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },

  // Loneliness (sadness variant)
  lonely: { emotion: 'sadness', confidence: 0.80, intensity: 'moderate' },
  loneliness: { emotion: 'sadness', confidence: 0.80, intensity: 'moderate' },
  alone: { emotion: 'sadness', confidence: 0.60, intensity: 'mild' },
  isolated: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  isolation: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  abandoned: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  abandonment: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  forsaken: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  rejected: { emotion: 'sadness', confidence: 0.80, intensity: 'moderate' },
  rejection: { emotion: 'sadness', confidence: 0.80, intensity: 'moderate' },
  excluded: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  unloved: { emotion: 'sadness', confidence: 0.80, intensity: 'intense' },
  unwanted: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  forgotten: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  neglected: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },

  // Disappointment (mild sadness)
  disappointed: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  disappointment: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  disappointing: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  letdown: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  discouraged: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  discouragement: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  disheartened: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  downhearted: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  down: { emotion: 'sadness', confidence: 0.55, intensity: 'mild' },
  blue: { emotion: 'sadness', confidence: 0.60, intensity: 'mild' },
  bummed: { emotion: 'sadness', confidence: 0.55, intensity: 'mild' },
  upset: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  hurt: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  wounded: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  pained: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  aching: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },

  // Crying/tears
  crying: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  tears: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  tearful: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  weeping: { emotion: 'sadness', confidence: 0.80, intensity: 'intense' },
  sobbing: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },

  // ===========================================================================
  // ANTICIPATION (Lime/Green) - Expectation, hope, vigilance
  // ===========================================================================

  // Core anticipation words
  anticipate: { emotion: 'anticipation', confidence: 0.90, intensity: 'moderate' },
  anticipating: { emotion: 'anticipation', confidence: 0.85, intensity: 'moderate' },
  anticipation: { emotion: 'anticipation', confidence: 0.90, intensity: 'moderate' },
  expect: { emotion: 'anticipation', confidence: 0.70, intensity: 'mild' },
  expecting: { emotion: 'anticipation', confidence: 0.70, intensity: 'mild' },
  expectation: { emotion: 'anticipation', confidence: 0.70, intensity: 'mild' },
  expectant: { emotion: 'anticipation', confidence: 0.75, intensity: 'moderate' },
  eager: { emotion: 'anticipation', confidence: 0.80, intensity: 'moderate' },
  eagerness: { emotion: 'anticipation', confidence: 0.80, intensity: 'moderate' },
  eagerly: { emotion: 'anticipation', confidence: 0.75, intensity: 'moderate' },
  excited: { emotion: 'anticipation', confidence: 0.80, intensity: 'intense' },
  excitement: { emotion: 'anticipation', confidence: 0.80, intensity: 'intense' },
  exciting: { emotion: 'anticipation', confidence: 0.75, intensity: 'moderate' },
  enthusiastic: { emotion: 'anticipation', confidence: 0.80, intensity: 'moderate' },
  enthusiasm: { emotion: 'anticipation', confidence: 0.80, intensity: 'moderate' },
  passionate: { emotion: 'anticipation', confidence: 0.80, intensity: 'intense' },
  passion: { emotion: 'anticipation', confidence: 0.80, intensity: 'intense' },
  zealous: { emotion: 'anticipation', confidence: 0.80, intensity: 'intense' },
  zeal: { emotion: 'anticipation', confidence: 0.80, intensity: 'intense' },

  // Hope (anticipation variant)
  hope: { emotion: 'anticipation', confidence: 0.80, intensity: 'moderate' },
  hopeful: { emotion: 'anticipation', confidence: 0.80, intensity: 'moderate' },
  hoping: { emotion: 'anticipation', confidence: 0.75, intensity: 'moderate' },
  optimistic: { emotion: 'anticipation', confidence: 0.75, intensity: 'moderate' },
  optimism: { emotion: 'anticipation', confidence: 0.75, intensity: 'moderate' },
  positive: { emotion: 'anticipation', confidence: 0.60, intensity: 'mild' },
  promising: { emotion: 'anticipation', confidence: 0.65, intensity: 'moderate' },
  potential: { emotion: 'anticipation', confidence: 0.55, intensity: 'mild' },

  // Looking forward
  'looking forward': { emotion: 'anticipation', confidence: 0.80, intensity: 'moderate' },
  await: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  awaiting: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  impatient: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  impatience: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  restless: { emotion: 'anticipation', confidence: 0.60, intensity: 'moderate' },
  'can\'t wait': { emotion: 'anticipation', confidence: 0.85, intensity: 'intense' },

  // Interest (mild anticipation)
  interested: { emotion: 'anticipation', confidence: 0.60, intensity: 'mild' },
  interest: { emotion: 'anticipation', confidence: 0.55, intensity: 'mild' },
  interesting: { emotion: 'anticipation', confidence: 0.50, intensity: 'mild' },
  engaged: { emotion: 'anticipation', confidence: 0.60, intensity: 'mild' },
  engagement: { emotion: 'anticipation', confidence: 0.55, intensity: 'mild' },
  motivated: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  motivation: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  driven: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  ambitious: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  ambition: { emotion: 'anticipation', confidence: 0.70, intensity: 'moderate' },
  determined: { emotion: 'anticipation', confidence: 0.75, intensity: 'moderate' },
  determination: { emotion: 'anticipation', confidence: 0.75, intensity: 'moderate' },
  focused: { emotion: 'anticipation', confidence: 0.60, intensity: 'mild' },

  // Vigilance (intense anticipation)
  vigilant: { emotion: 'anticipation', confidence: 0.75, intensity: 'intense' },
  vigilance: { emotion: 'anticipation', confidence: 0.75, intensity: 'intense' },
  alert: { emotion: 'anticipation', confidence: 0.60, intensity: 'moderate' },
  attentive: { emotion: 'anticipation', confidence: 0.60, intensity: 'moderate' },
  watchful: { emotion: 'anticipation', confidence: 0.65, intensity: 'moderate' },
  ready: { emotion: 'anticipation', confidence: 0.55, intensity: 'mild' },
  prepared: { emotion: 'anticipation', confidence: 0.55, intensity: 'mild' },

  // ===========================================================================
  // ANGER (Red) - Frustration, rage, annoyance
  // ===========================================================================

  // Core anger words
  angry: { emotion: 'anger', confidence: 0.85, intensity: 'moderate' },
  anger: { emotion: 'anger', confidence: 0.90, intensity: 'moderate' },
  mad: { emotion: 'anger', confidence: 0.75, intensity: 'moderate' },
  furious: { emotion: 'anger', confidence: 0.95, intensity: 'intense' },
  fury: { emotion: 'anger', confidence: 0.95, intensity: 'intense' },
  enraged: { emotion: 'anger', confidence: 0.95, intensity: 'intense' },
  rage: { emotion: 'anger', confidence: 0.95, intensity: 'intense' },
  raging: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },
  livid: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },
  outraged: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },
  outrage: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  incensed: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },
  infuriated: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },
  seething: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  irate: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  wrathful: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },
  wrath: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },

  // Frustration (moderate anger)
  frustrated: { emotion: 'anger', confidence: 0.80, intensity: 'moderate' },
  frustration: { emotion: 'anger', confidence: 0.80, intensity: 'moderate' },
  frustrating: { emotion: 'anger', confidence: 0.75, intensity: 'moderate' },
  exasperated: { emotion: 'anger', confidence: 0.80, intensity: 'moderate' },
  exasperation: { emotion: 'anger', confidence: 0.80, intensity: 'moderate' },
  aggravated: { emotion: 'anger', confidence: 0.75, intensity: 'moderate' },
  agitated: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },

  // Annoyance (mild anger)
  annoyed: { emotion: 'anger', confidence: 0.65, intensity: 'mild' },
  annoyance: { emotion: 'anger', confidence: 0.65, intensity: 'mild' },
  annoying: { emotion: 'anger', confidence: 0.60, intensity: 'mild' },
  irritated: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },
  irritation: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },
  irritating: { emotion: 'anger', confidence: 0.65, intensity: 'mild' },
  bothered: { emotion: 'anger', confidence: 0.55, intensity: 'mild' },
  displeased: { emotion: 'anger', confidence: 0.60, intensity: 'mild' },
  displeasure: { emotion: 'anger', confidence: 0.60, intensity: 'mild' },
  vexed: { emotion: 'anger', confidence: 0.65, intensity: 'mild' },
  peeved: { emotion: 'anger', confidence: 0.60, intensity: 'mild' },
  irked: { emotion: 'anger', confidence: 0.60, intensity: 'mild' },

  // Hostility (anger with aggression)
  hostile: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  hostility: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  aggressive: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  aggression: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  violent: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  violence: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  combative: { emotion: 'anger', confidence: 0.75, intensity: 'intense' },
  confrontational: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },
  belligerent: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  antagonistic: { emotion: 'anger', confidence: 0.75, intensity: 'moderate' },
  hateful: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },
  hatred: { emotion: 'anger', confidence: 0.90, intensity: 'intense' },
  hate: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  hating: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  loathe: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  loathing: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  despise: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  detest: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },
  abhor: { emotion: 'anger', confidence: 0.85, intensity: 'intense' },

  // Resentment (sustained anger)
  resentful: { emotion: 'anger', confidence: 0.75, intensity: 'moderate' },
  resentment: { emotion: 'anger', confidence: 0.75, intensity: 'moderate' },
  bitter: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },
  bitterness: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },
  vengeful: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  vengeance: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  spiteful: { emotion: 'anger', confidence: 0.75, intensity: 'moderate' },
  spite: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },
  vindictive: { emotion: 'anger', confidence: 0.80, intensity: 'intense' },
  grudge: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },

  // ===========================================================================
  // DISGUST (Teal) - Contempt, aversion, revulsion
  // ===========================================================================

  // Core disgust words
  disgust: { emotion: 'disgust', confidence: 0.90, intensity: 'moderate' },
  disgusted: { emotion: 'disgust', confidence: 0.90, intensity: 'moderate' },
  disgusting: { emotion: 'disgust', confidence: 0.85, intensity: 'moderate' },
  repulsed: { emotion: 'disgust', confidence: 0.90, intensity: 'intense' },
  repulsion: { emotion: 'disgust', confidence: 0.90, intensity: 'intense' },
  repulsive: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  revolted: { emotion: 'disgust', confidence: 0.90, intensity: 'intense' },
  revolting: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  revulsion: { emotion: 'disgust', confidence: 0.90, intensity: 'intense' },
  repugnant: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  repugnance: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  nauseated: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  nausea: { emotion: 'disgust', confidence: 0.80, intensity: 'moderate' },
  sickened: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  sickening: { emotion: 'disgust', confidence: 0.80, intensity: 'intense' },
  gross: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },
  vile: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  foul: { emotion: 'disgust', confidence: 0.80, intensity: 'moderate' },
  nasty: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },

  // Contempt (disgust toward people)
  contempt: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  contemptuous: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  disdain: { emotion: 'disgust', confidence: 0.80, intensity: 'moderate' },
  disdainful: { emotion: 'disgust', confidence: 0.80, intensity: 'moderate' },
  scorn: { emotion: 'disgust', confidence: 0.80, intensity: 'intense' },
  scornful: { emotion: 'disgust', confidence: 0.80, intensity: 'intense' },
  dismissive: { emotion: 'disgust', confidence: 0.60, intensity: 'mild' },
  condescending: { emotion: 'disgust', confidence: 0.65, intensity: 'moderate' },
  snobbish: { emotion: 'disgust', confidence: 0.60, intensity: 'mild' },
  arrogant: { emotion: 'disgust', confidence: 0.55, intensity: 'mild' },
  haughty: { emotion: 'disgust', confidence: 0.60, intensity: 'moderate' },

  // Aversion (mild disgust)
  aversion: { emotion: 'disgust', confidence: 0.75, intensity: 'moderate' },
  averse: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },
  dislike: { emotion: 'disgust', confidence: 0.60, intensity: 'mild' },
  distaste: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },
  distasteful: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },
  unpleasant: { emotion: 'disgust', confidence: 0.55, intensity: 'mild' },
  repelled: { emotion: 'disgust', confidence: 0.75, intensity: 'moderate' },
  offended: { emotion: 'disgust', confidence: 0.65, intensity: 'moderate' },
  offensive: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },
  appalled: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  appalling: { emotion: 'disgust', confidence: 0.80, intensity: 'intense' },
  horrifying: { emotion: 'disgust', confidence: 0.80, intensity: 'intense' },

  // Moral disgust
  shameful: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },
  disgraceful: { emotion: 'disgust', confidence: 0.75, intensity: 'moderate' },
  deplorable: { emotion: 'disgust', confidence: 0.80, intensity: 'intense' },
  despicable: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  abominable: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  atrocious: { emotion: 'disgust', confidence: 0.85, intensity: 'intense' },
  heinous: { emotion: 'disgust', confidence: 0.90, intensity: 'intense' },
  wicked: { emotion: 'disgust', confidence: 0.75, intensity: 'intense' },
  evil: { emotion: 'disgust', confidence: 0.80, intensity: 'intense' },
  corrupt: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },
  immoral: { emotion: 'disgust', confidence: 0.70, intensity: 'moderate' },

  // ===========================================================================
  // MIXED EMOTIONS / COMPLEX STATES
  // ===========================================================================

  // Love (joy + trust)
  love: { emotion: 'trust', confidence: 0.85, intensity: 'intense' },
  loving: { emotion: 'trust', confidence: 0.85, intensity: 'moderate' },
  beloved: { emotion: 'trust', confidence: 0.80, intensity: 'intense' },
  adore: { emotion: 'trust', confidence: 0.85, intensity: 'intense' },
  adoring: { emotion: 'trust', confidence: 0.85, intensity: 'intense' },
  affection: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  affectionate: { emotion: 'trust', confidence: 0.75, intensity: 'moderate' },
  tenderness: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  tender: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },
  warmth: { emotion: 'trust', confidence: 0.65, intensity: 'moderate' },
  fondness: { emotion: 'trust', confidence: 0.70, intensity: 'moderate' },
  fond: { emotion: 'trust', confidence: 0.65, intensity: 'mild' },

  // Nostalgia (joy + sadness)
  nostalgic: { emotion: 'sadness', confidence: 0.60, intensity: 'moderate' },
  nostalgia: { emotion: 'sadness', confidence: 0.60, intensity: 'moderate' },
  wistful: { emotion: 'sadness', confidence: 0.55, intensity: 'mild' },
  bittersweet: { emotion: 'sadness', confidence: 0.60, intensity: 'moderate' },
  longing: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  yearning: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  missing: { emotion: 'sadness', confidence: 0.60, intensity: 'moderate' },
  pining: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },

  // Guilt/Shame (sadness + disgust)
  guilty: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  guilt: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  ashamed: { emotion: 'sadness', confidence: 0.80, intensity: 'intense' },
  shame: { emotion: 'sadness', confidence: 0.80, intensity: 'intense' },
  embarrassed: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  embarrassment: { emotion: 'sadness', confidence: 0.65, intensity: 'moderate' },
  humiliated: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  humiliation: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  mortified: { emotion: 'sadness', confidence: 0.85, intensity: 'intense' },
  regret: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  regretful: { emotion: 'sadness', confidence: 0.70, intensity: 'moderate' },
  remorse: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },
  remorseful: { emotion: 'sadness', confidence: 0.75, intensity: 'moderate' },

  // Jealousy/Envy (anger + sadness)
  jealous: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },
  jealousy: { emotion: 'anger', confidence: 0.70, intensity: 'moderate' },
  envious: { emotion: 'anger', confidence: 0.65, intensity: 'moderate' },
  envy: { emotion: 'anger', confidence: 0.65, intensity: 'moderate' },
  covetous: { emotion: 'anger', confidence: 0.60, intensity: 'moderate' },

  // Boredom (mild disgust + mild sadness)
  bored: { emotion: 'disgust', confidence: 0.50, intensity: 'mild' },
  boredom: { emotion: 'disgust', confidence: 0.50, intensity: 'mild' },
  boring: { emotion: 'disgust', confidence: 0.45, intensity: 'mild' },
  tedious: { emotion: 'disgust', confidence: 0.50, intensity: 'mild' },
  monotonous: { emotion: 'disgust', confidence: 0.45, intensity: 'mild' },
  dull: { emotion: 'disgust', confidence: 0.45, intensity: 'mild' },
  uninterested: { emotion: 'disgust', confidence: 0.45, intensity: 'mild' },
  indifferent: { emotion: 'disgust', confidence: 0.40, intensity: 'mild' },
  apathetic: { emotion: 'disgust', confidence: 0.50, intensity: 'mild' },
  apathy: { emotion: 'disgust', confidence: 0.50, intensity: 'mild' },

  // ===========================================================================
  // NEGATION CONTEXT (lower confidence due to context dependency)
  // ===========================================================================

  // These might appear in negative constructions like "not happy"
  // but we can't detect negation with simple keyword matching
  // so we include them with standard confidence

  // ===========================================================================
  // INTENSIFIERS (these affect nearby emotions)
  // Not directly mapped to emotions - used for context
  // ===========================================================================

  // Note: In a more sophisticated implementation, we would use these
  // to modify the intensity of adjacent emotional words.
  // For now, they are not included in the lexicon.
};

/**
 * Get all keywords for a specific emotion
 */
export function getKeywordsForEmotion(emotion: PlutchikEmotion): string[] {
  return Object.entries(EMOTION_LEXICON)
    .filter(([_, entry]) => entry.emotion === emotion)
    .map(([word]) => word);
}

/**
 * Get lexicon statistics
 */
export function getLexiconStats(): {
  total: number;
  byEmotion: Record<PlutchikEmotion, number>;
  byIntensity: Record<string, number>;
} {
  const byEmotion: Record<PlutchikEmotion, number> = {
    joy: 0, trust: 0, fear: 0, surprise: 0,
    sadness: 0, anticipation: 0, anger: 0, disgust: 0,
  };
  const byIntensity: Record<string, number> = {
    mild: 0, moderate: 0, intense: 0,
  };

  for (const entry of Object.values(EMOTION_LEXICON)) {
    byEmotion[entry.emotion]++;
    const intensity = entry.intensity;
    if (intensity && byIntensity[intensity] !== undefined) {
      byIntensity[intensity]++;
    }
  }

  return {
    total: Object.keys(EMOTION_LEXICON).length,
    byEmotion,
    byIntensity,
  };
}
