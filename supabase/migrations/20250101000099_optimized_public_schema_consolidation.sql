-- UPDATED OPTIMIZED: Single migration to consolidate all schemas into public schema
-- This replaces multiple conflicting migrations with a single, clean approach
-- Updated to include all recent functionality: action scoring, local auth, multi-tenant, etc.

-- ============================================================================
-- SECTION 1: DROP EXISTING CONFLICTING STRUCTURES
-- ============================================================================

-- Drop MVP views from public schema (if they exist)
DROP VIEW IF EXISTS public.mvp_users;
DROP VIEW IF EXISTS public.mvp_customers;
DROP VIEW IF EXISTS public.mvp_renewals;
DROP VIEW IF EXISTS public.mvp_tasks;
DROP VIEW IF EXISTS public.mvp_events;
DROP VIEW IF EXISTS public.mvp_notes;

-- Drop existing foreign key constraints that reference mvp schema
ALTER TABLE IF EXISTS public.contracts DROP CONSTRAINT IF EXISTS contracts_customer_id_fkey;
ALTER TABLE IF EXISTS public.renewals DROP CONSTRAINT IF EXISTS renewals_customer_id_fkey;
ALTER TABLE IF EXISTS public.events DROP CONSTRAINT IF EXISTS events_customer_id_fkey;
ALTER TABLE IF EXISTS public.alerts DROP CONSTRAINT IF EXISTS alerts_customer_id_fkey;

-- ============================================================================
-- SECTION 2: CREATE CORE PUBLIC SCHEMA TABLES
-- ============================================================================

-- Ensure profiles table exists (enhanced from existing with local auth support)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    role TEXT,
    -- Local authentication fields
    auth_type TEXT DEFAULT 'oauth' CHECK (auth_type IN ('oauth', 'local')),
    password_hash TEXT,
    is_local_user BOOLEAN DEFAULT false,
    local_auth_enabled BOOLEAN DEFAULT false,
    -- Multi-tenant support
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create companies table for multi-tenant support
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add company_id column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID;

-- Add foreign key constraint for profiles.company_id
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS fk_profiles_company;
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- Create customers table (consolidated from MVP)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    health_score INTEGER DEFAULT 50,
    current_arr DECIMAL(12,2) DEFAULT 0,
    renewal_date DATE,
    assigned_to UUID REFERENCES public.profiles(id),
    -- Multi-tenant support
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



-- Create customer_properties table for additional customer data
CREATE TABLE IF NOT EXISTS public.customer_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    usage_score INTEGER,
    health_score INTEGER,
    nps_score INTEGER,
    current_arr DECIMAL(12,2),
    -- Action scoring fields
    revenue_impact_tier INTEGER DEFAULT 1 CHECK (revenue_impact_tier BETWEEN 1 AND 5),
    churn_risk_score INTEGER DEFAULT 1 CHECK (churn_risk_score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL, -- Made required per recent migrations
    phone TEXT,
    title TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



-- Create/update contracts table to reference public.customers
CREATE TABLE IF NOT EXISTS public.contracts (
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

-- Create/update renewals table to reference public.customers
CREATE TABLE IF NOT EXISTS public.renewals (
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
    -- Action scoring fields
    current_phase TEXT DEFAULT 'planning',
    tasks_generated_at TIMESTAMPTZ,
    last_action_score_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
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

-- Create/update events table to reference public.customers
CREATE TABLE IF NOT EXISTS public.events (
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

-- Create/update alerts table to reference public.customers
CREATE TABLE IF NOT EXISTS public.alerts (
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

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
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
-- SECTION 3: ACTION SCORING SYSTEM TABLES
-- ============================================================================

-- Create Task Templates (Workflow Blueprints)
CREATE TABLE IF NOT EXISTS public.task_templates (
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

-- Create Renewal Tasks (Task Instances)
CREATE TABLE IF NOT EXISTS public.renewal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID REFERENCES public.renewals(id) ON DELETE CASCADE,
    task_template_id UUID REFERENCES public.task_templates(id),
    assigned_user_id UUID REFERENCES public.profiles(id),
    
    -- Action scoring fields
    action_score DECIMAL DEFAULT 0,
    deadline_urgency_score DECIMAL DEFAULT 0,
    days_to_deadline INTEGER,
    task_deadline_date DATE,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    outcome_achieved BOOLEAN DEFAULT false,
    is_overdue BOOLEAN DEFAULT false,
    
    -- Execution tracking
    completed_at TIMESTAMPTZ,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Workflow Outcomes (Phase-Level Tracking)
CREATE TABLE IF NOT EXISTS public.renewal_workflow_outcomes (
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
-- SECTION 4: WORKFLOW CONVERSATION TABLES
-- ============================================================================

-- Create workflow conversations table
CREATE TABLE IF NOT EXISTS public.workflow_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renewal_id UUID REFERENCES public.renewals(id),
    workflow_id UUID, -- Will reference workflows table when created
    renewal_task_id UUID REFERENCES public.renewal_tasks(id),
    
    conversation_type TEXT NOT NULL,
    title TEXT,
    status TEXT DEFAULT 'active',
    privacy_level TEXT DEFAULT 'team' CHECK (privacy_level IN ('private', 'team', 'company')),
    created_by UUID REFERENCES public.profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
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
-- SECTION 5: ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_workflow_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Local users can access own profile" ON public.profiles;
DROP POLICY IF EXISTS "OAuth users can access own profile" ON public.profiles;

-- Create comprehensive RLS policies (simplified to avoid infinite recursion)
-- All tables: authenticated users can access (simplified for MVP)
CREATE POLICY "Authenticated users can access profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access companies" ON public.companies 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access customers" ON public.customers 
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access contacts" ON public.contacts;
CREATE POLICY "Authenticated users can access contacts" ON public.contacts
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access contracts" ON public.contracts;
CREATE POLICY "Authenticated users can access contracts" ON public.contracts
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access renewals" ON public.renewals;
CREATE POLICY "Authenticated users can access renewals" ON public.renewals
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access tasks" ON public.tasks;
CREATE POLICY "Authenticated users can access tasks" ON public.tasks
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access events" ON public.events;
CREATE POLICY "Authenticated users can access events" ON public.events
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access alerts" ON public.alerts;
CREATE POLICY "Authenticated users can access alerts" ON public.alerts
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access notes" ON public.notes;
CREATE POLICY "Authenticated users can access notes" ON public.notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Action scoring table policies
CREATE POLICY "Authenticated users can view task_templates" ON public.task_templates
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert task_templates" ON public.task_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update task_templates" ON public.task_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view renewal_tasks" ON public.renewal_tasks
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert renewal_tasks" ON public.renewal_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update renewal_tasks" ON public.renewal_tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Workflow conversation policies
CREATE POLICY "Authenticated users can access workflow_conversations" ON public.workflow_conversations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access conversation_messages" ON public.conversation_messages
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- SECTION 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes (including local auth)
CREATE INDEX IF NOT EXISTS idx_profiles_email_auth_type ON public.profiles(email, auth_type);
CREATE INDEX IF NOT EXISTS idx_profiles_local_auth ON public.profiles(is_local_user, local_auth_enabled);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_industry ON public.customers(industry);
CREATE INDEX IF NOT EXISTS idx_customers_health_score ON public.customers(health_score);
CREATE INDEX IF NOT EXISTS idx_customers_renewal_date ON public.customers(renewal_date);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON public.customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);

-- Customer properties indexes
CREATE INDEX IF NOT EXISTS idx_customer_properties_customer_id ON public.customer_properties(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_properties_revenue_tier ON public.customer_properties(revenue_impact_tier);
CREATE INDEX IF NOT EXISTS idx_customer_properties_churn_risk ON public.customer_properties(churn_risk_score);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON public.contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_is_primary ON public.contacts(is_primary);

-- Renewals indexes
CREATE INDEX IF NOT EXISTS idx_renewals_customer_id ON public.renewals(customer_id);
CREATE INDEX IF NOT EXISTS idx_renewals_renewal_date ON public.renewals(renewal_date);
CREATE INDEX IF NOT EXISTS idx_renewals_stage ON public.renewals(stage);
CREATE INDEX IF NOT EXISTS idx_renewals_risk_level ON public.renewals(risk_level);
CREATE INDEX IF NOT EXISTS idx_renewals_current_phase ON public.renewals(current_phase);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_renewal_id ON public.tasks(renewal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON public.tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_customer_id ON public.events(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_customer_id ON public.notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_notes_renewal_id ON public.notes(renewal_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON public.notes(note_type);

-- Action scoring indexes
CREATE INDEX IF NOT EXISTS idx_renewal_tasks_action_score ON public.renewal_tasks(action_score DESC);
CREATE INDEX IF NOT EXISTS idx_renewal_tasks_status_pending ON public.renewal_tasks(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_renewal_tasks_overdue ON public.renewal_tasks(is_overdue) WHERE is_overdue = true;
CREATE INDEX IF NOT EXISTS idx_task_templates_phase ON public.task_templates(phase);
CREATE INDEX IF NOT EXISTS idx_renewal_tasks_deadline ON public.renewal_tasks(days_to_deadline);
CREATE INDEX IF NOT EXISTS idx_renewal_tasks_renewal_id ON public.renewal_tasks(renewal_id);
CREATE INDEX IF NOT EXISTS idx_renewal_tasks_template_id ON public.renewal_tasks(task_template_id);

-- Workflow conversation indexes
CREATE INDEX IF NOT EXISTS idx_workflow_conversations_renewal_id ON public.workflow_conversations(renewal_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);

-- ============================================================================
-- SECTION 7: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Create or replace user creation function (enhanced for local auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, auth_type, is_local_user, company_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'auth_type', 'oauth'),
        COALESCE((NEW.raw_user_meta_data->>'auth_type')::text = 'local', false),
        (SELECT id FROM public.companies WHERE name = 'Default Company' LIMIT 1)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        auth_type = EXCLUDED.auth_type,
        is_local_user = EXCLUDED.is_local_user,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation (drop and recreate to ensure it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Local Authentication Functions
CREATE OR REPLACE FUNCTION public.create_local_user(
    user_email TEXT,
    user_password TEXT,
    user_full_name TEXT DEFAULT NULL,
    user_company_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    password_hash TEXT;
    company_id UUID;
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = user_email) THEN
        RAISE EXCEPTION 'User with email % already exists', user_email;
    END IF;
    
    -- Get or create company
    IF user_company_name IS NOT NULL THEN
        INSERT INTO public.companies (name) VALUES (user_company_name)
        ON CONFLICT (name) DO NOTHING
        RETURNING id INTO company_id;
        
        IF company_id IS NULL THEN
            SELECT id INTO company_id FROM public.companies WHERE name = user_company_name;
        END IF;
    ELSE
        SELECT id INTO company_id FROM public.companies WHERE name = 'Default Company';
    END IF;
    
    -- Generate password hash (using pgcrypto extension)
    password_hash := crypt(user_password, gen_salt('bf'));
    
    -- Create auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Default instance ID
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        user_email,
        password_hash,
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'full_name', COALESCE(user_full_name, ''),
            'company_name', COALESCE(user_company_name, ''),
            'auth_type', 'local'
        )
    ) RETURNING id INTO new_user_id;
    
    -- Create profile for local user
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        company_name,
        auth_type,
        password_hash,
        is_local_user,
        local_auth_enabled,
        company_id
    ) VALUES (
        new_user_id,
        user_email,
        COALESCE(user_full_name, ''),
        COALESCE(user_company_name, ''),
        'local',
        password_hash,
        true,
        true,
        company_id
    );
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate local user
CREATE OR REPLACE FUNCTION public.authenticate_local_user(
    user_email TEXT,
    user_password TEXT
)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    full_name TEXT,
    company_name TEXT,
    auth_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.company_name,
        p.auth_type
    FROM public.profiles p
    WHERE p.email = user_email 
        AND p.auth_type = 'local'
        AND p.is_local_user = true
        AND p.local_auth_enabled = true
        AND p.password_hash = crypt(user_password, p.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update local user password
CREATE OR REPLACE FUNCTION public.update_local_user_password(
    user_email TEXT,
    old_password TEXT,
    new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
    new_password_hash TEXT;
BEGIN
    -- Verify old password
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE email = user_email 
            AND auth_type = 'local'
            AND password_hash = crypt(old_password, password_hash)
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Generate new password hash
    new_password_hash := crypt(new_password, gen_salt('bf'));
    
    -- Update password in both tables
    UPDATE auth.users 
    SET encrypted_password = new_password_hash, updated_at = NOW()
    WHERE email = user_email;
    
    UPDATE public.profiles 
    SET password_hash = new_password_hash, updated_at = NOW()
    WHERE email = user_email;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Action Scoring Functions
CREATE OR REPLACE FUNCTION public.generate_renewal_tasks(renewal_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.renewal_tasks (
        renewal_id,
        task_template_id,
        task_deadline_date,
        days_to_deadline
    )
    SELECT 
        renewal_uuid,
        tt.id,
        r.renewal_date - INTERVAL '1 day' * tt.latest_completion_day,
        tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)
    FROM public.task_templates tt
    CROSS JOIN public.renewals r
    WHERE r.id = renewal_uuid AND tt.is_active = true;
      
    UPDATE public.renewals 
    SET tasks_generated_at = NOW()
    WHERE id = renewal_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily Action Score Recalculation
CREATE OR REPLACE FUNCTION public.update_action_scores()
RETURNS VOID AS $$
BEGIN
    UPDATE public.renewal_tasks rt
    SET 
        days_to_deadline = tt.latest_completion_day - (r.renewal_date - CURRENT_DATE),
        is_overdue = (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) < 0,
        action_score = (
            COALESCE(cp.revenue_impact_tier, 1) *
            CASE 
                WHEN (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) < 0 THEN 10
                WHEN (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) <= 1 THEN 9
                WHEN (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) <= 3 THEN 7
                WHEN (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) <= 7 THEN 5
                ELSE 1
            END *
            COALESCE(cp.churn_risk_score, 1) *
            tt.complexity_score
        ),
        updated_at = NOW()
    FROM public.task_templates tt
    JOIN public.renewals r ON rt.renewal_id = r.id
    LEFT JOIN public.customer_properties cp ON r.customer_id = cp.customer_id
    WHERE rt.task_template_id = tt.id
        AND rt.status = 'pending';
        
    UPDATE public.renewals 
    SET last_action_score_update = NOW()
    WHERE id IN (
        SELECT DISTINCT renewal_id 
        FROM public.renewal_tasks 
        WHERE status = 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Next Priority Task Function (Enhanced with date override)
CREATE OR REPLACE FUNCTION public.get_next_priority_task(override_date DATE DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  renewal_id UUID,
  task_template_id UUID,
  assigned_user_id UUID,
  action_score DECIMAL,
  deadline_urgency_score DECIMAL,
  days_to_deadline INTEGER,
  task_deadline_date DATE,
  status TEXT,
  outcome_achieved BOOLEAN,
  is_overdue BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  task_name TEXT,
  task_description TEXT,
  phase TEXT,
  complexity_score INTEGER,
  customer_id UUID,
  customer_name TEXT,
  renewal_date DATE,
  current_arr DECIMAL
) AS $$
DECLARE
  effective_date DATE;
BEGIN
  -- Use override date if provided, otherwise use current date
  effective_date := COALESCE(override_date, CURRENT_DATE);
  
  -- Return the highest priority pending task with related data
  RETURN QUERY
  SELECT 
    rt.id,
    rt.renewal_id,
    rt.task_template_id,
    rt.assigned_user_id,
    rt.action_score,
    rt.deadline_urgency_score,
    rt.days_to_deadline,
    rt.task_deadline_date,
    rt.status,
    rt.outcome_achieved,
    rt.is_overdue,
    rt.completed_at,
    rt.notes,
    rt.created_at,
    rt.updated_at,
    tt.name as task_name,
    tt.description as task_description,
    tt.phase,
    tt.complexity_score,
    r.customer_id,
    c.name as customer_name,
    r.renewal_date,
    cp.current_arr
  FROM public.renewal_tasks rt
  JOIN public.task_templates tt ON rt.task_template_id = tt.id
  JOIN public.renewals r ON rt.renewal_id = r.id
  JOIN public.customers c ON r.customer_id = c.id
  LEFT JOIN public.customer_properties cp ON r.customer_id = cp.customer_id
  WHERE rt.status = 'pending'
    AND tt.is_active = true
    -- Recalculate days_to_deadline and is_overdue using the effective date
    AND (tt.latest_completion_day - (r.renewal_date - effective_date)) >= 0
  ORDER BY rt.action_score DESC, (tt.latest_completion_day - (r.renewal_date - effective_date)) ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 8: ADD CONSTRAINTS
-- ============================================================================

-- Add unique constraint on customer names
ALTER TABLE public.customers 
ADD CONSTRAINT customers_name_unique UNIQUE (name);

-- Add foreign key constraint for contacts.customer_id (required by CustomerService)
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS fk_public_contacts_customer_id;
ALTER TABLE public.contacts 
ADD CONSTRAINT fk_public_contacts_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- ============================================================================
-- SECTION 9: INSERT DEFAULT DATA
-- ============================================================================

-- Insert default company
INSERT INTO public.companies (name) 
VALUES ('Default Company')
ON CONFLICT (name) DO NOTHING;

-- Insert sample task templates
INSERT INTO public.task_templates (name, description, phase, earliest_start_day, latest_completion_day, deadline_type, grace_period_days, complexity_score) VALUES
('Account Health Assessment', 'Review usage data, support tickets, stakeholder changes', 'planning', 120, 90, 'soft', 7, 2),
('Contract Analysis', 'Parse current contract terms, pricing, renewal clauses', 'planning', 120, 90, 'soft', 5, 1),
('Pricing Strategy Development', 'Analyze usage for price optimization, benchmark rates', 'preparation', 90, 65, 'hard', 3, 3),
('Renewal Notice Delivery', 'Send formal renewal notification with initial proposal', 'outreach', 60, 45, 'hard', 0, 1),
('Executive Business Review', 'Book strategic review meeting with key stakeholders', 'outreach', 55, 40, 'hard', 3, 3),
('Objection Response', 'Address pricing, feature, or contract term concerns', 'negotiation', 45, 30, 'hard', 2, 2),
('Final Quote Generation', 'Create definitive pricing and terms document', 'documentation', 30, 20, 'hard', 1, 1),
('Signature Management', 'Track DocuSign progress, send reminders', 'closure', 15, 5, 'hard', 1, 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 10: MIGRATION CLEANUP NOTES
-- ============================================================================

-- Note: This updated migration consolidates the following previous migrations:
-- - 20250619182010_create_essential_tables.sql (public schema tables)
-- - 20250101000002_create_mvp_schema.sql (MVP schema structure)
-- - 20250621171617_action_scoring_system.sql (action scoring system)
-- - 20250623174451_create_workflow_conversation_tables.sql (workflow conversations)
-- - 20250625000003_add_local_authentication.sql (local authentication)
-- - 20250625000004_add_customer_name_unique_constraint.sql (unique constraints)
-- - Various constraint and policy fixes
-- 
-- After this migration runs successfully, the following can be deprecated:
-- - MVP schema (mvp.*) - will be dropped in a future migration
-- - Schema switching logic in application code
-- - Multiple seed files (consolidated into single seed.sql)

-- This approach eliminates conflicts between:
-- 1. Creating and dropping the same tables in different migrations
-- 2. Conflicting foreign key constraints
-- 3. Duplicate policy definitions
-- 4. Mixed schema references
-- 5. Missing functionality from recent migrations

-- New features included:
-- 1. Complete action scoring system with task templates and renewal tasks
-- 2. Local authentication support with password hashing
-- 3. Multi-tenant support with company isolation
-- 4. Workflow conversation system
-- 5. Enhanced customer properties with revenue impact and churn risk scoring
-- 6. Comprehensive RLS policies for all tables
-- 7. Performance indexes for all major query patterns
