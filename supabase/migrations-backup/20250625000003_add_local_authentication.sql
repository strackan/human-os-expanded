-- Migration: Add Local Authentication Support
-- This migration adds local authentication as a fallback when OAuth is not working

-- ============================================================================
-- SECTION 1: ADD LOCAL AUTH FIELDS TO PROFILES TABLE
-- ============================================================================

-- Add local authentication fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'oauth' CHECK (auth_type IN ('oauth', 'local')),
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_local_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS local_auth_enabled BOOLEAN DEFAULT false;

-- Create index for local auth lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_auth_type ON public.profiles(email, auth_type);
CREATE INDEX IF NOT EXISTS idx_profiles_local_auth ON public.profiles(is_local_user, local_auth_enabled);

-- ============================================================================
-- SECTION 2: CREATE LOCAL AUTH FUNCTIONS
-- ============================================================================

-- Function to create a local user
CREATE OR REPLACE FUNCTION public.create_local_user(
    user_email TEXT,
    user_password TEXT,
    user_full_name TEXT DEFAULT NULL,
    user_company_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    password_hash TEXT;
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = user_email) THEN
        RAISE EXCEPTION 'User with email % already exists', user_email;
    END IF;
    
    -- Generate password hash (using pgcrypto extension)
    password_hash := crypt(user_password, gen_salt('bf'));
    
    -- Create auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Default instance ID
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        user_email,
        password_hash,
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'full_name', COALESCE(user_full_name, ''),
            'company_name', COALESCE(user_company_name, ''),
            'auth_type', 'local'
        )
    ) RETURNING id INTO new_user_id;
    
    -- Create profile for local user
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        company_name,
        auth_type,
        password_hash,
        is_local_user,
        local_auth_enabled
    ) VALUES (
        new_user_id,
        user_email,
        COALESCE(user_full_name, ''),
        COALESCE(user_company_name, ''),
        'local',
        password_hash,
        true,
        true
    );
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate local user
CREATE OR REPLACE FUNCTION public.authenticate_local_user(
    user_email TEXT,
    user_password TEXT
)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    full_name TEXT,
    company_name TEXT,
    auth_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.company_name,
        p.auth_type
    FROM public.profiles p
    WHERE p.email = user_email 
        AND p.auth_type = 'local'
        AND p.is_local_user = true
        AND p.local_auth_enabled = true
        AND p.password_hash = crypt(user_password, p.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update local user password
CREATE OR REPLACE FUNCTION public.update_local_user_password(
    user_email TEXT,
    old_password TEXT,
    new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
    new_password_hash TEXT;
BEGIN
    -- Verify old password
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE email = user_email 
            AND auth_type = 'local'
            AND password_hash = crypt(old_password, password_hash)
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Generate new password hash
    new_password_hash := crypt(new_password, gen_salt('bf'));
    
    -- Update password in both tables
    UPDATE auth.users 
    SET encrypted_password = new_password_hash, updated_at = NOW()
    WHERE email = user_email;
    
    UPDATE public.profiles 
    SET password_hash = new_password_hash, updated_at = NOW()
    WHERE email = user_email;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 3: UPDATE EXISTING USER HANDLER
-- ============================================================================

-- Update the existing user creation function to handle local users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, auth_type, is_local_user)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'auth_type', 'oauth'),
        COALESCE((NEW.raw_user_meta_data->>'auth_type')::text = 'local', false)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        auth_type = EXCLUDED.auth_type,
        is_local_user = EXCLUDED.is_local_user,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: CREATE POLICIES FOR LOCAL AUTH
-- ============================================================================

-- Allow local users to access their own profile
CREATE POLICY "Local users can access own profile" ON public.profiles
    FOR ALL USING (
        auth_type = 'local' AND 
        auth.uid() = id
    );

-- Allow OAuth users to access their own profile (existing policy)
CREATE POLICY "OAuth users can access own profile" ON public.profiles
    FOR ALL USING (
        auth_type = 'oauth' AND 
        auth.uid() = id
    );

-- ============================================================================
-- SECTION 5: ADD ENVIRONMENT VARIABLE SUPPORT
-- ============================================================================

-- Note: The following environment variables should be added to .env.local:
-- LOCAL_AUTH_ENABLED=true
-- LOCAL_AUTH_FALLBACK_ENABLED=true
-- LOCAL_AUTH_MIN_PASSWORD_LENGTH=8

-- ============================================================================
-- SECTION 6: MIGRATION NOTES
-- ============================================================================

-- This migration adds local authentication as a fallback system:
-- 1. Users can authenticate with email/password when OAuth is down
-- 2. Local users are stored separately from OAuth users
-- 3. Password hashing uses bcrypt for security
-- 4. Existing OAuth users are unaffected
-- 5. Local auth can be enabled/disabled via environment variables
