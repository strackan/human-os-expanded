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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setProfile(profile)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'signed out')
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Create or update profile on sign in
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata.full_name,
                avatar_url: session.user.user_metadata.avatar_url,
                updated_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (!error) {
              setProfile(profile)
            } else {
              console.error('Error upserting profile:', error)
            }
          } catch (error) {
            console.error('Error handling profile:', error)
          }
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}