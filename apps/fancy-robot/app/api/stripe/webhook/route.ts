import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseServer } from '@/lib/supabase-server'
import type Stripe from 'stripe'

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subDetails = invoice.parent?.subscription_details
  if (!subDetails) return null
  const sub = subDetails.subscription
  return typeof sub === 'string' ? sub : sub?.id ?? null
}

function getSubPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0]
  return {
    start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
  }
}

/**
 * Check if we've already processed this event. If not, record it.
 * Returns true if the event is a duplicate (already processed).
 */
async function isDuplicateEvent(
  db: ReturnType<NonNullable<ReturnType<typeof getSupabaseServer>>['schema']>,
  eventId: string,
  eventType: string,
): Promise<boolean> {
  const { data: existing } = await db
    .from('stripe_webhook_events')
    .select('event_id')
    .eq('event_id', eventId)
    .maybeSingle()

  if (existing) return true

  await db.from('stripe_webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
  })

  return false
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const serviceClient = getSupabaseServer()
  if (!serviceClient) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const db = serviceClient.schema('fancyrobot')

  // Idempotency check — skip if we've already processed this event
  if (await isDuplicateEvent(db, event.id, event.type)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const priceKey = session.metadata?.price_key
        if (!userId) break

        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = sub.items.data[0]?.price.id
          const period = getSubPeriod(sub)

          await db.from('subscriptions').upsert({
            stripe_subscription_id: sub.id,
            user_id: userId,
            stripe_price_id: priceId,
            status: sub.status,
            current_period_start: period.start,
            current_period_end: period.end,
            cancel_at_period_end: sub.cancel_at_period_end,
          }, { onConflict: 'stripe_subscription_id' })

          const isAnnual = priceKey?.includes('annual')
          await db.from('profiles').update({
            plan: 'pro',
            billing_interval: isAnnual ? 'annual' : 'monthly',
          }).eq('id', userId)
        } else if (session.mode === 'payment') {
          await db.from('elite_runs').insert({
            user_id: userId,
            primary_domain: session.metadata?.domain || '',
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'paid',
          })
        }
        break
      }

      case 'checkout.session.expired': {
        // Clean up any pre-created records for abandoned checkouts
        const expired = event.data.object as Stripe.Checkout.Session
        if (expired.mode === 'payment' && expired.payment_intent) {
          await db.from('elite_runs').delete()
            .eq('stripe_payment_intent_id', expired.payment_intent as string)
            .eq('status', 'pending')
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id
        const period = getSubPeriod(sub)

        await db.from('subscriptions').upsert({
          stripe_subscription_id: sub.id,
          user_id: userId,
          stripe_price_id: sub.items.data[0]?.price.id,
          status: sub.status,
          current_period_start: period.start,
          current_period_end: period.end,
          cancel_at_period_end: sub.cancel_at_period_end,
        }, { onConflict: 'stripe_subscription_id' })

        if (userId && (sub.status === 'past_due' || sub.status === 'unpaid')) {
          // Keep pro but mark status — don't immediately downgrade
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id

        await db.from('subscriptions').update({
          status: 'canceled',
        }).eq('stripe_subscription_id', sub.id)

        if (userId) {
          await db.from('profiles').update({
            plan: 'free',
            billing_interval: null,
          }).eq('id', userId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = getInvoiceSubscriptionId(invoice)
        if (subId) {
          await db.from('subscriptions').update({
            status: 'past_due',
          }).eq('stripe_subscription_id', subId)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subId2 = getInvoiceSubscriptionId(invoice)
        if (subId2) {
          await db.from('subscriptions').update({
            status: 'active',
          }).eq('stripe_subscription_id', subId2)
        }
        break
      }
    }
  } catch (err) {
    console.error(`Webhook processing error [${event.type}]:`, err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
