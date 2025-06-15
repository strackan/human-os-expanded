// src/lib/supabase.ts (CLIENT ONLY - NO SERVER IMPORTS)
import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client
export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
        return cookie ? cookie.split('=')[1] : undefined
      },
      set(name: string, value: string, options: { path?: string; maxAge?: number }) {
        if (typeof document === 'undefined') return
        let cookie = `${name}=${value}`
        if (options.path) cookie += `; path=${options.path}`
        if (options.maxAge) cookie += `; max-age=${options.maxAge}`
        document.cookie = cookie
      },
      remove(name: string, options: { path?: string }) {
        if (typeof document === 'undefined') return
        document.cookie = `${name}=; max-age=0${options.path ? `; path=${options.path}` : ''}`
      },
    },
  }
)

// Basic types for our main entities
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_name?: string
  role?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  domain?: string
  industry?: string
  tier: string
  health_score: number
  nps_score?: number
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  csm_id?: string
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  customer_id: string
  contract_number?: string
  start_date: string
  end_date: string
  arr: number
  seats: number
  contract_type: string
  status: string
  auto_renewal: boolean
  terms_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Renewal {
  id: string
  contract_id: string
  customer_id: string
  renewal_date: string
  current_arr: number
  proposed_arr?: number
  probability: number
  stage: string
  risk_level: string
  expansion_opportunity: number
  assigned_to?: string
  ai_risk_score?: number
  ai_recommendations?: string
  ai_confidence?: number
  last_contact_date?: string
  next_action?: string
  next_action_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Enhanced types with relations
export type RenewalWithRelations = Renewal & {
  customer: Customer
  contract: Contract
}

export type CustomerWithRelations = Customer & {
  contracts: Contract[]
  renewals: Renewal[]
}