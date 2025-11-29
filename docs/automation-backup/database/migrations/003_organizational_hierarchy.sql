-- Migration 003: Organizational Hierarchy
-- Simple Salesforce-style manager hierarchy with basic roles

-- ============================================================
-- USERS TABLE
-- ============================================================
-- Core user table with self-referential manager hierarchy
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  department VARCHAR(100),

  -- Salesforce-style manager hierarchy (self-referential)
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Basic role (no complex permissions)
  role VARCHAR(50) DEFAULT 'csm',

  -- OAuth integration
  oauth_provider VARCHAR(50), -- 'salesforce', 'hubspot', 'google', etc.
  oauth_user_id VARCHAR(255), -- External user ID from OAuth provider

  -- Salesforce-specific fields for import
  salesforce_user_id VARCHAR(18), -- 18-character Salesforce ID
  salesforce_manager_id VARCHAR(18), -- Will be resolved to local manager_id on import

  -- Metadata
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  -- Index for manager hierarchy traversal
  CONSTRAINT valid_role CHECK (role IN ('csm', 'manager', 'vp_cs', 'director', 'ceo', 'admin'))
);

-- Indexes for performance
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_salesforce_user_id ON users(salesforce_user_id);
CREATE INDEX idx_users_active ON users(active) WHERE active = true;

-- Self-referential manager check (prevent cycles)
CREATE OR REPLACE FUNCTION check_manager_cycle()
RETURNS TRIGGER AS $$
DECLARE
  current_manager_id UUID;
  depth INT := 0;
BEGIN
  -- If no manager, no cycle possible
  IF NEW.manager_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Cannot be your own manager
  IF NEW.id = NEW.manager_id THEN
    RAISE EXCEPTION 'User cannot be their own manager';
  END IF;

  -- Walk up the chain to detect cycles
  current_manager_id := NEW.manager_id;
  WHILE current_manager_id IS NOT NULL AND depth < 50 LOOP
    IF current_manager_id = NEW.id THEN
      RAISE EXCEPTION 'Manager hierarchy cycle detected';
    END IF;

    SELECT manager_id INTO current_manager_id
    FROM users
    WHERE id = current_manager_id;

    depth := depth + 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_manager_cycle_check
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_manager_cycle();

-- ============================================================
-- COMPANY SETTINGS (Key Organizational Roles)
-- ============================================================
-- Global company-level role assignments for template variables
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255),

  -- Key organizational roles (referenced in workflow templates)
  vp_customer_success_id UUID REFERENCES users(id),
  ceo_id UUID REFERENCES users(id),

  -- Team email aliases for bulk notifications
  customer_success_team_email VARCHAR(255), -- e.g., 'cs-team@company.com'
  executive_team_email VARCHAR(255), -- e.g., 'exec-team@company.com'

  -- Escalation defaults
  default_manager_escalation_threshold_arr DECIMAL(12,2) DEFAULT 50000,
  default_vp_escalation_threshold_arr DECIMAL(12,2) DEFAULT 100000,
  default_ceo_escalation_threshold_arr DECIMAL(12,2) DEFAULT 250000,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Only one row allowed
CREATE UNIQUE INDEX idx_company_settings_singleton ON company_settings ((1));

-- ============================================================
-- CUSTOMER ASSIGNMENTS (CSM & Account Team)
-- ============================================================
-- Links customers to their CSM and account team
ALTER TABLE customers ADD COLUMN IF NOT EXISTS csm_id UUID REFERENCES users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_executive_id UUID REFERENCES users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS solutions_architect_id UUID REFERENCES users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS executive_sponsor_id UUID REFERENCES users(id);

-- Account plan metadata
ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_account_plan BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_plan_owner_id UUID REFERENCES users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_plan_last_updated TIMESTAMP;

-- Indexes
CREATE INDEX idx_customers_csm_id ON customers(csm_id);
CREATE INDEX idx_customers_has_account_plan ON customers(has_account_plan) WHERE has_account_plan = true;

-- ============================================================
-- TEAM ESCALATIONS (Tracking)
-- ============================================================
-- Tracks team escalation events for renewals
CREATE TABLE team_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  workflow_stage VARCHAR(50) NOT NULL, -- 'critical', 'emergency', 'overdue'
  escalation_level VARCHAR(50) NOT NULL, -- 'manager', 'vp_cs', 'ceo', 'account_team'

  -- Escalation details
  escalated_by_user_id UUID REFERENCES users(id),
  escalated_to_user_id UUID REFERENCES users(id),
  escalation_date TIMESTAMP DEFAULT NOW(),

  -- Notification tracking
  manager_notified BOOLEAN DEFAULT false,
  vp_cs_notified BOOLEAN DEFAULT false,
  ceo_notified BOOLEAN DEFAULT false,
  account_team_notified BOOLEAN DEFAULT false,

  -- Collaboration tracking
  slack_channel_created BOOLEAN DEFAULT false,
  slack_channel_name VARCHAR(255),
  team_sync_scheduled BOOLEAN DEFAULT false,
  team_sync_calendar_event_id VARCHAR(255),

  -- Manager acknowledgment (Emergency workflow gate)
  manager_acknowledged BOOLEAN DEFAULT false,
  manager_acknowledged_by_user_id UUID REFERENCES users(id),
  manager_acknowledged_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_team_escalations_customer_id ON team_escalations(customer_id);
CREATE INDEX idx_team_escalations_workflow_stage ON team_escalations(workflow_stage);
CREATE INDEX idx_team_escalations_escalation_date ON team_escalations(escalation_date DESC);
CREATE INDEX idx_team_escalations_manager_acknowledged ON team_escalations(manager_acknowledged)
  WHERE manager_acknowledged = false;

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- View: User with manager details (for template resolution)
CREATE VIEW users_with_manager AS
SELECT
  u.id,
  u.email,
  u.name,
  u.title,
  u.role,
  u.manager_id,
  m.email AS manager_email,
  m.name AS manager_name,
  m.title AS manager_title
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
WHERE u.active = true;

-- View: Customer with full team details
CREATE VIEW customers_with_team AS
SELECT
  c.id,
  c.name,
  c.arr,
  c.renewal_date,
  c.has_account_plan,

  -- CSM details
  csm.id AS csm_id,
  csm.email AS csm_email,
  csm.name AS csm_name,

  -- CSM's manager
  csm.manager_id AS csm_manager_id,
  csm_manager.email AS csm_manager_email,
  csm_manager.name AS csm_manager_name,

  -- Account team
  ae.email AS account_executive_email,
  sa.email AS solutions_architect_email,
  exec_sponsor.email AS executive_sponsor_email,

  -- Account plan owner
  ap_owner.email AS account_plan_owner_email,
  ap_owner.name AS account_plan_owner_name

FROM customers c
LEFT JOIN users csm ON c.csm_id = csm.id
LEFT JOIN users csm_manager ON csm.manager_id = csm_manager.id
LEFT JOIN users ae ON c.account_executive_id = ae.id
LEFT JOIN users sa ON c.solutions_architect_id = sa.id
LEFT JOIN users exec_sponsor ON c.executive_sponsor_id = exec_sponsor.id
LEFT JOIN users ap_owner ON c.account_plan_owner_id = ap_owner.id;

-- ============================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================

-- Insert sample company settings
INSERT INTO company_settings (
  company_name,
  customer_success_team_email,
  executive_team_email
) VALUES (
  'Acme Corp',
  'cs-team@acme.com',
  'exec-team@acme.com'
);

-- Sample organizational hierarchy
INSERT INTO users (id, email, name, title, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ceo@acme.com', 'Jane CEO', 'Chief Executive Officer', 'ceo'),
  ('00000000-0000-0000-0000-000000000002', 'vp-cs@acme.com', 'John VP', 'VP Customer Success', 'vp_cs'),
  ('00000000-0000-0000-0000-000000000003', 'manager-alpha@acme.com', 'Alice Manager', 'CS Manager - Alpha Team', 'manager'),
  ('00000000-0000-0000-0000-000000000004', 'manager-beta@acme.com', 'Bob Manager', 'CS Manager - Beta Team', 'manager'),
  ('00000000-0000-0000-0000-000000000005', 'csm-1@acme.com', 'Carol CSM', 'Customer Success Manager', 'csm'),
  ('00000000-0000-0000-0000-000000000006', 'csm-2@acme.com', 'Dave CSM', 'Customer Success Manager', 'csm'),
  ('00000000-0000-0000-0000-000000000007', 'csm-3@acme.com', 'Eve CSM', 'Senior Customer Success Manager', 'csm');

-- Build hierarchy: CEO -> VP CS -> Managers -> CSMs
UPDATE users SET manager_id = NULL WHERE id = '00000000-0000-0000-0000-000000000001'; -- CEO has no manager
UPDATE users SET manager_id = '00000000-0000-0000-0000-000000000001' WHERE id = '00000000-0000-0000-0000-000000000002'; -- VP reports to CEO
UPDATE users SET manager_id = '00000000-0000-0000-0000-000000000002' WHERE id IN ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004'); -- Managers report to VP
UPDATE users SET manager_id = '00000000-0000-0000-0000-000000000003' WHERE id IN ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006'); -- CSMs in Alpha team
UPDATE users SET manager_id = '00000000-0000-0000-0000-000000000004' WHERE id = '00000000-0000-0000-0000-000000000007'; -- CSM in Beta team

-- Update company settings with key roles
UPDATE company_settings SET
  vp_customer_success_id = '00000000-0000-0000-0000-000000000002',
  ceo_id = '00000000-0000-0000-0000-000000000001';
