-- Script to create a local user account for authentication
-- Run this script using: npx supabase db reset --db-url "postgresql://postgres:postgres@localhost:54321/postgres"
-- Or run it directly in Supabase Studio SQL Editor

-- Replace these values with your desired credentials
DO $$
DECLARE
    user_email TEXT := 'admin@renubu.local';  -- Change this to your email
    user_password TEXT := 'TestPassword123!';  -- Change this to your password (min 8 chars)
    user_name TEXT := 'Admin User';  -- Change this to your name
    new_user_id UUID;
BEGIN
    -- Create the user in auth.users table with encrypted password
    -- Using Supabase's crypt function to properly hash the password
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        user_email,
        crypt(user_password, gen_salt('bf')),
        NOW(), -- Email is confirmed
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email'],
            'auth_type', 'local'
        ),
        jsonb_build_object(
            'email', user_email,
            'email_verified', true,
            'full_name', user_name,
            'auth_type', 'local'
        ),
        false,
        NOW(),
        NOW(),
        '',
        ''
    ) RETURNING id INTO new_user_id;

    -- Create corresponding profile record
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        auth_type,
        is_local_user,
        local_auth_enabled,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        user_email,
        user_name,
        'local',
        true,
        true,
        NOW(),
        NOW()
    );

    -- Output success message
    RAISE NOTICE 'Local user created successfully!';
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'You can now login with these credentials';
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'User with email % already exists!', user_email;
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user: %', SQLERRM;
END $$;

-- Verify the user was created
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.raw_app_meta_data->>'auth_type' as auth_type,
    p.full_name,
    p.is_local_user,
    p.local_auth_enabled
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN ('admin@renubu.local', 'justin@renubu.com')
ORDER BY u.created_at DESC;