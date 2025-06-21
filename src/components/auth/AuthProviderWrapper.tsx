// src/components/auth/AuthProviderWrapper.tsx (SERVER COMPONENT)
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AuthProvider from './AuthProvider'

export default async function AuthProviderWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  console.log('🔐 Server AuthProviderWrapper - User:', {
    hasUser: !!user,
    userEmail: user?.email
  })
  
  return <AuthProvider initialUser={user}>{children}</AuthProvider>
} 