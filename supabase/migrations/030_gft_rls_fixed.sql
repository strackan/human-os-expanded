-- ============================================
-- GFT RLS Policies (Fixed - no auth.uid() issues)
-- Service role only for now - add user policies later
-- ============================================

-- Enable RLS on all tables
ALTER TABLE gft.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.li_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.li_post_engagements ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for MCP server and extension)
CREATE POLICY "gft_contacts_service" ON gft.contacts FOR ALL TO service_role USING (true);
CREATE POLICY "gft_companies_service" ON gft.companies FOR ALL TO service_role USING (true);
CREATE POLICY "gft_activities_service" ON gft.activities FOR ALL TO service_role USING (true);
CREATE POLICY "gft_li_posts_service" ON gft.li_posts FOR ALL TO service_role USING (true);
CREATE POLICY "gft_engagements_service" ON gft.li_post_engagements FOR ALL TO service_role USING (true);

-- Anon can read (for extension with anon key)
CREATE POLICY "gft_contacts_anon_select" ON gft.contacts FOR SELECT TO anon USING (true);
CREATE POLICY "gft_companies_anon_select" ON gft.companies FOR SELECT TO anon USING (true);
CREATE POLICY "gft_activities_anon_select" ON gft.activities FOR SELECT TO anon USING (true);
CREATE POLICY "gft_li_posts_anon_select" ON gft.li_posts FOR SELECT TO anon USING (true);
CREATE POLICY "gft_engagements_anon_select" ON gft.li_post_engagements FOR SELECT TO anon USING (true);

-- Anon can insert/update (for extension with anon key)
CREATE POLICY "gft_contacts_anon_insert" ON gft.contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "gft_contacts_anon_update" ON gft.contacts FOR UPDATE TO anon USING (true);
CREATE POLICY "gft_companies_anon_insert" ON gft.companies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "gft_companies_anon_update" ON gft.companies FOR UPDATE TO anon USING (true);
CREATE POLICY "gft_activities_anon_insert" ON gft.activities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "gft_li_posts_anon_insert" ON gft.li_posts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "gft_engagements_anon_insert" ON gft.li_post_engagements FOR INSERT TO anon WITH CHECK (true);
