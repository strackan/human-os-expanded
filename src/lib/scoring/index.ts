/**
 * Customer Scoring Module
 *
 * Unified scoring engine for customer health, risk, and opportunity.
 */

export * from './types';
export { CustomerScoringService } from './CustomerScoringService';
export {
  INHERSIGHT_SIGNALS,
  INHERSIGHT_TIERS,
  setupInHerSightSignals,
  mapInHerSightDataToSignals,
} from './inhersight-config';
