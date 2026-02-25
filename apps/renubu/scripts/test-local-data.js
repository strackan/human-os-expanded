const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const localSupabaseUrl = 'http://127.0.0.1:54321';
const localSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(localSupabaseUrl, localSupabaseKey);

async function testData() {
  try {
    console.log('Testing local database connection...');
    
    // Test customers table
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.error('Error querying customers:', customersError);
    } else {
      console.log(`✓ Customers table has ${customers.length} records`);
      if (customers.length > 0) {
        console.log('Sample customer:', customers[0]);
      }
    }
    
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error querying profiles:', profilesError);
    } else {
      console.log(`✓ Profiles table has ${profiles.length} records`);
      if (profiles.length > 0) {
        console.log('Sample profile:', profiles[0]);
      }
    }
    
    // Test auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error querying auth.users:', authError);
    } else {
      console.log(`✓ Auth users table has ${authUsers.users.length} records`);
      if (authUsers.users.length > 0) {
        console.log('Sample auth user:', authUsers.users[0]);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testData();

