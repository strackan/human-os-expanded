import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Starting test renewal creation...');
    const supabase = createClient();

    // Get a random customer from the customers table
    console.log('Fetching a random customer...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1)
      .single();

    if (customerError) {
      console.error('Error finding customer:', customerError);
      throw customerError;
    }

    if (!customer) {
      console.error('No customers found');
      throw new Error('No customers found');
    }

    console.log('Found customer:', customer);

    // Create a test renewal for the customer
    console.log('Creating renewal for customer:', customer.id);
    const { data: renewal, error: renewalError } = await supabase
      .from('renewals')
      .insert({
        customer_id: customer.id,
        product_name: 'Enterprise License',
        current_value: 50000,
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'active',
        metadata: { 
          test: true,
          product_type: 'Software License',
          seats: 100,
          term_length: 'Annual'
        }
      })
      .select()
      .single();

    if (renewalError) {
      console.error('Error creating renewal:', renewalError);
      throw renewalError;
    }

    console.log('Successfully created renewal:', renewal);
    return NextResponse.json(renewal);
  } catch (error) {
    console.error('Detailed error creating test renewal:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test renewal', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 