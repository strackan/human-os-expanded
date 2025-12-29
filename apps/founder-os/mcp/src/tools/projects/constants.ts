/**
 * Project Constants
 */

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PROJECT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const MILESTONE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
} as const;

export const MEMBER_ROLE = {
  OWNER: 'owner',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
} as const;

export const LINK_TYPE = {
  CONTACT: 'contact',
  COMPANY: 'company',
  GOAL: 'goal',
  ENTITY: 'entity',
} as const;
