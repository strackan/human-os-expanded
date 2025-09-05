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

async function populateCloudFullSeed() {
  try {
    console.log('🚀 Populating cloud database with full seed data (15 customers)...\n');
    
    // Step 1: Clear existing data
    console.log('1. Clearing existing data...');
    const tablesToClear = [
      'notes', 'tasks', 'events', 'renewals', 
      'contracts', 'alerts', 'contacts', 'customers', 'customer_properties'
    ];
    
    for (const table of tablesToClear) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.log(`⚠️  Warning clearing ${table}: ${error.message}`);
      }
    }
    console.log('✅ Cleared existing data\n');
    
    // Step 2: Create all 15 customers with dynamic renewal dates
    console.log('2. Creating all 15 customers...');
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
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Global Solutions',
        domain: 'globalsolutions.com',
        industry: 'Consulting',
        health_score: 92,
        current_arr: 750000,
        renewal_date: new Date(Date.now() + 125 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'StartupXYZ',
        domain: 'startupxyz.com',
        industry: 'Fintech',
        health_score: 35,
        current_arr: 85000,
        renewal_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'Nimbus Analytics',
        domain: 'nimbusanalytics.com',
        industry: 'Analytics',
        health_score: 67,
        current_arr: 210000,
        renewal_date: new Date(Date.now() + 155 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Venture Partners',
        domain: 'venturepartners.com',
        industry: 'Finance',
        health_score: 78,
        current_arr: 540000,
        renewal_date: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440008',
        name: 'Horizon Systems',
        domain: 'horizonsystems.com',
        industry: 'Healthcare',
        health_score: 55,
        current_arr: 305000,
        renewal_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440009',
        name: 'Quantum Soft',
        domain: 'quantumsoft.com',
        industry: 'Software',
        health_score: 82,
        current_arr: 190000,
        renewal_date: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Apex Media',
        domain: 'apexmedia.com',
        industry: 'Media',
        health_score: 64,
        current_arr: 150000,
        renewal_date: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Stellar Networks',
        domain: 'stellarnetworks.com',
        industry: 'Telecom',
        health_score: 88,
        current_arr: 620000,
        renewal_date: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'FusionWare',
        domain: 'fusionware.com',
        industry: 'Technology',
        health_score: 58,
        current_arr: 97000,
        renewal_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'Dynamic Ventures',
        domain: 'dynamicventures.com',
        industry: 'Retail',
        health_score: 49,
        current_arr: 130000,
        renewal_date: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        name: 'Prime Holdings',
        domain: 'primeholdings.com',
        industry: 'Logistics',
        health_score: 83,
        current_arr: 410000,
        renewal_date: new Date(Date.now() + 195 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        name: 'BetaWorks',
        domain: 'betaworks.com',
        industry: 'Education',
        health_score: 61,
        current_arr: 110000,
        renewal_date: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
    
    // Step 3: Create customer properties for all 15 customers
    console.log('3. Creating customer properties...');
    const customerProperties = [
      { customer_id: '550e8400-e29b-41d4-a716-446655440001', usage_score: 92, health_score: 85, nps_score: 45, current_arr: 450000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440002', usage_score: 65, health_score: 45, nps_score: -10, current_arr: 380000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440003', usage_score: 70, health_score: 72, nps_score: 30, current_arr: 120000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440004', usage_score: 88, health_score: 92, nps_score: 60, current_arr: 750000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440005', usage_score: 50, health_score: 35, nps_score: -20, current_arr: 85000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440006', usage_score: 80, health_score: 67, nps_score: 25, current_arr: 210000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440007', usage_score: 74, health_score: 78, nps_score: 15, current_arr: 540000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440008', usage_score: 60, health_score: 55, nps_score: 5, current_arr: 305000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440009', usage_score: 85, health_score: 82, nps_score: 40, current_arr: 190000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440010', usage_score: 77, health_score: 64, nps_score: 20, current_arr: 150000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440011', usage_score: 91, health_score: 88, nps_score: 55, current_arr: 620000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440012', usage_score: 63, health_score: 58, nps_score: 10, current_arr: 97000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440013', usage_score: 57, health_score: 49, nps_score: -5, current_arr: 130000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440014', usage_score: 86, health_score: 83, nps_score: 35, current_arr: 410000 },
      { customer_id: '550e8400-e29b-41d4-a716-446655440015', usage_score: 72, health_score: 61, nps_score: 18, current_arr: 110000 }
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
    
    // Step 4: Create contacts for all 15 customers
    console.log('4. Creating contacts...');
    const contacts = [
      { id: '550e8400-e29b-41d4-a716-446655440101', first_name: 'John', last_name: 'Smith', email: 'john.smith@acmecorp.com', phone: '+1-555-0101', title: 'CTO', customer_id: '550e8400-e29b-41d4-a716-446655440001', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440102', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@riskycorp.com', phone: '+1-555-0102', title: 'VP Operations', customer_id: '550e8400-e29b-41d4-a716-446655440002', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440103', first_name: 'Michael', last_name: 'Chen', email: 'michael.chen@techstart.com', phone: '+1-555-0103', title: 'Product Manager', customer_id: '550e8400-e29b-41d4-a716-446655440003', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440104', first_name: 'Emily', last_name: 'Davis', email: 'emily.davis@globalsolutions.com', phone: '+1-555-0104', title: 'CEO', customer_id: '550e8400-e29b-41d4-a716-446655440004', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440105', first_name: 'David', last_name: 'Wilson', email: 'david.wilson@startupxyz.com', phone: '+1-555-0105', title: 'CTO', customer_id: '550e8400-e29b-41d4-a716-446655440005', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440106', first_name: 'Lisa', last_name: 'Rodriguez', email: 'lisa.rodriguez@nimbusanalytics.com', phone: '+1-555-0106', title: 'Head of Analytics', customer_id: '550e8400-e29b-41d4-a716-446655440006', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440107', first_name: 'Robert', last_name: 'Taylor', email: 'robert.taylor@venturepartners.com', phone: '+1-555-0107', title: 'Managing Partner', customer_id: '550e8400-e29b-41d4-a716-446655440007', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440108', first_name: 'Jennifer', last_name: 'Brown', email: 'jennifer.brown@horizonsystems.com', phone: '+1-555-0108', title: 'VP Technology', customer_id: '550e8400-e29b-41d4-a716-446655440008', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440109', first_name: 'Mark', last_name: 'Anderson', email: 'mark.anderson@quantumsoft.com', phone: '+1-555-0109', title: 'Lead Developer', customer_id: '550e8400-e29b-41d4-a716-446655440009', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440110', first_name: 'Amanda', last_name: 'White', email: 'amanda.white@apexmedia.com', phone: '+1-555-0110', title: 'Creative Director', customer_id: '550e8400-e29b-41d4-a716-446655440010', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440111', first_name: 'Chris', last_name: 'Martinez', email: 'chris.martinez@stellarnetworks.com', phone: '+1-555-0111', title: 'Network Engineer', customer_id: '550e8400-e29b-41d4-a716-446655440011', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440112', first_name: 'Nicole', last_name: 'Garcia', email: 'nicole.garcia@fusionware.com', phone: '+1-555-0112', title: 'Product Owner', customer_id: '550e8400-e29b-41d4-a716-446655440012', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440113', first_name: 'Kevin', last_name: 'Lee', email: 'kevin.lee@dynamicventures.com', phone: '+1-555-0113', title: 'VP Sales', customer_id: '550e8400-e29b-41d4-a716-446655440013', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440114', first_name: 'Rachel', last_name: 'Kim', email: 'rachel.kim@primeholdings.com', phone: '+1-555-0114', title: 'Operations Director', customer_id: '550e8400-e29b-41d4-a716-446655440014', is_primary: true },
      { id: '550e8400-e29b-41d4-a716-446655440115', first_name: 'Thomas', last_name: 'Jackson', email: 'thomas.jackson@betaworks.com', phone: '+1-555-0115', title: 'Education Lead', customer_id: '550e8400-e29b-41d4-a716-446655440015', is_primary: true }
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
    
    // Step 5: Create contracts for all customers
    console.log('5. Creating contracts...');
    const contracts = customers.map((customer, index) => ({
      customer_id: customer.id,
      contract_number: `${customer.name.split(' ')[0].toUpperCase()}-2024-${String(index + 1).padStart(3, '0')}`,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      arr: customer.current_arr,
      seats: Math.floor(customer.current_arr / 1000),
      contract_type: 'subscription',
      status: 'active',
      auto_renewal: true
    }));
    
    const { data: insertedContracts, error: contractsError } = await supabase
      .from('contracts')
      .insert(contracts)
      .select();
    
    if (contractsError) {
      console.error('❌ Error creating contracts:', contractsError);
      return;
    }
    console.log(`✅ Created ${insertedContracts.length} contracts\n`);
    
    // Step 6: Create renewals for all customers
    console.log('6. Creating renewals...');
    const renewals = customers.map((customer, index) => ({
      contract_id: insertedContracts[index].id,
      customer_id: customer.id,
      renewal_date: customer.renewal_date,
      current_arr: customer.current_arr,
      proposed_arr: Math.floor(customer.current_arr * 1.1), // 10% increase
      probability: Math.floor(Math.random() * 40) + 60, // 60-100%
      stage: ['discovery', 'negotiation', 'at_risk'][Math.floor(Math.random() * 3)],
      risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    }));
    
    const { data: insertedRenewals, error: renewalsError } = await supabase
      .from('renewals')
      .insert(renewals)
      .select();
    
    if (renewalsError) {
      console.error('❌ Error creating renewals:', renewalsError);
      return;
    }
    console.log(`✅ Created ${insertedRenewals.length} renewals\n`);
    
    // Step 7: Create tasks for renewals
    console.log('7. Creating tasks...');
    const tasks = insertedRenewals.map((renewal, index) => ({
      renewal_id: renewal.id,
      customer_id: renewal.customer_id,
      title: ['QBR Preparation', 'Contract Review', 'Risk Assessment', 'Feature Demo', 'Success Planning'][index % 5],
      description: `Task for ${customers.find(c => c.id === renewal.customer_id)?.name}`,
      status: ['pending', 'in_progress', 'completed'][index % 3],
      priority: ['low', 'medium', 'high'][index % 3],
      due_date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
    
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
    const events = customers.map((customer, index) => ({
      title: ['QBR Meeting', 'Renewal Discussion', 'Health Check', 'Product Demo', 'Success Planning'][index % 5],
      description: `Event for ${customer.name}`,
      event_type: ['meeting', 'call', 'demo', 'workshop'][index % 4],
      customer_id: customer.id,
      event_date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: ['scheduled', 'completed'][index % 2]
    }));
    
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
    const notes = customers.map((customer, index) => ({
      customer_id: customer.id,
      renewal_id: insertedRenewals[index]?.id,
      content: `Note for ${customer.name}: ${['Customer is satisfied', 'Need follow-up', 'Expansion opportunity', 'Risk assessment needed', 'Success planning in progress'][index % 5]}`,
      note_type: ['meeting', 'call', 'risk', 'general'][index % 4]
    }));
    
    const { data: insertedNotes, error: notesError } = await supabase
      .from('notes')
      .insert(notes)
      .select();
    
    if (notesError) {
      console.error('❌ Error creating notes:', notesError);
      return;
    }
    console.log(`✅ Created ${insertedNotes.length} notes\n`);
    
    console.log('🎉 Cloud database populated with full seed data!');
    console.log('\n📊 Full Data Summary:');
    console.log(`   Customers: ${insertedCustomers.length}`);
    console.log(`   Customer Properties: ${insertedProperties.length}`);
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

populateCloudFullSeed();


