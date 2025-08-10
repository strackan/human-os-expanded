-- Consolidate all tables to public schema and remove mvp references
-- This migration moves all data from mvp schema to public schema

-- Step 1: Create the profiles table in public schema (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create the customers table in public schema (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    health_score INTEGER DEFAULT 50,
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    current_arr DECIMAL(12,2) DEFAULT 0,
    renewal_date DATE,
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create the contacts table in public schema
CREATE TABLE IF NOT EXISTS public.contacts (
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

-- Step 4: Remove primary_contact_id column from customers table (if it exists)
ALTER TABLE public.customers DROP COLUMN IF EXISTS primary_contact_id;

-- Step 5: Create renewals table in public schema
CREATE TABLE IF NOT EXISTS public.renewals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    current_arr DECIMAL(12,2) NOT NULL,
    proposed_arr DECIMAL(12,2),
    probability INTEGER DEFAULT 50,
    stage TEXT NOT NULL DEFAULT 'discovery',
    risk_level TEXT NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Create tasks table in public schema
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

-- Step 7: Create events table in public schema
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    user_id UUID REFERENCES public.profiles(id),
    event_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: Create notes table in public schema
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

-- Step 9: Migrate data from mvp schema to public schema
-- Only migrate if mvp tables exist and public tables are empty

-- Migrate customers
INSERT INTO public.customers (id, name, domain, industry, health_score, primary_contact_name, primary_contact_email, current_arr, renewal_date, assigned_to, created_at, updated_at)
SELECT id, name, domain, industry, health_score, primary_contact_name, primary_contact_email, current_arr, renewal_date, assigned_to, created_at, updated_at
FROM mvp.customers
WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE public.customers.id = mvp.customers.id);

-- Migrate renewals
INSERT INTO public.renewals (id, customer_id, renewal_date, current_arr, proposed_arr, probability, stage, risk_level, assigned_to, notes, created_at, updated_at)
SELECT id, customer_id, renewal_date, current_arr, proposed_arr, probability, stage, risk_level, assigned_to, notes, created_at, updated_at
FROM mvp.renewals
WHERE NOT EXISTS (SELECT 1 FROM public.renewals WHERE public.renewals.id = mvp.renewals.id);

-- Migrate tasks
INSERT INTO public.tasks (id, renewal_id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, updated_at)
SELECT id, renewal_id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, updated_at
FROM mvp.tasks
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE public.tasks.id = mvp.tasks.id);

-- Migrate events
INSERT INTO public.events (id, title, description, event_type, customer_id, user_id, event_date, status, created_at, updated_at)
SELECT id, title, description, event_type, customer_id, user_id, event_date, status, created_at, updated_at
FROM mvp.events
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE public.events.id = mvp.events.id);

-- Migrate notes
INSERT INTO public.notes (id, customer_id, renewal_id, user_id, content, note_type, created_at, updated_at)
SELECT id, customer_id, renewal_id, user_id, content, note_type, created_at, updated_at
FROM mvp.notes
WHERE NOT EXISTS (SELECT 1 FROM public.notes WHERE public.notes.id = mvp.notes.id);

-- Step 10: Update foreign key references in existing public tables
-- Update contracts table to reference public.customers (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contracts') THEN
        ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_customer_id_fkey;
        ALTER TABLE public.contracts ADD CONSTRAINT contracts_customer_id_fkey 
            FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update customer_properties table to reference public.customers (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_properties') THEN
        ALTER TABLE public.customer_properties DROP CONSTRAINT IF EXISTS customer_properties_customer_id_fkey;
        ALTER TABLE public.customer_properties ADD CONSTRAINT customer_properties_customer_id_fkey 
            FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update key_dates table to reference public.customers (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'key_dates') THEN
        ALTER TABLE public.key_dates DROP CONSTRAINT IF EXISTS key_dates_customer_id_fkey;
        ALTER TABLE public.key_dates ADD CONSTRAINT key_dates_customer_id_fkey 
            FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update alerts table to reference public.customers (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
        ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_customer_id_fkey;
        ALTER TABLE public.alerts ADD CONSTRAINT alerts_customer_id_fkey 
            FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 11: Enable RLS on all public tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS policies for public tables
-- Customers policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
CREATE POLICY "Authenticated users can view customers" ON public.customers
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Authenticated users can insert customers" ON public.customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers" ON public.customers
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
CREATE POLICY "Authenticated users can delete customers" ON public.customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Contacts policies
DROP POLICY IF EXISTS "Authenticated users can access contacts" ON public.contacts;
CREATE POLICY "Authenticated users can access contacts" ON public.contacts
    FOR ALL USING (auth.role() = 'authenticated');

-- Renewals policies
DROP POLICY IF EXISTS "Authenticated users can access renewals" ON public.renewals;
CREATE POLICY "Authenticated users can access renewals" ON public.renewals
    FOR ALL USING (auth.role() = 'authenticated');

-- Tasks policies
DROP POLICY IF EXISTS "Authenticated users can access tasks" ON public.tasks;
CREATE POLICY "Authenticated users can access tasks" ON public.tasks
    FOR ALL USING (auth.role() = 'authenticated');

-- Events policies
DROP POLICY IF EXISTS "Authenticated users can access events" ON public.events;
CREATE POLICY "Authenticated users can access events" ON public.events
    FOR ALL USING (auth.role() = 'authenticated');

-- Notes policies
DROP POLICY IF EXISTS "Authenticated users can access notes" ON public.notes;
CREATE POLICY "Authenticated users can access notes" ON public.notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_customers_assigned_to ON public.customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_public_customers_industry ON public.customers(industry);
CREATE INDEX IF NOT EXISTS idx_public_customers_health_score ON public.customers(health_score);
CREATE INDEX IF NOT EXISTS idx_public_customers_renewal_date ON public.customers(renewal_date);

CREATE INDEX IF NOT EXISTS idx_public_contacts_customer_id ON public.contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_public_contacts_primary ON public.contacts(is_primary);

CREATE INDEX IF NOT EXISTS idx_public_renewals_customer_id ON public.renewals(customer_id);
CREATE INDEX IF NOT EXISTS idx_public_renewals_assigned_to ON public.renewals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_public_renewals_renewal_date ON public.renewals(renewal_date);

CREATE INDEX IF NOT EXISTS idx_public_tasks_renewal_id ON public.tasks(renewal_id);
CREATE INDEX IF NOT EXISTS idx_public_tasks_customer_id ON public.tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_public_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_public_tasks_status ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_public_events_customer_id ON public.events(customer_id);
CREATE INDEX IF NOT EXISTS idx_public_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_public_events_event_date ON public.events(event_date);

CREATE INDEX IF NOT EXISTS idx_public_notes_customer_id ON public.notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_public_notes_renewal_id ON public.notes(renewal_id);
CREATE INDEX IF NOT EXISTS idx_public_notes_user_id ON public.notes(user_id);

-- Step 14: Drop mvp schema views (they're no longer needed)
DROP VIEW IF EXISTS public.mvp_users;
DROP VIEW IF EXISTS public.mvp_customers;
DROP VIEW IF EXISTS public.mvp_renewals;
DROP VIEW IF EXISTS public.mvp_tasks;
DROP VIEW IF EXISTS public.mvp_events;
DROP VIEW IF EXISTS public.mvp_notes;

-- Step 15: Create new views for backward compatibility (pointing to public schema)
-- Note: mvp_users view removed since profiles table will be dropped
CREATE OR REPLACE VIEW public.mvp_customers AS SELECT * FROM public.customers;
CREATE OR REPLACE VIEW public.mvp_renewals AS SELECT * FROM public.renewals;
CREATE OR REPLACE VIEW public.mvp_tasks AS SELECT * FROM public.tasks;
CREATE OR REPLACE VIEW public.mvp_events AS SELECT * FROM public.events;
CREATE OR REPLACE VIEW public.mvp_notes AS SELECT * FROM public.notes;

-- Step 16: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
