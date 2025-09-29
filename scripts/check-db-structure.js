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

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check if customers table exists
    console.log('📋 Checking customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (customersError) {
      console.error('❌ Error accessing customers table:', customersError);
    } else {
      console.log('✅ Customers table accessible');
    }

    // Check if contacts table exists
    console.log('📋 Checking contacts table...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);

    if (contactsError) {
      console.error('❌ Error accessing contacts table:', contactsError);
    } else {
      console.log('✅ Contacts table accessible');
    }

    // Try a simple join to see if it works
    console.log('🔗 Testing join between customers and contacts...');
    const { data: joinTest, error: joinError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        contacts!fk_public_contacts_customer_id (
          id,
          first_name,
          last_name
        )
      `)
      .limit(1);

    if (joinError) {
      console.error('❌ Error with join:', joinError);
      console.log('💡 The foreign key constraint might not exist or be malformed');
    } else {
      console.log('✅ Join works correctly');
      console.log('📊 Join test result:', joinTest);
    }

    // Try without the foreign key constraint name
    console.log('🔗 Testing join without foreign key constraint name...');
    const { data: joinTest2, error: joinError2 } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        contacts (
          id,
          first_name,
          last_name
        )
      `)
      .limit(1);

    if (joinError2) {
      console.error('❌ Error with join (no constraint name):', joinError2);
    } else {
      console.log('✅ Join without constraint name works');
      console.log('📊 Join test 2 result:', joinTest2);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkDatabaseStructure();
