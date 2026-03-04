import { createClient } from '@/lib/supabase/server'

export async function getUserPlan() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { plan: null as null, user: null as null }

  const { data: profile } = await supabase
    .schema('fancyrobot')
    .from('profiles')
    .select('plan, billing_interval, stripe_customer_id')
    .eq('id', user.id)
    .single()

  return {
    plan: (profile?.plan || 'free') as 'free' | 'pro',
    billingInterval: profile?.billing_interval as 'monthly' | 'annual' | null,
    hasStripe: !!profile?.stripe_customer_id,
    user,
  }
}
