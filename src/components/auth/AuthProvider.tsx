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

  // Helper function to handle profile updates
  const handleProfileUpdate = async (user: User) => {
    try {
      console.log('📝 Updating profile for user:', user.id)
      
      // First get the existing profile to preserve company_id
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name || 
                    user.user_metadata.name || 
                    user.user_metadata.given_name,
          avatar_url: user.user_metadata.avatar_url,
          company_id: existingProfile?.company_id, // Preserve existing company_id
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Profile update error:', error.message)
      } else {
        console.log('✅ Profile updated:', profile)
        setProfile(profile)
      }
    } catch (error) {
      console.error('❌ Profile error:', error)
    }
  }

  useEffect(() => {
    let mounted = true
    console.log('🔐 AuthProvider mounted')

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('📥 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, skipping session update')
          return
        }

        if (error) {
          console.error('❌ Session error:', error.message)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        console.log('📝 Session state:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        })

        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 Fetching user profile...')
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            console.error('❌ Profile fetch error:', profileError.message)
          } else {
            console.log('✅ Profile fetched:', profile)
            setProfile(profile)
          }
        }
      } catch (error) {
        console.error('❌ Session error:', error)
      } finally {
        if (mounted) {
          console.log('✅ Setting loading to false')
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes - CRITICAL: No async calls in callback!
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', { 
          event, 
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        })
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, skipping auth state update')
          return
        }
        
        // Immediate sync operations
        setUser(session?.user ?? null)
        
        // Defer async operations
        if (session?.user) {
          setTimeout(() => {
            handleProfileUpdate(session.user)
          }, 0)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [supabase])

  // Debug log for state changes
  useEffect(() => {
    console.log('🔄 Auth state updated:', {
      hasUser: !!user,
      hasProfile: !!profile,
      loading,
      userId: user?.id,
      userEmail: user?.email
    })
  }, [user, profile, loading])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}