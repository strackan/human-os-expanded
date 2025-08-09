-- OPTIMIZED: Single migration to consolidate all schemas into public schema
-- This replaces multiple conflicting migrations with a single, clean approach

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

-- Ensure profiles table exists (enhanced from existing)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table (consolidated from MVP)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    health_score INTEGER DEFAULT 50,
    primary_contact_id UUID, -- Will reference contacts after creation
    primary_contact_name TEXT, -- Legacy field for backwards compatibility
    primary_contact_email TEXT, -- Legacy field for backwards compatibility
    current_arr DECIMAL(12,2) DEFAULT 0,
    renewal_date DATE,
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    title TEXT,
    company_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for customers.primary_contact_id (after contacts table exists)
ALTER TABLE public.customers 
DROP CONSTRAINT IF EXISTS fk_customers_primary_contact;
ALTER TABLE public.customers 
ADD CONSTRAINT fk_customers_primary_contact 
FOREIGN KEY (primary_contact_id) REFERENCES public.contacts(id);

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
-- SECTION 3: ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- Create comprehensive RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- All other tables: authenticated users can access (simplified for MVP)
CREATE POLICY "Authenticated users can access customers" ON public.customers
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access contacts" ON public.contacts
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access contracts" ON public.contracts
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access renewals" ON public.renewals
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access tasks" ON public.tasks
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access events" ON public.events
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access alerts" ON public.alerts
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access notes" ON public.notes
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- SECTION 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_industry ON public.customers(industry);
CREATE INDEX IF NOT EXISTS idx_customers_health_score ON public.customers(health_score);
CREATE INDEX IF NOT EXISTS idx_customers_renewal_date ON public.customers(renewal_date);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON public.customers(assigned_to);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_is_primary ON public.contacts(is_primary);

-- Renewals indexes
CREATE INDEX IF NOT EXISTS idx_renewals_customer_id ON public.renewals(customer_id);
CREATE INDEX IF NOT EXISTS idx_renewals_renewal_date ON public.renewals(renewal_date);
CREATE INDEX IF NOT EXISTS idx_renewals_stage ON public.renewals(stage);
CREATE INDEX IF NOT EXISTS idx_renewals_risk_level ON public.renewals(risk_level);

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

-- ============================================================================
-- SECTION 5: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Create or replace user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation (drop and recreate to ensure it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SECTION 6: MIGRATION CLEANUP NOTES
-- ============================================================================

-- Note: This migration consolidates the following previous migrations:
-- - 20250619182010_create_essential_tables.sql (public schema tables)
-- - 20250101000002_create_mvp_schema.sql (MVP schema structure)
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
