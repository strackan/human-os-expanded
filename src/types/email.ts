/**
 * Email Orchestration Types
 *
 * Type definitions for AI-powered email generation system.
 */

import type { Customer, Contact } from './customer';

/**
 * Supported email types
 */
export type EmailType =
  | 'renewal_kickoff'
  | 'pricing_discussion'
  | 'qbr_invitation'
  | 'risk_mitigation'
  | 'expansion_pitch';

/**
 * Email tone options
 */
export type EmailTone = 'formal' | 'casual' | 'urgent';

/**
 * Generated email structure
 */
export interface GeneratedEmail {
  subject: string;
  body: string;
  tone: EmailTone;
  suggestedSendTime?: Date;
  metadata: EmailMetadata;
}

/**
 * Email generation metadata
 */
export interface EmailMetadata {
  emailType: EmailType;
  customerId: string;
  recipientContactId?: string;
  generatedAt: Date;
  aiModel: string;
  tokensUsed: number;
  promptVersion?: string;
}

/**
 * Customer context for email generation
 */
export interface EmailCustomerContext {
  customer: Customer;
  primaryContact?: Contact;
  recipientContact?: Contact;
  daysUntilRenewal?: number;
  healthTrend?: 'improving' | 'stable' | 'declining';
  recentActivity?: EmailContextActivity[];
  openRisks?: string[];
  opportunities?: string[];
}

/**
 * Recent activity for context
 */
export interface EmailContextActivity {
  type: 'support_ticket' | 'meeting' | 'email' | 'feature_request' | 'escalation';
  summary: string;
  date: Date;
  impact?: 'positive' | 'negative' | 'neutral';
}

/**
 * Email generation request parameters
 */
export interface GenerateEmailRequest {
  customerId: string;
  emailType: EmailType;
  recipientContactId?: string;
  customInstructions?: string;
  includeMetrics?: boolean;
}

/**
 * Email generation response
 */
export interface GenerateEmailResponse {
  success: boolean;
  email?: GeneratedEmail;
  error?: string;
  errorCode?:
    | 'INVALID_CUSTOMER'
    | 'API_ERROR'
    | 'RATE_LIMIT'
    | 'INVALID_TYPE'
    | 'MISSING_CUSTOMER_ID'
    | 'MISSING_EMAIL_TYPE'
    | 'UNAUTHORIZED'
    | 'UNKNOWN_ERROR';
}

/**
 * Email save request parameters
 */
export interface SaveEmailRequest {
  customerId: string;
  workflowTaskId?: string;
  email: {
    subject: string;
    body: string;
    tone: EmailTone;
    recipientContactId?: string;
  };
  metadata: EmailMetadata;
}

/**
 * Email save response
 */
export interface SaveEmailResponse {
  success: boolean;
  artifactId?: string;
  error?: string;
}

/**
 * Email type configuration
 */
export interface EmailTypeConfig {
  type: EmailType;
  label: string;
  description: string;
  defaultTone: EmailTone;
  estimatedLength: 'short' | 'medium' | 'long';
  requiresApproval: boolean;
  icon?: string;
}

/**
 * Predefined email type configurations
 */
export const EMAIL_TYPE_CONFIGS: Record<EmailType, EmailTypeConfig> = {
  renewal_kickoff: {
    type: 'renewal_kickoff',
    label: 'Renewal Kickoff',
    description: 'Start renewal conversation 90 days before contract end',
    defaultTone: 'formal',
    estimatedLength: 'medium',
    requiresApproval: false,
  },
  pricing_discussion: {
    type: 'pricing_discussion',
    label: 'Pricing Discussion',
    description: 'Discuss pricing, ARR changes, or contract terms',
    defaultTone: 'formal',
    estimatedLength: 'medium',
    requiresApproval: true,
  },
  qbr_invitation: {
    type: 'qbr_invitation',
    label: 'QBR Invitation',
    description: 'Invite customer to quarterly business review',
    defaultTone: 'casual',
    estimatedLength: 'short',
    requiresApproval: false,
  },
  risk_mitigation: {
    type: 'risk_mitigation',
    label: 'Risk Mitigation',
    description: 'Address low health score or escalation',
    defaultTone: 'urgent',
    estimatedLength: 'medium',
    requiresApproval: true,
  },
  expansion_pitch: {
    type: 'expansion_pitch',
    label: 'Expansion Opportunity',
    description: 'Pitch upsell or expansion opportunity',
    defaultTone: 'casual',
    estimatedLength: 'medium',
    requiresApproval: false,
  },
};
