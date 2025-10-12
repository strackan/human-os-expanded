-- ============================================================================
-- Renubu Database Schema (Table Definitions Only - No Data)
-- Generated from Supabase Migrations
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Companies table for multi-tenant support
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (user accounts)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    role TEXT,
    auth_type TEXT DEFAULT 'oauth' CHECK (auth_type IN ('oauth', 'local')),
    password_hash TEXT,
    is_local_user BOOLEAN DEFAULT false,
    local_auth_enabled BOOLEAN DEFAULT false,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    domain TEXT,
    industry TEXT,
    health_score INTEGER DEFAULT 50,
    current_arr DECIMAL(12,2) DEFAULT 0,
    renewal_date DATE,
    assigned_to UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id),
    account_plan TEXT CHECK (account_plan IN ('invest', 'expand', 'manage', 'monitor')),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer properties table
CREATE TABLE public.customer_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    usage_score INTEGER,
    health_score INTEGER,
    nps_score INTEGER,
    current_arr DECIMAL(12,2),
    revenue_impact_tier INTEGER DEFAULT 1 CHECK (revenue_impact_tier BETWEEN 1 AND 5),
    churn_risk_score INTEGER DEFAULT 1 CHECK (churn_risk_score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    title TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts table
CREATE TABLE public.contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    contract_number TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    arr DECIMAL(12,2) NOT NULL,
    seats INTEGER,
    contract_type TEXT NOT NULL DEFAULT 'subscription',
    status TEXT NOT NULL DEFAULT 'active',
    auto_renewal BOOLEAN DEFAULT true,
    terms_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renewals table
CREATE TABLE public.renewals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    current_arr DECIMAL(12,2) NOT NULL,
    proposed_arr DECIMAL(12,2),
    probability INTEGER DEFAULT 50,
    stage TEXT NOT NULL DEFAULT 'discovery',
    risk_level TEXT NOT NULL DEFAULT 'medium',
    expansion_opportunity DECIMAL(12,2) DEFAULT 0,
    assigned_to UUID REFERENCES public.profiles(id),
    ai_risk_score INTEGER,
    ai_recommendations TEXT,
    ai_confidence INTEGER,
    last_contact_date DATE,
    next_action TEXT,
    next_action_date DATE,
    notes TEXT,
    current_phase TEXT DEFAULT 'planning',
    tasks_generated_at TIMESTAMPTZ,
    last_action_score_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    renewal_id UUID REFERENCES public.renewals(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.profiles(id),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    user_id UUID REFERENCES public.profiles(id),
    event_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    customer_id UUID REFERENCES public.customers(id),
    user_id UUID REFERENCES public.profiles(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    renewal_id UUID REFERENCES public.renewals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'meeting', 'call', 'email', 'risk')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACTION SCORING SYSTEM
-- ============================================================================

-- Task Templates (Workflow Blueprints)
CREATE TABLE public.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    phase TEXT NOT NULL CHECK (phase IN ('planning', 'preparation', 'outreach', 'negotiation', 'documentation', 'closure')),
    earliest_start_day INTEGER NOT NULL,
    latest_completion_day INTEGER NOT NULL,
    deadline_type TEXT DEFAULT 'soft' CHECK (deadline_type IN ('hard', 'soft')),
    grace_period_days INTEGER DEFAULT 0,
    complexity_score INTEGER DEFAULT 1 CHECK (complexity_score BETWEEN 1 AND 3),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renewal Tasks (Task Instances)
CREATE TABLE public.renewal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID REFERENCES public.renewals(id) ON DELETE CASCADE,
    task_template_id UUID REFERENCES public.task_templates(id),
    assigned_user_id UUID REFERENCES public.profiles(id),
    action_score DECIMAL DEFAULT 0,
    deadline_urgency_score DECIMAL DEFAULT 0,
    days_to_deadline INTEGER,
    task_deadline_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    outcome_achieved BOOLEAN DEFAULT false,
    is_overdue BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Outcomes (Phase-Level Tracking)
CREATE TABLE public.renewal_workflow_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID REFERENCES public.renewals(id),
    phase TEXT NOT NULL,
    phase_completed BOOLEAN DEFAULT false,
    outcome_quality TEXT CHECK (outcome_quality IN ('excellent', 'good', 'acceptable', 'poor')),
    key_deliverables_achieved TEXT[],
    renewal_probability_change INTEGER,
    customer_sentiment_change TEXT CHECK (customer_sentiment_change IN ('improved', 'unchanged', 'worsened')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WORKFLOW SYSTEM
-- ============================================================================

-- Workflow Executions
CREATE TABLE public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'completed_with_pending_tasks', 'snoozed', 'abandoned')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Step Executions
CREATE TABLE public.workflow_step_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WORKFLOW TASK MANAGEMENT
-- ============================================================================

-- Workflow Tasks
CREATE TABLE public.workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
    step_execution_id UUID REFERENCES public.workflow_step_executions(id) ON DELETE SET NULL,
    original_workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    recommendation_id UUID,
    task_type TEXT NOT NULL CHECK (task_type IN (
        'review_contract', 'draft_email', 'schedule_meeting', 'analyze_usage',
        'prepare_proposal', 'follow_up', 'escalate', 'update_crm',
        'get_transcript', 'review_recommendation', 'custom'
    )),
    task_category TEXT CHECK (task_category IN ('ai_generated', 'csm_manual', 'system')),
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'snoozed', 'completed', 'skipped', 'reassigned'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_snoozed_at TIMESTAMPTZ,
    max_snooze_date TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,
    snooze_count INTEGER DEFAULT 0,
    force_action BOOLEAN DEFAULT false,
    auto_skip_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    skip_reason TEXT,
    reassigned_from UUID REFERENCES public.profiles(id),
    reassigned_at TIMESTAMPTZ,
    reassignment_reason TEXT,
    surfaced_in_workflows UUID[],
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT max_snooze_enforced CHECK (snoozed_until IS NULL OR max_snooze_date IS NULL OR snoozed_until <= max_snooze_date),
    CONSTRAINT force_action_requires_max_snooze_date CHECK (force_action = false OR max_snooze_date IS NOT NULL),
    CONSTRAINT auto_skip_after_force_action CHECK (auto_skip_at IS NULL OR force_action = true),
    CONSTRAINT completion_timestamps CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status = 'skipped' AND skipped_at IS NOT NULL) OR
        (status NOT IN ('completed', 'skipped'))
    )
);

-- Workflow Task Artifacts
CREATE TABLE public.workflow_task_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.workflow_tasks(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL CHECK (artifact_type IN (
        'email_draft', 'contract_analysis', 'meeting_notes',
        'proposal_draft', 'recommendation', 'custom'
    )),
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    generated_by TEXT DEFAULT 'manual' CHECK (generated_by IN ('manual', 'ai', 'template')),
    ai_model TEXT,
    generation_prompt TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Task Type Configuration
CREATE TABLE public.task_type_config (
    task_type TEXT PRIMARY KEY,
    auto_skip_enabled BOOLEAN DEFAULT true,
    auto_skip_grace_hours INTEGER DEFAULT 24,
    requires_manual_escalation BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- In-Product Notifications
CREATE TABLE public.in_product_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'task_assigned', 'task_snoozed_resurfaced', 'task_force_action_warning',
        'task_auto_skipped', 'task_reassigned', 'workflow_completed', 'custom'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    link_url TEXT,
    link_text TEXT,
    task_id UUID REFERENCES public.workflow_tasks(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- WORKFLOW CONVERSATIONS
-- ============================================================================

-- Workflow Conversations
CREATE TABLE public.workflow_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID REFERENCES public.renewals(id),
    workflow_id UUID,
    renewal_task_id UUID REFERENCES public.renewal_tasks(id),
    conversation_type TEXT NOT NULL,
    title TEXT,
    status TEXT DEFAULT 'active',
    privacy_level TEXT DEFAULT 'team' CHECK (privacy_level IN ('private', 'team', 'company')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Messages
CREATE TABLE public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.workflow_conversations(id) ON DELETE CASCADE,
    participant_type TEXT NOT NULL,
    participant_id UUID REFERENCES public.profiles(id),
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_score NUMERIC,
    structured_data JSONB,
    responds_to_message_id UUID REFERENCES public.conversation_messages(id),
    decision_outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_email_auth_type ON public.profiles(email, auth_type);
CREATE INDEX idx_profiles_local_auth ON public.profiles(is_local_user, local_auth_enabled);
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);

CREATE INDEX idx_companies_name ON public.companies(name);

CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customers_industry ON public.customers(industry);
CREATE INDEX idx_customers_health_score ON public.customers(health_score);
CREATE INDEX idx_customers_renewal_date ON public.customers(renewal_date);
CREATE INDEX idx_customers_assigned_to ON public.customers(assigned_to);
CREATE INDEX idx_customers_company_id ON public.customers(company_id);
CREATE INDEX idx_customers_account_plan ON public.customers(account_plan) WHERE account_plan IS NOT NULL;
CREATE INDEX idx_customers_risk_score ON public.customers(risk_score DESC) WHERE risk_score IS NOT NULL;
CREATE INDEX idx_customers_opportunity_score ON public.customers(opportunity_score DESC) WHERE opportunity_score IS NOT NULL;
CREATE INDEX idx_customers_workflow_queue ON public.customers(assigned_to, account_plan, renewal_date) WHERE assigned_to IS NOT NULL;

CREATE INDEX idx_customer_properties_customer_id ON public.customer_properties(customer_id);
CREATE INDEX idx_customer_properties_revenue_tier ON public.customer_properties(revenue_impact_tier);
CREATE INDEX idx_customer_properties_churn_risk ON public.customer_properties(churn_risk_score);

CREATE INDEX idx_contacts_customer_id ON public.contacts(customer_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_is_primary ON public.contacts(is_primary);

CREATE INDEX idx_renewals_customer_id ON public.renewals(customer_id);
CREATE INDEX idx_renewals_renewal_date ON public.renewals(renewal_date);
CREATE INDEX idx_renewals_stage ON public.renewals(stage);
CREATE INDEX idx_renewals_risk_level ON public.renewals(risk_level);
CREATE INDEX idx_renewals_current_phase ON public.renewals(current_phase);

CREATE INDEX idx_tasks_renewal_id ON public.tasks(renewal_id);
CREATE INDEX idx_tasks_customer_id ON public.tasks(customer_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX idx_events_customer_id ON public.events(customer_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_status ON public.events(status);

CREATE INDEX idx_notes_customer_id ON public.notes(customer_id);
CREATE INDEX idx_notes_renewal_id ON public.notes(renewal_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_note_type ON public.notes(note_type);

CREATE INDEX idx_renewal_tasks_action_score ON public.renewal_tasks(action_score DESC);
CREATE INDEX idx_renewal_tasks_status_pending ON public.renewal_tasks(status) WHERE status = 'pending';
CREATE INDEX idx_renewal_tasks_overdue ON public.renewal_tasks(is_overdue) WHERE is_overdue = true;
CREATE INDEX idx_task_templates_phase ON public.task_templates(phase);
CREATE INDEX idx_renewal_tasks_deadline ON public.renewal_tasks(days_to_deadline);
CREATE INDEX idx_renewal_tasks_renewal_id ON public.renewal_tasks(renewal_id);
CREATE INDEX idx_renewal_tasks_template_id ON public.renewal_tasks(task_template_id);

CREATE INDEX idx_workflow_conversations_renewal_id ON public.workflow_conversations(renewal_id);
CREATE INDEX idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);

CREATE INDEX idx_workflow_tasks_customer ON public.workflow_tasks(customer_id);
CREATE INDEX idx_workflow_tasks_assigned_to ON public.workflow_tasks(assigned_to);
CREATE INDEX idx_workflow_tasks_status ON public.workflow_tasks(status);
CREATE INDEX idx_workflow_tasks_workflow_execution ON public.workflow_tasks(workflow_execution_id);
CREATE INDEX idx_workflow_tasks_snoozed_until ON public.workflow_tasks(snoozed_until) WHERE status = 'snoozed';
CREATE INDEX idx_workflow_tasks_auto_skip ON public.workflow_tasks(auto_skip_at) WHERE auto_skip_at IS NOT NULL;
CREATE INDEX idx_workflow_tasks_force_action ON public.workflow_tasks(force_action) WHERE force_action = true;

CREATE INDEX idx_workflow_task_artifacts_task ON public.workflow_task_artifacts(task_id);
CREATE INDEX idx_workflow_task_artifacts_type ON public.workflow_task_artifacts(artifact_type);

CREATE INDEX idx_notifications_user ON public.in_product_notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.in_product_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_expires ON public.in_product_notifications(expires_at);
CREATE INDEX idx_notifications_task ON public.in_product_notifications(task_id);
CREATE INDEX idx_notifications_created ON public.in_product_notifications(created_at DESC);
