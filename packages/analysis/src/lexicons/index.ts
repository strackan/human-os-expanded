/**
 * @human-os/analysis - Lexicons
 *
 * Keyword lexicons for emotion and competency signal detection.
 */

export {
  EMOTION_LEXICON,
  getKeywordsForEmotion,
  getLexiconStats,
} from './emotion-lexicon.js';

export {
  COMPETENCY_LEXICON,
  getKeywordsForSignal,
  getCompetencyLexiconStats,
  type CompetencyLexiconEntry,
  type CompetencyLexicon,
} from './competency-lexicon.js';
