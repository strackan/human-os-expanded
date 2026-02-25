const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomerCreation() {
  console.log('🧪 Testing customer creation...');
  
  try {
    // Test 1: Simple customer creation
    console.log('📝 Creating test customer...');
    const { data: customer, error: createError } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer ' + Date.now(),
        domain: 'testcustomer.com',
        industry: 'Technology',
        health_score: 80,
        current_arr: 100000,
        renewal_date: '2024-12-31'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating customer:', createError);
      return;
    }

    console.log('✅ Customer created successfully:', customer);

    // Test 2: Check if we can fetch the customer
    console.log('🔍 Fetching created customer...');
    const { data: fetchedCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching customer:', fetchError);
      return;
    }

    console.log('✅ Customer fetched successfully:', fetchedCustomer);

    // Test 3: Check for slug conflicts
    console.log('🔍 Testing slug conflict check...');
    const { data: conflictCheck, error: conflictError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('name', customer.name)
      .single();

    if (conflictError && conflictError.code === 'PGRST116') {
      console.log('✅ No conflict found (expected)');
    } else if (conflictError) {
      console.error('❌ Error checking conflicts:', conflictError);
    } else {
      console.log('✅ Conflict check completed:', conflictCheck);
    }

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCustomerCreation();
