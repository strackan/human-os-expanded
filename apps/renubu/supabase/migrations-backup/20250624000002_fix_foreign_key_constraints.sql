-- Fix foreign key constraints for MVP schema
-- This migration ensures proper relationships between customers and contacts

-- 1. Drop existing foreign key constraints if they exist (to avoid conflicts)
ALTER TABLE mvp.customers DROP CONSTRAINT IF EXISTS fk_mvp_customers_primary_contact;
ALTER TABLE mvp.contacts DROP CONSTRAINT IF EXISTS fk_mvp_contacts_company_id;

-- 2. Recreate the foreign key constraints with proper naming
ALTER TABLE mvp.customers 
    ADD CONSTRAINT fk_mvp_customers_primary_contact 
    FOREIGN KEY (primary_contact_id) REFERENCES mvp.contacts(id) ON DELETE SET NULL;

ALTER TABLE mvp.contacts 
    ADD CONSTRAINT fk_mvp_contacts_company_id 
    FOREIGN KEY (company_id) REFERENCES mvp.customers(id) ON DELETE CASCADE;

-- 3. Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_mvp_customers_primary_contact_id ON mvp.customers(primary_contact_id);
CREATE INDEX IF NOT EXISTS idx_mvp_contacts_company_id ON mvp.contacts(company_id);

-- 4. Ensure the contacts table has the correct structure
DO $$
BEGIN
    -- Add any missing columns to contacts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mvp' AND table_name = 'contacts' AND column_name = 'is_primary') THEN
        ALTER TABLE mvp.contacts ADD COLUMN is_primary BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mvp' AND table_name = 'contacts' AND column_name = 'title') THEN
        ALTER TABLE mvp.contacts ADD COLUMN title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mvp' AND table_name = 'contacts' AND column_name = 'phone') THEN
        ALTER TABLE mvp.contacts ADD COLUMN phone TEXT;
    END IF;
END $$;

-- 5. Update the database types to reflect the current schema
-- This will be handled by the TypeScript generation
