/**
 * Database Constants
 *
 * Centralized constants for all database table and column names.
 * This file provides type-safe constants to replace string literals throughout the codebase.
 *
 * Phase 0.2: Consolidation - Agent 1
 */

// =====================================================
// TABLE NAMES
// =====================================================

export const DB_TABLES = {
  // Core tables
  CUSTOMERS: 'customers',
  CONTACTS: 'contacts',
  PROFILES: 'profiles',

  // Workflow tables
  WORKFLOW_EXECUTIONS: 'workflow_executions',
  WORKFLOW_STEP_EXECUTIONS: 'workflow_step_executions',
  WORKFLOW_TASKS: 'workflow_tasks',
  WORKFLOW_WAKE_TRIGGERS: 'workflow_wake_triggers',
  WORKFLOW_SKIP_TRIGGERS: 'workflow_skip_triggers',
  WORKFLOW_ESCALATE_TRIGGERS: 'workflow_escalate_triggers',
  WORKFLOW_ACTIONS: 'workflow_actions',

  // Alert and notification tables
  ALERTS: 'alerts',
  IN_PRODUCT_NOTIFICATIONS: 'in_product_notifications',

  // Configuration tables
  TASK_TYPE_CONFIG: 'task_type_config',

  // Data views
  CONTRACT_MATRIX: 'contract_matrix',
  CUSTOMER_PROPERTIES: 'customer_properties',

  // Talent Orchestration tables (Release 1.5 & 1.6)
  CANDIDATES: 'candidates',
  TALENT_BENCH: 'talent_bench',
  INTERVIEW_SESSIONS: 'interview_sessions',

  // String-Tie tables (Release 1.4)
  STRING_TIES: 'string_ties',
  USER_SETTINGS: 'user_settings',

  // Automation Rules tables (Release 1.4)
  AUTOMATION_RULES: 'automation_rules',
  AUTOMATION_RULE_EXECUTIONS: 'automation_rule_executions',

  // Onboarding tables
  ONBOARDING_SESSIONS: 'onboarding_sessions',

  // ARI tables
  ARI_SCORE_SNAPSHOTS: 'ari_score_snapshots',
  ARI_ENTITY_MAPPINGS: 'ari_entity_mappings',
} as const;

// =====================================================
// COMMON COLUMN NAMES
// =====================================================

export const DB_COLUMNS = {
  // Primary keys and IDs
  ID: 'id',
  CUSTOMER_ID: 'customer_id',
  USER_ID: 'user_id',
  WORKFLOW_EXECUTION_ID: 'workflow_execution_id',
  WORKFLOW_CONFIG_ID: 'workflow_config_id',
  STEP_EXECUTION_ID: 'step_execution_id',
  STEP_ID: 'step_id',
  TASK_ID: 'task_id',
  RENEWAL_ID: 'renewal_id',
  RECOMMENDATION_ID: 'recommendation_id',

  // Timestamps
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  STARTED_AT: 'started_at',
  COMPLETED_AT: 'completed_at',
  PROCESSED_AT: 'processed_at',
  SNOOZED_UNTIL: 'snoozed_until',
  EXPIRES_AT: 'expires_at',
  READ_AT: 'read_at',
  SKIPPED_AT: 'skipped_at',
  REASSIGNED_AT: 'reassigned_at',
  LAST_ACTIVITY_AT: 'last_activity_at',

  // Status fields
  STATUS: 'status',

  // Common fields
  NAME: 'name',
  EMAIL: 'email',
  PHONE: 'phone',
  TITLE: 'title',
  INDUSTRY: 'industry',
  DOMAIN: 'domain',
  PRIORITY: 'priority',
  METADATA: 'metadata',

  // Customer-specific columns
  CURRENT_ARR: 'current_arr',
  HEALTH_SCORE: 'health_score',
  RENEWAL_DATE: 'renewal_date',

  // Contact-specific columns
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  IS_PRIMARY: 'is_primary',
  RELATIONSHIP_STRENGTH: 'relationship_strength',
  COMMUNICATION_STYLE: 'communication_style',
  KEY_CONCERNS: 'key_concerns',
  LEVERAGE_POINTS: 'leverage_points',
  RECENT_INTERACTIONS: 'recent_interactions',
  RELATIONSHIP_NOTES: 'relationship_notes',

  // Workflow execution columns
  WORKFLOW_NAME: 'workflow_name',
  WORKFLOW_TYPE: 'workflow_type',
  CURRENT_STEP_ID: 'current_step_id',
  CURRENT_STEP_INDEX: 'current_step_index',
  TOTAL_STEPS: 'total_steps',
  COMPLETED_STEPS_COUNT: 'completed_steps_count',
  SKIPPED_STEPS_COUNT: 'skipped_steps_count',
  COMPLETION_PERCENTAGE: 'completion_percentage',
  WAKE_TRIGGERS: 'wake_triggers',
  LAST_EVALUATED_AT: 'last_evaluated_at',
  TRIGGER_FIRED_AT: 'trigger_fired_at',
  FIRED_TRIGGER_TYPE: 'fired_trigger_type',

  // Step execution columns
  STEP_INDEX: 'step_index',
  STEP_TITLE: 'step_title',
  STEP_TYPE: 'step_type',
  BRANCH_PATH: 'branch_path',

  // Task columns
  TASK_TYPE: 'task_type',
  TASK_CATEGORY: 'task_category',
  ACTION: 'action',
  DESCRIPTION: 'description',
  ASSIGNED_TO: 'assigned_to',
  CREATED_BY: 'created_by',
  ORIGINAL_WORKFLOW_EXECUTION_ID: 'original_workflow_execution_id',
  FIRST_SNOOZED_AT: 'first_snoozed_at',
  MAX_SNOOZE_DATE: 'max_snooze_date',
  SNOOZE_COUNT: 'snooze_count',
  FORCE_ACTION: 'force_action',
  AUTO_SKIP_AT: 'auto_skip_at',
  SKIP_REASON: 'skip_reason',
  REASSIGNED_FROM: 'reassigned_from',
  REASSIGNMENT_REASON: 'reassignment_reason',
  SURFACED_IN_WORKFLOWS: 'surfaced_in_workflows',

  // Notification columns
  NOTIFICATION_TYPE: 'notification_type',
  MESSAGE: 'message',
  LINK_URL: 'link_url',
  LINK_TEXT: 'link_text',
  IS_READ: 'is_read',

  // Alert columns
  ALERT_TYPE: 'alert_type',
  ALERT_SUBTYPE: 'alert_subtype',
  DATA_SOURCE: 'data_source',
  CONFIDENCE_SCORE: 'confidence_score',
  CURRENT_VALUE: 'current_value',
  PREVIOUS_VALUE: 'previous_value',

  // Task type config columns
  AUTO_SKIP_ENABLED: 'auto_skip_enabled',
  AUTO_SKIP_GRACE_HOURS: 'auto_skip_grace_hours',
  REQUIRES_MANUAL_ESCALATION: 'requires_manual_escalation',

  // Contract matrix columns
  SEATS: 'seats',
  ARR: 'arr',
  END_DATE: 'end_date',
  TERM_MONTHS: 'term_months',
  AUTO_RENEWAL: 'auto_renewal',
  PRICING_MODEL: 'pricing_model',
  DISCOUNT_PERCENT: 'discount_percent',
  PAYMENT_TERMS: 'payment_terms',
  AUTO_RENEWAL_NOTICE_DAYS: 'auto_renewal_notice_days',
  RENEWAL_PRICE_CAP_PERCENT: 'renewal_price_cap_percent',
  SLA_UPTIME_PERCENT: 'sla_uptime_percent',
  SUPPORT_TIER: 'support_tier',
  RESPONSE_TIME_HOURS: 'response_time_hours',
  DEDICATED_CSM: 'dedicated_csm',
  LIABILITY_CAP: 'liability_cap',
  DATA_RESIDENCY: 'data_residency',
  INCLUDED_FEATURES: 'included_features',
  USAGE_LIMITS: 'usage_limits',
  DAYS_UNTIL_RENEWAL: 'days_until_renewal',
  IN_RENEWAL_WINDOW: 'in_renewal_window',

  // Customer properties columns
  ACTIVE_USERS: 'active_users',
  UTILIZATION_PERCENT: 'utilization_percent',
  YOY_GROWTH: 'yoy_growth',
  LAST_MONTH_GROWTH: 'last_month_growth',
  PEAK_USAGE: 'peak_usage',
  ADOPTION_RATE: 'adoption_rate',
  MARKET_PRICE_AVERAGE: 'market_price_average',
  MARKET_PERCENTILE: 'market_percentile',
  PRICE_GAP: 'price_gap',
  SIMILAR_CUSTOMER_RANGE: 'similar_customer_range',
  OPPORTUNITY_VALUE: 'opportunity_value',

  // Talent Orchestration columns (Release 1.5 & 1.6)
  LINKEDIN_URL: 'linkedin_url',
  REFERRAL_SOURCE: 'referral_source',
  INTERVIEW_TRANSCRIPT: 'interview_transcript',
  ANALYSIS: 'analysis',
  ARCHETYPE: 'archetype',
  OVERALL_SCORE: 'overall_score',
  DIMENSIONS: 'dimensions',
  TIER: 'tier',
  FLAGS: 'flags',
  INTELLIGENCE_FILE: 'intelligence_file',
  LAST_CHECK_IN: 'last_check_in',
  CHECK_IN_COUNT: 'check_in_count',
  SESSION_TYPE: 'session_type',
  SESSION_DATE: 'session_date',
  DURATION_MINUTES: 'duration_minutes',
  QUESTIONS_ASKED: 'questions_asked',
  KEY_INSIGHTS: 'key_insights',
  SENTIMENT: 'sentiment',
  UPDATES: 'updates',
  CANDIDATE_ID: 'candidate_id',
  ARCHETYPE_PRIMARY: 'archetype_primary',
  ARCHETYPE_CONFIDENCE: 'archetype_confidence',
  BEST_FIT_ROLES: 'best_fit_roles',
  BENCHED_AT: 'benched_at',
} as const;

// =====================================================
// TYPE EXPORTS
// =====================================================

export type DbTable = typeof DB_TABLES[keyof typeof DB_TABLES];
export type DbColumn = typeof DB_COLUMNS[keyof typeof DB_COLUMNS];

// =====================================================
// HELPER TYPES FOR SPECIFIC TABLES
// =====================================================

/**
 * Type-safe table name constants
 */
export type TableName = {
  readonly CUSTOMERS: 'customers';
  readonly CONTACTS: 'contacts';
  readonly PROFILES: 'profiles';
  readonly WORKFLOW_EXECUTIONS: 'workflow_executions';
  readonly WORKFLOW_STEP_EXECUTIONS: 'workflow_step_executions';
  readonly WORKFLOW_TASKS: 'workflow_tasks';
  readonly WORKFLOW_WAKE_TRIGGERS: 'workflow_wake_triggers';
  readonly WORKFLOW_SKIP_TRIGGERS: 'workflow_skip_triggers';
  readonly WORKFLOW_ESCALATE_TRIGGERS: 'workflow_escalate_triggers';
  readonly WORKFLOW_ACTIONS: 'workflow_actions';
  readonly ALERTS: 'alerts';
  readonly IN_PRODUCT_NOTIFICATIONS: 'in_product_notifications';
  readonly TASK_TYPE_CONFIG: 'task_type_config';
  readonly CONTRACT_MATRIX: 'contract_matrix';
  readonly CUSTOMER_PROPERTIES: 'customer_properties';
};

/**
 * Re-export for convenience
 */
export const TABLES = DB_TABLES;
export const COLUMNS = DB_COLUMNS;
