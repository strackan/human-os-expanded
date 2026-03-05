import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}

/** @deprecated Use getStripe() — kept for backward compat */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop]
  },
})

export const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  elite_adhoc: process.env.STRIPE_PRICE_ELITE_ADHOC!,
  elite_annual: process.env.STRIPE_PRICE_ELITE_ANNUAL!,
  elite_monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY!,
  article: process.env.STRIPE_PRICE_ARTICLE!,
} as const

export type PriceKey = keyof typeof PRICE_IDS
