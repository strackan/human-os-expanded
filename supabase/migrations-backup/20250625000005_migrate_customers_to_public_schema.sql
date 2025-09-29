-- Migration to move customers table from mvp schema to public schema
-- This consolidates everything to use only the public schema

-- 1. Create the customers table in public schema with the same structure as mvp.customers
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the contacts table in public schema
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    title TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add primary_contact_id column to public customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS primary_contact_id UUID REFERENCES public.contacts(id);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_public_customers_primary_contact ON public.customers(primary_contact_id);
CREATE INDEX IF NOT EXISTS idx_public_contacts_customer_id ON public.contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_public_contacts_primary ON public.contacts(is_primary);

-- 5. Enable RLS on the new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for customers
CREATE POLICY "Authenticated users can access customers" ON public.customers
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Create RLS policies for contacts
CREATE POLICY "Authenticated users can access contacts" ON public.contacts
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. Migrate data from mvp.customers to public.customers (if mvp.customers exists and has data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mvp' AND table_name = 'customers') THEN
        -- Check if there's data to migrate
        IF EXISTS (SELECT 1 FROM mvp.customers LIMIT 1) THEN
            -- Insert data from mvp.customers to public.customers
            INSERT INTO public.customers (
                id, name, domain, industry, health_score, 
                primary_contact_name, primary_contact_email, 
                current_arr, renewal_date, assigned_to, 
                created_at, updated_at
            )
            SELECT 
                id, name, domain, industry, health_score,
                primary_contact_name, primary_contact_email,
                current_arr, renewal_date, assigned_to,
                created_at, updated_at
            FROM mvp.customers
            ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'Migrated data from mvp.customers to public.customers';
        ELSE
            RAISE NOTICE 'mvp.customers table exists but is empty, no data to migrate';
        END IF;
    ELSE
        RAISE NOTICE 'mvp.customers table does not exist, no data to migrate';
    END IF;
END $$;

-- 9. Migrate data from mvp.contacts to public.contacts (if mvp.contacts exists and has data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mvp' AND table_name = 'contacts') THEN
        -- Check if there's data to migrate
        IF EXISTS (SELECT 1 FROM mvp.contacts LIMIT 1) THEN
            -- Insert data from mvp.contacts to public.contacts
            INSERT INTO public.contacts (
                id, first_name, last_name, email, phone, title,
                customer_id, is_primary, created_at, updated_at
            )
            SELECT 
                id, first_name, last_name, email, phone, title,
                company_id, is_primary, created_at, updated_at
            FROM mvp.contacts
            ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'Migrated data from mvp.contacts to public.contacts';
        ELSE
            RAISE NOTICE 'mvp.contacts table exists but is empty, no data to migrate';
        END IF;
    ELSE
        RAISE NOTICE 'mvp.contacts table does not exist, no data to migrate';
    END IF;
END $$;

-- 10. Update foreign key references in other tables to point to public.customers
-- Update contracts table
ALTER TABLE public.contracts 
    DROP CONSTRAINT IF EXISTS contracts_customer_id_fkey;

ALTER TABLE public.contracts 
    ADD CONSTRAINT contracts_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Update renewals table
ALTER TABLE public.renewals 
    DROP CONSTRAINT IF EXISTS renewals_customer_id_fkey;

ALTER TABLE public.renewals 
    ADD CONSTRAINT renewals_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Update events table
ALTER TABLE public.events 
    DROP CONSTRAINT IF EXISTS events_customer_id_fkey;

ALTER TABLE public.events 
    ADD CONSTRAINT events_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Update alerts table
ALTER TABLE public.alerts 
    DROP CONSTRAINT IF EXISTS alerts_customer_id_fkey;

ALTER TABLE public.alerts 
    ADD CONSTRAINT alerts_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- 11. Create a view to maintain backward compatibility (optional)
CREATE OR REPLACE VIEW public.mvp_customers AS SELECT * FROM public.customers;
CREATE OR REPLACE VIEW public.mvp_contacts AS SELECT * FROM public.contacts;

-- 12. Add unique constraint on customer name
ALTER TABLE public.customers ADD CONSTRAINT customers_name_unique UNIQUE (name);
