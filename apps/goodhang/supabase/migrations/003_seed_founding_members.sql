-- Seed Founding Members
-- This creates profiles for founding members WITHOUT needing authentication
-- Update this with your actual founding members

-- IMPORTANT: These UUIDs are fake. You'll need to either:
-- 1. Have people sign up via auth, then update their profiles OR
-- 2. Create auth users first, then insert profiles with matching IDs

-- Example: Insert yourself as the first admin
-- First, you need to sign up at /login, then run this to make yourself admin:

-- UPDATE profiles
-- SET
--   name = 'Your Name',
--   bio = 'Your bio here',
--   role = 'Founder & CEO',
--   company = 'Renubu',
--   linkedin_url = 'https://linkedin.com/in/yourprofile',
--   interests = ARRAY['AI', 'GTM', 'Community Building'],
--   user_role = 'admin',
--   membership_tier = 'free'
-- WHERE email = 'your@email.com';

-- For demo purposes, here's how you'd insert sample members (after they've signed up):
-- Note: Only do this for real users who have authenticated!

/*
-- Example member profile updates (run AFTER users sign up)
UPDATE profiles
SET
  name = 'Jane Smith',
  bio = 'Product leader passionate about building communities and AI-powered tools.',
  role = 'VP of Product',
  company = 'Tech Startup',
  linkedin_url = 'https://linkedin.com/in/janesmith',
  interests = ARRAY['Product Management', 'AI/ML', 'Community'],
  membership_tier = 'free'
WHERE email = 'jane@example.com';

UPDATE profiles
SET
  name = 'Mike Johnson',
  bio = 'Engineering leader who loves solving hard problems and mentoring others.',
  role = 'CTO',
  company = 'Scale Inc',
  linkedin_url = 'https://linkedin.com/in/mikejohnson',
  interests = ARRAY['Engineering', 'Mentorship', 'Open Source'],
  membership_tier = 'free'
WHERE email = 'mike@example.com';
*/

-- Check existing profiles
SELECT id, email, name, user_role FROM profiles ORDER BY created_at;
