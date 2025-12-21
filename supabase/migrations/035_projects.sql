-- Human OS Migration: Projects Schema
-- Adds project management to Founder OS with milestones, members, and links

-- =============================================================================
-- PROJECTS TABLE
-- Central project entity with metadata, status, and documentation
-- =============================================================================
CREATE TABLE founder_os.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  readme_markdown TEXT,
  github_repo_url TEXT,
  claude_project_folder TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_founder_os_projects_user_id ON founder_os.projects(user_id);
CREATE INDEX idx_founder_os_projects_status ON founder_os.projects(status);
CREATE INDEX idx_founder_os_projects_priority ON founder_os.projects(priority);
CREATE INDEX idx_founder_os_projects_slug ON founder_os.projects(slug);

-- =============================================================================
-- MILESTONES TABLE
-- Project milestones with ordering and completion tracking
-- =============================================================================
CREATE TABLE founder_os.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES founder_os.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  target_date DATE,
  completed_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_founder_os_milestones_project_id ON founder_os.milestones(project_id);
CREATE INDEX idx_founder_os_milestones_status ON founder_os.milestones(status);
CREATE INDEX idx_founder_os_milestones_order ON founder_os.milestones(project_id, order_index);

-- =============================================================================
-- PROJECT MEMBERS TABLE
-- Multi-user collaboration with roles
-- =============================================================================
CREATE TABLE founder_os.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES founder_os.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'contributor', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_founder_os_project_members_project_id ON founder_os.project_members(project_id);
CREATE INDEX idx_founder_os_project_members_user_id ON founder_os.project_members(user_id);

-- =============================================================================
-- PROJECT LINKS TABLE
-- Links projects to contacts, companies, goals, entities
-- =============================================================================
CREATE TABLE founder_os.project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES founder_os.projects(id) ON DELETE CASCADE,
  linked_type VARCHAR(20) NOT NULL CHECK (linked_type IN ('contact', 'company', 'goal', 'entity')),
  linked_id UUID NOT NULL,
  relationship VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, linked_type, linked_id)
);

CREATE INDEX idx_founder_os_project_links_project_id ON founder_os.project_links(project_id);
CREATE INDEX idx_founder_os_project_links_linked ON founder_os.project_links(linked_type, linked_id);

-- =============================================================================
-- ALTER EXISTING TABLES
-- Add project_id and milestone_id to tasks and goals
-- =============================================================================
ALTER TABLE founder_os.tasks
  ADD COLUMN project_id UUID REFERENCES founder_os.projects(id) ON DELETE SET NULL,
  ADD COLUMN milestone_id UUID REFERENCES founder_os.milestones(id) ON DELETE SET NULL;

CREATE INDEX idx_founder_os_tasks_project_id ON founder_os.tasks(project_id);
CREATE INDEX idx_founder_os_tasks_milestone_id ON founder_os.tasks(milestone_id);

ALTER TABLE founder_os.goals
  ADD COLUMN project_id UUID REFERENCES founder_os.projects(id) ON DELETE SET NULL;

CREATE INDEX idx_founder_os_goals_project_id ON founder_os.goals(project_id);

-- =============================================================================
-- AUTO-UPDATE TRIGGERS
-- =============================================================================
CREATE TRIGGER update_founder_os_projects_updated_at
  BEFORE UPDATE ON founder_os.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_founder_os_milestones_updated_at
  BEFORE UPDATE ON founder_os.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE founder_os.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.project_links ENABLE ROW LEVEL SECURITY;

-- Service role full access (matches existing pattern)
CREATE POLICY "Service role full access" ON founder_os.projects FOR ALL USING (true);
CREATE POLICY "Service role full access" ON founder_os.milestones FOR ALL USING (true);
CREATE POLICY "Service role full access" ON founder_os.project_members FOR ALL USING (true);
CREATE POLICY "Service role full access" ON founder_os.project_links FOR ALL USING (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE founder_os.projects IS 'Project management with milestones, documentation, and collaboration';
COMMENT ON TABLE founder_os.milestones IS 'Project milestones with status and completion tracking';
COMMENT ON TABLE founder_os.project_members IS 'Project collaboration - owners, contributors, viewers';
COMMENT ON TABLE founder_os.project_links IS 'Links projects to contacts, companies, goals, and entities';
COMMENT ON COLUMN founder_os.projects.slug IS 'URL-friendly unique identifier per user';
COMMENT ON COLUMN founder_os.projects.readme_markdown IS 'Rich project documentation in markdown';
COMMENT ON COLUMN founder_os.projects.claude_project_folder IS 'Path to associated Claude project folder';
COMMENT ON COLUMN founder_os.milestones.order_index IS 'Display order within project';
COMMENT ON COLUMN founder_os.project_links.relationship IS 'Nature of the link (e.g., design_partner, investor, advisor)';

-- =============================================================================
-- SEED DATA
-- Insert sample projects for testing (using a placeholder user_id)
-- Note: Replace with actual user_id when running in production
-- =============================================================================
DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Placeholder, replace as needed
  v_renubu_id UUID;
  v_human_os_id UUID;
  v_powerpak_id UUID;
  v_good_hang_id UUID;
BEGIN
  -- Insert projects
  INSERT INTO founder_os.projects (id, user_id, name, slug, description, status, priority, start_date, readme_markdown)
  VALUES
    (gen_random_uuid(), v_user_id, 'Renubu', 'renubu', 'AI-powered relationship management platform', 'active', 'critical', '2024-01-01', '# Renubu

AI-powered CRM for founders and professionals.

## Vision
Make relationship management effortless with AI.')
  RETURNING id INTO v_renubu_id;

  INSERT INTO founder_os.projects (id, user_id, name, slug, description, status, priority, start_date)
  VALUES
    (gen_random_uuid(), v_user_id, 'Human OS', 'human-os', 'Personal knowledge and context management system', 'active', 'high', '2024-01-01')
  RETURNING id INTO v_human_os_id;

  INSERT INTO founder_os.projects (id, user_id, name, slug, description, status, priority)
  VALUES
    (gen_random_uuid(), v_user_id, 'PowerPak', 'powerpak', 'Portable power solutions for outdoor adventures', 'active', 'medium')
  RETURNING id INTO v_powerpak_id;

  INSERT INTO founder_os.projects (id, user_id, name, slug, description, status, priority)
  VALUES
    (gen_random_uuid(), v_user_id, 'Good Hang', 'good-hang', 'Social planning app for quality time with friends', 'on_hold', 'low')
  RETURNING id INTO v_good_hang_id;

  -- Insert milestones for Renubu
  INSERT INTO founder_os.milestones (project_id, name, description, status, target_date, order_index)
  VALUES
    (v_renubu_id, 'MVP Launch', 'Core CRM features with AI relationship insights', 'in_progress', '2025-02-01', 1),
    (v_renubu_id, 'Beta Release', 'Public beta with early adopter program', 'not_started', '2025-04-01', 2),
    (v_renubu_id, 'Product Hunt Launch', 'Official public launch on Product Hunt', 'not_started', '2025-06-01', 3);

  -- Insert milestones for Human OS
  INSERT INTO founder_os.milestones (project_id, name, description, status, order_index)
  VALUES
    (v_human_os_id, 'Projects Schema', 'Add project management to Founder OS', 'in_progress', 1),
    (v_human_os_id, 'Mobile App', 'iOS/Android app for on-the-go capture', 'not_started', 2);
END $$;
