#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function addTestData() {
  console.log('🌱 Adding test customer data...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Add a test customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: 'Acme Corporation',
        domain: 'acmecorp.com',
        industry: 'Technology',
        health_score: 85,
        current_arr: 450000,
        renewal_date: '2024-08-15',
        primary_contact_name: 'John Smith',
        primary_contact_email: 'john.smith@acmecorp.com'
      })
      .select()
      .single();

    if (customerError) {
      console.log('❌ Error creating customer:', customerError.message);
      return;
    }

    console.log('✅ Created customer:', customer.name);

    // Add a contact for this customer
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@acmecorp.com',
        phone: '+1-555-0101',
        title: 'CTO',
        customer_id: customer.id,
        is_primary: true
      })
      .select()
      .single();

    if (contactError) {
      console.log('❌ Error creating contact:', contactError.message);
      return;
    }

    console.log('✅ Created contact:', `${contact.first_name} ${contact.last_name}`);

    // Add another test customer
    const { data: customer2, error: customer2Error } = await supabase
      .from('customers')
      .insert({
        name: 'RiskyCorp',
        domain: 'riskycorp.com',
        industry: 'Manufacturing',
        health_score: 45,
        current_arr: 380000,
        renewal_date: '2024-07-30',
        primary_contact_name: 'Sarah Johnson',
        primary_contact_email: 'sarah.johnson@riskycorp.com'
      })
      .select()
      .single();

    if (customer2Error) {
      console.log('❌ Error creating second customer:', customer2Error.message);
      return;
    }

    console.log('✅ Created customer:', customer2.name);

    // Add a contact for the second customer
    const { data: contact2, error: contact2Error } = await supabase
      .from('contacts')
      .insert({
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@riskycorp.com',
        phone: '+1-555-0102',
        title: 'VP Operations',
        customer_id: customer2.id,
        is_primary: true
      })
      .select()
      .single();

    if (contact2Error) {
      console.log('❌ Error creating second contact:', contact2Error.message);
      return;
    }

    console.log('✅ Created contact:', `${contact2.first_name} ${contact2.last_name}`);

    console.log('\n✅ Test data added successfully!');

  } catch (error) {
    console.log('❌ Failed to add test data:', error.message);
  }
}

addTestData().catch(console.error);
