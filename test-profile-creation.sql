-- Test profile creation trigger
-- This script will help us debug why profiles aren't being created

-- Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check current profiles
SELECT 
    id,
    email,
    full_name,
    created_at
FROM public.profiles
LIMIT 10;

-- Check auth users
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users
LIMIT 10; 