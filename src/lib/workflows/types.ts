/**
 * Workflow Type System
 *
 * Defines data structures and types for the workflow assignment system
 * Supports 4 workflow categories: renewal, strategic, opportunity, risk
 *
 * Ported from automation-backup JavaScript implementation to TypeScript
 */

/**
 * Workflow Type Enum
 * Defines the 4 main categories of workflows
 */
export enum WorkflowType {
  RENEWAL = 'renewal',        // Based on renewal stage (9 stages: Overdue -> Monitor)
  STRATEGIC = 'strategic',    // Based on account_plan (invest/manage/monitor/expand)
  OPPORTUNITY = 'opportunity', // Based on opportunity score
  RISK = 'risk'               // Based on risk score
}

/**
 * Workflow Status Enum
 */
export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  COMPLETED_WITH_SNOOZE = 'completed_with_snooze', // Steps done, but tasks snoozed
  SKIPPED = 'skipped',
  FAILED = 'failed'
}

/**
 * Task Status Enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SNOOZED = 'snoozed',
  SKIPPED = 'skipped'
}

/**
 * Task Owner Enum
 */
export enum TaskOwner {
  AI = 'AI',
  CSM = 'CSM'
}

/**
 * Recommendation Status Enum
 */
export enum RecommendationStatus {
  PENDING = 'pending',
  ACTIONED = 'actioned',
  SKIPPED = 'skipped',
  SNOOZED = 'snoozed'
}

/**
 * Account Plan Enum
 */
export enum AccountPlan {
  INVEST = 'invest',
  EXPAND = 'expand',
  MANAGE = 'manage',
  MONITOR = 'monitor'
}

/**
 * Experience Level Enum
 */
export enum ExperienceLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  EXPERT = 'expert'
}

/**
 * Communication Style Enum
 */
export enum CommunicationStyle {
  FORMAL = 'formal',
  STANDARD = 'standard',
  CASUAL = 'casual',
  TECHNICAL = 'technical'
}

/**
 * Workflow Complexity Enum
 */
export enum WorkflowComplexity {
  SIMPLE = 'simple',
  STANDARD = 'standard',
  DETAILED = 'detailed'
}

/**
 * Priority Factors Interface
 * Breakdown of what influenced the priority score (for transparency)
 */
export interface PriorityFactors {
  base_score: number;
  arr_multiplier: number;
  urgency_score: number;
  stage_bonus: number;
  account_plan_multiplier: number;
  opportunity_bonus: number;
  risk_penalty: number;
  custom: {
    workload_penalty?: number;
    experience_multiplier?: number;
    workflow_type?: string;
    customer_arr?: number;
    [key: string]: any;
  };
}

/**
 * Workflow Metadata Interface
 * Extensible metadata that varies by workflow type
 */
export interface WorkflowMetadata {
  workflow_type: string;
  trigger_reason: string;
  source_data: Record<string, any>;
  generated_at: string;
  custom: Record<string, any>;
  // Renewal-specific metadata
  renewal_stage?: string;
  stage?: string;
  days_until_renewal?: number;
  // Strategic workflow metadata
  account_plan?: string;
  // Opportunity/Risk metadata
  opportunity_score?: number;
  risk_score?: number;
  // Customer data
  arr?: number;
}

/**
 * Workflow Instance Interface
 * This is what gets created when a workflow is assigned to a customer
 */
export interface WorkflowInstance {
  id: string;
  type: WorkflowType;
  customer_id: string;
  config: Record<string, any>;
  priority_score: number;
  priority_factors: PriorityFactors;
  metadata: WorkflowMetadata;
  status: WorkflowStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User Context Interface
 * Information about the CSM that can influence workflow prioritization and customization
 */
export interface UserContext {
  user_id: string;
  full_name: string;
  email: string;
  experience_level: ExperienceLevel;
  current_workload: number;
  specialties: string[];
  preferences: {
    communication_style: CommunicationStyle;
    workflow_complexity: WorkflowComplexity;
  };
  performance_metrics: {
    close_rate: number | null;
    avg_response_time: number | null;
    customer_satisfaction: number | null;
  };
  territories: string[];
}

/**
 * Customer Data Interface (for workflow context)
 */
export interface CustomerData {
  id?: string;
  customer_id?: string;
  domain: string;
  arr: number;
  renewal_date: string | null;
  owner: string;
  // Workflow determination fields
  renewal_id?: string;
  renewal_stage?: string;
  account_plan?: string | null;
  opportunity_score?: number | null;
  risk_score?: number | null;
  days_until_renewal?: number | null;
}

/**
 * Workflow Assignment Interface
 * This is the output structure for the dashboard - combines workflow with customer data
 */
export interface WorkflowAssignment {
  workflow: WorkflowInstance;
  customer: CustomerData;
  context: {
    days_until_renewal: number | null;
    renewal_stage: string | null;
    account_plan: string | null;
    opportunity_score: number | null;
    risk_score: number | null;
  };
  user_context: UserContext | null;
}

/**
 * Factory function to create a WorkflowInstance
 */
export function createWorkflowInstance(params: {
  id: string;
  type: WorkflowType;
  customer_id: string;
  config: Record<string, any>;
  priority_score?: number;
  priority_factors?: PriorityFactors;
  metadata?: Partial<WorkflowMetadata>;
  status?: WorkflowStatus;
  assigned_to?: string | null;
  created_at?: string;
  updated_at?: string;
}): WorkflowInstance {
  return {
    id: params.id,
    type: params.type,
    customer_id: params.customer_id,
    config: params.config,
    priority_score: params.priority_score ?? 0,
    priority_factors: params.priority_factors ?? createPriorityFactors({}),
    metadata: {
      workflow_type: params.type,
      trigger_reason: '',
      source_data: {},
      generated_at: new Date().toISOString(),
      custom: {},
      ...params.metadata
    } as WorkflowMetadata,
    status: params.status ?? WorkflowStatus.PENDING,
    assigned_to: params.assigned_to ?? null,
    created_at: params.created_at ?? new Date().toISOString(),
    updated_at: params.updated_at ?? new Date().toISOString()
  };
}

/**
 * Factory function to create a UserContext
 */
export function createUserContext(params: {
  user_id: string;
  full_name: string;
  email: string;
  experience_level?: ExperienceLevel;
  current_workload?: number;
  specialties?: string[];
  preferences?: Partial<UserContext['preferences']>;
  performance_metrics?: Partial<UserContext['performance_metrics']>;
  territories?: string[];
}): UserContext {
  return {
    user_id: params.user_id,
    full_name: params.full_name,
    email: params.email,
    experience_level: params.experience_level ?? ExperienceLevel.MID,
    current_workload: params.current_workload ?? 0,
    specialties: params.specialties ?? [],
    preferences: {
      communication_style: params.preferences?.communication_style ?? CommunicationStyle.STANDARD,
      workflow_complexity: params.preferences?.workflow_complexity ?? WorkflowComplexity.STANDARD
    },
    performance_metrics: {
      close_rate: params.performance_metrics?.close_rate ?? null,
      avg_response_time: params.performance_metrics?.avg_response_time ?? null,
      customer_satisfaction: params.performance_metrics?.customer_satisfaction ?? null
    },
    territories: params.territories ?? []
  };
}

/**
 * Factory function to create a WorkflowAssignment
 */
export function createWorkflowAssignment(params: {
  workflow: WorkflowInstance;
  customer: CustomerData;
  context?: Partial<WorkflowAssignment['context']>;
  user_context?: UserContext | null;
}): WorkflowAssignment {
  return {
    workflow: params.workflow,
    customer: {
      id: params.customer.id || params.customer.customer_id,
      customer_id: params.customer.id || params.customer.customer_id,
      domain: params.customer.domain,
      arr: params.customer.arr,
      renewal_date: params.customer.renewal_date,
      owner: params.customer.owner
    },
    context: {
      days_until_renewal: params.context?.days_until_renewal ?? null,
      renewal_stage: params.context?.renewal_stage ?? null,
      account_plan: params.context?.account_plan ?? null,
      opportunity_score: params.context?.opportunity_score ?? null,
      risk_score: params.context?.risk_score ?? null
    },
    user_context: params.user_context ?? null
  };
}

/**
 * Factory function to create WorkflowMetadata
 */
export function createWorkflowMetadata(params: {
  workflow_type: string;
  trigger_reason: string;
  source_data?: Record<string, any>;
  generated_at?: string;
  custom?: Record<string, any>;
}): WorkflowMetadata {
  return {
    workflow_type: params.workflow_type,
    trigger_reason: params.trigger_reason,
    source_data: params.source_data ?? {},
    generated_at: params.generated_at ?? new Date().toISOString(),
    custom: params.custom ?? {}
  };
}

/**
 * Factory function to create PriorityFactors
 */
export function createPriorityFactors(params: {
  base_score?: number;
  arr_multiplier?: number;
  urgency_score?: number;
  stage_bonus?: number;
  account_plan_multiplier?: number;
  opportunity_bonus?: number;
  risk_penalty?: number;
  custom?: Record<string, any>;
}): PriorityFactors {
  return {
    base_score: params.base_score ?? 0,
    arr_multiplier: params.arr_multiplier ?? 1.0,
    urgency_score: params.urgency_score ?? 0,
    stage_bonus: params.stage_bonus ?? 0,
    account_plan_multiplier: params.account_plan_multiplier ?? 1.0,
    opportunity_bonus: params.opportunity_bonus ?? 0,
    risk_penalty: params.risk_penalty ?? 0,
    custom: params.custom ?? {}
  };
}

/**
 * Helper function to validate workflow type
 */
export function isValidWorkflowType(type: string): type is WorkflowType {
  return Object.values(WorkflowType).includes(type as WorkflowType);
}

/**
 * Helper function to validate workflow status
 */
export function isValidWorkflowStatus(status: string): status is WorkflowStatus {
  return Object.values(WorkflowStatus).includes(status as WorkflowStatus);
}

/**
 * Helper function to validate account plan
 */
export function isValidAccountPlan(plan: string): plan is AccountPlan {
  return Object.values(AccountPlan).includes(plan as AccountPlan);
}
