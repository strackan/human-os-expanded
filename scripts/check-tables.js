const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const localSupabaseUrl = 'http://127.0.0.1:54321';
const localSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(localSupabaseUrl, localSupabaseKey);

async function checkTables() {
  try {
    console.log('Checking local database tables...\n');
    
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful\n');
    
    // Check each table
    const tables = ['customers', 'profiles', 'contacts', 'contracts', 'renewals', 'tasks', 'events', 'alerts', 'notes', 'customer_properties'];
    
    console.log('2. Checking table contents:');
    console.log('='.repeat(50));
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(5);
        
        if (error) {
          console.log(`❌ ${table.padEnd(20)}: ${error.message}`);
        } else {
          console.log(`✅ ${table.padEnd(20)}: ${data.length} records`);
        }
      } catch (err) {
        console.log(`❌ ${table.padEnd(20)}: ${err.message}`);
      }
    }
    
    console.log('='.repeat(50));
    console.log('\n✅ Table check completed!');
    
  } catch (error) {
    console.error('Script failed:', error);
  }
}

checkTables();
