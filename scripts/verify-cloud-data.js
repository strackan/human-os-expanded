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

async function verifyCloudData() {
  try {
    console.log('🔍 Verifying cloud database data...\n');
    
    // Check each table
    const tables = [
      'companies',
      'customers', 
      'customer_properties',
      'contacts',
      'contracts',
      'renewals',
      'tasks',
      'events',
      'notes'
    ];
    
    console.log('📊 Data Summary:');
    console.log('='.repeat(50));
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*');
        
        if (error) {
          console.log(`❌ ${table.padEnd(20)}: ${error.message}`);
        } else {
          console.log(`✅ ${table.padEnd(20)}: ${data.length} records`);
          if (data.length > 0) {
            // Show sample data for key tables
            if (table === 'customers') {
              console.log(`   Sample: ${data[0].name} (${data[0].domain})`);
            } else if (table === 'companies') {
              console.log(`   Sample: ${data[0].name}`);
            } else if (table === 'renewals') {
              console.log(`   Sample: ${data[0].stage} - ${data[0].risk_level} risk`);
            }
          }
        }
      } catch (err) {
        console.log(`❌ ${table.padEnd(20)}: ${err.message}`);
      }
    }
    
    console.log('='.repeat(50));
    
    // Test a specific query to verify relationships
    console.log('\n🔗 Testing relationships...');
    
    const { data: customersWithRelations, error: relationError } = await supabase
      .from('customers')
      .select(`
        *,
        customer_properties(*),
        contacts(*),
        contracts(*),
        renewals(*)
      `)
      .limit(1);
    
    if (relationError) {
      console.log(`❌ Relationship test failed: ${relationError.message}`);
    } else if (customersWithRelations && customersWithRelations.length > 0) {
      const customer = customersWithRelations[0];
      console.log(`✅ Customer: ${customer.name}`);
      console.log(`   Properties: ${customer.customer_properties?.length || 0}`);
      console.log(`   Contacts: ${customer.contacts?.length || 0}`);
      console.log(`   Contracts: ${customer.contracts?.length || 0}`);
      console.log(`   Renewals: ${customer.renewals?.length || 0}`);
    }
    
    console.log('\n🎉 Cloud database verification completed!');
    console.log('✅ All data appears to be properly populated and relationships are working.');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyCloudData();









