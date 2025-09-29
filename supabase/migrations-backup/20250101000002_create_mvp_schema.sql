-- Create simplified MVP schema
-- This focuses on core functionality for rapid MVP development

-- 1. Users (simplified profiles)
CREATE TABLE mvp.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers (simplified)
CREATE TABLE mvp.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    health_score INTEGER DEFAULT 50,
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    current_arr DECIMAL(12,2) DEFAULT 0,
    renewal_date DATE,
    assigned_to UUID REFERENCES mvp.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Renewals (simplified)
CREATE TABLE mvp.renewals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES mvp.customers(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    current_arr DECIMAL(12,2) NOT NULL,
    proposed_arr DECIMAL(12,2),
    probability INTEGER DEFAULT 50,
    stage TEXT NOT NULL DEFAULT 'discovery',
    risk_level TEXT NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES mvp.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks (simplified)
CREATE TABLE mvp.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    renewal_id UUID REFERENCES mvp.renewals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES mvp.users(id),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Events (simplified)
CREATE TABLE mvp.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    customer_id UUID REFERENCES mvp.customers(id),
    user_id UUID REFERENCES mvp.users(id),
    event_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notes (simple notes system)
CREATE TABLE mvp.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES mvp.customers(id) ON DELETE CASCADE,
    renewal_id UUID REFERENCES mvp.renewals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES mvp.users(id),
    content TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'meeting', 'call', 'email', 'risk')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE mvp.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MVP schema
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON mvp.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON mvp.users
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON mvp.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- All authenticated users can access other tables (simple MVP approach)
CREATE POLICY "Authenticated users can access customers" ON mvp.customers
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access renewals" ON mvp.renewals
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access tasks" ON mvp.tasks
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access events" ON mvp.events
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access notes" ON mvp.notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_mvp_customers_name ON mvp.customers(name);
CREATE INDEX idx_mvp_renewals_customer_id ON mvp.renewals(customer_id);
CREATE INDEX idx_mvp_renewals_renewal_date ON mvp.renewals(renewal_date);
CREATE INDEX idx_mvp_tasks_renewal_id ON mvp.tasks(renewal_id);
CREATE INDEX idx_mvp_tasks_status ON mvp.tasks(status);
CREATE INDEX idx_mvp_tasks_assigned_to ON mvp.tasks(assigned_to);
CREATE INDEX idx_mvp_events_customer_id ON mvp.events(customer_id);
CREATE INDEX idx_mvp_events_event_date ON mvp.events(event_date);
CREATE INDEX idx_mvp_notes_customer_id ON mvp.notes(customer_id);
CREATE INDEX idx_mvp_notes_renewal_id ON mvp.notes(renewal_id);

-- Create function to handle new user creation for MVP
CREATE OR REPLACE FUNCTION mvp.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mvp.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created_mvp ON auth.users;
CREATE TRIGGER on_auth_user_created_mvp
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION mvp.handle_new_user();

-- Create views in public schema for easy access to MVP tables
-- These views will allow access to MVP tables through public schema
CREATE OR REPLACE VIEW public.mvp_users AS SELECT * FROM mvp.users;
CREATE OR REPLACE VIEW public.mvp_customers AS SELECT * FROM mvp.customers;
CREATE OR REPLACE VIEW public.mvp_renewals AS SELECT * FROM mvp.renewals;
CREATE OR REPLACE VIEW public.mvp_tasks AS SELECT * FROM mvp.tasks;
CREATE OR REPLACE VIEW public.mvp_events AS SELECT * FROM mvp.events;
CREATE OR REPLACE VIEW public.mvp_notes AS SELECT * FROM mvp.notes;

-- Grant permissions on views
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated; 