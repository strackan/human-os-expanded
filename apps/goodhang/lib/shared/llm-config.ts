/**
 * Centralized LLM configuration: temperature map by document/task type.
 *
 * Each API call should tag its task with a Doctype and use getTemperature()
 * instead of hardcoding a temperature value.
 */

export type Doctype =
  | 'extraction'
  | 'scoring'
  | 'structured-generation'
  | 'conversational'
  | 'reflective'
  | 'creative'
  | 'theatrical';

export const TEMPERATURE_MAP: Record<Doctype, number> = {
  extraction: 0.2,
  scoring: 0.3,
  'structured-generation': 0.5,
  conversational: 0.7,
  reflective: 0.7,
  creative: 0.8,
  theatrical: 0.9,
};

export function getTemperature(doctype: Doctype): number {
  return TEMPERATURE_MAP[doctype];
}
