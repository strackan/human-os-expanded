-- Simplified Migration: Just do the data migration, no constraints yet
-- File: supabase/migrations/[timestamp]_convert_to_multi_tenant_simple.sql

-- Step 1: Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create a default company
INSERT INTO companies (name) 
VALUES ('Default Company')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Migrate existing company names from profiles
INSERT INTO companies (name)
SELECT DISTINCT company_name 
FROM profiles 
WHERE company_name IS NOT NULL 
AND company_name != ''
AND company_name != 'Default Company'
ON CONFLICT (name) DO NOTHING;

-- Step 4: Add company_id to profiles (no constraint yet)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Step 5: Populate profiles.company_id
UPDATE profiles 
SET company_id = c.id
FROM companies c
WHERE profiles.company_name = c.name
AND profiles.company_id IS NULL;

-- Set any remaining NULL to default company
UPDATE profiles 
SET company_id = (SELECT id FROM companies WHERE name = 'Default Company')
WHERE company_id IS NULL;

-- Step 6: Add company_id to customers (no constraint yet)
-- NOTE: MVP customers table doesn't have csm_id, so we'll set all to default company
ALTER TABLE mvp.customers 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Step 7: Set all customers to default company (since no csm_id exists)
UPDATE mvp.customers 
SET company_id = (SELECT id FROM companies WHERE name = 'Default Company')
WHERE company_id IS NULL;

-- Step 8: Clean up conversation tables
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS workflow_conversations CASCADE;

-- Step 9: Recreate conversation tables
CREATE TABLE workflow_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_id UUID REFERENCES renewals(id),
  workflow_id UUID REFERENCES workflows(id),
  renewal_task_id UUID REFERENCES renewal_tasks(id),
  
  conversation_type TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'active',
  privacy_level TEXT DEFAULT 'team' CHECK (privacy_level IN ('private', 'team', 'company')),
  created_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES workflow_conversations(id) ON DELETE CASCADE,
  
  participant_type TEXT NOT NULL,
  participant_id UUID REFERENCES profiles(id),
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  
  confidence_score NUMERIC,
  structured_data JSONB,
  responds_to_message_id UUID REFERENCES conversation_messages(id),
  decision_outcome TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 10: Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Step 11: Simple RLS policies
CREATE POLICY "Company isolation - companies" ON companies FOR ALL TO authenticated
USING (id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company isolation - profiles" ON profiles FOR ALL TO authenticated  
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company isolation - customers" ON mvp.customers FOR ALL TO authenticated
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company isolation - renewals" ON mvp.renewals FOR ALL TO authenticated
USING (
  customer_id IN (
    SELECT id FROM mvp.customers 
    WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Company isolation - conversations" ON workflow_conversations FOR ALL TO authenticated
USING (
  renewal_id IN (
    SELECT r.id FROM mvp.renewals r
    JOIN mvp.customers c ON r.customer_id = c.id
    WHERE c.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Company isolation - messages" ON conversation_messages FOR ALL TO authenticated
USING (
  conversation_id IN (SELECT id FROM workflow_conversations)
);