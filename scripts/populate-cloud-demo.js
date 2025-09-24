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

async function populateCloudDemo() {
  try {
    console.log('🚀 Populating cloud database with demo data...\n');
    
    // Step 1: Create demo company
    console.log('1. Creating demo company...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Renubu Demo Corp',
        domain: 'renubu-demo.com'
      })
      .select()
      .single();
    
    if (companyError) {
      console.error('❌ Error creating company:', companyError);
      return;
    }
    console.log(`✅ Created company: ${company.name}\n`);
    
    // Step 2: Create demo customers
    console.log('2. Creating demo customers...');
    const customers = [
      {
        name: 'Acme Corporation',
        domain: 'acmecorp.com',
        industry: 'Technology',
        health_score: 85,
        current_arr: 450000,
        renewal_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company_id: company.id
      },
      {
        name: 'RiskyCorp',
        domain: 'riskycorp.com',
        industry: 'Manufacturing',
        health_score: 45,
        current_arr: 380000,
        renewal_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company_id: company.id
      },
      {
        name: 'TechStart Inc',
        domain: 'techstart.com',
        industry: 'SaaS',
        health_score: 72,
        current_arr: 120000,
        renewal_date: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company_id: company.id
      }
    ];
    
    const { data: insertedCustomers, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select();
    
    if (customersError) {
      console.error('❌ Error creating customers:', customersError);
      return;
    }
    console.log(`✅ Created ${insertedCustomers.length} customers\n`);
    
    // Step 3: Create customer properties
    console.log('3. Creating customer properties...');
    const customerProperties = [
      {
        customer_id: insertedCustomers[0].id,
        usage_score: 92,
        health_score: 85,
        nps_score: 45,
        current_arr: 450000
      },
      {
        customer_id: insertedCustomers[1].id,
        usage_score: 65,
        health_score: 45,
        nps_score: -10,
        current_arr: 380000
      },
      {
        customer_id: insertedCustomers[2].id,
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
      console.error('❌ Error creating customer properties:', propertiesError);
      return;
    }
    console.log(`✅ Created ${insertedProperties.length} customer properties\n`);
    
    // Step 4: Create contacts
    console.log('4. Creating contacts...');
    const contacts = [
      {
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@acmecorp.com',
        phone: '+1-555-0101',
        title: 'CTO',
        customer_id: insertedCustomers[0].id,
        is_primary: true
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@riskycorp.com',
        phone: '+1-555-0102',
        title: 'VP Operations',
        customer_id: insertedCustomers[1].id,
        is_primary: true
      },
      {
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@techstart.com',
        phone: '+1-555-0103',
        title: 'Product Manager',
        customer_id: insertedCustomers[2].id,
        is_primary: true
      }
    ];
    
    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();
    
    if (contactsError) {
      console.error('❌ Error creating contacts:', contactsError);
      return;
    }
    console.log(`✅ Created ${insertedContacts.length} contacts\n`);
    
    // Step 5: Create contracts
    console.log('5. Creating contracts...');
    const contracts = [
      {
        customer_id: insertedCustomers[0].id,
        contract_number: 'ACME-2024-001',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        arr: 450000,
        seats: 500,
        contract_type: 'subscription',
        status: 'active',
        auto_renewal: true
      },
      {
        customer_id: insertedCustomers[1].id,
        contract_number: 'RISKY-2024-001',
        start_date: '2024-02-01',
        end_date: '2025-01-31',
        arr: 380000,
        seats: 300,
        contract_type: 'subscription',
        status: 'active',
        auto_renewal: true
      },
      {
        customer_id: insertedCustomers[2].id,
        contract_number: 'TECH-2024-001',
        start_date: '2024-03-01',
        end_date: '2025-02-28',
        arr: 120000,
        seats: 100,
        contract_type: 'subscription',
        status: 'active',
        auto_renewal: true
      }
    ];
    
    const { data: insertedContracts, error: contractsError } = await supabase
      .from('contracts')
      .insert(contracts)
      .select();
    
    if (contractsError) {
      console.error('❌ Error creating contracts:', contractsError);
      return;
    }
    console.log(`✅ Created ${insertedContracts.length} contracts\n`);
    
    // Step 6: Create renewals
    console.log('6. Creating renewals...');
    const renewals = [
      {
        contract_id: insertedContracts[0].id,
        customer_id: insertedCustomers[0].id,
        renewal_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        current_arr: 450000,
        proposed_arr: 495000,
        probability: 85,
        stage: 'negotiation',
        risk_level: 'low'
      },
      {
        contract_id: insertedContracts[1].id,
        customer_id: insertedCustomers[1].id,
        renewal_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        current_arr: 380000,
        proposed_arr: 380000,
        probability: 40,
        stage: 'at_risk',
        risk_level: 'high'
      },
      {
        contract_id: insertedContracts[2].id,
        customer_id: insertedCustomers[2].id,
        renewal_date: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        current_arr: 120000,
        proposed_arr: 144000,
        probability: 70,
        stage: 'discovery',
        risk_level: 'medium'
      }
    ];
    
    const { data: insertedRenewals, error: renewalsError } = await supabase
      .from('renewals')
      .insert(renewals)
      .select();
    
    if (renewalsError) {
      console.error('❌ Error creating renewals:', renewalsError);
      return;
    }
    console.log(`✅ Created ${insertedRenewals.length} renewals\n`);
    
    // Step 7: Create tasks
    console.log('7. Creating tasks...');
    const tasks = [
      {
        renewal_id: insertedRenewals[0].id,
        customer_id: insertedCustomers[0].id,
        title: 'QBR Preparation',
        description: 'Prepare quarterly business review materials',
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        renewal_id: insertedRenewals[1].id,
        customer_id: insertedCustomers[1].id,
        title: 'Risk Assessment',
        description: 'Conduct customer health assessment',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        renewal_id: insertedRenewals[2].id,
        customer_id: insertedCustomers[2].id,
        title: 'Feature Demo',
        description: 'Demonstrate new product features',
        status: 'completed',
        priority: 'medium',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed_at: new Date().toISOString()
      }
    ];
    
    const { data: insertedTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();
    
    if (tasksError) {
      console.error('❌ Error creating tasks:', tasksError);
      return;
    }
    console.log(`✅ Created ${insertedTasks.length} tasks\n`);
    
    // Step 8: Create events
    console.log('8. Creating events...');
    const events = [
      {
        title: 'QBR Meeting',
        description: 'Quarterly business review with executive team',
        event_type: 'meeting',
        customer_id: insertedCustomers[0].id,
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled'
      },
      {
        title: 'Renewal Discussion',
        description: 'Discuss renewal terms and pricing',
        event_type: 'call',
        customer_id: insertedCustomers[1].id,
        event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled'
      },
      {
        title: 'Product Demo',
        description: 'Demonstrate new features and capabilities',
        event_type: 'demo',
        customer_id: insertedCustomers[2].id,
        event_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      }
    ];
    
    const { data: insertedEvents, error: eventsError } = await supabase
      .from('events')
      .insert(events)
      .select();
    
    if (eventsError) {
      console.error('❌ Error creating events:', eventsError);
      return;
    }
    console.log(`✅ Created ${insertedEvents.length} events\n`);
    
    // Step 9: Create notes
    console.log('9. Creating notes...');
    const notes = [
      {
        customer_id: insertedCustomers[0].id,
        renewal_id: insertedRenewals[0].id,
        content: 'Customer is very satisfied with current service level. Discussed expansion opportunities for Q2.',
        note_type: 'meeting'
      },
      {
        customer_id: insertedCustomers[1].id,
        renewal_id: insertedRenewals[1].id,
        content: 'Customer experiencing some challenges with adoption. Recommend additional training.',
        note_type: 'risk'
      },
      {
        customer_id: insertedCustomers[2].id,
        renewal_id: insertedRenewals[2].id,
        content: 'Customer was impressed with new features. Interested in early access program.',
        note_type: 'general'
      }
    ];
    
    const { data: insertedNotes, error: notesError } = await supabase
      .from('notes')
      .insert(notes)
      .select();
    
    if (notesError) {
      console.error('❌ Error creating notes:', notesError);
      return;
    }
    console.log(`✅ Created ${insertedNotes.length} notes\n`);
    
    console.log('🎉 Cloud database populated successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`   Company: ${company.name}`);
    console.log(`   Customers: ${insertedCustomers.length}`);
    console.log(`   Contacts: ${insertedContacts.length}`);
    console.log(`   Contracts: ${insertedContracts.length}`);
    console.log(`   Renewals: ${insertedRenewals.length}`);
    console.log(`   Tasks: ${insertedTasks.length}`);
    console.log(`   Events: ${insertedEvents.length}`);
    console.log(`   Notes: ${insertedNotes.length}`);
    
    console.log('\n🔗 Next steps:');
    console.log('   1. Update environment variables to use cloud database');
    console.log('   2. Test the application functionality');
    console.log('   3. Verify all data is loading correctly');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

populateCloudDemo();








