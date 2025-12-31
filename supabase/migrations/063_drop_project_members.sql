-- Drop project_members table
-- Project collaborators can be tracked via project_links with linked_type='contact'

-- Drop the table (cascades indexes and constraints)
DROP TABLE IF EXISTS founder_os.project_members;

-- Update comment on project_links to clarify it handles team members too
COMMENT ON TABLE founder_os.project_links IS
  'Links projects to contacts (including team members), companies, OKR goals, and entities.
   Use relationship field to specify role (e.g., ''contributor'', ''advisor'', ''design_partner'').';
