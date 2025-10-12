/**
 * Obsidian Black Strategic Planning Workflow
 *
 * Five-step workflow for creating strategic recovery plan for
 * Obsidian Black (at-risk customer).
 *
 * Based on FE_ACT1_TASKS.md Phase 2: Workflow 1
 */

import { WorkflowDefinition } from '../WorkflowExecutor';

export const acoStrategicPlanningWorkflow: WorkflowDefinition = {
  id: 'obsblk-strategic-planning',
  name: 'Strategic Account Planning - Obsidian Black',
  description: 'Create 90-day recovery plan for at-risk coordination services customer',
  steps: [
    // ============================================
    // Step 1: Contract Intelligence Review
    // ============================================
    {
      id: 'step-1-contract',
      number: 1,
      title: 'Contract Intelligence & Threat Assessment',
      description: 'Review current agreement, SLA violations, and renewal risk factors',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'obsblk-contract-status',
          type: 'status_grid',
          title: 'Annual Coordination Services Agreement - Status',
          config: {
            columns: 4,
            items: [
              { label: 'Contract Status', value: 'At Risk', status: 'error', sublabel: 'No auto-renewal' },
              { label: 'Health Score', value: '4.2 / 10', status: 'error', sublabel: 'High churn risk' },
              { label: 'Annual Value', value: '$850K', status: 'warning', sublabel: 'Declining usage' },
              { label: 'Renewal Date', value: 'Apr 15, 2026', status: 'warning', sublabel: '143 days' }
            ]
          }
        }
      ]
    },

    // ============================================
    // Step 2: Performance History Analysis
    // ============================================
    {
      id: 'step-2-history',
      number: 2,
      title: 'Operational Incident Log Review',
      description: 'Analyze failure history and service quality issues',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'obsblk-incident-timeline',
          type: 'timeline',
          title: 'Critical Events - Operation Blackout Failure',
          config: {
            events: [
              {
                date: 'Oct 15, 2024',
                title: 'Operation Blackout Initiated',
                description: 'High-value coordination event launched',
                status: 'complete'
              },
              {
                date: 'Oct 15, 2024 14:23',
                title: 'Platform Latency: 47 Seconds',
                description: 'Critical delay in coordination phase - SLA violation',
                status: 'current'
              },
              {
                date: 'Oct 16, 2024',
                title: 'Operation Failed - $850K Loss',
                description: 'Customer impact assessment completed',
                status: 'pending'
              },
              {
                date: 'Oct 18, 2024',
                title: 'Marcus Escalation',
                description: '"Year Two is your proving ground" email sent',
                status: 'pending'
              }
            ]
          }
        },
        {
          id: 'obsblk-service-status',
          type: 'status_grid',
          title: 'Service Quality Indicators',
          config: {
            columns: 2,
            items: [
              { label: 'SLA Compliance', value: '97.2%', status: 'error', sublabel: 'Below 99.5% target' },
              { label: 'Communication Gap', value: '87 days', status: 'error', sublabel: 'After CSM transition' },
              { label: 'Support Stability', value: '4 liaisons', status: 'error', sublabel: 'In 8 months' },
              { label: 'Platform Uptime', value: '99.1%', status: 'warning', sublabel: 'Operation Blackout impact' }
            ]
          }
        }
      ]
    },

    // ============================================
    // Step 3: Risk Score Calculation
    // ============================================
    {
      id: 'step-3-risk',
      number: 3,
      title: 'Threat Analysis Report',
      description: 'Calculate comprehensive health score and churn probability',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'obsblk-health-breakdown',
          type: 'status_grid',
          title: 'Health Score Component Analysis',
          config: {
            columns: 2,
            items: [
              { label: 'Product Performance', value: '3.1 / 10', status: 'error', sublabel: 'Operation Blackout' },
              { label: 'Relationship Strength', value: '4.8 / 10', status: 'warning', sublabel: '87-day gap' },
              { label: 'Strategic Alignment', value: '5.2 / 10', status: 'warning', sublabel: 'Moderate fit' },
              { label: 'Support Quality', value: '3.5 / 10', status: 'error', sublabel: '4 liaison changes' },
              { label: 'Executive Sponsorship', value: '6.0 / 10', status: 'warning', sublabel: 'Marcus engaged' },
              { label: 'Overall Health', value: '4.2 / 10', status: 'error', sublabel: '68% churn risk' }
            ]
          }
        }
      ]
    },

    // ============================================
    // Step 4: Strategic Response Decision
    // ============================================
    {
      id: 'step-4-decision',
      number: 4,
      title: 'Strategic Concern Assessment',
      description: 'Identify your primary concern about this account',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'obsblk-concerns-checklist',
          type: 'checklist',
          title: 'Primary Concerns - Select Your Focus',
          config: {
            items: [
              { id: 'tech', label: 'Technical issues won\'t be fixed in time (Platform stability)', completed: false },
              { id: 'elena', label: 'I don\'t know Elena Voss at all (New VP Technical Ops)', completed: false },
              { id: 'time', label: '143 days isn\'t enough time (Renewal timeline pressure)', completed: false },
              { id: 'marcus', label: 'Marcus has already decided to leave (Trust damage)', completed: false }
            ],
            showProgress: false
          }
        }
      ]
    },

    // ============================================
    // Step 5: Account Plan Generation
    // ============================================
    {
      id: 'step-5-plan',
      number: 5,
      title: 'Operational Continuity Blueprint',
      description: 'Review and approve 90-day strategic recovery plan',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'obsblk-recovery-plan',
          type: 'action_tracker',
          title: '90-Day Strategic Recovery Plan',
          config: {
            showProgress: true,
            actions: [
              // Phase 1: Days 1-7 (Immediate Response)
              {
                id: 'action-1',
                title: 'Respond to Marcus "proving ground" email',
                owner: 'Sarah Chen',
                deadline: 'Day 1',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-2',
                title: 'Intro email to Elena Voss (VP Technical Ops)',
                owner: 'Sarah Chen',
                deadline: 'Day 3',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-3',
                title: 'Schedule Marcus call - accountability discussion',
                owner: 'Sarah Chen',
                deadline: 'Day 5',
                status: 'pending',
                checkable: true
              },
              // Phase 2: Days 8-30 (Trust Rebuilding)
              {
                id: 'action-4',
                title: 'Deliver Operation Blackout accountability report',
                owner: 'Sarah Chen',
                deadline: 'Day 15',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-5',
                title: 'Propose dedicated technical liaison',
                owner: 'Sarah Chen',
                deadline: 'Day 20',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-6',
                title: 'Discovery call with Elena about $1.7M initiative',
                owner: 'Sarah Chen',
                deadline: 'Day 10',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-7',
                title: 'Schedule Q1 QBR with Marcus',
                owner: 'Sarah Chen',
                deadline: 'Day 30',
                status: 'pending',
                checkable: true
              },
              // Phase 3: Days 31-90 (Roadmap Positioning)
              {
                id: 'action-8',
                title: 'Demo timezone automation (Elena requirement)',
                owner: 'Product Team',
                deadline: 'Day 45',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-9',
                title: 'Present expansion proposal for Elena initiative',
                owner: 'Sarah Chen',
                deadline: 'Day 60',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-10',
                title: 'Renewal kickoff meeting',
                owner: 'Sarah Chen',
                deadline: 'Day 75',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-11',
                title: 'Renewal proposal delivered',
                owner: 'Sarah Chen',
                deadline: 'Day 90',
                status: 'pending',
                checkable: true
              }
            ]
          }
        },
        {
          id: 'obsblk-success-metrics',
          type: 'status_grid',
          title: 'Success Probability Forecast',
          config: {
            columns: 2,
            items: [
              { label: 'Current Renewal Probability', value: '32%', status: 'error', sublabel: 'Without intervention' },
              { label: 'With Strategic Plan', value: '78%', status: 'complete', sublabel: 'If executed properly' },
              { label: 'Health Score Target', value: '7.5 / 10', status: 'complete', sublabel: 'By Day 90' },
              { label: 'Expansion Opportunity', value: '$2.55M', status: 'complete', sublabel: 'Elena initiative' }
            ]
          }
        }
      ]
    }
  ]
};
