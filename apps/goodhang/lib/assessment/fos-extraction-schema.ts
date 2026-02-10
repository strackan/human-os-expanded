/**
 * Zod validation schema for the FOS Interview Extraction LLM output.
 *
 * Validates the JSON returned by Claude for extracting stories, anecdotes,
 * events, people, and parking lot items from FOS interview answers.
 */

import { z } from 'zod';

const ConfidenceEnum = z.enum(['high', 'medium', 'low']);

const StorySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().min(20),
  core_quote: z.string().min(1),
  emotional_tone: z.string().min(1),
  source_question: z.string().regex(/^[abc]\d$/),
  tags: z.array(z.string()).optional(),
  used_in: z.array(z.string()).optional(),
  confidence: ConfidenceEnum.optional(),
});

const AnecdoteSchema = z.object({
  id: z.string().optional(),
  summary: z.string().min(1),
  quote: z.string().optional(),
  illustrates: z.string().min(1),
  source_question: z.string().optional(),
  tags: z.array(z.string()).optional(),
  used_in: z.array(z.string()).optional(),
  confidence: ConfidenceEnum.optional(),
});

const EventSchema = z.object({
  id: z.string().optional(),
  date_range: z.string().optional(),
  summary: z.string().min(1),
  impact: z.string().min(1),
  source_question: z.string().optional(),
  tags: z.array(z.string()).optional(),
  used_in: z.array(z.string()).optional(),
  confidence: ConfidenceEnum.optional(),
});

const PersonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  relationship: z.string().min(1),
  context: z.string().min(1),
  can_reference: z.boolean().optional(),
  reference_rules: z.string().optional(),
  source_question: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const ParkingLotSchema = z.object({
  id: z.string().optional(),
  topic: z.string().min(1),
  priority: ConfidenceEnum.optional(),
  context: z.string().min(1),
  follow_up_questions: z.array(z.string()).optional(),
  source_question: z.string().optional(),
});

export const FosExtractionOutputSchema = z.object({
  stories: z.array(StorySchema),
  anecdotes: z.array(AnecdoteSchema),
  events: z.array(EventSchema),
  people: z.array(PersonSchema),
  parking_lot: z.array(ParkingLotSchema),
  corrections: z.array(z.any()).optional(),
});

export type ValidatedFosExtractionOutput = z.infer<typeof FosExtractionOutputSchema>;
