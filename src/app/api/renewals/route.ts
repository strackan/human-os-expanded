// /src/app/api/renewals/route.ts - SECURED with multi-tenant isolation
import { NextResponse } from 'next/server'
import { getAuthenticatedClient, getUserCompanyId } from '@/lib/supabase-server'

export async function GET() {
  try {
    // 1. Authenticate user and get client (with RLS bypass in demo mode)
    const { user, supabase, error: authError } = await getAuthenticatedClient()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user's company_id from profiles
    const companyId = await getUserCompanyId(user.id, supabase)

    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 403 })
    }

    // 3. Get renewals for customers that belong to user's company
    const { data, error } = await supabase
      .from('renewals')
      .select(`
        *,
        customers!inner (
          id,
          name,
          industry,
          health_score,
          company_id
        ),
        contracts (
          contract_number,
          arr
        )
      `)
      .eq('customers.company_id', companyId)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json(data || [])
  } catch (error: unknown) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// temporary shim: if anything issues POST, reuse GET so you don't get 405s
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: Request) {
  return GET();
}