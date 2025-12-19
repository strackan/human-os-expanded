-- ============================================
-- GFT RLS Policies
-- Secures gft schema for multi-user access
-- ============================================

-- Enable RLS on all tables
ALTER TABLE gft.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.li_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.li_post_engagements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTACTS POLICIES
-- ============================================
CREATE POLICY "gft_contacts_select_own" ON gft.contacts
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "gft_contacts_insert_own" ON gft.contacts
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "gft_contacts_update_own" ON gft.contacts
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "gft_contacts_delete_own" ON gft.contacts
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "gft_contacts_service_all" ON gft.contacts
  FOR ALL TO service_role USING (true);

-- ============================================
-- COMPANIES POLICIES
-- ============================================
CREATE POLICY "gft_companies_select_own" ON gft.companies
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "gft_companies_insert_own" ON gft.companies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "gft_companies_update_own" ON gft.companies
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "gft_companies_delete_own" ON gft.companies
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "gft_companies_service_all" ON gft.companies
  FOR ALL TO service_role USING (true);

-- ============================================
-- ACTIVITIES POLICIES
-- ============================================
CREATE POLICY "gft_activities_select_own" ON gft.activities
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "gft_activities_insert_own" ON gft.activities
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "gft_activities_update_own" ON gft.activities
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "gft_activities_delete_own" ON gft.activities
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "gft_activities_service_all" ON gft.activities
  FOR ALL TO service_role USING (true);

-- ============================================
-- LI_POSTS POLICIES
-- ============================================
CREATE POLICY "gft_li_posts_select_own" ON gft.li_posts
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "gft_li_posts_insert_own" ON gft.li_posts
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "gft_li_posts_update_own" ON gft.li_posts
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "gft_li_posts_delete_own" ON gft.li_posts
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "gft_li_posts_service_all" ON gft.li_posts
  FOR ALL TO service_role USING (true);

-- ============================================
-- LI_POST_ENGAGEMENTS POLICIES
-- (Access via post ownership)
-- ============================================
CREATE POLICY "gft_engagements_select_via_post" ON gft.li_post_engagements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM gft.li_posts WHERE id = post_id AND owner_id = auth.uid())
  );

CREATE POLICY "gft_engagements_insert_via_post" ON gft.li_post_engagements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM gft.li_posts WHERE id = post_id AND owner_id = auth.uid())
  );

CREATE POLICY "gft_engagements_update_via_post" ON gft.li_post_engagements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM gft.li_posts WHERE id = post_id AND owner_id = auth.uid())
  );

CREATE POLICY "gft_engagements_delete_via_post" ON gft.li_post_engagements
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM gft.li_posts WHERE id = post_id AND owner_id = auth.uid())
  );

CREATE POLICY "gft_engagements_service_all" ON gft.li_post_engagements
  FOR ALL TO service_role USING (true);
