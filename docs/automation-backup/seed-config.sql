-- ============================================================================
-- Workflow Configuration Seed Data
-- ============================================================================
-- Purpose: Initial configuration data for workflow system
-- Version: 1.0
-- Created: October 2025
--
-- This file populates the configuration tables with:
--   - 4 plan types (Renewal, Strategic, Risk, Opportunity)
--   - 9 renewal workflows (Monitor through Overdue)
--   - Example strategic workflows
--   - Default scoring properties
--   - Default workflow properties
-- ============================================================================

-- ============================================================================
-- Seed: plans (4 plan types)
-- ============================================================================

INSERT INTO plans (id, plan_key, plan_name, plan_description, auto_assign, requires_approval, icon, color, display_order) VALUES
  (
    'plan-renewal',
    'renewal',
    'Renewal Planning',
    'Automated renewal workflows based on days until renewal date. Includes 9 stage-based workflows from Monitor (180+ days) to Overdue (<0 days).',
    1,  -- Auto-assign to all customers with renewals
    0,  -- No approval needed
    '🔄',
    'blue',
    1
  ),
  (
    'plan-strategic',
    'strategic',
    'Strategic Account Plan',
    'Strategic account management workflows for high-value customers. Includes quarterly reviews, health checks, and executive engagement.',
    0,  -- Not auto-assigned (rep must approve)
    1,  -- Requires approval
    '🎯',
    'purple',
    2
  ),
  (
    'plan-risk',
    'risk',
    'Risk Mitigation',
    'Proactive risk intervention workflows for at-risk customers. Triggered by risk scores or negative signals.',
    0,  -- Not auto-assigned
    1,  -- Requires approval
    '⚠️',
    'red',
    3
  ),
  (
    'plan-opportunity',
    'opportunity',
    'Expansion Opportunity',
    'Upsell and expansion workflows for customers showing growth signals or high opportunity scores.',
    0,  -- Not auto-assigned
    1,  -- Requires approval
    '💡',
    'green',
    4
  );

-- ============================================================================
-- Seed: workflows - Renewal Plan (9 workflows)
-- ============================================================================
-- These workflows progress based on days_until_renewal
-- Each has a specific urgency_score used in priority calculation
-- ============================================================================

INSERT INTO workflows (id, plan_id, workflow_key, workflow_name, workflow_description, trigger_type, trigger_config, urgency_score, template_file, icon, sequence_order) VALUES
  (
    'wf-renewal-overdue',
    'plan-renewal',
    'overdue',
    'Overdue Stage',
    'URGENT: Renewal date has passed. Immediate action required to close renewal and prevent churn.',
    'days_based',
    '{"days_min": null, "days_max": -1}',
    100,  -- Highest urgency
    'RenewalOverdueWorkflow.ts',
    '🔴',
    1
  ),
  (
    'wf-renewal-emergency',
    'plan-renewal',
    'emergency',
    'Emergency Stage',
    'CRITICAL: 0-6 days until renewal. Final push to close deal and secure renewal.',
    'days_based',
    '{"days_min": 0, "days_max": 6}',
    90,
    'RenewalEmergencyWorkflow.ts',
    '🚨',
    2
  ),
  (
    'wf-renewal-critical',
    'plan-renewal',
    'critical',
    'Critical Stage',
    'HIGH PRIORITY: 7-13 days until renewal. Finalize contract terms and prepare for signature.',
    'days_based',
    '{"days_min": 7, "days_max": 13}',
    80,
    'RenewalCriticalWorkflow.ts',
    '⚠️',
    3
  ),
  (
    'wf-renewal-signature',
    'plan-renewal',
    'signature',
    'Signature Stage',
    '14-29 days until renewal. Present final proposal and obtain executive signatures.',
    'days_based',
    '{"days_min": 14, "days_max": 29}',
    70,
    'RenewalSignatureWorkflow.ts',
    '✍️',
    4
  ),
  (
    'wf-renewal-finalize',
    'plan-renewal',
    'finalize',
    'Finalize Stage',
    '30-59 days until renewal. Finalize renewal terms, pricing, and contract details.',
    'days_based',
    '{"days_min": 30, "days_max": 59}',
    60,
    'RenewalFinalizeWorkflow.ts',
    '📝',
    5
  ),
  (
    'wf-renewal-negotiate',
    'plan-renewal',
    'negotiate',
    'Negotiate Stage',
    '60-89 days until renewal. Negotiate renewal terms, pricing, and expansion opportunities.',
    'days_based',
    '{"days_min": 60, "days_max": 89}',
    50,
    'RenewalNegotiateWorkflow.ts',
    '🤝',
    6
  ),
  (
    'wf-renewal-engage',
    'plan-renewal',
    'engage',
    'Engage Stage',
    '90-119 days until renewal. Engage key stakeholders and assess renewal readiness.',
    'days_based',
    '{"days_min": 90, "days_max": 119}',
    40,
    'RenewalEngageWorkflow.ts',
    '💬',
    7
  ),
  (
    'wf-renewal-prepare',
    'plan-renewal',
    'prepare',
    'Prepare Stage',
    '120-179 days until renewal. Prepare renewal strategy and identify potential issues.',
    'days_based',
    '{"days_min": 120, "days_max": 179}',
    30,
    'RenewalPrepareWorkflow.ts',
    '📋',
    8
  ),
  (
    'wf-renewal-monitor',
    'plan-renewal',
    'monitor',
    'Monitor Stage',
    '180+ days until renewal. Monitor customer health and usage patterns.',
    'days_based',
    '{"days_min": 180, "days_max": null}',
    20,  -- Lowest urgency
    'RenewalMonitorWorkflow.ts',
    '👀',
    9
  );

-- ============================================================================
-- Seed: workflows - Strategic Plan (Example workflows)
-- ============================================================================
-- These workflows are manually triggered or schedule-based
-- ============================================================================

INSERT INTO workflows (id, plan_id, workflow_key, workflow_name, workflow_description, trigger_type, trigger_config, base_score, template_file, icon, sequence_order) VALUES
  (
    'wf-strategic-qbr',
    'plan-strategic',
    'quarterly-review',
    'Quarterly Business Review',
    'Comprehensive quarterly review with customer executive team. Review progress, outcomes, and strategic alignment.',
    'schedule',
    '{"frequency": "quarterly"}',
    70,  -- High priority
    'StrategicQBRWorkflow.ts',
    '📊',
    1
  ),
  (
    'wf-strategic-health',
    'plan-strategic',
    'health-check',
    'Monthly Health Check',
    'Regular health check to assess customer satisfaction, usage patterns, and potential issues.',
    'schedule',
    '{"frequency": "monthly"}',
    60,
    'StrategicHealthCheckWorkflow.ts',
    '🏥',
    2
  ),
  (
    'wf-strategic-exec',
    'plan-strategic',
    'executive-meeting',
    'Executive Sponsor Meeting',
    'Strategic engagement with executive sponsors to align on goals and ensure executive buy-in.',
    'manual',
    '{}',
    80,  -- High priority when triggered
    'StrategicExecutiveMeetingWorkflow.ts',
    '👔',
    3
  );

-- ============================================================================
-- Seed: workflows - Risk Plan (Example workflows)
-- ============================================================================

INSERT INTO workflows (id, plan_id, workflow_key, workflow_name, workflow_description, trigger_type, trigger_config, base_score, template_file, icon, sequence_order) VALUES
  (
    'wf-risk-assessment',
    'plan-risk',
    'risk-assessment',
    'Risk Assessment',
    'Comprehensive assessment of customer risk factors and development of mitigation strategy.',
    'manual',
    '{}',
    85,  -- High urgency
    'RiskAssessmentWorkflow.ts',
    '🔍',
    1
  ),
  (
    'wf-risk-intervention',
    'plan-risk',
    'risk-intervention',
    'Risk Intervention',
    'Active intervention to address identified risks and prevent churn.',
    'manual',
    '{}',
    90,  -- Very high urgency
    'RiskInterventionWorkflow.ts',
    '🚑',
    2
  );

-- ============================================================================
-- Seed: workflows - Opportunity Plan (Example workflows)
-- ============================================================================

INSERT INTO workflows (id, plan_id, workflow_key, workflow_name, workflow_description, trigger_type, trigger_config, base_score, template_file, icon, sequence_order) VALUES
  (
    'wf-opportunity-identify',
    'plan-opportunity',
    'opportunity-identification',
    'Opportunity Identification',
    'Identify and qualify expansion opportunities based on usage patterns and customer growth.',
    'manual',
    '{}',
    65,
    'OpportunityIdentificationWorkflow.ts',
    '🔎',
    1
  ),
  (
    'wf-opportunity-propose',
    'plan-opportunity',
    'expansion-proposal',
    'Expansion Proposal',
    'Develop and present expansion proposal to customer decision makers.',
    'manual',
    '{}',
    75,
    'OpportunityExpansionWorkflow.ts',
    '📈',
    2
  );

-- ============================================================================
-- Seed: scoring_properties (Priority calculation configuration)
-- ============================================================================
-- These properties control how workflow priority scores are calculated
-- ============================================================================

INSERT INTO scoring_properties (property_key, property_value, property_type, property_scope, description, default_value) VALUES
  (
    'arr_breakpoints',
    '{"high":150000,"medium":100000}',
    'object',
    'arr',
    'ARR thresholds for priority multiplier tiers. High: $150k+, Medium: $100k+',
    '{"high":150000,"medium":100000}'
  ),
  (
    'arr_multipliers',
    '{"high":2.0,"medium":1.5,"low":1.0}',
    'object',
    'arr',
    'Priority multipliers by ARR tier. High-value customers get higher priority.',
    '{"high":2.0,"medium":1.5,"low":1.0}'
  ),
  (
    'account_plan_multipliers',
    '{"invest":1.5,"expand":1.3,"manage":1.0,"monitor":0.8}',
    'object',
    'account_plan',
    'Priority multipliers by account plan type. Strategic accounts get higher priority.',
    '{"invest":1.5,"expand":1.3,"manage":1.0,"monitor":0.8}'
  ),
  (
    'strategic_base_scores',
    '{"invest":70,"expand":60}',
    'object',
    'account_plan',
    'Base scores for strategic workflows by account plan type.',
    '{"invest":70,"expand":60}'
  ),
  (
    'opportunity_base_score',
    '50',
    'number',
    'general',
    'Base score for opportunity workflows.',
    '50'
  ),
  (
    'opportunity_score_multiplier',
    '0.5',
    'number',
    'general',
    'Multiplier for customer opportunity_score when calculating priority.',
    '0.5'
  ),
  (
    'risk_base_score',
    '60',
    'number',
    'general',
    'Base score for risk workflows.',
    '60'
  ),
  (
    'risk_score_multiplier',
    '0.6',
    'number',
    'general',
    'Multiplier for customer risk_score when calculating priority.',
    '0.6'
  ),
  (
    'workload_penalty_per_workflow',
    '2',
    'number',
    'csm',
    'Points deducted per active workflow in CSM workload. Used for load balancing.',
    '2'
  ),
  (
    'experience_multipliers',
    '{"expert":1.2,"senior":1.1,"mid":1.0,"junior":0.9}',
    'object',
    'csm',
    'Priority multipliers by CSM experience level. Routes complex workflows to senior CSMs.',
    '{"expert":1.2,"senior":1.1,"mid":1.0,"junior":0.9}'
  );

-- ============================================================================
-- Seed: workflow_properties (General workflow system settings)
-- ============================================================================

INSERT INTO workflow_properties (property_key, property_value, property_type, description, default_value) VALUES
  (
    'opportunity_score_min',
    '70',
    'number',
    'Minimum opportunity_score required to trigger opportunity plan suggestion.',
    '70'
  ),
  (
    'risk_score_min',
    '60',
    'number',
    'Minimum risk_score required to trigger risk plan suggestion.',
    '60'
  ),
  (
    'renewal_advance_days',
    '365',
    'number',
    'How many days in advance to start renewal planning (default: 365 = 1 year).',
    '365'
  );

-- ============================================================================
-- Seed Complete
-- ============================================================================
-- Summary:
--   - 4 plan types seeded
--   - 15 workflows seeded (9 renewal + 3 strategic + 2 risk + 2 opportunity - 1 overlap = 15)
--   - 10 scoring properties seeded
--   - 3 workflow properties seeded
--
-- Next steps:
--   1. Run this seed file: sqlite3 renubu-test.db < seed-config.sql
--   2. Verify data: sqlite3 renubu-test.db "SELECT * FROM plans;"
--   3. Update code to read from database instead of hardcoded values
-- ============================================================================
