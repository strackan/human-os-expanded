const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const localSupabaseUrl = 'http://127.0.0.1:54321';
const localSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(localSupabaseUrl, localSupabaseKey);

async function insertSeedData() {
  try {
    console.log('Inserting seed data into local database...\n');
    
    // Insert customers
    console.log('1. Inserting customers...');
    const customers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Acme Corporation',
        domain: 'acmecorp.com',
        industry: 'Technology',
        health_score: 85,
        current_arr: 450000,
        renewal_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'RiskyCorp',
        domain: 'riskycorp.com',
        industry: 'Manufacturing',
        health_score: 45,
        current_arr: 380000,
        renewal_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'TechStart Inc',
        domain: 'techstart.com',
        industry: 'SaaS',
        health_score: 72,
        current_arr: 120000,
        renewal_date: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];
    
    const { data: insertedCustomers, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select();
    
    if (customersError) {
      console.error('❌ Error inserting customers:', customersError);
    } else {
      console.log(`✅ Inserted ${insertedCustomers.length} customers`);
    }
    
    // Insert customer properties
    console.log('\n2. Inserting customer properties...');
    const customerProperties = [
      {
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        usage_score: 92,
        health_score: 85,
        nps_score: 45,
        current_arr: 450000
      },
      {
        customer_id: '550e8400-e29b-41d4-a716-446655440002',
        usage_score: 65,
        health_score: 45,
        nps_score: -10,
        current_arr: 380000
      },
      {
        customer_id: '550e8400-e29b-41d4-a716-446655440003',
        usage_score: 70,
        health_score: 72,
        nps_score: 30,
        current_arr: 120000
      }
    ];
    
    const { data: insertedProperties, error: propertiesError } = await supabase
      .from('customer_properties')
      .insert(customerProperties)
      .select();
    
    if (propertiesError) {
      console.error('❌ Error inserting customer properties:', propertiesError);
    } else {
      console.log(`✅ Inserted ${insertedProperties.length} customer properties`);
    }
    
    // Insert contacts
    console.log('\n3. Inserting contacts...');
    const contacts = [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@acmecorp.com',
        phone: '+1-555-0101',
        title: 'CTO',
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        is_primary: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@riskycorp.com',
        phone: '+1-555-0102',
        title: 'VP Operations',
        customer_id: '550e8400-e29b-41d4-a716-446655440002',
        is_primary: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@techstart.com',
        phone: '+1-555-0103',
        title: 'Product Manager',
        customer_id: '550e8400-e29b-41d4-a716-446655440003',
        is_primary: true
      }
    ];
    
    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();
    
    if (contactsError) {
      console.error('❌ Error inserting contacts:', contactsError);
    } else {
      console.log(`✅ Inserted ${insertedContacts.length} contacts`);
    }
    
    console.log('\n✅ Seed data insertion completed!');
    
  } catch (error) {
    console.error('Script failed:', error);
  }
}

insertSeedData();
