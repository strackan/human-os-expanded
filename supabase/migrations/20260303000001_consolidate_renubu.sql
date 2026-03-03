-- ============================================================================
-- Consolidate Renubu tables into renubu.* schema
-- Source: standalone renubu Supabase instance (uuvdjjclwwulvyeboavk)
-- Reference: apps/renubu/supabase/migrations/20250101000099_optimized_public_schema_consolidation.sql
-- + subsequent migrations through 20260228
-- All IF NOT EXISTS for idempotency
-- ============================================================================

-- Schema + grants
CREATE SCHEMA IF NOT EXISTS renubu;
GRANT USAGE ON SCHEMA renubu TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA renubu GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA renubu GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- ============================================================================
-- PROFILES (renubu-specific, with local auth + multi-tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    role TEXT,
    auth_type TEXT DEFAULT 'oauth' CHECK (auth_type IN ('oauth', 'local')),
    password_hash TEXT,
    is_local_user BOOLEAN DEFAULT false,
    local_auth_enabled BOOLEAN DEFAULT false,
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_profiles_email ON renubu.profiles(email);
CREATE INDEX IF NOT EXISTS idx_rn_profiles_company ON renubu.profiles(company_id);

-- ============================================================================
-- COMPANIES (multi-tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT,
    industry TEXT,
    health_score INTEGER DEFAULT 50,
    current_arr DECIMAL(12,2) DEFAULT 0,
    renewal_date DATE,
    assigned_to UUID,
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_customers_name ON renubu.customers(name);
CREATE INDEX IF NOT EXISTS idx_rn_customers_renewal ON renubu.customers(renewal_date);
CREATE INDEX IF NOT EXISTS idx_rn_customers_health ON renubu.customers(health_score);

-- ============================================================================
-- CUSTOMER PROPERTIES (health, scores, risk)
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.customer_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES renubu.customers(id) ON DELETE CASCADE,
    usage_score INTEGER,
    health_score INTEGER,
    nps_score INTEGER,
    current_arr DECIMAL(12,2),
    revenue_impact_tier INTEGER DEFAULT 1 CHECK (revenue_impact_tier BETWEEN 1 AND 5),
    churn_risk_score INTEGER DEFAULT 1 CHECK (churn_risk_score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_custprop_customer ON renubu.customer_properties(customer_id);

-- ============================================================================
-- CONTACTS (customer stakeholders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    title TEXT,
    customer_id UUID REFERENCES renubu.customers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    is_demo BOOLEAN DEFAULT false,
    role_type TEXT,
    engagement_level TEXT,
    last_interaction_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_contacts_customer ON renubu.contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_rn_contacts_email ON renubu.contacts(email);

-- ============================================================================
-- CONTRACTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES renubu.customers(id) ON DELETE CASCADE,
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
    is_demo BOOLEAN DEFAULT false,
    term_months INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_contracts_customer ON renubu.contracts(customer_id);

-- ============================================================================
-- CONTRACT TERMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.contract_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES renubu.contracts(id) ON DELETE CASCADE,
    term_type TEXT NOT NULL,
    term_name TEXT NOT NULL,
    term_value TEXT NOT NULL,
    effective_date DATE,
    expiration_date DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_contract_terms_contract ON renubu.contract_terms(contract_id);

-- ============================================================================
-- RENEWALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES renubu.contracts(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES renubu.customers(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    current_arr DECIMAL(12,2) NOT NULL,
    proposed_arr DECIMAL(12,2),
    probability INTEGER DEFAULT 50,
    stage TEXT NOT NULL DEFAULT 'discovery',
    risk_level TEXT NOT NULL DEFAULT 'medium',
    expansion_opportunity DECIMAL(12,2) DEFAULT 0,
    assigned_to UUID,
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

CREATE INDEX IF NOT EXISTS idx_rn_renewals_customer ON renubu.renewals(customer_id);
CREATE INDEX IF NOT EXISTS idx_rn_renewals_date ON renubu.renewals(renewal_date);
CREATE INDEX IF NOT EXISTS idx_rn_renewals_stage ON renubu.renewals(stage);

-- ============================================================================
-- CUSTOMER FEATURES
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.customer_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES renubu.customers(id) ON DELETE CASCADE,
    feature_category TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    feature_status TEXT NOT NULL,
    adoption_percentage INTEGER,
    last_used_at TIMESTAMPTZ,
    enabled_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_features_customer ON renubu.customer_features(customer_id);

-- ============================================================================
-- ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    customer_id UUID,
    user_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID,
    customer_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_tasks_renewal ON renubu.tasks(renewal_id);
CREATE INDEX IF NOT EXISTS idx_rn_tasks_customer ON renubu.tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_rn_tasks_status ON renubu.tasks(status);

-- ============================================================================
-- EVENTS + NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    customer_id UUID,
    user_id UUID,
    event_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS renubu.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    renewal_id UUID,
    user_id UUID,
    content TEXT NOT NULL,
    note_type TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACTION SCORING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.task_templates (
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

CREATE TABLE IF NOT EXISTS renubu.renewal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID,
    task_template_id UUID REFERENCES renubu.task_templates(id),
    assigned_user_id UUID,
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

CREATE INDEX IF NOT EXISTS idx_rn_renewal_tasks_renewal ON renubu.renewal_tasks(renewal_id);
CREATE INDEX IF NOT EXISTS idx_rn_renewal_tasks_score ON renubu.renewal_tasks(action_score DESC);

CREATE TABLE IF NOT EXISTS renubu.renewal_workflow_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID,
    phase TEXT NOT NULL,
    phase_completed BOOLEAN DEFAULT false,
    outcome_quality TEXT,
    key_deliverables_achieved TEXT[],
    renewal_probability_change INTEGER,
    customer_sentiment_change TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WORKFLOW SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    workflow_type TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS renubu.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_definition_id UUID REFERENCES renubu.workflow_definitions(id),
    customer_id UUID,
    user_id UUID,
    status TEXT DEFAULT 'pending',
    current_step INTEGER DEFAULT 0,
    state JSONB DEFAULT '{}',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_wf_exec_customer ON renubu.workflow_executions(customer_id);
CREATE INDEX IF NOT EXISTS idx_rn_wf_exec_status ON renubu.workflow_executions(status);

CREATE TABLE IF NOT EXISTS renubu.action_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID REFERENCES renubu.workflow_executions(id),
    action_id VARCHAR,
    executed_by UUID,
    params JSONB,
    result JSONB,
    success BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- WORKFLOW CONVERSATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.workflow_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID,
    workflow_id UUID,
    renewal_task_id UUID,
    conversation_type TEXT NOT NULL,
    title TEXT,
    status TEXT DEFAULT 'active',
    privacy_level TEXT DEFAULT 'team',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS renubu.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES renubu.workflow_conversations(id) ON DELETE CASCADE,
    participant_type TEXT NOT NULL,
    participant_id UUID,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_score NUMERIC,
    structured_data JSONB,
    responds_to_message_id UUID,
    decision_outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATION RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    workflow_config_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    event_conditions JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS renubu.automation_rule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_rule_id UUID REFERENCES renubu.automation_rules(id),
    workflow_execution_id UUID,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_conditions JSONB,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACCOUNT PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.account_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    renewal_id UUID,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    objectives JSONB,
    key_initiatives JSONB,
    success_metrics JSONB,
    stakeholder_map JSONB,
    risk_assessment JSONB,
    timeline JSONB,
    notes TEXT,
    created_by UUID,
    last_reviewed_at TIMESTAMPTZ,
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_account_plans_customer ON renubu.account_plans(customer_id);

CREATE TABLE IF NOT EXISTS renubu.account_plan_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_plan_id UUID REFERENCES renubu.account_plans(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    target_quarter INTEGER,
    target_month INTEGER,
    assigned_to UUID,
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    completion_notes TEXT,
    workflow_execution_id UUID,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- APP SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRICING (market data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.pricing_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry TEXT NOT NULL,
    product_category TEXT,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL,
    source TEXT,
    as_of_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SIGNAL + INTEL SYSTEM (from Phase 1.4 migrations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.signal_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_name TEXT NOT NULL UNIQUE,
    signal_type TEXT NOT NULL,
    category TEXT,
    weight DECIMAL DEFAULT 1.0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS renubu.customer_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    signal_configuration_id UUID REFERENCES renubu.signal_configurations(id),
    signal_value DECIMAL,
    raw_data JSONB,
    observed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rn_custsignals_customer ON renubu.customer_signals(customer_id);

CREATE TABLE IF NOT EXISTS renubu.tier_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name TEXT NOT NULL UNIQUE,
    tier_level INTEGER NOT NULL,
    min_score DECIMAL,
    max_score DECIMAL,
    description TEXT,
    playbook JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PILOT TENANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS renubu.pilot_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES — service_role full access, authenticated read/write
-- ============================================================================

DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'profiles', 'companies', 'customers', 'customer_properties',
        'contacts', 'contracts', 'contract_terms', 'renewals',
        'customer_features', 'alerts', 'tasks', 'events', 'notes',
        'task_templates', 'renewal_tasks', 'renewal_workflow_outcomes',
        'workflow_definitions', 'workflow_executions', 'action_executions',
        'workflow_conversations', 'conversation_messages',
        'automation_rules', 'automation_rule_executions',
        'account_plans', 'account_plan_activities', 'app_settings',
        'pricing_benchmarks', 'signal_configurations', 'customer_signals',
        'tier_configurations', 'pilot_tenants'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE renubu.%I ENABLE ROW LEVEL SECURITY', t);

        EXECUTE format(
            'CREATE POLICY "service_role_all_%s" ON renubu.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
            t, t
        );

        EXECUTE format(
            'CREATE POLICY "authenticated_all_%s" ON renubu.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
            t, t
        );
    END LOOP;
END $$;

-- ============================================================================
-- Expose schema to PostgREST
-- ============================================================================
-- NOTE: Must also add 'renubu' to supabase/config.toml [api].schemas
-- and to the Supabase dashboard API settings for cloud
