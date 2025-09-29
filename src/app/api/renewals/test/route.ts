import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'

function makeDevServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseJsClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
}
async function makeProdSSRClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSSRClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
    },
  })
}

export async function POST() {
  try {
    const supabase = process.env.NODE_ENV === 'development' ? makeDevServiceClient() : await makeProdSSRClient()

    // Use existing “Test Customer” (avoid UNIQUE(name) collisions)
    const { data: c1 } = await supabase.from('customers').select('id').eq('name','Test Customer').maybeSingle()
    let customerId = c1?.id as string | undefined
    if (!customerId) {
      const { data: created, error: createCustErr } = await supabase
        .from('customers')
        .upsert({ name: 'Test Customer', domain: 'testcustomer.com' }, { onConflict: 'name' })
        .select().single()
      if (createCustErr) return NextResponse.json({ step:'create_customer', ...createCustErr }, { status: 500 })
      customerId = created.id
    }

    // Create a contract
    const start = new Date(), end = new Date(start.getTime() + 365*24*3600*1000)
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        customer_id: customerId,
        contract_number: `TEST-${Date.now()}`, // if UNIQUE, this ensures uniqueness
        start_date: start.toISOString().slice(0,10),
        end_date: end.toISOString().slice(0,10),
        arr: 50000, seats: 100, contract_type: 'subscription', status: 'active', auto_renewal: true,
      })
      .select().single()
    if (contractError) return NextResponse.json({ step:'insert_contract', ...contractError }, { status: 500 })

    // Create a renewal in 30 days
    const renewalDate = new Date(); renewalDate.setDate(renewalDate.getDate() + 30)
    const { data: renewal, error: renewalError } = await supabase
      .from('renewals')
      .insert({
        contract_id: contract.id,
        customer_id: customerId,
        renewal_date: renewalDate.toISOString().slice(0,10),
        current_arr: 50000, proposed_arr: 55000, probability: 75,
        stage: 'negotiation', risk_level: 'medium', expansion_opportunity: 10000,
      })
      .select().single()
    if (renewalError) return NextResponse.json({ step:'insert_renewal', ...renewalError }, { status: 500 })

    return NextResponse.json({ contract, renewal })
  } catch (e) {
    return NextResponse.json({ error:'Failed to create test renewal', details: (e as any)?.message || String(e) }, { status: 500 })
  }
}
