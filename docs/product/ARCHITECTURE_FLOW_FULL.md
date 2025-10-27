# Renubu Architecture Flow - Complete System Diagram

**Last Updated:** 2025-10-27
**Purpose:** Comprehensive architecture visualization for technical documentation and narrative storytelling
**Audience:** Engineers, product managers, stakeholders, and storytellers

---

## Overview

This document provides a complete end-to-end flowchart of the Renubu system architecture, designed to serve dual purposes:

1. **Technical Whitepaper Foundation** - Detailed enough to explain every component, decision point, and data flow
2. **Narrative Story Structure** - Comprehensive enough to form the backbone of a novel about how AI transforms customer success work

The mermaid diagram below visualizes **14 interconnected layers** spanning from data ingestion through workflow execution to continuous improvement.

> **Note:** For a standalone mermaid file that can be rendered directly, see [ARCHITECTURE_FLOW_DIAGRAM.mmd](./ARCHITECTURE_FLOW_DIAGRAM.mmd)

---

## Complete System Flow Diagram

```mermaid
flowchart TD
    %% =====================================================
    %% LAYER 1: DATA INGESTION & INTELLIGENCE
    %% =====================================================

    START([CSM Wakes Up<br/>Monday Morning]) --> DAILY_JOB[Daily Background Job<br/>Runs at 6am]

    DAILY_JOB --> INGEST[Data Ingestion Layer]

    subgraph DATA_SOURCES[Data Sources]
        CRM[(CRM System<br/>Customer Data)]
        USAGE[(Usage Analytics<br/>Product Metrics)]
        SUPPORT[(Support Tickets<br/>Sentiment Data)]
        CONTRACTS[(Contract Database<br/>Terms & Dates)]
    end

    CRM --> INGEST
    USAGE --> INGEST
    SUPPORT --> INGEST
    CONTRACTS --> INGEST

    INGEST --> CUSTOMER_REFRESH[Refresh Customer Records]
    CUSTOMER_REFRESH --> |"For each customer"| ANALYZE

    %% =====================================================
    %% LAYER 2: INTELLIGENCE ANALYSIS ENGINE
    %% =====================================================

    subgraph INTEL[Intelligence Analysis Engine]
        ANALYZE[Analyze Customer State]

        ANALYZE --> HEALTH[Calculate Health Score<br/>0-100]
        ANALYZE --> USAGE_TREND[Analyze Usage Trends<br/>+/-% Change]
        ANALYZE --> SENTIMENT[Assess Support Sentiment<br/>Positive/Negative/Neutral]
        ANALYZE --> CONTRACT_CHECK[Check Contract Status<br/>Active/Expiring/Renewed]

        HEALTH --> RISK_CALC[Risk Score Calculator<br/>0-10 Scale]
        USAGE_TREND --> RISK_CALC
        SENTIMENT --> RISK_CALC
        CONTRACT_CHECK --> RISK_CALC

        USAGE_TREND --> OPP_CALC[Opportunity Score Calculator<br/>0-10 Scale]
        HEALTH --> OPP_CALC
        CONTRACT_CHECK --> OPP_CALC

        CONTRACT_CHECK --> RENEWAL_CALC[Days Until Renewal Calculator]

        RISK_CALC --> STAGE_DETERMINE
        OPP_CALC --> STAGE_DETERMINE
        RENEWAL_CALC --> STAGE_DETERMINE
        CONTRACT_CHECK --> STAGE_DETERMINE

        STAGE_DETERMINE[Determine Renewal Stage<br/>Emergency/Critical/Urgent/etc]
    end

    STAGE_DETERMINE --> DECISION_MATRIX

    %% =====================================================
    %% LAYER 3: WORKFLOW DETERMINATION ENGINE
    %% =====================================================

    subgraph WORKFLOW_DETERMINATION[Workflow Determination Engine]
        DECISION_MATRIX{Decision Matrix}

        DECISION_MATRIX --> |Risk Score ≥ 7| RISK_TRIGGER[Risk Trigger Activated]
        DECISION_MATRIX --> |Opportunity Score ≥ 6| OPP_TRIGGER[Opportunity Trigger Activated]
        DECISION_MATRIX --> |Days ≤ 120| RENEWAL_TRIGGER[Renewal Trigger Activated]
        DECISION_MATRIX --> |Account Plan = Invest/Expand| STRATEGIC_TRIGGER[Strategic Planning Trigger]
        DECISION_MATRIX --> |No Triggers| MONITOR[Monitor Only<br/>No Workflow]

        RISK_TRIGGER --> CHECK_TIMING{Within 120 Days<br/>of Renewal?}
        CHECK_TIMING --> |Yes| IN_BAND_RISK[In-Band Risk Workflow]
        CHECK_TIMING --> |No| OUT_BAND_RISK[Out-of-Band Risk Intervention]

        OPP_TRIGGER --> CHECK_TIMING2{Within 120 Days<br/>of Renewal?}
        CHECK_TIMING2 --> |Yes| IN_BAND_OPP[In-Band Opportunity Workflow]
        CHECK_TIMING2 --> |No| OUT_BAND_OPP[Out-of-Band Opportunity Development]

        RENEWAL_TRIGGER --> STAGE_WORKFLOW{Match Days to Stage}

        STAGE_WORKFLOW --> |≤7 Days| EMERGENCY_WF[Emergency Retention Protocol]
        STAGE_WORKFLOW --> |8-14 Days| CRITICAL_WF[Critical Intervention Workflow]
        STAGE_WORKFLOW --> |15-30 Days| URGENT_WF[Urgent Action Workflow]
        STAGE_WORKFLOW --> |31-60 Days| FINALIZE_WF[Contract Finalization Workflow]
        STAGE_WORKFLOW --> |61-90 Days| NEGOTIATE_WF[Negotiation Prep Workflow]
        STAGE_WORKFLOW --> |91-120 Days| ACTIVE_WF[Standard Renewal Workflow]
        STAGE_WORKFLOW --> |121-180 Days| PREPARE_WF[Renewal Preparation Workflow]
        STAGE_WORKFLOW --> |181+ Days| STRATEGIC_WF[Strategic Planning Workflow]

        STRATEGIC_TRIGGER --> STRATEGIC_WF
    end

    IN_BAND_RISK --> WORKFLOW_INSTANCE
    OUT_BAND_RISK --> WORKFLOW_INSTANCE
    IN_BAND_OPP --> WORKFLOW_INSTANCE
    OUT_BAND_OPP --> WORKFLOW_INSTANCE
    EMERGENCY_WF --> WORKFLOW_INSTANCE
    CRITICAL_WF --> WORKFLOW_INSTANCE
    URGENT_WF --> WORKFLOW_INSTANCE
    FINALIZE_WF --> WORKFLOW_INSTANCE
    NEGOTIATE_WF --> WORKFLOW_INSTANCE
    ACTIVE_WF --> WORKFLOW_INSTANCE
    PREPARE_WF --> WORKFLOW_INSTANCE
    STRATEGIC_WF --> WORKFLOW_INSTANCE
    MONITOR --> DAILY_SUMMARY

    %% =====================================================
    %% LAYER 4: WORKFLOW INSTANCE CREATION & SCORING
    %% =====================================================

    subgraph WORKFLOW_CREATION[Workflow Instance Creation]
        WORKFLOW_INSTANCE[Create Workflow Instance]

        WORKFLOW_INSTANCE --> PRIORITY_SCORE[Calculate Priority Score]

        subgraph PRIORITY_FACTORS[Priority Factors]
            ARR_FACTOR[ARR Value<br/>Weight: 1.5x]
            URGENCY_FACTOR[Urgency Score<br/>Days Until Renewal]
            HEALTH_FACTOR[Health Decline<br/>Weight: 1.5x]
            USAGE_FACTOR[Usage Decline<br/>Weight: 1.2x]
            STRATEGIC_FACTOR[Strategic Account<br/>Weight: 2.0x]
        end

        ARR_FACTOR --> PRIORITY_SCORE
        URGENCY_FACTOR --> PRIORITY_SCORE
        HEALTH_FACTOR --> PRIORITY_SCORE
        USAGE_FACTOR --> PRIORITY_SCORE
        STRATEGIC_FACTOR --> PRIORITY_SCORE

        PRIORITY_SCORE --> ASSIGN_CSM[Assign to CSM Owner]
        ASSIGN_CSM --> QUEUE[Add to Workflow Queue]
    end

    QUEUE --> ALL_WORKFLOWS[Collect All Workflows<br/>From All Customers]
    ALL_WORKFLOWS --> SORT_PRIORITY[Sort by Priority Score<br/>Highest First]
    SORT_PRIORITY --> DAILY_SUMMARY

    %% =====================================================
    %% LAYER 5: DASHBOARD PRESENTATION
    %% =====================================================

    subgraph DASHBOARD[Dashboard Layer]
        DAILY_SUMMARY[Generate Daily Summary<br/>Per CSM]

        DAILY_SUMMARY --> TODAY_ONE[Today's One Thing<br/>Highest Priority Workflow]
        DAILY_SUMMARY --> PRIORITY_LIST[Priority Workflows List<br/>Top 5-10]
        DAILY_SUMMARY --> SNOOZED_CHECK{Any Snoozed Steps<br/>Due Today?}

        SNOOZED_CHECK --> |Yes| SNOOZED_BANNER[Resume Snoozed Steps Banner]
        SNOOZED_CHECK --> |No| CONTINUE_DASH

        TODAY_ONE --> CONTINUE_DASH[Display Dashboard]
        PRIORITY_LIST --> CONTINUE_DASH
        SNOOZED_BANNER --> CONTINUE_DASH
    end

    CONTINUE_DASH --> CSM_LOGIN

    %% =====================================================
    %% LAYER 6: USER INTERACTION - DASHBOARD VIEW
    %% =====================================================

    CSM_LOGIN([CSM Opens Dashboard<br/>8:00 AM])

    CSM_LOGIN --> SEES_DASHBOARD{What Does CSM See?}

    SEES_DASHBOARD --> |Main Card| PRIORITY_CARD["Priority Card:<br/>Obsidian Black - $185K ARR<br/>Renewal in 365 days<br/>Health Score: 87"]
    SEES_DASHBOARD --> |Secondary| WORKFLOW_TABS["Workflow State Panel:<br/>• Active (3)<br/>• Snoozed (1)<br/>• Escalated (0)"]
    SEES_DASHBOARD --> |Notification| ALERT_BANNER["Alert Banner:<br/>1 snoozed step due today"]

    PRIORITY_CARD --> CSM_DECISION{CSM Decides}
    WORKFLOW_TABS --> CSM_DECISION
    ALERT_BANNER --> CSM_DECISION

    CSM_DECISION --> |Click Launch| LAUNCH_WORKFLOW[Click Let's Begin Button]
    CSM_DECISION --> |View Snoozed| RESUME_SNOOZED[Resume Snoozed Step]
    CSM_DECISION --> |Snooze Entire| SNOOZE_WORKFLOW[Snooze Entire Workflow]

    %% =====================================================
    %% LAYER 7: WORKFLOW LAUNCH & COMPOSITION
    %% =====================================================

    LAUNCH_WORKFLOW --> SERVER_COMPOSE[Server-Side Composition]

    subgraph COMPOSITION[Workflow Composition Layer - Phase 3]
        SERVER_COMPOSE --> FETCH_DEF[Fetch from workflow_definitions]

        FETCH_DEF --> DB_QUERY["Database Query:<br/>SELECT * FROM workflow_definitions<br/>WHERE workflow_id = 'obsidian-black-renewal'<br/>AND company_id IS NULL"]

        DB_QUERY --> DEF_RESULT["Workflow Definition:<br/>• slide_sequence: ['intro', 'account', 'pricing', 'quote', 'email', 'summary']<br/>• slide_contexts: {pricing: {variables: {...}}}"]

        DEF_RESULT --> SLIDE_LOOP[Loop Through Slide Sequence]

        SLIDE_LOOP --> SLIDE_LIB[Slide Library Lookup]

        subgraph SLIDE_LIBRARY[Slide Library - Reusable Builders]
            INTRO_SLIDE[intro-slide Builder]
            ACCOUNT_SLIDE[account-overview Builder]
            PRICING_SLIDE[pricing-strategy Builder]
            QUOTE_SLIDE[prepare-quote Builder]
            EMAIL_SLIDE[email-draft Builder]
            SUMMARY_SLIDE[summary-slide Builder]
        end

        SLIDE_LIB --> BUILD_SLIDE[Build Slide with Context]
        BUILD_SLIDE --> TEMPLATE_HYDRATE[Template Hydration Engine]

        TEMPLATE_HYDRATE --> REPLACE_VARS["Replace Variables:<br/>{{customerName}} → 'Obsidian Black'<br/>{{timeOfDay}} → 'morning'<br/>{{daysToRenewal}} → '365'"]

        REPLACE_VARS --> RESOLVE_COMPONENTS[Resolve Artifact Components]
        RESOLVE_COMPONENTS --> SLIDE_COMPLETE[Slide Complete]

        SLIDE_COMPLETE --> MORE_SLIDES{More Slides?}
        MORE_SLIDES --> |Yes| SLIDE_LOOP
        MORE_SLIDES --> |No| CONFIG_READY[Workflow Config Ready]
    end

    CONFIG_READY --> CREATE_EXECUTION

    %% =====================================================
    %% LAYER 8: WORKFLOW EXECUTION RECORD
    %% =====================================================

    subgraph EXECUTION_TRACKING[Execution Tracking Layer]
        CREATE_EXECUTION[Create Workflow Execution Record]

        CREATE_EXECUTION --> INSERT_EXEC["INSERT INTO workflow_executions:<br/>• workflow_config_id<br/>• customer_id<br/>• user_id<br/>• status: 'in_progress'<br/>• total_steps: 6<br/>• current_step: 0"]

        INSERT_EXEC --> EXEC_ID[Return Execution ID]
        EXEC_ID --> REGISTER_CONFIG[Register Config in Memory]
    end

    REGISTER_CONFIG --> OPEN_TASKMODE

    %% =====================================================
    %% LAYER 9: TASKMODE FULLSCREEN UI
    %% =====================================================

    subgraph TASKMODE_UI[TaskMode Fullscreen Interface]
        OPEN_TASKMODE[Open TaskMode Fullscreen]

        OPEN_TASKMODE --> INIT_STATE[Initialize useTaskModeState Hook]

        INIT_STATE --> LOAD_STEPS[Load Step States from Database]

        LOAD_STEPS --> STEP_QUERY["Query workflow_step_states<br/>for execution_id"]

        STEP_QUERY --> RENDER_UI[Render Fullscreen Modal]

        subgraph UI_COMPONENTS[UI Components]
            HEADER[Workflow Header<br/>Customer Name, Progress]
            PROGRESS_BAR[Step Progress Bar<br/>6 Steps with Status Badges]
            CHAT_PANEL[Chat Panel - Left Side<br/>Conversation Interface]
            ARTIFACT_PANEL[Artifact Panel - Right Side<br/>Interactive Components]
        end

        RENDER_UI --> HEADER
        RENDER_UI --> PROGRESS_BAR
        RENDER_UI --> CHAT_PANEL
        RENDER_UI --> ARTIFACT_PANEL
    end

    CHAT_PANEL --> FIRST_SLIDE
    ARTIFACT_PANEL --> FIRST_SLIDE

    %% =====================================================
    %% LAYER 10: SLIDE NAVIGATION & INTERACTION
    %% =====================================================

    subgraph SLIDE_FLOW[Slide-by-Slide Workflow Execution]
        FIRST_SLIDE[Slide 1: Introduction]

        FIRST_SLIDE --> INTRO_CHAT["Chat Message:<br/>'Good morning! Let's plan the renewal for Obsidian Black...'"]
        FIRST_SLIDE --> INTRO_ARTIFACT["Artifact:<br/>Strategic Plan Summary<br/>• Current ARR: $185K<br/>• Health Score: 87<br/>• Renewal: 365 days"]

        INTRO_CHAT --> INTRO_BUTTON[Button: Let's Review the Account]
        INTRO_ARTIFACT --> INTRO_BUTTON

        INTRO_BUTTON --> |Click| SLIDE2[Slide 2: Account Overview]

        SLIDE2 --> ACCOUNT_CHAT["Chat Message:<br/>'Here's the complete account overview...'"]
        SLIDE2 --> ACCOUNT_ARTIFACTS["Artifacts:<br/>• Contract Summary Card<br/>• Contact List<br/>• Usage Metrics Chart<br/>• Health Score Timeline"]

        ACCOUNT_CHAT --> ACCOUNT_CHECKLIST[Interactive Checklist:<br/>☐ Reviewed contract terms<br/>☐ Verified key contacts<br/>☐ Checked usage trends]
        ACCOUNT_ARTIFACTS --> ACCOUNT_CHECKLIST

        ACCOUNT_CHECKLIST --> |All Checked| SLIDE3[Slide 3: Pricing Strategy]

        SLIDE3 --> PRICING_CHAT["Chat Message:<br/>'Based on usage growth and market position,<br/>I recommend an 8% increase...'"]
        SLIDE3 --> PRICING_ARTIFACTS["Artifacts:<br/>• Pricing Recommendation Card<br/>• Competitive Analysis<br/>• ROI Calculator<br/>• Scenario Comparison"]

        PRICING_CHAT --> PRICING_DECISION{CSM Decision Point}
        PRICING_ARTIFACTS --> PRICING_DECISION

        PRICING_DECISION --> |Accept| SLIDE4[Slide 4: Prepare Quote]
        PRICING_DECISION --> |Modify| PRICING_ADJUST[Adjust Pricing Parameters]
        PRICING_DECISION --> |Snooze Step| SNOOZE_MODAL[Open Snooze Modal]

        PRICING_ADJUST --> SLIDE4

        SLIDE4 --> QUOTE_CHAT["Chat Message:<br/>'Let's build your renewal quote...'"]
        SLIDE4 --> QUOTE_ARTIFACT["Artifact:<br/>Interactive Quote Builder<br/>• Line Items<br/>• Terms & Conditions<br/>• Payment Schedule<br/>• Approval Workflow"]

        QUOTE_CHAT --> QUOTE_COMPLETE[Generate PDF Quote]
        QUOTE_ARTIFACT --> QUOTE_COMPLETE

        QUOTE_COMPLETE --> SLIDE5[Slide 5: Email Draft]

        SLIDE5 --> EMAIL_CHAT["Chat Message:<br/>'Here's a personalized email for Marcus Chen...'"]
        SLIDE5 --> EMAIL_ARTIFACT["Artifact:<br/>Email Composer<br/>• Personalized greeting<br/>• Usage highlights<br/>• Value proposition<br/>• Call to action"]

        EMAIL_CHAT --> EMAIL_EDIT[CSM Reviews and Edits]
        EMAIL_ARTIFACT --> EMAIL_EDIT

        EMAIL_EDIT --> EMAIL_SEND{Send Email?}
        EMAIL_SEND --> |Yes| SEND_EMAIL[Send via Integration]
        EMAIL_SEND --> |Save Draft| SAVE_DRAFT[Save to CRM]

        SEND_EMAIL --> SLIDE6[Slide 6: Summary & Completion]
        SAVE_DRAFT --> SLIDE6

        SLIDE6 --> SUMMARY_CHAT["Chat Message:<br/>'Excellent work! Here's what we accomplished...'"]
        SLIDE6 --> SUMMARY_ARTIFACTS["Artifacts:<br/>• Completion Report<br/>• Next Steps Checklist<br/>• Follow-up Schedule<br/>• Success Metrics"]

        SUMMARY_CHAT --> COMPLETE_BTN[Button: Mark Complete]
        SUMMARY_ARTIFACTS --> COMPLETE_BTN

        COMPLETE_BTN --> |Click| COMPLETE_WORKFLOW[Complete Workflow]
    end

    %% =====================================================
    %% LAYER 11: STEP-LEVEL ACTIONS
    %% =====================================================

    subgraph STEP_ACTIONS[Step-Level Action System]
        SNOOZE_MODAL --> SNOOZE_UI["Snooze Modal:<br/>• Date Picker<br/>• Quick Options (1 day, 2 days, 1 week)<br/>• Reason Field"]

        SNOOZE_UI --> SNOOZE_SUBMIT[Submit Snooze]

        SNOOZE_SUBMIT --> SNOOZE_SERVICE[WorkflowStepActionService]

        SNOOZE_SERVICE --> UPSERT_STATE["UPSERT workflow_step_states:<br/>• execution_id<br/>• step_index: 2<br/>• status: 'snoozed'<br/>• snoozed_until: '2025-10-29 10:00'"]

        SNOOZE_SERVICE --> INSERT_ACTION["INSERT workflow_step_actions:<br/>• action_type: 'snooze'<br/>• reason: 'Waiting for finance approval'<br/>• performed_by: user_id"]

        UPSERT_STATE --> TRIGGER_UPDATE[Database Trigger Fires]
        INSERT_ACTION --> TRIGGER_UPDATE

        TRIGGER_UPDATE --> UPDATE_FLAGS["UPDATE workflow_executions:<br/>• has_snoozed_steps = true<br/>• next_due_step_date = '2025-10-29 10:00'"]

        UPDATE_FLAGS --> RELOAD_STATE[Reload Step States in UI]
        RELOAD_STATE --> ORANGE_BADGE[Display Orange Badge on Step 3]

        ORANGE_BADGE --> CONTINUE_FLOW[Continue with Other Steps]
    end

    CONTINUE_FLOW --> SLIDE4

    %% =====================================================
    %% LAYER 12: WORKFLOW COMPLETION & FEEDBACK
    %% =====================================================

    subgraph COMPLETION[Workflow Completion Layer]
        COMPLETE_WORKFLOW --> UPDATE_EXEC["UPDATE workflow_executions:<br/>• status = 'completed'<br/>• completed_at = NOW()<br/>• completion_percentage = 100"]

        UPDATE_EXEC --> CREATE_TASKS[Create Follow-up Tasks]
        CREATE_TASKS --> UPDATE_RENEWAL[Update Renewal Record]
        UPDATE_RENEWAL --> LOG_OUTCOME[Log Workflow Outcome]

        LOG_OUTCOME --> CONFETTI[Display Confetti Animation]
        CONFETTI --> CLOSE_TASKMODE[Close TaskMode]
    end

    CLOSE_TASKMODE --> BACK_DASHBOARD[Return to Dashboard]

    %% =====================================================
    %% LAYER 13: CONTINUOUS IMPROVEMENT & FEEDBACK LOOP
    %% =====================================================

    subgraph FEEDBACK_LOOP[Feedback & Learning Loop]
        BACK_DASHBOARD --> COLLECT_METRICS[Collect Workflow Metrics]

        COLLECT_METRICS --> METRICS["Metrics Collected:<br/>• Time to complete<br/>• Steps snoozed/skipped<br/>• Button clicks<br/>• Artifacts viewed<br/>• Outcome achieved"]

        METRICS --> ANALYZE_PATTERNS[Analyze Patterns]

        ANALYZE_PATTERNS --> UPDATE_ALGO["Update Algorithms:<br/>• Priority scoring weights<br/>• Workflow determination rules<br/>• Template effectiveness"]

        UPDATE_ALGO --> NEXT_CYCLE[Ready for Next Day]
    end

    NEXT_CYCLE --> DAILY_JOB

    %% =====================================================
    %% LAYER 14: BACKGROUND JOBS & AUTOMATED TRIGGERS
    %% =====================================================

    subgraph BACKGROUND[Background Jobs & Automation]
        NIGHTLY_JOB[Nightly Job - 11pm]

        NIGHTLY_JOB --> CHECK_SNOOZED["Check Snoozed Steps:<br/>Query workflow_step_states<br/>WHERE snoozed_until <= TOMORROW"]

        CHECK_SNOOZED --> SEND_NOTIF[Send Notifications to CSMs]
        SEND_NOTIF --> EMAIL_NOTIF[Email: You have 1 step due tomorrow]
        SEND_NOTIF --> IN_APP_NOTIF[In-App Notification Badge]

        WEEKLY_JOB[Weekly Job - Sunday]
        WEEKLY_JOB --> ACCOUNT_REVIEW[Review All Accounts]
        ACCOUNT_REVIEW --> ADJUST_PLANS[Adjust Account Plans]
        ADJUST_PLANS --> FORECAST[Generate Forecast Report]

        EVENT_TRIGGER[Event-Driven Triggers]
        EVENT_TRIGGER --> |Support Ticket Created| SUPPORT_EVENT[High-Priority Ticket Detected]
        SUPPORT_EVENT --> ESCALATE[Create Risk Workflow]

        EVENT_TRIGGER --> |Usage Spike| USAGE_EVENT[Significant Usage Increase]
        USAGE_EVENT --> CREATE_OPP[Create Opportunity Workflow]

        EVENT_TRIGGER --> |Contact Changed| CONTACT_EVENT[Primary Contact Left Company]
        CONTACT_EVENT --> EXEC_LOSS[Executive Contact Loss Workflow]
    end

    ESCALATE --> WORKFLOW_INSTANCE
    CREATE_OPP --> WORKFLOW_INSTANCE
    EXEC_LOSS --> WORKFLOW_INSTANCE

    %% =====================================================
    %% STYLING
    %% =====================================================

    classDef dataLayer fill:#7ED95A,stroke:#333,stroke-width:2px,color:#000
    classDef intelligenceLayer fill:#2E1175,stroke:#333,stroke-width:2px,color:#fff
    classDef workflowLayer fill:#ec8d1d,stroke:#333,stroke-width:2px,color:#fff
    classDef executionLayer fill:#4095c9,stroke:#333,stroke-width:2px,color:#fff
    classDef uiLayer fill:#9333ea,stroke:#333,stroke-width:2px,color:#fff
    classDef dbLayer fill:#f59e0b,stroke:#333,stroke-width:2px,color:#000

    class DAILY_JOB,INGEST,CUSTOMER_REFRESH dataLayer
    class ANALYZE,HEALTH,USAGE_TREND,RISK_CALC,OPP_CALC,STAGE_DETERMINE intelligenceLayer
    class DECISION_MATRIX,WORKFLOW_INSTANCE,PRIORITY_SCORE workflowLayer
    class CREATE_EXECUTION,OPEN_TASKMODE,SLIDE_FLOW executionLayer
    class CSM_LOGIN,SEES_DASHBOARD,TASKMODE_UI uiLayer
    class INSERT_EXEC,UPSERT_STATE,INSERT_ACTION,UPDATE_EXEC dbLayer
```

---

## Narrative Arc: The Story of a Workflow

### Chapter 1: Dawn of a New Day
**The Silent Guardian** - At 6 AM, while CSMs sleep, Renubu's daily job awakens. Like a devoted assistant preparing for a busy day, it scans through thousands of customers, calculating health scores, detecting trends, and identifying risks. It's a symphony of data, algorithms working in concert to answer one question: "What matters most today?"

### Chapter 2: The Intelligence Layer
**The Pattern Recognizer** - Deep in the system, the intelligence engine analyzes Obsidian Black's account. Health score: 87 (strong). Usage trend: +20% growth (excellent). Support sentiment: positive. But there's more - the contract expires in 365 days, putting it in the "Strategic Planning" stage. The renewal stage determination algorithm makes its call: this account needs proactive attention.

### Chapter 3: The Decision Matrix
**The Orchestrator's Choice** - The workflow determination engine evaluates the data. With 365 days until renewal, high health, and growing usage, this isn't a risk case - it's an opportunity for expansion. But first, the standard renewal workflow must be initiated. The system creates a workflow instance, tags it for Strategic Planning, and assigns it to Justin, the account owner.

### Chapter 4: The Priority Game
**Scoring What Matters** - Now comes the critical calculation: how important is this workflow compared to the other 183 workflows generated today? The priority score calculator weighs multiple factors:
- ARR Value: $185K × 1.5 weight = High value
- Urgency: 365 days = Lower urgency (but still important)
- Health: 87/100 = Stable, positive
- Usage: +20% growth × 1.2 weight = Strong signal
- Strategic: Yes × 2.0 weight = Critical multiplier

Final score: 87.5 - This lands in the top 5 workflows for the day.

### Chapter 5: Morning Arrives
**The CSM Awakens** - Justin opens his laptop at 8 AM, coffee in hand. Instead of 30 dashboards, he sees one thing: "Renewal Planning for Obsidian Black - $185K ARR". The zen-aesthetic dashboard displays exactly what he needs to know. A single priority card. Three active workflows in the sidebar. One snoozed step due today (from yesterday's work on a different account).

### Chapter 6: The Launch
**Entering the Flow State** - Justin clicks "Let's Begin!". Behind the scenes, the server springs into action:
1. Query: Fetch workflow definition from database
2. Compose: Iterate through slide sequence, building each slide from the library
3. Hydrate: Replace template variables with real customer data
4. Persist: Create workflow execution record in database
5. Launch: Open TaskMode fullscreen interface

The transition is seamless. Justin is now in the workflow.

### Chapter 7: The Journey Begins
**Slide by Slide** - The first message appears in the chat panel: "Good morning, Justin! Let's plan the renewal for Obsidian Black. They're at $185K ARR with 365 days until renewal. Their health score of 87 and +20% usage growth indicate a strong relationship. Let's make this renewal excellent."

On the right, artifacts appear: the strategic plan summary, key metrics visualized. Justin reviews the information, checking boxes as he goes. Each interaction is tracked, each decision logged.

### Chapter 8: The Pricing Decision
**The Human Touch** - Slide 3 presents AI-generated pricing recommendations. The algorithm suggests an 8% increase to $199,800, backed by usage data and market analysis. But Justin hesitates - finance hasn't approved the new pricing tiers yet.

He clicks the step number. A menu appears. "Snooze Step". A modal opens. He selects "2 days", types "Waiting for finance approval", and clicks submit.

Behind the scenes:
- Database: UPSERT workflow_step_states (status: snoozed)
- Database: INSERT workflow_step_actions (audit trail)
- Trigger: Update workflow_executions flags
- UI: Display orange badge on Step 3

But the workflow doesn't stop. Justin continues to Steps 4, 5, and 6, preparing the quote framework and email draft with placeholder pricing.

### Chapter 9: The Completion
**Celebrating Success** - Justin reaches the summary slide. He's completed 5 of 6 steps, with one snoozed. He clicks "Mark Complete". Confetti rains down. The workflow is done (sort of). In two days, the snoozed step will resurface, but for now, Justin has made significant progress.

The database updates:
- workflow_executions: status = 'in_progress', has_snoozed_steps = true
- Tasks created: Follow up with finance, Schedule call with Marcus
- Renewal record updated: Next action date, progress notes

### Chapter 10: The Feedback Loop
**Learning and Improving** - As Justin returns to the dashboard, the system collects metrics:
- Time to complete: 42 minutes (within target)
- Steps snoozed: 1 (pricing strategy)
- Artifacts viewed: 8 of 12 available
- Button clicks: 23 interactions
- Outcome: Partial completion with clear next steps

These metrics feed back into the algorithm. Over time, the system learns:
- When finance approvals typically cause delays
- Which artifacts are most valuable for strategic accounts
- How to better sequence slides for efficiency
- What priority scoring weights produce the best outcomes

### Chapter 11: The Next Day
**The Snoozed Step Returns** - Two days later, Justin logs in. The dashboard shows: "Resume Snoozed Step: Obsidian Black - Pricing Strategy". Finance has approved. He clicks, and instantly he's back at Step 3, exactly where he left off. The context is preserved. The work continues seamlessly.

### Chapter 12: The Bigger Picture
**The System at Scale** - While Justin works on Obsidian Black, the system manages 1,847 other customer accounts:
- 247 renewal workflows generated this month
- 89 risk interventions triggered automatically
- 53 opportunity workflows created from usage spikes
- 12 executive contact loss workflows from CRM events

Each CSM sees their own "one thing". Each workflow precisely prioritized. Each interaction feeding the learning loop.

---

## Key Architectural Patterns

### Pattern 1: Database-Driven Composition (Phase 3)
**Problem:** Hardcoded workflows required code deploys for every change.
**Solution:** Store workflow definitions in database, compose at runtime.
**Benefit:** Create new workflows in minutes, not days. Support multi-tenancy.

### Pattern 2: Slide Library Abstraction
**Problem:** Duplicated slide logic across workflows (910+ lines per workflow).
**Solution:** Reusable slide builders, referenced by ID in sequences.
**Benefit:** Build 6-step workflow with 6 IDs. Maintain once, use everywhere.

### Pattern 3: Template Hydration
**Problem:** Personalization at scale requires dynamic content.
**Solution:** Template placeholders ({{variable}}) replaced at runtime.
**Benefit:** One workflow template serves 1,000+ customers uniquely.

### Pattern 4: Step-Level Granularity
**Problem:** Snooz ing entire workflow blocks all progress.
**Solution:** Independent step state management with database persistence.
**Benefit:** Continue workflow around blocked steps, resume when ready.

### Pattern 5: Priority Scoring Algorithm
**Problem:** How to rank 247 workflows across urgency, value, and risk?
**Solution:** Multi-factor scoring with configurable weights.
**Benefit:** CSMs always see highest-impact work first.

### Pattern 6: Audit Trail Everything
**Problem:** Compliance requires knowing who did what when.
**Solution:** workflow_step_actions table logs every action.
**Benefit:** Complete auditability, enables learning from behavior.

### Pattern 7: Event-Driven Architecture
**Problem:** React to customer events in real-time, not just daily jobs.
**Solution:** Event triggers create workflows immediately.
**Benefit:** High-priority ticket → Instant risk workflow creation.

### Pattern 8: Feedback Loop Integration
**Problem:** How to continuously improve recommendation quality?
**Solution:** Collect metrics on every workflow, update algorithms weekly.
**Benefit:** System learns what works, adapts priority scoring over time.

---

## Technical Component Directory

### Database Tables (Layer: Persistence)
- `workflow_definitions` - Reusable workflow templates
- `workflow_executions` - Individual workflow runs
- `workflow_step_states` - Step-level status tracking
- `workflow_step_actions` - Complete audit trail
- `contracts` - Contract lifecycle data
- `contract_terms` - Business & legal terms
- `customers` - Customer master data
- `renewals` - Renewal opportunities
- `tasks` - Follow-up to-dos
- `events` - Customer timeline events

### Services (Layer: Business Logic)
- `orchestrator.ts` - Main workflow generation coordinator
- `determination.ts` - Workflow type determination rules
- `scoring.ts` - Priority score calculation
- `db-composer.ts` - Database-driven composition
- `composer.ts` - Slide library assembly
- `hydrator.ts` - Template variable replacement
- `WorkflowStepActionService.ts` - Step-level actions
- `ActionScoreCalculator.ts` - Update urgency scoring
- `EventTriggerEngine.ts` - Real-time event handling

### UI Components (Layer: Presentation)
- `TaskModeFullscreen.tsx` - Main workflow orchestrator
- `useTaskModeState.ts` - State management hook
- `ChatRenderer.tsx` - Left panel conversation
- `ArtifactRenderer.tsx` - Right panel components
- `WorkflowStepProgress.tsx` - Progress bar with badges
- `StepActionModals.tsx` - Snooze/skip modals
- `WorkflowStatePanel.tsx` - Active/snoozed/escalated tabs
- `PriorityWorkflowCard.tsx` - Today's One Thing card

### Slide Library (Layer: Content)
- `intro-slide` - Workflow introduction
- `account-overview` - Customer metrics & contract
- `pricing-strategy` - AI pricing recommendations
- `prepare-quote` - Interactive quote builder
- `email-draft` - Personalized email composer
- `summary-slide` - Completion report
- ... 20+ more slides

### Background Jobs (Layer: Automation)
- Daily Job (6 AM) - Generate all workflows
- Nightly Job (11 PM) - Check snoozed steps, send notifications
- Weekly Job (Sunday) - Account plan review, forecasting
- Event Triggers (Real-time) - Support tickets, usage spikes, contact changes

---

## Metrics & Impact

### System Performance
- Dashboard load time: ~200ms (including database composition)
- Slide navigation: Instant (client-side state)
- Step action persistence: ~150ms (database + UI update)
- Daily job processing: ~5 minutes for 2,000 customers

### Business Impact (Projected)
- CSM capacity: 50-100 customers → 200-500 customers (5x improvement)
- Time per renewal: 4 hours → 1 hour (75% reduction)
- Missed renewals: 10% → <2% (8 percentage point improvement)
- Revenue at risk prevention: $5M/month → $4M/month saved

### User Experience
- Dashboards viewed daily: 30+ → 1 (30x simplification)
- "What should I do today?" decision time: 45 minutes → 30 seconds
- Workflow completion rate: 60% → 92% (with step-level snoozing)
- CSM satisfaction: "Finally, a tool that actually helps"

---

## Future Enhancements (Phase 4+)

### Visual Workflow Builder (Q1 2026)
- Drag-and-drop slide sequencing
- Visual context editor with preview
- Template variable picker with autocomplete
- Version control and A/B testing UI

### Multi-Workflow Orchestration (Q2 2026)
- Chain multiple workflows together
- Conditional branching based on outcomes
- Cross-workflow data passing
- Complex playbook execution

### Predictive Analytics (Q3 2026)
- ML models predict renewal outcomes
- Recommend workflows before thresholds hit
- Simulate "what if" scenarios
- Optimize priority scoring with reinforcement learning

### Integration Marketplace (Q4 2026)
- Connect to any CRM, support system, analytics platform
- Pre-built connectors for Salesforce, Zendesk, Gainsight
- Custom integration builder
- Bi-directional data sync

---

## Conclusion

This comprehensive architecture flowchart documents the complete Renubu system from data ingestion through workflow execution and continuous improvement. It serves both as technical documentation for engineers and as a narrative structure for understanding how modern AI-powered systems transform complex professional work.

The system's power lies not in any single component, but in how all layers work together: intelligent data analysis → precise workflow determination → dynamic composition → seamless execution → step-level flexibility → continuous learning.

For CSMs, it's magic: log in, see one priority task, complete it in an hour, move on with confidence.

For the system, it's orchestration: 13 interconnected layers, 40+ components, thousands of calculations per second, all working toward one goal: help humans do their best work.

---

**Related Documentation:**
- [System Overview](SYSTEM-OVERVIEW.md) - Product perspective
- [Technical Architecture](../technical/ARCHITECTURE.md) - Deep dive
- [Database Schema](../technical/DATABASE.md) - Data structures
- [Workflow Guide](../guides/WORKFLOWS.md) - Creating workflows
- [Step Actions Guide](../guides/STEP-ACTIONS.md) - Step-level features
