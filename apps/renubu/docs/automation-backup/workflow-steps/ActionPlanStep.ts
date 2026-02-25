/**
 * Generic Action Plan Step Template
 *
 * This step can be used as the final step in any renewal workflow.
 * It generates a comprehensive action plan with:
 * - Summary of completed process
 * - AI-executable tasks (CRM updates, reminders, tracking)
 * - CSM-assigned tasks (meetings, calls, relationship building)
 * - Timeline of next steps
 * - Next workflow trigger information
 *
 * Usage: Import and add as last step in any workflow definition
 */

import { WorkflowStepDefinition } from '../types/workflow';

export const ActionPlanStep: WorkflowStepDefinition = {
  id: 'action-plan',
  name: 'Review Action Plan',
  type: 'planning',
  description: 'Generate comprehensive action plan with AI and CSM tasks',
  estimatedTime: '5-10min',

  execution: {
    llmPrompt: `
      You are generating a comprehensive ACTION PLAN for a renewal workflow.
      This plan will guide both automated systems (AI tasks) and humans (CSM tasks) through next steps.

      ═══════════════════════════════════════════════════════════════════════
      CONTEXT - CUSTOMER & WORKFLOW
      ═══════════════════════════════════════════════════════════════════════

      Customer: {{customer.name}}
      Current ARR: ${{customer.arr}}
      Days Until Renewal: {{customer.daysUntilRenewal}}
      Renewal Date: {{customer.renewalDate}}

      Current Workflow: {{workflow.name}}
      Workflow Stage: {{workflow.stage}}
      Workflow Type: {{workflow.type}}

      ═══════════════════════════════════════════════════════════════════════
      CONTEXT - COMPLETED STEPS
      ═══════════════════════════════════════════════════════════════════════

      {{#each previousSteps}}
      ──────────────────────────────────────────────────────────────────────
      Step {{this.stepNumber}}: {{this.stepName}}
      ──────────────────────────────────────────────────────────────────────
      Type: {{this.type}}
      Status: {{this.status}}

      Outputs:
      {{#each this.outputs}}
      - {{this.key}}: {{this.value}}
      {{/each}}

      Key Decisions:
      {{#if this.decisions}}
      {{#each this.decisions}}
      - {{this.decision}}
      {{/each}}
      {{else}}
      - No explicit decisions recorded
      {{/if}}

      {{/each}}

      ═══════════════════════════════════════════════════════════════════════
      YOUR TASK: GENERATE ACTION PLAN
      ═══════════════════════════════════════════════════════════════════════

      Create a structured action plan with the following sections:

      ───────────────────────────────────────────────────────────────────────
      1. PROCESS SUMMARY
      ───────────────────────────────────────────────────────────────────────

      Summarize what was completed in this workflow:
      - List each step with status (Complete, Partial, etc.)
      - Key decisions made (pricing changes, contact updates, strategy choices)
      - Important metrics identified (ARR targets, risk levels, dates)

      Format as array of objects:
      [
        {
          "stepName": "Contract Review",
          "status": "complete",
          "keyDecision": "Price Increase Cap: 8%",
          "value": "Max increase: $17,600"
        },
        ...
      ]

      ───────────────────────────────────────────────────────────────────────
      2. AI ACTION ITEMS (Auto-Executable Tasks)
      ───────────────────────────────────────────────────────────────────────

      Identify tasks that can be AUTOMATED by the system:

      Common AI Tasks:
      - Update CRM records (contact changes, opportunity updates, field updates)
      - Create automated reminders (follow-ups, deadline alerts, check-ins)
      - Set up tracking (email engagement, meeting scheduling, document opens)
      - Sync data across systems (Salesforce, HubSpot, internal DB)
      - Generate reports (value realization, usage analytics)
      - Schedule notifications (to CSM, to customer, to stakeholders)

      For EACH AI task, provide:
      - action: Short action name (e.g., "Update Salesforce Contact")
      - description: Detailed description of what will be done
      - processor: Name of the processor file to execute it
        * Use: "salesforce-contact-updater.js" for CRM contact updates
        * Use: "follow-up-reminder-creator.js" for creating reminders
        * Use: "email-engagement-tracker.js" for email tracking
        * Use: "crm-opportunity-updater.js" for opportunity field updates
        * Use: "workflow-scheduler.js" for scheduling next workflows
      - estimatedTime: How long it takes (e.g., "Within 15 minutes", "Within 1 hour")
      - priority: 1-5 (1 = most urgent)
      - executeImmediately: true/false (execute right away vs. scheduled)
      - metadata: Any data needed by the processor (old values, new values, IDs, etc.)

      Format as array of objects:
      [
        {
          "action": "Update Primary Contact in Salesforce",
          "description": "Change primary contact from Sarah Chen to Eric Estrada in Salesforce opportunity",
          "processor": "salesforce-contact-updater.js",
          "estimatedTime": "Within 15 minutes",
          "priority": 1,
          "executeImmediately": true,
          "metadata": {
            "oldContact": { "name": "Sarah Chen", "salesforceId": "003..." },
            "newContact": { "name": "Eric Estrada", "salesforceId": "003..." }
          }
        },
        ...
      ]

      ───────────────────────────────────────────────────────────────────────
      3. CSM ACTION ITEMS (Human-Required Tasks)
      ───────────────────────────────────────────────────────────────────────

      Identify tasks that require HUMAN action:

      Common CSM Tasks:
      - Schedule and conduct meetings (QBRs, renewal discussions, stakeholder calls)
      - Make phone calls (check-ins, relationship building)
      - Strategic decisions (pricing negotiations, contract amendments)
      - Relationship building (executive engagement, multi-threading)
      - Documentation (value realization reports, business cases)
      - Internal coordination (legal, finance, product teams)

      For EACH CSM task, provide:
      - action: Short action name (e.g., "Schedule CFO Engagement Meeting")
      - description: Detailed description of what CSM should do
      - complexity: "simple" | "moderate" | "complex"
        * simple: Single action, <30 min
        * moderate: Multiple steps, 30-60 min
        * complex: Requires planning, multiple dependencies, >60 min
      - priority: 1-5 (1 = most urgent)
      - estimatedTime: Estimated duration (e.g., "30 minutes", "2 hours")
      - dueDate: Suggested due date (relative to today or absolute)
      - subTasks: If complexity = "complex", break into sub-tasks

      Format as array of objects:
      [
        {
          "action": "Schedule and Conduct CFO Engagement Meeting",
          "description": "Set up 30-minute intro call with new CFO to discuss value, build relationship, and address budget concerns",
          "complexity": "complex",
          "priority": 1,
          "estimatedTime": "2 hours total (prep + meeting + follow-up)",
          "dueDate": "Within 2 weeks",
          "subTasks": [
            {
              "action": "Research CFO background and priorities",
              "estimatedTime": "30 minutes"
            },
            {
              "action": "Prepare value-focused slide deck",
              "estimatedTime": "45 minutes"
            },
            {
              "action": "Send meeting invitation",
              "estimatedTime": "15 minutes"
            },
            {
              "action": "Conduct meeting",
              "estimatedTime": "30 minutes"
            }
          ]
        },
        ...
      ]

      ───────────────────────────────────────────────────────────────────────
      4. TIMELINE (Sequential Next Steps)
      ───────────────────────────────────────────────────────────────────────

      Create a sequential timeline of what happens next:
      - Include immediate tasks (today/this week)
      - Include follow-up tasks (next 2-4 weeks)
      - Include next workflow triggers
      - Include renewal milestones

      For EACH timeline event, provide:
      - step: Sequential number (1, 2, 3...)
      - date: Date or relative time (e.g., "Today", "Oct 1-3", "Within 2 weeks", "Day 90")
      - owner: "AI" | "CSM" | "Customer"
      - title: Short title
      - description: Brief description
      - status: "pending" | "completed"

      Format as array of objects:
      [
        {
          "step": 1,
          "date": "Today",
          "owner": "AI",
          "title": "Update CRM Records",
          "description": "Automated updates to Salesforce contact and opportunity",
          "status": "pending"
        },
        {
          "step": 2,
          "date": "Within 2-3 business days",
          "owner": "Customer",
          "title": "Respond to Meeting Request",
          "description": "Eric should respond to CFO meeting invitation",
          "status": "pending"
        },
        ...
      ]

      ───────────────────────────────────────────────────────────────────────
      5. NEXT WORKFLOW
      ───────────────────────────────────────────────────────────────────────

      Determine what renewal workflow stage comes NEXT:

      Renewal Stage Sequence:
      - Monitor (180+ days)
      - Discovery (150-179 days)
      - Prepare (120-149 days)
      - Engage (90-119 days)
      - Negotiate (60-89 days)
      - Finalize (30-59 days)
      - Signature (15-29 days)
      - Critical (7-14 days)
      - Emergency (0-6 days)
      - Overdue (≤-1 days)

      Based on current stage ({{workflow.stage}}) and days until renewal ({{customer.daysUntilRenewal}}):
      - Identify next workflow stage
      - Calculate estimated trigger date
      - List conditions that must be met before triggering

      Format as object:
      {
        "name": "Prepare Renewal",
        "stage": "Prepare",
        "estimatedDate": "2025-11-15",
        "daysFromNow": 30,
        "conditions": [
          "Discovery action items completed",
          "CFO relationship established",
          "Value documentation finalized"
        ]
      }

      ═══════════════════════════════════════════════════════════════════════
      OUTPUT FORMAT
      ═══════════════════════════════════════════════════════════════════════

      Return a VALID JSON object with this exact structure:

      {
        "summary": {
          "completedSteps": [ /* array of step summaries */ ],
          "keyMetrics": [
            { "label": "Target ARR", "value": "$265,000", "unit": "USD" },
            { "label": "Price Increase", "value": "6.8", "unit": "%" },
            { "label": "Days to Renewal", "value": "165", "unit": "days" }
          ]
        },
        "aiTasks": [ /* array of AI tasks */ ],
        "csmTasks": [ /* array of CSM tasks */ ],
        "timeline": [ /* array of timeline events */ ],
        "nextWorkflow": { /* next workflow object */ }
      }

      ═══════════════════════════════════════════════════════════════════════
      IMPORTANT GUIDELINES
      ═══════════════════════════════════════════════════════════════════════

      1. Be SPECIFIC: Use actual customer names, dates, values from the context
      2. Be ACTIONABLE: Every task should be clear and executable
      3. Be REALISTIC: Estimate times and dates based on typical scenarios
      4. Be COMPLETE: Don't leave gaps - cover all important next steps
      5. Be PRIORITIZED: Most urgent/important tasks should have priority 1-2
      6. VALIDATE JSON: Ensure output is valid, parseable JSON

      Now generate the action plan:
    `,

    processor: 'generators/actionPlanGenerator.js',

    outputs: [
      'action_plan',       // Full action plan object
      'ai_tasks',          // Array of AI tasks
      'csm_tasks',         // Array of CSM tasks
      'timeline',          // Timeline array
      'next_workflow',     // Next workflow metadata
      'summary'            // Process summary
    ]
  },

  ui: {
    type: 'artifact_review',
    description: 'Review the generated action plan and approve to create tasks',

    artifacts: [
      {
        id: 'comprehensive-summary',
        name: 'Action Plan Summary',
        type: 'action_plan',
        component: 'ComprehensiveSummary',

        config: {
          sections: [
            'process_completed',
            'ai_action_items',
            'csm_action_items',
            'timeline',
            'key_metrics'
          ],

          // When CSM clicks "Finalize Action Plan", create tasks
          enableTaskCreation: true,

          // AI tasks execute immediately after creation
          enableAutoExecution: true,

          // Show task creation confirmation
          confirmBeforeCreating: true,

          // Allow editing tasks before finalizing
          allowTaskEditing: true
        }
      }
    ],

    actions: [
      {
        id: 'finalize-action-plan',
        label: 'Finalize Action Plan',
        type: 'primary',
        description: 'Create tasks and trigger AI execution',
        confirmMessage: 'This will create all AI and CSM tasks. Continue?',

        onExecute: {
          createTasks: true,
          executeAITasks: true,
          scheduleNextWorkflow: true,
          completeWorkflow: true
        }
      },
      {
        id: 'edit-action-plan',
        label: 'Edit Tasks',
        type: 'secondary',
        description: 'Modify tasks before finalizing',

        onExecute: {
          openTaskEditor: true
        }
      }
    ]
  }
};

/**
 * Stage-Specific Action Plan Configurations
 *
 * These can be merged with the base ActionPlanStep to provide
 * stage-specific guidance for the LLM.
 */

export const DiscoveryActionPlanConfig = {
  execution: {
    contextEnhancement: `
      ═══════════════════════════════════════════════════════════════════════
      DISCOVERY STAGE CONTEXT
      ═══════════════════════════════════════════════════════════════════════

      This is the DISCOVERY stage (150-179 days until renewal).

      Focus Areas:
      - Relationship building and stakeholder mapping
      - Data gathering (CSM insights, contract analysis, pricing strategy)
      - Early identification of risks and opportunities
      - Foundation setting for future stages

      Typical AI Task Priorities for Discovery:
      1. Update CRM with CSM assessment insights (relationship strength, confidence)
      2. Set calendar reminders for contract notice deadlines
      3. Create stakeholder engagement tracking
      4. Schedule next workflow trigger (Prepare stage at ~140 days)
      5. Set up competitive intelligence monitoring

      Typical CSM Task Priorities for Discovery:
      1. Address stakeholder gaps (e.g., CFO engagement if not yet established)
      2. Reschedule missed QBRs or check-ins
      3. Create value realization documentation
      4. Gather competitive intelligence
      5. Build multi-threaded relationships

      Next Workflow: Prepare (120-149 days)
      Trigger Condition: ~140 days until renewal, or when discovery tasks completed
    `
  }
};

export const EngageActionPlanConfig = {
  execution: {
    contextEnhancement: `
      ═══════════════════════════════════════════════════════════════════════
      ENGAGE STAGE CONTEXT
      ═══════════════════════════════════════════════════════════════════════

      This is the ENGAGE stage (90-119 days until renewal).

      Focus Areas:
      - Active stakeholder engagement and relationship deepening
      - Value demonstration and ROI presentation
      - Early negotiation positioning
      - Proposal preparation

      Typical AI Task Priorities for Engage:
      1. Generate value realization reports
      2. Track stakeholder meeting engagement
      3. Set proposal follow-up reminders
      4. Update opportunity stage in CRM
      5. Schedule Negotiate stage workflow

      Typical CSM Task Priorities for Engage:
      1. Conduct executive value review meetings
      2. Present ROI and business case
      3. Address objections and concerns
      4. Secure verbal commitment
      5. Coordinate internal resources (SE, leadership)

      Next Workflow: Negotiate (60-89 days)
      Trigger Condition: ~75 days until renewal, verbal commitment obtained
    `
  }
};

export const NegotiateActionPlanConfig = {
  execution: {
    contextEnhancement: `
      ═══════════════════════════════════════════════════════════════════════
      NEGOTIATE STAGE CONTEXT
      ═══════════════════════════════════════════════════════════════════════

      This is the NEGOTIATE stage (60-89 days until renewal).

      Focus Areas:
      - Contract negotiation and redlining
      - Pricing finalization
      - Legal and procurement coordination
      - Objection handling

      Typical AI Task Priorities for Negotiate:
      1. Track contract redline versions
      2. Set legal review reminders
      3. Monitor proposal engagement (opens, downloads)
      4. Update CRM with negotiation status
      5. Schedule Finalize stage workflow

      Typical CSM Task Priorities for Negotiate:
      1. Address pricing objections
      2. Coordinate with legal/procurement
      3. Escalate to leadership if needed
      4. Finalize contract terms
      5. Prepare final proposal

      Next Workflow: Finalize (30-59 days)
      Trigger Condition: ~45 days until renewal, pricing and terms agreed
    `
  }
};

export const CriticalActionPlanConfig = {
  execution: {
    contextEnhancement: `
      ═══════════════════════════════════════════════════════════════════════
      CRITICAL STAGE CONTEXT
      ═══════════════════════════════════════════════════════════════════════

      This is the CRITICAL stage (7-14 days until renewal).

      Focus Areas:
      - URGENCY: Contract must be signed soon
      - Executive escalation if needed
      - Remove all blockers
      - Daily follow-ups

      Typical AI Task Priorities for Critical:
      1. Send daily status alerts to CSM
      2. Escalation notifications to leadership
      3. Track signature status in real-time
      4. Update CRM with urgency flags
      5. Prepare emergency contingency

      Typical CSM Task Priorities for Critical:
      1. Daily customer contact
      2. Remove all blockers immediately
      3. Executive escalation if not signed
      4. Coordinate expedited legal review
      5. Prepare for Emergency stage if needed

      Next Workflow: Emergency (0-6 days) or Signature (if signed)
      Trigger Condition: 6 days until renewal, or signature obtained
    `
  }
};
