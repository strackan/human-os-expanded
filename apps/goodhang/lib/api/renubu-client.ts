/**
 * Renubu API Client for GoodHang
 *
 * Handles all communication with Renubu backend API for:
 * - CS Assessment interviews
 * - Candidate scoring
 * - Results retrieval
 */

import { createClient } from '@/lib/supabase/client';

const RENUBU_API_URL = process.env.NEXT_PUBLIC_RENUBU_API_URL || 'https://renubu.vercel.app';

export interface AssessmentQuestion {
  id: string;
  section: string;
  order: number;
  text: string;
  type: 'open_ended' | 'scale' | 'multiple_choice';
  dimensions: string[];
  required: boolean;
  followUp?: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  order: number;
  transitionMessage?: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentConfig {
  id: string;
  title: string;
  version: string;
  estimatedMinutes: number;
  sections: AssessmentSection[];
  completionMessage: string;
}

export interface StartAssessmentResponse {
  candidate_id: string;
  assessment: AssessmentConfig;
  message: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  message: string;
  question_id: string;
}

export interface CompleteAssessmentResponse {
  success: boolean;
  message: string;
  candidate_id: string;
  tier: 'top_1' | 'benched' | 'passed';
  overall_score: number;
  archetype: string;
}

export interface AssessmentResults {
  candidate_id: string;
  name: string;
  email: string;
  status: string;
  tier: 'top_1' | 'benched' | 'passed';
  overall_score: number;
  archetype: string;
  archetype_confidence: 'high' | 'medium' | 'low';
  dimensions: {
    iq: number;
    eq: number;
    empathy: number;
    self_awareness: number;
    technical: number;
    ai_readiness: number;
    gtm: number;
    personality: number;
    motivation: number;
    work_history: number;
    passions: number;
    culture_fit: number;
  };
  flags: {
    red_flags: string[];
    green_flags: string[];
  };
  recommendation: string;
  best_fit_roles: string[];
  analyzed_at: string;
}

/**
 * Get authenticated Supabase session token
 */
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || null;
}

/**
 * Start a new assessment
 */
export async function startAssessment(params: {
  name: string;
  email: string;
  source?: string;
}): Promise<StartAssessmentResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${RENUBU_API_URL}/api/public/assessment/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start assessment');
  }

  return response.json();
}

/**
 * Submit an answer to a question
 */
export async function submitAnswer(
  candidateId: string,
  params: {
    question_id: string;
    question_text: string;
    answer: string;
  }
): Promise<SubmitAnswerResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${RENUBU_API_URL}/api/public/assessment/${candidateId}/answer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit answer');
  }

  return response.json();
}

/**
 * Complete the assessment and trigger AI scoring
 */
export async function completeAssessment(
  candidateId: string
): Promise<CompleteAssessmentResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${RENUBU_API_URL}/api/public/assessment/${candidateId}/complete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to complete assessment');
  }

  return response.json();
}

/**
 * Get assessment results
 */
export async function getAssessmentResults(candidateId: string): Promise<AssessmentResults> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${RENUBU_API_URL}/api/public/assessment/${candidateId}/results`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get results');
  }

  return response.json();
}

/**
 * Get all assessment questions
 */
export async function getAssessmentQuestions(): Promise<{ assessment: AssessmentConfig }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${RENUBU_API_URL}/api/public/assessment/questions`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get questions');
  }

  return response.json();
}

// ============================================================================
// INVITE CODE SYSTEM
// ============================================================================

export interface ValidateInviteResponse {
  valid: boolean;
  contact: {
    id: string;
    name: string;
    email: string | null;
  };
}

export interface SignupResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  };
  session?: { access_token: string; refresh_token: string } | null; // Supabase session if auto-confirmed
  message: string;
}

/**
 * Validate an invite code
 * Does not require authentication
 * Uses local GoodHang API
 */
export async function validateInviteCode(inviteCode: string): Promise<ValidateInviteResponse> {
  const response = await fetch('/api/invites/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invite_code: inviteCode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to validate invite code');
  }

  return response.json();
}

/**
 * Send magic link for email verification
 * User clicks link to authenticate, then sets password
 * Uses local GoodHang API
 */
export async function sendMagicLink(params: {
  invite_code: string;
  email: string;
  name: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/invites/send-magic-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send magic link');
  }

  return response.json();
}

/**
 * Sign up with invite code
 * Creates auth user, links to contact, creates profile
 * Does not require authentication (creates the auth)
 * Uses local GoodHang API
 */
export async function signupWithInvite(params: {
  invite_code: string;
  email: string;
  password: string;
  name: string;
}): Promise<SignupResponse> {
  const response = await fetch('/api/invites/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign up');
  }

  return response.json();
}
