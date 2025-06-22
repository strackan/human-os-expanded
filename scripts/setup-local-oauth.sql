-- Setup OAuth for local development
-- This script configures Google OAuth to work with localhost

-- Insert Google OAuth provider configuration
INSERT INTO auth.providers (id, name, created_at, updated_at)
VALUES ('google', 'google', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert OAuth configuration for Google
INSERT INTO auth.config (id, created_at, updated_at, site_url, additional_redirect_urls, jwt_expiry, enable_signup, enable_anonymous_sign_ins, enable_manual_linking, minimum_password_length, password_requirements)
VALUES (
  'default',
  NOW(),
  NOW(),
  'http://127.0.0.1:3000',
  ARRAY[
    'http://127.0.0.1:3000/api/auth/callback',
    'http://127.0.0.1:3000/auth/callback',
    'http://localhost:3000/api/auth/callback',
    'http://localhost:3000/auth/callback'
  ],
  3600,
  true,
  false,
  false,
  6,
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$'
)
ON CONFLICT (id) DO UPDATE SET
  site_url = EXCLUDED.site_url,
  additional_redirect_urls = EXCLUDED.additional_redirect_urls,
  updated_at = NOW();

-- Configure Google OAuth settings
INSERT INTO auth.saml_providers (id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at)
VALUES (
  'google',
  'https://accounts.google.com/o/saml2/metadata',
  NULL,
  NULL,
  '{"email": "email", "name": "name", "picture": "picture"}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Enable Google OAuth in external providers
UPDATE auth.config 
SET external = jsonb_build_object(
  'google', jsonb_build_object(
    'enabled', true,
    'client_id', '42614968888-9g1qb4kjofnqcusk9ru52llanfaei8cc.apps.googleusercontent.com',
    'secret', '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',
    'redirect_uri', 'http://127.0.0.1:3000/api/auth/callback'
  )
)
WHERE id = 'default';

-- Print confirmation
SELECT 'OAuth configuration updated for local development' as status;

-- Insert Google OAuth settings
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  '{"sub": "112942739978699858767", "email": "justin@renubu.com", "email_verified": true, "name": "Justin Strackany", "given_name": "Justin", "family_name": "Strackany", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJi-WsPTG9GkeF63VdoHh1yzYqD2VE_24KrfLTeQks-jdjkeA=s96-c", "locale": "en"}',
  'google',
  NOW(),
  NOW(),
  NOW()
);

-- Create a test user for local development
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'justin@renubu.com',
  '',
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '{"provider": "google", "providers": ["google"]}',
  '{"avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJi-WsPTG9GkeF63VdoHh1yzYqD2VE_24KrfLTeQks-jdjkeA=s96-c", "custom_claims": {"hd": "renubu.com"}, "email": "justin@renubu.com", "email_verified": true, "full_name": "Justin Strackany", "iss": "https://accounts.google.com", "name": "Justin Strackany", "phone_verified": false, "picture": "https://lh3.googleusercontent.com/a/ACg8ocJi-WsPTG9GkeF63VdoHh1yzYqD2VE_24KrfLTeQks-jdjkeA=s96-c", "provider_id": "112942739978699858767", "sub": "112942739978699858767"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Create a profile for the test user
INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url',
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.email = 'justin@renubu.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- Enable Google OAuth in the auth schema
UPDATE auth.config 
SET 
  additional_redirect_urls = ARRAY[
    'http://127.0.0.1:3000/api/auth/callback',
    'http://127.0.0.1:3000/auth/callback',
    'http://localhost:3000/api/auth/callback',
    'http://localhost:3000/auth/callback'
  ],
  updated_at = NOW()
WHERE id = 'default'; 