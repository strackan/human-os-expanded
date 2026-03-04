import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  elite_adhoc: process.env.STRIPE_PRICE_ELITE_ADHOC!,
  elite_annual: process.env.STRIPE_PRICE_ELITE_ANNUAL!,
} as const

export type PriceKey = keyof typeof PRICE_IDS
