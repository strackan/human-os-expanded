import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Creating test customer...');
    const supabase = createClient();

    // First, check if we're authenticated and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth check:', { user, authError });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('admin')
      .eq('id', user.id)
      .single();

    console.log('Profile check:', { profile, profileError });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw profileError;
    }

    if (!profile?.admin) {
      throw new Error('User is not an admin');
    }

    // Create a test customer with the correct structure (no metadata, integer health_score)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer',
        domain: 'testcustomer.com',
        industry: 'Technology',
        tier: 'Enterprise',
        health_score: 80, // integer value
        nps_score: 9,
        primary_contact_name: 'John Doe',
        primary_contact_email: 'john@testcustomer.com',
        primary_contact_phone: '+1234567890',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      throw customerError;
    }

    console.log('Successfully created customer:', customer);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating test customer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test customer', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 