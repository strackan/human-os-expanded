import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    console.log('Starting debug check...');
    
    // Try both server client and service role client
    const serverClient = await createServerSupabaseClient();
    const serviceRoleClient = createServiceRoleClient();

    // Test 1: Server client customers query
    console.log('Test 1: Server client customers query');
    const { data: serverCustomers, error: serverCustomersError } = await serverClient
      .from('customers')
      .select('*')
      .limit(5);

    console.log('Server client customers found:', serverCustomers?.length || 0);
    if (serverCustomersError) {
      console.error('Server customers query error:', serverCustomersError);
    }

    // Test 2: Service role client customers query
    console.log('Test 2: Service role client customers query');
    const { data: serviceCustomers, error: serviceCustomersError } = await serviceRoleClient
      .from('customers')
      .select('*')
      .limit(5);

    console.log('Service role customers found:', serviceCustomers?.length || 0);
    if (serviceCustomersError) {
      console.error('Service role customers query error:', serviceCustomersError);
    }

    // Test 3: Check if contacts table exists
    console.log('Test 3: Contacts query');
    const { data: contacts, error: contactsError } = await serviceRoleClient
      .from('contacts')
      .select('*')
      .limit(5);

    if (contactsError) {
      console.error('Contacts query error:', contactsError);
    }

    // Test 4: Check table schema
    console.log('Test 4: Check customer properties');
    const { data: properties, error: propertiesError } = await serviceRoleClient
      .from('customer_properties')
      .select('*')
      .limit(5);

    if (propertiesError) {
      console.error('Properties query error:', propertiesError);
    }

    return NextResponse.json({
      success: true,
      serverClient: {
        customers: serverCustomers || [],
        customersCount: serverCustomers?.length || 0,
        error: serverCustomersError?.message || null
      },
      serviceRoleClient: {
        customers: serviceCustomers || [],
        customersCount: serviceCustomers?.length || 0,
        error: serviceCustomersError?.message || null
      },
      contacts: contacts || [],
      contactsCount: contacts?.length || 0,
      properties: properties || [],
      propertiesCount: properties?.length || 0,
      errors: {
        contacts: contactsError?.message || null,
        properties: propertiesError?.message || null
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json(
      { 
        error: 'Debug check failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
