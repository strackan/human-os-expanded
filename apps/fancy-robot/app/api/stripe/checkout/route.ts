import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { stripe, PRICE_IDS, type PriceKey } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { priceKey } = (await request.json()) as { priceKey: PriceKey }

    if (!PRICE_IDS[priceKey]) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const serviceClient = getSupabaseServer()
    if (!serviceClient) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    // Get or create Stripe customer
    const { data: profile } = await serviceClient
      .schema('fancyrobot')
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await serviceClient
        .schema('fancyrobot')
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // One-time purchases use payment mode; everything else is subscription
    const isOneTime = priceKey === 'elite_adhoc' || priceKey === 'article'

    const origin = request.headers.get('origin') || 'http://localhost:4200'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: PRICE_IDS[priceKey], quantity: 1 }],
      mode: isOneTime ? 'payment' : 'subscription',
      success_url: `${origin}/new-site/dashboard?checkout=success`,
      cancel_url: `${origin}/new-site/pricing?checkout=canceled`,
      metadata: {
        supabase_user_id: user.id,
        price_key: priceKey,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
