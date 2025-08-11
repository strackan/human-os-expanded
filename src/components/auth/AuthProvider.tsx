// src/components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/supabase'
import { SessionPersistence } from '@/lib/session-persistence'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: (scope?: 'global' | 'local' | 'others') => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

// Create supabase client outside component to prevent infinite re-renders
const supabase = createClient()

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing session with timeout...')
      
      // Add timeout to prevent hanging
      const refreshPromise = supabase.auth.refreshSession()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session refresh timeout')), 5000)
      )
      
      const result = await Promise.race([refreshPromise, timeoutPromise])
      const { data, error } = result as any
      
      if (error) {
        console.error('❌ Session refresh failed:', error)
        throw error
      }
      
      if (data.session) {
        console.log('✅ Session refreshed successfully')
        setUser(data.session.user)
        await fetchAndUpdateProfile(data.session.user)
      } else {
        console.log('⚠️ No session after refresh')
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.log('⚠️ Session refresh timeout/error, clearing session:', error)
      setUser(null)
      setProfile(null)
    }
  }

  const fetchAndUpdateProfile = async (currentUser: User) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      
      if (!profileError && profile) {
        console.log('✅ Profile fetched:', profile)
        setProfile(profile)
      } else {
        console.log('⚠️ Profile error:', profileError?.message)
        // Create profile if it doesn't exist
        if (profileError?.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: currentUser.id,
              email: currentUser.email!,
              full_name: currentUser.user_metadata.full_name || 
                        currentUser.user_metadata.name || 
                        currentUser.user_metadata.given_name,
              avatar_url: currentUser.user_metadata.avatar_url,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()
          
          if (!createError && newProfile) {
            console.log('✅ Profile created:', newProfile)
            setProfile(newProfile)
          } else {
            console.error('❌ Profile creation failed:', createError)
          }
        }
      }
    } catch (error) {
      console.error('❌ Profile fetch/update failed:', error)
      setProfile(null)
    }
  }

  const signOut = async (scope: 'global' | 'local' | 'others' = 'global') => {
    try {
      console.log('🔐 Signing out...', { scope })
      
      // Clear local state and session backup first
      console.log('🔐 Clearing local state and session backup...')
      setUser(null)
      setProfile(null)
      SessionPersistence.clearSessionData()
      console.log('✅ Local state and session backup cleared')
      
      // Call client-side signout with scope and timeout
      console.log('🔐 Calling Supabase auth.signOut...')
      
      try {
        // Add a timeout to prevent hanging
        const signoutPromise = supabase.auth.signOut({ scope })
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Signout timeout')), 3000)
        )
        
        const { error } = await Promise.race([signoutPromise, timeoutPromise]) as { error: unknown }
        
        if (error) {
          console.error('❌ Client-side signout error:', error)
          // Don't throw error, continue with server-side signout
        } else {
          console.log('✅ Supabase signout successful')
        }
      } catch (signoutError) {
        console.warn('⚠️ Supabase signout failed or timed out, continuing with server-side signout:', signoutError)
      }
      
      console.log('✅ Client-side sign out complete')
      
      // Use fetch to trigger server-side signout
      console.log('🔐 Calling server-side signout...')
      if (typeof window !== 'undefined') {
        try {
          const response = await fetch('/signout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            console.log('✅ Server-side signout successful')
            // The server will handle the redirect
          } else {
            console.warn('⚠️ Server-side signout failed, falling back to direct redirect')
            window.location.href = '/signin'
          }
          
        } catch (fetchError) {
          console.warn('⚠️ Fetch to server-side signout failed, falling back to direct redirect:', fetchError)
          // Fallback to direct redirect
          window.location.href = '/signin'
        }
      }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // Even if there's an error, redirect to signin
      console.log('🔐 Redirecting to signin page due to error...')
      if (typeof window !== 'undefined') {
        try {
          window.location.href = '/signin'
        } catch (redirectError) {
          console.warn('⚠️ window.location.href failed, trying alternative redirect:', redirectError)
          // Fallback: try to use Next.js router if available
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', '/signin')
            window.location.reload()
          }
        }
      }
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial user via auth refresh API to prevent hanging
    const getInitialUser = async () => {
      try {
        console.log('🔍 Getting initial user with timeout...')
        
        // First try to restore from backup if available
        if (SessionPersistence.isSessionBackupAvailable()) {
          console.log('🔄 Session backup found, attempting restoration...')
          const restored = await SessionPersistence.restoreSession(supabase)
          if (restored) {
            // Session restored, get the fresh session data
            const { data: { session } } = await supabase.auth.getSession()
            if (session && mounted) {
              setUser(session.user)
              await fetchAndUpdateProfile(session.user)
              setLoading(false)
              return
            }
          }
        }
        
        // Add timeout to prevent hanging on getSession
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initial session check timeout')), 3000)
        )
        
        const result = await Promise.race([sessionPromise, timeoutPromise])
        const { data: { session }, error: sessionError } = result as any
        
        if (!session || sessionError) {
          console.log('👤 No session found locally')
          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }
        
        // Save successful session for future restoration
        SessionPersistence.saveSessionData(session.user, session)
        
        // Trust the session data to prevent infinite loops
        if (mounted) {
          console.log('✅ Using session data directly to prevent infinite refresh loop')
          setUser(session.user)
          await fetchAndUpdateProfile(session.user)
        }
      } catch (error) {
        console.log('⚠️ Initial auth check timeout/error, allowing unauthenticated access:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    getInitialUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email
        })
        
        if (!mounted) return
        
        // Add small delay for session sync after token refresh
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        if (session?.user) {
          setUser(session.user)
          console.log('👤 User authenticated, updating profile...')
          try {
            await fetchAndUpdateProfile(session.user)
          } catch (error) {
            console.log('⚠️ Profile update failed:', error)
            if (mounted) setProfile(null)
          }
        } else {
          console.log('👤 User signed out, clearing state')
          setUser(null)
          setProfile(null)
        }
        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}