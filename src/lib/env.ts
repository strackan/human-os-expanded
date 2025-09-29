// src/lib/env.ts
import { config } from 'dotenv'

// Load environment variables from .env.local first, then .env
config({ path: '.env.local' })
config({ path: '.env' })

// Validate required environment variables
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID,
  SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
}

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

requiredEnvVars.forEach(varName => {
  if (!env[varName as keyof typeof env]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
})

export default env
