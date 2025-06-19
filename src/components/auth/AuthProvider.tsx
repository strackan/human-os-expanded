// src/components/auth/AuthProvider.tsx (rename from vider.tsx)
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase' // ← Only imports client-side code
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('📝 Initial session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          sessionExpiry: session?.expires_at,
          currentTime: Math.floor(Date.now() / 1000),
          error: error?.message
        })
        
        if (!mounted) return

        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 User found, fetching profile...')
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            console.error('❌ Profile fetch error:', profileError.message)
          } else {
            console.log('✅ Profile fetched:', profile)
          }
          
          if (mounted) {
            setProfile(profile)
          }
        } else {
          console.log('👤 No user found in initial session')
        }
      } catch (error) {
        console.error('❌ Session error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('🏁 Initial session loading complete')
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          sessionExpiry: session?.expires_at,
          currentTime: Math.floor(Date.now() / 1000)
        })
        
        if (!mounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            console.log('📝 User metadata:', session.user.user_metadata)
            const { data: profile, error } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata.full_name || 
                          session.user.user_metadata.name || 
                          session.user.user_metadata.given_name,
                avatar_url: session.user.user_metadata.avatar_url,
                updated_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (!error && mounted) {
              console.log('✅ Profile updated:', profile)
              setProfile(profile)
            } else if (error) {
              console.error('❌ Profile update error:', error.message)
            }
          } catch (error) {
            console.error('❌ Profile error:', error)
          }
        } else {
          console.log('👤 User signed out, clearing profile')
          if (mounted) {
            setProfile(null)
          }
        }
        
        if (mounted) {
          setLoading(false)
          console.log('🏁 Auth state change complete')
        }
      }
    )

    return () => {
      mounted = false
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}