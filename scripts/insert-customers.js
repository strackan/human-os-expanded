const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Customer data from the seed file
const customers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Acme Corporation',
    domain: 'acmecorp.com',
    industry: 'Technology',
    health_score: 85,
    current_arr: 450000,
    renewal_date: '2024-08-15',
    primary_contact_name: 'John Smith',
    primary_contact_email: 'john.smith@acmecorp.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'RiskyCorp',
    domain: 'riskycorp.com',
    industry: 'Manufacturing',
    health_score: 45,
    current_arr: 380000,
    renewal_date: '2024-07-30',
    primary_contact_name: 'Sarah Johnson',
    primary_contact_email: 'sarah.johnson@riskycorp.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'TechStart Inc',
    domain: 'techstart.com',
    industry: 'SaaS',
    health_score: 72,
    current_arr: 120000,
    renewal_date: '2024-09-20',
    primary_contact_name: 'Michael Chen',
    primary_contact_email: 'michael.chen@techstart.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Global Solutions',
    domain: 'globalsolutions.com',
    industry: 'Consulting',
    health_score: 92,
    current_arr: 750000,
    renewal_date: '2024-10-05',
    primary_contact_name: 'Emily Davis',
    primary_contact_email: 'emily.davis@globalsolutions.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'StartupXYZ',
    domain: 'startupxyz.com',
    industry: 'Fintech',
    health_score: 35,
    current_arr: 85000,
    renewal_date: '2024-07-15',
    primary_contact_name: 'David Wilson',
    primary_contact_email: 'david.wilson@startupxyz.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Nimbus Analytics',
    domain: 'nimbusanalytics.com',
    industry: 'Analytics',
    health_score: 67,
    current_arr: 210000,
    renewal_date: '2024-11-12',
    primary_contact_name: 'Lisa Rodriguez',
    primary_contact_email: 'lisa.rodriguez@nimbusanalytics.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Venture Partners',
    domain: 'venturepartners.com',
    industry: 'Finance',
    health_score: 78,
    current_arr: 540000,
    renewal_date: '2024-12-01',
    primary_contact_name: 'Robert Taylor',
    primary_contact_email: 'robert.taylor@venturepartners.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Horizon Systems',
    domain: 'horizonsystems.com',
    industry: 'Healthcare',
    health_score: 55,
    current_arr: 305000,
    renewal_date: '2024-06-25',
    primary_contact_name: 'Jennifer Brown',
    primary_contact_email: 'jennifer.brown@horizonsystems.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'Quantum Soft',
    domain: 'quantumsoft.com',
    industry: 'Software',
    health_score: 82,
    current_arr: 190000,
    renewal_date: '2024-09-10',
    primary_contact_name: 'Mark Anderson',
    primary_contact_email: 'mark.anderson@quantumsoft.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Apex Media',
    domain: 'apexmedia.com',
    industry: 'Media',
    health_score: 64,
    current_arr: 150000,
    renewal_date: '2024-08-05',
    primary_contact_name: 'Amanda White',
    primary_contact_email: 'amanda.white@apexmedia.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Stellar Networks',
    domain: 'stellarnetworks.com',
    industry: 'Telecom',
    health_score: 88,
    current_arr: 620000,
    renewal_date: '2024-10-22',
    primary_contact_name: 'Chris Martinez',
    primary_contact_email: 'chris.martinez@stellarnetworks.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'FusionWare',
    domain: 'fusionware.com',
    industry: 'Technology',
    health_score: 58,
    current_arr: 97000,
    renewal_date: '2024-07-08',
    primary_contact_name: 'Nicole Garcia',
    primary_contact_email: 'nicole.garcia@fusionware.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: 'Dynamic Ventures',
    domain: 'dynamicventures.com',
    industry: 'Retail',
    health_score: 49,
    current_arr: 130000,
    renewal_date: '2024-11-30',
    primary_contact_name: 'Kevin Lee',
    primary_contact_email: 'kevin.lee@dynamicventures.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    name: 'Prime Holdings',
    domain: 'primeholdings.com',
    industry: 'Logistics',
    health_score: 83,
    current_arr: 410000,
    renewal_date: '2024-12-15',
    primary_contact_name: 'Rachel Kim',
    primary_contact_email: 'rachel.kim@primeholdings.com'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    name: 'BetaWorks',
    domain: 'betaworks.com',
    industry: 'Education',
    health_score: 61,
    current_arr: 110000,
    renewal_date: '2024-09-05',
    primary_contact_name: 'Thomas Jackson',
    primary_contact_email: 'thomas.jackson@betaworks.com'
  }
];

// Contact data
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
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440104',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@globalsolutions.com',
    phone: '+1-555-0104',
    title: 'CEO',
    customer_id: '550e8400-e29b-41d4-a716-446655440004',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440105',
    first_name: 'David',
    last_name: 'Wilson',
    email: 'david.wilson@startupxyz.com',
    phone: '+1-555-0105',
    title: 'CTO',
    customer_id: '550e8400-e29b-41d4-a716-446655440005',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440106',
    first_name: 'Lisa',
    last_name: 'Rodriguez',
    email: 'lisa.rodriguez@nimbusanalytics.com',
    phone: '+1-555-0106',
    title: 'Head of Analytics',
    customer_id: '550e8400-e29b-41d4-a716-446655440006',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440107',
    first_name: 'Robert',
    last_name: 'Taylor',
    email: 'robert.taylor@venturepartners.com',
    phone: '+1-555-0107',
    title: 'Managing Partner',
    customer_id: '550e8400-e29b-41d4-a716-446655440007',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440108',
    first_name: 'Jennifer',
    last_name: 'Brown',
    email: 'jennifer.brown@horizonsystems.com',
    phone: '+1-555-0108',
    title: 'VP Technology',
    customer_id: '550e8400-e29b-41d4-a716-446655440008',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440109',
    first_name: 'Mark',
    last_name: 'Anderson',
    email: 'mark.anderson@quantumsoft.com',
    phone: '+1-555-0109',
    title: 'Lead Developer',
    customer_id: '550e8400-e29b-41d4-a716-446655440009',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440110',
    first_name: 'Amanda',
    last_name: 'White',
    email: 'amanda.white@apexmedia.com',
    phone: '+1-555-0110',
    title: 'Creative Director',
    customer_id: '550e8400-e29b-41d4-a716-446655440010',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440111',
    first_name: 'Chris',
    last_name: 'Martinez',
    email: 'chris.martinez@stellarnetworks.com',
    phone: '+1-555-0111',
    title: 'Network Engineer',
    customer_id: '550e8400-e29b-41d4-a716-446655440011',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440112',
    first_name: 'Nicole',
    last_name: 'Garcia',
    email: 'nicole.garcia@fusionware.com',
    phone: '+1-555-0112',
    title: 'Product Owner',
    customer_id: '550e8400-e29b-41d4-a716-446655440012',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440113',
    first_name: 'Kevin',
    last_name: 'Lee',
    email: 'kevin.lee@dynamicventures.com',
    phone: '+1-555-0113',
    title: 'VP Sales',
    customer_id: '550e8400-e29b-41d4-a716-446655440013',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440114',
    first_name: 'Rachel',
    last_name: 'Kim',
    email: 'rachel.kim@primeholdings.com',
    phone: '+1-555-0114',
    title: 'Operations Director',
    customer_id: '550e8400-e29b-41d4-a716-446655440014',
    is_primary: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440115',
    first_name: 'Thomas',
    last_name: 'Jackson',
    email: 'thomas.jackson@betaworks.com',
    phone: '+1-555-0115',
    title: 'Education Lead',
    customer_id: '550e8400-e29b-41d4-a716-446655440015',
    is_primary: true
  }
];

async function insertCustomers() {
  try {
    console.log('Checking if tables exist...');
    
    // Check if customers table exists
    const { data: customersCheck, error: customersCheckError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (customersCheckError) {
      console.error('Error checking customers table:', customersCheckError);
      console.error('Details:', JSON.stringify(customersCheckError, null, 2));
      return;
    }
    
    console.log('✅ Customers table exists');
    
    // Check if contacts table exists
    const { data: contactsCheck, error: contactsCheckError } = await supabase
      .from('contacts')
      .select('count')
      .limit(1);
    
    if (contactsCheckError) {
      console.error('Error checking contacts table:', contactsCheckError);
      console.error('Details:', JSON.stringify(contactsCheckError, null, 2));
      return;
    }
    
    console.log('✅ Contacts table exists');
    
    console.log('Inserting customers...');
    
    // Insert customers
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select();
    
    if (customersError) {
      console.error('Error inserting customers:', customersError);
      console.error('Details:', JSON.stringify(customersError, null, 2));
      return;
    }
    
    console.log(`✅ Successfully inserted ${customersData.length} customers`);
    
    // Insert contacts
    console.log('Inserting contacts...');
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();
    
    if (contactsError) {
      console.error('Error inserting contacts:', contactsError);
      console.error('Details:', JSON.stringify(contactsError, null, 2));
      return;
    }
    
    console.log(`✅ Successfully inserted ${contactsData.length} contacts`);
    console.log('✅ All 15 customers and their contacts have been inserted into the database!');
    
  } catch (error) {
    console.error('Error inserting data:', error);
    console.error('Details:', JSON.stringify(error, null, 2));
  }
}

insertCustomers();
