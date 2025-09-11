// src/app/api/customers/test/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'

function makeDevServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !service) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  // Service-role client (bypasses cookies/session + RLS)
  return createSupabaseJsClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function makeProdSSRClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createSSRClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
      },
    },
  })
}

export async function POST() {
  try {
    const supabase = process.env.NODE_ENV === 'development'
      ? makeDevServiceClient()
      : await makeProdSSRClient()

    // Minimal customer insert that matches your schema (no tier/primary_contact_*)
  // replace the insert() block with this:
const { data: customer, error: customerError } = await supabase
.from('customers')
.upsert(
  { name: 'Test Customer', domain: 'testcustomer.com' }, 
  { onConflict: 'name' }             // ← respect UNIQUE(name)
)
.select()
.single()


    if (customerError) {
      console.error('Error creating customer:', customerError)
      return NextResponse.json({ error: customerError.message }, { status: 500 })
    }

    // Your schema has customer_properties – seed some baseline scores there
    const { error: propsError } = await supabase
      .from('customer_properties')
      .insert({
        customer_id: customer.id,
        usage_score: 80,
        health_score: 75,
        nps_score: 9,
        current_arr: 50000,
        revenue_impact_tier: 3,
        churn_risk_score: 2,
      })

    if (propsError) {
      console.error('Error creating customer_properties:', propsError)
      return NextResponse.json({ error: propsError.message }, { status: 500 })
    }

    return NextResponse.json({ customer })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Error creating test customer:', e)
    return NextResponse.json({ error: 'Failed to create test customer', details: msg }, { status: 500 })
  }
}

/*
TODO (production hardening):
- Re-enable admin/role checks when using the SSR (session-bound) client in prod.
- Keep service-role path behind NODE_ENV==='development' or an explicit env flag.
*/
