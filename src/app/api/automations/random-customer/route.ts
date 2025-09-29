import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get a random customer from the database
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, renewal_date')
      .not('renewal_date', 'is', null)
      .limit(10) // Get 10 customers and pick random one for better randomness
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customers', details: error.message },
        { status: 500 }
      )
    }
    
    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { error: 'No customers found with renewal dates' },
        { status: 404 }
      )
    }
    
    // Pick a random customer from the results
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)]
    
    return NextResponse.json({
      success: true,
      customer: randomCustomer,
      total_available: customers.length
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}