import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key to bypass RLS temporarily
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    console.log('Testing data access...')
    
    // Test direct data access
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      
    const { data: renewals, error: renewalsError } = await supabase
      .from('renewals')
      .select('*')
    
    return NextResponse.json({
      companies: { data: companies, error: companiesError },
      customers: { data: customers, error: customersError },
      renewals: { data: renewals, error: renewalsError }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}