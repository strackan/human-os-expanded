/**
 * BLUESOFT SHOWCASE DEMO - Workflows & Artifacts Seed
 *
 * Creates workflow executions, tasks, and artifacts for the Bluesoft
 * 120-day renewal journey demonstration.
 *
 * Demonstrates:
 * - Critical Renewal workflow (Days 105-115)
 * - Emergency Renewal workflow (Days 115-120)
 * - 6 artifacts across the lifecycle
 * - Real workflow execution data
 *
 * Run this AFTER:
 * 1. RUN_THIS_MIGRATION.sql
 * 2. BLUESOFT_DEMO_MIGRATION.sql
 * 3. BLUESOFT_DEMO_SEED.sql
 *
 * Date: October 9, 2025
 */

-- =====================================================
-- PART 1: SEED CORE WORKFLOWS (if not already seeded)
-- =====================================================

-- Insert Critical workflow config
INSERT INTO workflows (workflow_id, name, description, version, config, is_core, tenant_id)
VALUES (
  'critical',
  'Critical Renewal',
  'High-urgency escalation and emergency resolution for renewals 7-14 days out',
  '1.0.0',
  '{"id": "critical", "name": "Critical Renewal", "steps": []}'::jsonb,
  true,
  NULL
)
ON CONFLICT (workflow_id) DO NOTHING;

-- Insert Emergency workflow config
INSERT INTO workflows (workflow_id, name, description, version, config, is_core, tenant_id)
VALUES (
  'emergency',
  'Emergency Renewal',
  'Final push to secure renewal in last 0-6 days before expiration',
  '1.0.0',
  '{"id": "emergency", "name": "Emergency Renewal", "steps": []}'::jsonb,
  true,
  NULL
)
ON CONFLICT (workflow_id) DO NOTHING;

-- =====================================================
-- PART 2: WORKFLOW EXECUTIONS
-- =====================================================

-- Workflow Execution 1: Critical Renewal (Days 105-115)
INSERT INTO workflow_executions (
  id,
  customer_id,
  workflow_id,
  workflow_name,
  status,
  total_steps,
  completed_steps_count,
  started_at,
  completed_at,
  metadata
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001', -- Bluesoft
  (SELECT id FROM workflows WHERE workflow_id = 'critical' LIMIT 1),
  'Critical Renewal',
  'completed',
  (SELECT jsonb_array_length(config->'steps') FROM workflows WHERE workflow_id = 'critical' LIMIT 1),  -- Count steps from config
  (SELECT jsonb_array_length(config->'steps') FROM workflows WHERE workflow_id = 'critical' LIMIT 1),  -- All completed
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE - INTERVAL '5 days',
  jsonb_build_object(
    'daysUntilRenewal', 15,
    'currentARR', 180000,
    'renewalARR', 198000,
    'expansionPercentage', 10,
    'primaryBlocker', 'signature_pending',
    'outcome', 'escalated_to_emergency',
    'warRoomActivated', true,
    'executiveInvolvement', 'VP CS, Executive Sponsor'
  )
)
ON CONFLICT (id) DO NOTHING;

-- Workflow Execution 2: Emergency Renewal (Days 115-120)
INSERT INTO workflow_executions (
  id,
  customer_id,
  workflow_id,
  workflow_name,
  status,
  total_steps,
  completed_steps_count,
  started_at,
  completed_at,
  metadata
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001', -- Bluesoft
  (SELECT id FROM workflows WHERE workflow_id = 'emergency' LIMIT 1),
  'Emergency Renewal',
  'completed',
  (SELECT jsonb_array_length(config->'steps') FROM workflows WHERE workflow_id = 'emergency' LIMIT 1),  -- Count steps from config
  (SELECT jsonb_array_length(config->'steps') FROM workflows WHERE workflow_id = 'emergency' LIMIT 1),  -- All completed
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE,
  jsonb_build_object(
    'hoursUntilRenewal', 120,
    'currentARR', 180000,
    'renewalARR', 198000,
    'primaryBlocker', 'payment_processing',
    'outcome', 'renewal_secured_with_expansion',
    'ceoInvolvement', true,
    'finalARR', 198000,
    'expansionAchieved', true
  )
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 3: WORKFLOW TASKS
-- =====================================================

-- Critical Workflow Tasks
INSERT INTO workflow_tasks (
  id,
  workflow_execution_id,
  customer_id,
  task_type,
  title,
  description,
  status,
  priority,
  due_date,
  assigned_to,
  created_at,
  completed_at
)
SELECT
  t.id,
  t.workflow_execution_id,
  we.customer_id,  -- Derived from workflow_execution JOIN
  t.task_type,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.assigned_to,
  t.created_at,
  t.completed_at
FROM (
  VALUES
    -- Task 1: Critical Status Assessment
    (
      '20000000-0000-0000-0000-000000000001'::UUID,
      '10000000-0000-0000-0000-000000000001'::UUID,
      'assessment',
      'Critical Status Assessment',
      'Assess renewal status and identify primary blockers',
      'completed',
      'high',
      CURRENT_DATE - INTERVAL '15 days',
      NULL::UUID,
      CURRENT_DATE - INTERVAL '15 days',
      CURRENT_DATE - INTERVAL '15 days'
    ),
    -- Task 2: Executive Escalation
    (
      '20000000-0000-0000-0000-000000000002'::UUID,
      '10000000-0000-0000-0000-000000000001'::UUID,
      'escalation',
      'Executive Escalation',
      'Escalate to executive team with situation brief',
      'completed',
      'critical',
      CURRENT_DATE - INTERVAL '14 days',
      NULL::UUID,
      CURRENT_DATE - INTERVAL '14 days',
      CURRENT_DATE - INTERVAL '14 days'
    ),
    -- Task 3: Emergency Resolution Plan
    (
      '20000000-0000-0000-0000-000000000003'::UUID,
      '10000000-0000-0000-0000-000000000001'::UUID,
      'action',
      'Emergency Resolution Plan',
      'Execute emergency actions to resolve signature blockers',
      'completed',
      'critical',
      CURRENT_DATE - INTERVAL '13 days',
      NULL::UUID,
      CURRENT_DATE - INTERVAL '13 days',
      CURRENT_DATE - INTERVAL '10 days'
    )
) AS t(id, workflow_execution_id, task_type, title, description, status, priority, due_date, assigned_to, created_at, completed_at)
JOIN workflow_executions we ON we.id = t.workflow_execution_id
ON CONFLICT (id) DO NOTHING;

-- Emergency Workflow Tasks
INSERT INTO workflow_tasks (
  id,
  workflow_execution_id,
  customer_id,
  task_type,
  title,
  description,
  status,
  priority,
  due_date,
  assigned_to,
  created_at,
  completed_at
)
SELECT
  t.id,
  t.workflow_execution_id,
  we.customer_id,  -- Derived from workflow_execution JOIN
  t.task_type,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.assigned_to,
  t.created_at,
  t.completed_at
FROM (
  VALUES
    -- Task 4: Emergency Status Check
    (
      '20000000-0000-0000-0000-000000000004'::UUID,
      '10000000-0000-0000-0000-000000000002'::UUID,
      'assessment',
      'Emergency Status Check',
      'Rapid assessment of current situation in final 5 days',
      'completed',
      'critical',
      CURRENT_DATE - INTERVAL '5 days',
      NULL::UUID,
      CURRENT_DATE - INTERVAL '5 days',
      CURRENT_DATE - INTERVAL '5 days'
    ),
    -- Task 5: Final Push - Payment Collection
    (
      '20000000-0000-0000-0000-000000000005'::UUID,
      '10000000-0000-0000-0000-000000000002'::UUID,
      'action',
      'Final Push - Payment Collection',
      'Execute final payment collection actions',
      'completed',
      'critical',
      CURRENT_DATE - INTERVAL '3 days',
      NULL::UUID,
      CURRENT_DATE - INTERVAL '4 days',
      CURRENT_DATE - INTERVAL '2 days'
    ),
    -- Task 6: Renewal Success Report
    (
      '20000000-0000-0000-0000-000000000006'::UUID,
      '10000000-0000-0000-0000-000000000002'::UUID,
      'completion',
      'Renewal Success Report',
      'Document outcome and post-mortem analysis',
      'completed',
      'medium',
      CURRENT_DATE,
      NULL::UUID,
      CURRENT_DATE,
      CURRENT_DATE
    )
) AS t(id, workflow_execution_id, task_type, title, description, status, priority, due_date, assigned_to, created_at, completed_at)
JOIN workflow_executions we ON we.id = t.workflow_execution_id
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 4: ARTIFACTS
-- =====================================================

-- Artifact 1: Critical Status Assessment
INSERT INTO workflow_task_artifacts (
  id,
  task_id,
  artifact_type,
  title,
  content,
  generated_by_ai,
  ai_model,
  ai_prompt,
  is_approved,
  metadata,
  created_at
) VALUES (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'contract_analysis',
  'Critical Renewal Status - Bluesoft Corporation',
  jsonb_build_object(
    'daysUntilRenewal', 15,
    'currentARR', 180000,
    'renewalARR', 198000,
    'signatures', jsonb_build_object(
      'docusignSent', true,
      'customerSigned', false,
      'vendorCountersigned', false,
      'status', 'SIGNATURE_PENDING'
    ),
    'payment', jsonb_build_object(
      'invoiceSent', true,
      'paymentReceived', false,
      'poReceived', true
    ),
    'salesforce', jsonb_build_object(
      'opportunityStage', 'Negotiation/Review',
      'contractEndDateUpdated', false,
      'nextYearOpportunityCreated', false
    ),
    'negotiation', jsonb_build_object(
      'priceAgreed', true,
      'termsFinalized', true,
      'pendingApprovals', ARRAY['CFO signature', 'Legal final review']
    ),
    'routeSelected', 'SIGNATURE_PENDING',
    'reasoning', 'All terms agreed, but waiting on customer''s CFO (David Kim) to sign. Executive escalation needed to accelerate signature collection.',
    'secondaryConcerns', ARRAY['Legal review taking 3+ days', 'CFO traveling next week']
  ),
  true,
  'gpt-4',
  'Assess critical renewal status for Bluesoft Corporation',
  true,
  jsonb_build_object('workflow', 'critical', 'step', 'critical-status-assessment'),
  CURRENT_DATE - INTERVAL '15 days'
)
ON CONFLICT (id) DO NOTHING;

-- Artifact 2: Executive Escalation Brief
INSERT INTO workflow_task_artifacts (
  id,
  task_id,
  artifact_type,
  title,
  content,
  generated_by_ai,
  ai_model,
  ai_prompt,
  is_approved,
  metadata,
  created_at
) VALUES (
  '30000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  'meeting_notes',
  'Executive Escalation Brief - Bluesoft Renewal',
  jsonb_build_object(
    'situationBrief', 'Bluesoft renewal terms are 100% agreed upon with 10% expansion ($180K → $198K). All stakeholders except CFO David Kim have approved. David is our champion Marcus Thompson''s boss.',
    'whyAtRisk', ARRAY[
      'David Kim (CFO) is traveling next week (days 7-10 before renewal)',
      'Legal review delayed by 3 days due to custom payment terms',
      'If David doesn''t sign before travel, we hit emergency window'
    ],
    'whatsAtStake', jsonb_build_object(
      'arrImpact', 198000,
      'strategicImpact', 'Tier 1 Enterprise account, reference customer',
      'churnRisk', 'LOW (customer wants to renew, just logistics)'
    ),
    'executiveActions', jsonb_build_object(
      'vpCS', ARRAY['Approve war room activation', 'Daily 9am check-ins with CSM', 'Fast-track legal review (4-hour SLA)'],
      'executiveSponsor', ARRAY['Direct call to David Kim (CFO) - request signature before travel', 'Offer DocuSign walkthrough or wet signature alternative']
    ),
    'warRoomRecommendation', 'YES',
    'warRoomDetails', jsonb_build_object(
      'frequency', 'Daily 15-min standups (9am) until signature secured',
      'attendees', ARRAY['CSM', 'VP CS', 'Executive Sponsor'],
      'slackChannel', '#war-room-bluesoft'
    )
  ),
  true,
  'gpt-4',
  'Generate executive escalation brief for Bluesoft critical renewal',
  true,
  jsonb_build_object('workflow', 'critical', 'step', 'executive-escalation', 'warRoomActivated', true),
  CURRENT_DATE - INTERVAL '14 days'
)
ON CONFLICT (id) DO NOTHING;

-- Artifact 3: Emergency Resolution Plan
INSERT INTO workflow_task_artifacts (
  id,
  task_id,
  artifact_type,
  title,
  content,
  generated_by_ai,
  ai_model,
  ai_prompt,
  is_approved,
  metadata,
  created_at
) VALUES (
  '30000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000003',
  'action_plan',
  'Emergency Signature Collection Plan - Bluesoft',
  jsonb_build_object(
    'primaryBlocker', 'CFO signature pending',
    'deadline', 'Day 110 (before CFO travel)',
    'resolutionActions', jsonb_build_object(
      'multiChannelOutreach', ARRAY[
        'Email to David Kim with DocuSign link + urgency note',
        'LinkedIn message from our CEO to David Kim',
        'Phone call from Executive Sponsor → scheduled for tomorrow 10am',
        'Champion (Marcus Thompson) to escalate internally'
      ],
      'executiveCall', jsonb_build_object(
        'scheduled', 'Tomorrow 10am PST',
        'attendees', 'Our CEO + David Kim (Bluesoft CFO)',
        'agenda', 'Quick DocuSign walkthrough, answer any questions, secure signature'
      ),
      'alternativeMethods', ARRAY[
        'Wet signature option (overnight FedEx if DocuSign blocked)',
        'Authorized signatory (if David unavailable, can Marcus sign?)'
      ],
      'fastTrackApprovals', ARRAY[
        'Legal review completed (4-hour SLA)',
        'Finance approved payment flexibility',
        'Contract final version sent to customer'
      ]
    ),
    'dailyStatus', jsonb_build_object(
      'day107', 'Executive call scheduled, multi-channel outreach initiated',
      'day108', '[Pending] Executive call outcome',
      'day109', '[Pending] Signature secured or escalate to alternative methods',
      'day110', '[Deadline] Must have signature before CFO travel'
    )
  ),
  true,
  'gpt-4',
  'Create emergency signature collection plan for Bluesoft CFO',
  true,
  jsonb_build_object('workflow', 'critical', 'step', 'emergency-resolution'),
  CURRENT_DATE - INTERVAL '13 days'
)
ON CONFLICT (id) DO NOTHING;

-- Artifact 4: Emergency Status Check
INSERT INTO workflow_task_artifacts (
  id,
  task_id,
  artifact_type,
  title,
  content,
  generated_by_ai,
  ai_model,
  ai_prompt,
  is_approved,
  metadata,
  created_at
) VALUES (
  '30000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000004',
  'meeting_notes',
  'Emergency Status - Bluesoft Renewal',
  jsonb_build_object(
    'hoursUntilRenewal', 120,
    'rapidStatus', jsonb_build_object(
      'contractStatus', 'SIGNED ✅ (David Kim signed on Day 111)',
      'paymentStatus', 'PENDING ⏳ (PO received, payment scheduled Day 118)',
      'customerIntent', 'RENEWING ✅ (100% commitment confirmed)',
      'primaryBlocker', 'Payment processing (AP/Finance coordination)',
      'hoursNeeded', '48-72 hours (payment clears Day 118-119)'
    ),
    'pathForward', 'FINAL_PUSH',
    'reasoning', 'Customer 100% committed, just need payment to process. Will coordinate with AP/Finance to ensure payment clears before renewal date.',
    'teamNotification', jsonb_build_object(
      'managerAcknowledged', true,
      'vpCSNotified', true,
      'dailySync', 'Daily sync at 9am (CSM, Manager, VP CS)'
    )
  ),
  true,
  'gpt-4',
  'Conduct emergency status check for Bluesoft with 5 days remaining',
  true,
  jsonb_build_object('workflow', 'emergency', 'step', 'emergency-status-check'),
  CURRENT_DATE - INTERVAL '5 days'
)
ON CONFLICT (id) DO NOTHING;

-- Artifact 5: Final Push Action Plan
INSERT INTO workflow_task_artifacts (
  id,
  task_id,
  artifact_type,
  title,
  content,
  generated_by_ai,
  ai_model,
  ai_prompt,
  is_approved,
  metadata,
  created_at
) VALUES (
  '30000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000005',
  'action_plan',
  'Final Push - Payment Collection',
  jsonb_build_object(
    'hoursRemaining', 96,
    'primaryBlocker', 'Payment processing',
    'immediateActions', jsonb_build_object(
      'paymentCoordination', ARRAY[
        'Called Bluesoft AP/Finance directly (spoke with Sarah in AP)',
        'Confirmed payment scheduled for Day 118 (3 days before renewal)',
        'Backup: Accept credit card payment if wire/ACH delayed',
        'Finance approved payment plan if needed (50/50 split)'
      ],
      'executiveConfirmation', jsonb_build_object(
        'callCompleted', true,
        'participants', 'CEO-to-CEO confirmation call with Sarah Chen (Bluesoft VP Eng)',
        'outcome', 'Confirmed renewal commitment and timeline',
        'futureOpportunity', 'Discussed future expansion opportunities (Q2 2026)'
      ),
      'hourlyUpdates', jsonb_build_object(
        'day118', jsonb_build_object(
          '9am', 'Payment initiated by Bluesoft AP',
          '3pm', 'Payment confirmed in transit (ACH 24-48 hours)'
        ),
        'day119', jsonb_build_object(
          '9am', 'Payment still processing',
          '3pm', 'Payment CLEARED ✅'
        ),
        'day120', jsonb_build_object(
          '9am', 'Renewal SECURED ✅ - Contract fully executed, payment received, Salesforce updated'
        )
      )
    )
  ),
  true,
  'gpt-4',
  'Execute final push for Bluesoft payment collection',
  true,
  jsonb_build_object('workflow', 'emergency', 'step', 'final-push'),
  CURRENT_DATE - INTERVAL '4 days'
)
ON CONFLICT (id) DO NOTHING;

-- Artifact 6: Renewal Success Report
INSERT INTO workflow_task_artifacts (
  id,
  task_id,
  artifact_type,
  title,
  content,
  generated_by_ai,
  ai_model,
  ai_prompt,
  is_approved,
  metadata,
  created_at
) VALUES (
  '30000000-0000-0000-0000-000000000006',
  '20000000-0000-0000-0000-000000000006',
  'assessment',
  'Bluesoft Renewal - Success Report',
  jsonb_build_object(
    'finalOutcome', 'RENEWAL SECURED WITH EXPANSION',
    'outcomeDetails', jsonb_build_object(
      'expansion', '10% expansion: $180K → $198K ARR',
      'licenseExpansion', '40 → 45 seats',
      'contractTerm', '1-year contract (renews Oct 2026)',
      'paymentTerms', 'Net 30',
      'contractValue', 198000,
      'startDate', '2025-10-10',
      'endDate', '2026-10-09'
    ),
    'nextSteps', jsonb_build_object(
      'immediate', ARRAY[
        'Contract processed and filed',
        'Payment confirmed received ($198K)',
        'Salesforce updated (Closed Won, next renewal opp created)',
        'Thank you email sent to Sarah Chen and David Kim'
      ],
      'followUp', ARRAY[
        'Onboard 5 new users (expansion seats)',
        'Schedule success check-in (30 days)',
        'Plan Q1 QBR (January 2026)'
      ],
      'futurePlanning', jsonb_build_object(
        'healthScore', 85,
        'expansionOpportunity', 'Q2 2026 (Sarah mentioned potential for 20 more seats)',
        'executiveSponsorRelationship', 'Strong (CEO-to-VP relationship established)'
      )
    ),
    'postMortem', jsonb_build_object(
      'whatLedToEmergency', ARRAY[
        'CFO signature delayed due to travel schedule',
        'Legal review took 3 days (custom payment terms)',
        'AP/Finance payment processing near deadline'
      ],
      'couldHaveDoneDifferently', ARRAY[
        'Start signature collection 30 days earlier (not 15 days)',
        'Identify CFO travel schedule sooner',
        'Simplify payment terms to avoid legal delays'
      ],
      'lessonsLearned', ARRAY[
        'Executive-to-executive relationships are critical for high-value renewals',
        'Multi-channel outreach (email, phone, LinkedIn) accelerates responses',
        'Payment processing can take 48-72 hours - plan accordingly'
      ],
      'preventionPlan', ARRAY[
        '60-day signature collection timeline (not 30 days)',
        'Stakeholder travel calendars tracked in CRM',
        'Standard payment terms for renewals (custom terms only if necessary)'
      ]
    ),
    'celebration', 'Bluesoft renewed with expansion! Excellent teamwork by CSM, Executive Sponsor, and VP CS. Health score improved to 85, customer relationship stronger than ever.',
    'nextRenewal', '2026-10-09',
    'growthPotential', '20+ additional seats in Q2 2026',
    'accountStatus', 'Tier 1 Strategic Account ⭐'
  ),
  true,
  'gpt-4',
  'Generate renewal success report and post-mortem for Bluesoft',
  true,
  jsonb_build_object('workflow', 'emergency', 'step', 'outcome-resolution', 'finalOutcome', 'success'),
  CURRENT_DATE
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BLUESOFT WORKFLOWS & ARTIFACTS SEEDED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created workflow executions:';
  RAISE NOTICE '  - Critical Renewal (Days 105-115)';
  RAISE NOTICE '  - Emergency Renewal (Days 115-120)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tasks:';
  RAISE NOTICE '  - Critical Status Assessment';
  RAISE NOTICE '  - Executive Escalation';
  RAISE NOTICE '  - Emergency Resolution Plan';
  RAISE NOTICE '  - Emergency Status Check';
  RAISE NOTICE '  - Final Push - Payment Collection';
  RAISE NOTICE '  - Renewal Success Report';
  RAISE NOTICE '';
  RAISE NOTICE 'Created artifacts:';
  RAISE NOTICE '  - 6 artifacts across the renewal lifecycle';
  RAISE NOTICE '  - All artifacts AI-generated and approved';
  RAISE NOTICE '  - Mapped to workflow tasks';
  RAISE NOTICE '';
  RAISE NOTICE 'Demo ready! Access Bluesoft showcase:';
  RAISE NOTICE '  - Customer ID: 00000000-0000-0000-0000-000000000001';
  RAISE NOTICE '  - Final ARR: $198,000 (10%% expansion)';
  RAISE NOTICE '  - Health Score: 85';
  RAISE NOTICE '  - Status: Renewal Secured ✅';
  RAISE NOTICE '========================================';
END $$;
