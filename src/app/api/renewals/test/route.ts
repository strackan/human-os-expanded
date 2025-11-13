import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    // 1. Authenticate user
    const supabase = createServiceRoleClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 403 })
    }

    // 3. Use existing "Test Customer" for this company or create one
    const { data: c1 } = await supabase
      .from('customers')
      .select('id')
      .eq('name', 'Test Customer')
      .eq('company_id', profile.company_id)
      .maybeSingle()

    let customerId = c1?.id as string | undefined
    if (!customerId) {
      const { data: created, error: createCustErr } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer',
          domain: 'testcustomer.com',
          company_id: profile.company_id
        })
        .select()
        .single()
      if (createCustErr) return NextResponse.json({ step: 'create_customer', ...createCustErr }, { status: 500 })
      customerId = created.id
    }

    // 4. Create a contract
    const start = new Date(), end = new Date(start.getTime() + 365*24*3600*1000)
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        customer_id: customerId,
        contract_number: `TEST-${Date.now()}`,
        start_date: start.toISOString().slice(0,10),
        end_date: end.toISOString().slice(0,10),
        arr: 50000,
        seats: 100,
        contract_type: 'subscription',
        status: 'active',
        auto_renewal: true,
      })
      .select()
      .single()
    if (contractError) return NextResponse.json({ step: 'insert_contract', ...contractError }, { status: 500 })

    // 5. Create a renewal in 30 days
    const renewalDate = new Date()
    renewalDate.setDate(renewalDate.getDate() + 30)
    const { data: renewal, error: renewalError } = await supabase
      .from('renewals')
      .insert({
        contract_id: contract.id,
        customer_id: customerId,
        renewal_date: renewalDate.toISOString().slice(0,10),
        current_arr: 50000,
        proposed_arr: 55000,
        probability: 75,
        stage: 'negotiation',
        risk_level: 'medium',
        expansion_opportunity: 10000,
      })
      .select()
      .single()
    if (renewalError) return NextResponse.json({ step: 'insert_renewal', ...renewalError }, { status: 500 })

    return NextResponse.json({ contract, renewal })
  } catch (e) {
    return NextResponse.json({
      error: 'Failed to create test renewal',
      details: (e as any)?.message || String(e)
    }, { status: 500 })
  }
}
