-- Fix both public and MVP schemas to use proper contact structure
-- This migration adds contacts tables and updates customers tables in both schemas

-- 1. Create the contacts table in MVP schema FIRST (without foreign key initially)
CREATE TABLE IF NOT EXISTS mvp.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    title TEXT,
    company_id UUID, -- No foreign key constraint initially
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the contacts table in public schema (only if public.customers exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        CREATE TABLE IF NOT EXISTS public.contacts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            title TEXT,
            customer_id UUID, -- No foreign key constraint initially
            is_primary BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- 3. NOW add primary_contact_id column to MVP customers table (after contacts table exists)
ALTER TABLE mvp.customers ADD COLUMN IF NOT EXISTS primary_contact_id UUID;

-- 4. Add primary_contact_id column to public customers table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS primary_contact_id UUID;
    END IF;
END $$;

-- 5. NOW add the foreign key constraints (after both tables and columns exist)
ALTER TABLE mvp.contacts 
    ADD CONSTRAINT fk_mvp_contacts_company_id 
    FOREIGN KEY (company_id) REFERENCES mvp.customers(id) ON DELETE CASCADE;

ALTER TABLE mvp.customers 
    ADD CONSTRAINT fk_mvp_customers_primary_contact 
    FOREIGN KEY (primary_contact_id) REFERENCES mvp.contacts(id);

-- 6. Add foreign key constraints for public schema (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        ALTER TABLE public.contacts 
            ADD CONSTRAINT fk_public_contacts_customer_id 
            FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

        ALTER TABLE public.customers 
            ADD CONSTRAINT fk_public_customers_primary_contact 
            FOREIGN KEY (primary_contact_id) REFERENCES public.contacts(id);
    END IF;
END $$;

-- 7. Create indexes for performance in MVP schema
CREATE INDEX IF NOT EXISTS idx_mvp_contacts_company_id ON mvp.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_mvp_contacts_primary ON mvp.contacts(is_primary);
CREATE INDEX IF NOT EXISTS idx_mvp_customers_primary_contact ON mvp.customers(primary_contact_id);

-- 8. Create indexes for performance in public schema (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        CREATE INDEX IF NOT EXISTS idx_public_contacts_customer_id ON public.contacts(customer_id);
        CREATE INDEX IF NOT EXISTS idx_public_contacts_primary ON public.contacts(is_primary);
        CREATE INDEX IF NOT EXISTS idx_public_customers_primary_contact ON public.customers(primary_contact_id);
    END IF;
END $$;

-- 9. Enable RLS on both contacts tables
ALTER TABLE mvp.contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 10. Create RLS policies for MVP contacts
DROP POLICY IF EXISTS "Authenticated users can access contacts" ON mvp.contacts;
CREATE POLICY "Authenticated users can access contacts" ON mvp.contacts
    FOR ALL USING (auth.role() = 'authenticated');

-- 11. Create RLS policies for public contacts (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        DROP POLICY IF EXISTS "Authenticated users can access contacts" ON public.contacts;
        CREATE POLICY "Authenticated users can access contacts" ON public.contacts
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 12. Create views for backward compatibility
CREATE OR REPLACE VIEW public.mvp_contacts AS SELECT * FROM mvp.contacts;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        CREATE OR REPLACE VIEW public.public_contacts AS SELECT * FROM public.contacts;
    END IF;
END $$;

-- 13. Remove old columns from MVP customers table (after ensuring data is migrated)
-- Note: This should be done after data migration to avoid data loss
-- ALTER TABLE mvp.customers DROP COLUMN IF EXISTS primary_contact_name;
-- ALTER TABLE mvp.customers DROP COLUMN IF EXISTS primary_contact_email;

-- 14. Remove old columns from public customers table (after ensuring data is migrated)
-- Note: This should be done after data migration to avoid data loss
-- ALTER TABLE public.customers DROP COLUMN IF EXISTS primary_contact_name;
-- ALTER TABLE public.customers DROP COLUMN IF EXISTS primary_contact_email;
