/**
 * Shared utilities and prompts for the goodhang application
 */

export {
  getIdentityGrounding,
  getEmotionalResistance,
  getDataGrounding,
  getFullGroundingPrompt,
  getLightweightGrounding,
  type GroundingContext,
} from './agent-grounding';

export {
  getTemperature,
  TEMPERATURE_MAP,
  type Doctype,
} from './llm-config';

export {
  extractAndValidate,
  type LLMJsonResult,
  type LLMJsonError,
} from './llm-json';
