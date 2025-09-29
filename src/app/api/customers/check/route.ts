import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Checking customers table...');
    const supabase = createClient();

    // First, get the table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('customers')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('Error checking table structure:', tableError);
      throw tableError;
    }

    // Then, get all customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      throw customersError;
    }

    return NextResponse.json({
      tableStructure: tableInfo,
      customers: customers,
      count: customers?.length || 0
    });
  } catch (error) {
    console.error('Error checking customers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check customers', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 