/**
 * Talent/Candidate Validation Schemas
 *
 * Zod schemas for talent orchestration API endpoints (Release 1.5/1.6).
 */

import { z } from 'zod';
import { CommonValidators } from '../helpers';

/**
 * Schema for creating a new candidate (public endpoint)
 * POST /api/talent/candidates
 */
export const CreateCandidateSchema = z.object({
  email: CommonValidators.email(),
  fullName: CommonValidators.nonEmptyString(),
  phone: z.string().optional(),
  linkedinUrl: CommonValidators.url().optional(),
  resumeUrl: CommonValidators.url().optional(),
  desiredRole: CommonValidators.nonEmptyString().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  location: z.string().optional(),
  willingToRelocate: z.boolean().optional(),
  referralSource: z.string().optional(),
});

/**
 * Schema for updating candidate status
 * PATCH /api/talent/candidates/[id]
 */
export const UpdateCandidateSchema = z.object({
  status: z.enum(['new', 'screening', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn']).optional(),
  stage: z.string().optional(),
  notes: z.string().optional(),
  assignedRecruiterId: CommonValidators.uuid().optional(),
  nextFollowUpDate: CommonValidators.isoDate().optional(),
});

/**
 * Schema for creating an interview session
 * POST /api/talent/interviews
 */
export const CreateInterviewSessionSchema = z.object({
  candidateId: CommonValidators.uuid(),
  interviewType: z.enum(['phone_screen', 'technical', 'behavioral', 'culture_fit', 'final']),
  scheduledAt: CommonValidators.isoDate(),
  interviewerId: CommonValidators.uuid().optional(),
  duration: z.number().int().positive().optional(),
  location: z.string().optional(),
  meetingUrl: CommonValidators.url().optional(),
});

/**
 * Schema for updating interview session results
 * PATCH /api/talent/interviews/[id]
 */
export const UpdateInterviewSessionSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
  score: z.number().int().min(1).max(10).optional(),
  feedback: z.string().optional(),
  recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']).optional(),
  completedAt: CommonValidators.isoDate().optional(),
});

/**
 * Schema for adding candidate to talent bench
 * POST /api/talent/bench
 */
export const AddToTalentBenchSchema = z.object({
  candidateId: CommonValidators.uuid(),
  skills: z.array(z.string()).min(1),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead', 'principal']),
  availability: z.enum(['immediate', 'two_weeks', 'one_month', 'flexible']),
  desiredRoles: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

/**
 * Schema for talent search query parameters
 * GET /api/talent/candidates
 */
export const TalentQuerySchema = z.object({
  status: z.string().optional(),
  skills: z.string().optional(), // comma-separated
  experienceLevel: z.string().optional(),
  location: z.string().optional(),
  availability: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
