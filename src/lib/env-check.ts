export function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLocal = supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost')
  
  if (isLocal) {
    console.log('🏠 Local development mode detected')
    console.log('📝 Make sure Google OAuth redirect URIs include:')
    console.log('   - http://127.0.0.1:3000/api/auth/callback')
    console.log('   - http://localhost:3000/api/auth/callback')
    console.log('📝 Remove any remote Supabase callback URLs from Google OAuth config')
    console.log('🔗 Current Supabase URL:', supabaseUrl)
  }
  
  return { isLocal, supabaseUrl }
} 