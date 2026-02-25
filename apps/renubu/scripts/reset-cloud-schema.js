const { createClient } = require('@supabase/supabase-js');

// Cloud Supabase configuration
const cloudSupabaseUrl = 'https://uuvdjjclwwulvyeboavk.supabase.co';
const cloudServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmRqamNsd3d1bHZ5ZWJvYXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc2MjM3NCwiZXhwIjoyMDY1MzM4Mzc0fQ.uaWFNXt8zWh_3qmpBPMNXsExo0d-u_vVmd11A-JRaDs';

const supabase = createClient(cloudSupabaseUrl, cloudServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetCloudSchema() {
  try {
    console.log('🔄 Resetting cloud database schema to match local...\n');
    
    // Step 1: Drop all existing tables and functions
    console.log('1. Dropping existing tables and functions...');
    
    const dropQueries = [
      // Drop new tables that don't exist in local
      'DROP TABLE IF EXISTS public.customer_forecasts CASCADE;',
      'DROP TABLE IF EXISTS public.date_monitoring_log CASCADE;',
      'DROP TABLE IF EXISTS public.key_dates CASCADE;',
      'DROP TABLE IF EXISTS public.workflows CASCADE;',
      'DROP TABLE IF EXISTS public.workflow_conversations CASCADE;',
      'DROP TABLE IF EXISTS public.conversation_messages CASCADE;',
      'DROP TABLE IF EXISTS public.renewal_tasks CASCADE;',
      'DROP TABLE IF EXISTS public.renewal_workflow_outcomes CASCADE;',
      'DROP TABLE IF EXISTS public.task_templates CASCADE;',
      
      // Drop functions that don't exist in local
      'DROP FUNCTION IF EXISTS public.create_renewal_planning_tasks() CASCADE;',
      'DROP FUNCTION IF EXISTS public.generate_renewal_tasks(uuid) CASCADE;',
      'DROP FUNCTION IF EXISTS public.get_next_priority_task(date) CASCADE;',
      'DROP FUNCTION IF EXISTS public.update_action_scores() CASCADE;',
      
      // Drop policies
      'DROP POLICY IF EXISTS "customer_forecasts_policy" ON public.customer_forecasts;',
      'DROP POLICY IF EXISTS "Company isolation - messages" ON public.conversation_messages;',
      'DROP POLICY IF EXISTS "Company isolation - conversations" ON public.workflow_conversations;',
      'DROP POLICY IF EXISTS "Company isolation - customers" ON public.customers;',
      'DROP POLICY IF EXISTS "Company isolation - renewals" ON public.renewals;',
      'DROP POLICY IF EXISTS "Company isolation - profiles" ON public.profiles;',
      'DROP POLICY IF EXISTS "Company isolation - companies" ON public.companies;',
    ];
    
    for (const query of dropQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Warning: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️  Warning: ${err.message}`);
      }
    }
    
    console.log('✅ Dropped existing tables and functions\n');
    
    // Step 2: Add missing columns to match local schema
    console.log('2. Adding missing columns to match local schema...');
    
    const alterQueries = [
      // Add missing columns to customers table
      'ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);',
      'ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS current_arr DECIMAL(12,2) DEFAULT 0;',
      'ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS renewal_date DATE;',
      'ALTER TABLE public.customers DROP COLUMN IF EXISTS csm_id;',
      'ALTER TABLE public.customers DROP COLUMN IF EXISTS nps_score;',
      'ALTER TABLE public.customers DROP COLUMN IF EXISTS primary_contact_email;',
      'ALTER TABLE public.customers DROP COLUMN IF EXISTS primary_contact_name;',
      'ALTER TABLE public.customers DROP COLUMN IF EXISTS primary_contact_phone;',
      'ALTER TABLE public.customers DROP COLUMN IF EXISTS tier;',
      
      // Add missing columns to profiles table
      'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT \'oauth\' CHECK (auth_type IN (\'oauth\', \'local\'));',
      'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;',
      'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_local_user BOOLEAN DEFAULT false;',
      'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS local_auth_enabled BOOLEAN DEFAULT false;',
      
      // Add missing columns to customer_properties table
      'ALTER TABLE public.customer_properties DROP COLUMN IF EXISTS contract_end_date;',
      'ALTER TABLE public.customer_properties DROP COLUMN IF EXISTS contract_renewal_date;',
      'ALTER TABLE public.customer_properties DROP COLUMN IF EXISTS expansion_opportunity_date;',
      'ALTER TABLE public.customer_properties DROP COLUMN IF EXISTS expansion_potential;',
      'ALTER TABLE public.customer_properties DROP COLUMN IF EXISTS last_activity_date;',
      'ALTER TABLE public.customer_properties DROP COLUMN IF EXISTS next_review_date;',
      'ALTER TABLE public.customer_properties DROP COLUMN IF EXISTS risk_level;',
      
      // Add missing columns to events table
      'ALTER TABLE public.events DROP COLUMN IF EXISTS priority;',
      'ALTER TABLE public.events DROP COLUMN IF EXISTS processed;',
    ];
    
    for (const query of alterQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Warning: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️  Warning: ${err.message}`);
      }
    }
    
    console.log('✅ Updated table columns\n');
    
    // Step 3: Create missing tables
    console.log('3. Creating missing tables...');
    
    const createTableQueries = [
      // Create contacts table
      `CREATE TABLE IF NOT EXISTS public.contacts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        title TEXT,
        customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      
      // Create notes table
      `CREATE TABLE IF NOT EXISTS public.notes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
        renewal_id UUID REFERENCES public.renewals(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id),
        content TEXT NOT NULL,
        note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'meeting', 'call', 'risk')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      
      // Create tasks table
      `CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        renewal_id UUID REFERENCES public.renewals(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        assigned_to UUID REFERENCES public.profiles(id),
        due_date DATE,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
    ];
    
    for (const query of createTableQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Warning: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️  Warning: ${err.message}`);
      }
    }
    
    console.log('✅ Created missing tables\n');
    
    // Step 4: Create missing functions
    console.log('4. Creating missing functions...');
    
    const createFunctionQueries = [
      // Create local authentication functions
      `CREATE OR REPLACE FUNCTION public.authenticate_local_user(user_email text, user_password text)
       RETURNS json
       LANGUAGE plpgsql
       SECURITY DEFINER
       AS $$
       DECLARE
         user_record RECORD;
         result json;
       BEGIN
         SELECT * INTO user_record
         FROM public.profiles
         WHERE email = user_email AND auth_type = 'local' AND local_auth_enabled = true;
         
         IF user_record IS NULL THEN
           RETURN json_build_object('success', false, 'error', 'User not found or local auth not enabled');
         END IF;
         
         IF user_record.password_hash = crypt(user_password, user_record.password_hash) THEN
           RETURN json_build_object('success', true, 'user', row_to_json(user_record));
         ELSE
           RETURN json_build_object('success', false, 'error', 'Invalid password');
         END IF;
       END;
       $$;`,
      
      `CREATE OR REPLACE FUNCTION public.create_local_user(user_email text, user_password text, user_full_name text, user_company_name text)
       RETURNS json
       LANGUAGE plpgsql
       SECURITY DEFINER
       AS $$
       DECLARE
         new_user_id uuid;
         result json;
       BEGIN
         INSERT INTO public.profiles (id, email, full_name, company_name, auth_type, password_hash, is_local_user, local_auth_enabled)
         VALUES (gen_random_uuid(), user_email, user_full_name, user_company_name, 'local', crypt(user_password, gen_salt('bf')), true, true)
         RETURNING id INTO new_user_id;
         
         RETURN json_build_object('success', true, 'user_id', new_user_id);
       EXCEPTION
         WHEN unique_violation THEN
           RETURN json_build_object('success', false, 'error', 'User already exists');
         WHEN OTHERS THEN
           RETURN json_build_object('success', false, 'error', SQLERRM);
       END;
       $$;`,
    ];
    
    for (const query of createFunctionQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Warning: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️  Warning: ${err.message}`);
      }
    }
    
    console.log('✅ Created missing functions\n');
    
    // Step 5: Update RLS policies to match local
    console.log('5. Updating RLS policies...');
    
    const policyQueries = [
      // Drop new policies and recreate old ones
      'DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.alerts;',
      'DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.alerts;',
      'DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;',
      'DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON public.contracts;',
      'DROP POLICY IF EXISTS "Authenticated users can update contracts" ON public.contracts;',
      'DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;',
      'DROP POLICY IF EXISTS "Authenticated users can insert customer_properties" ON public.customer_properties;',
      'DROP POLICY IF EXISTS "Authenticated users can update customer_properties" ON public.customer_properties;',
      'DROP POLICY IF EXISTS "Authenticated users can view customer_properties" ON public.customer_properties;',
      'DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;',
      'DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;',
      'DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;',
      'DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;',
      'DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;',
      'DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;',
      'DROP POLICY IF EXISTS "Authenticated users can insert renewals" ON public.renewals;',
      'DROP POLICY IF EXISTS "Authenticated users can update renewals" ON public.renewals;',
      'DROP POLICY IF EXISTS "Authenticated users can view renewals" ON public.renewals;',
      'DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;',
      
      // Create old-style policies
      'CREATE POLICY "Authenticated users can access alerts" ON public.alerts FOR ALL TO authenticated USING (true);',
      'CREATE POLICY "Authenticated users can access contracts" ON public.contracts FOR ALL TO authenticated USING (true);',
      'CREATE POLICY "Authenticated users can access customer_properties" ON public.customer_properties FOR ALL TO authenticated USING (true);',
      'CREATE POLICY "Authenticated users can access customers" ON public.customers FOR ALL TO authenticated USING (true);',
      'CREATE POLICY "Authenticated users can access events" ON public.events FOR ALL TO authenticated USING (true);',
      'CREATE POLICY "Authenticated users can access renewals" ON public.renewals FOR ALL TO authenticated USING (true);',
      'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO public USING (auth.uid() = id);',
      'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO public USING (auth.uid() = id);',
      'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO public WITH CHECK (auth.uid() = id);',
      'CREATE POLICY "Local users can access own profile" ON public.profiles FOR ALL TO public USING (auth_type = \'local\' AND email = current_setting(\'request.jwt.claims\', true)::json->>\'email\');',
      'CREATE POLICY "OAuth users can access own profile" ON public.profiles FOR ALL TO public USING (auth_type = \'oauth\' AND auth.uid() = id);',
    ];
    
    for (const query of policyQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Warning: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️  Warning: ${err.message}`);
      }
    }
    
    console.log('✅ Updated RLS policies\n');
    
    console.log('🎉 Cloud database schema reset completed!');
    console.log('📋 Next steps:');
    console.log('   1. Run: npx supabase db push');
    console.log('   2. Run: npx supabase db reset --linked');
    console.log('   3. Test the application with cloud database');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

resetCloudSchema();












