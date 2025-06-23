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
  signOut: (scope?: 'global' | 'local' | 'others') => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
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
  initialUser?: User | null
}

export default function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(!initialUser) // If we have initial user, don't show loading
  const supabase = createClient()

  const signOut = async (scope: 'global' | 'local' | 'others' = 'global') => {
    try {
      console.log('🔐 Signing out...', { scope })
      
      // Call server-side signout endpoint first
      const response = await fetch('/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scope }),
      })
      
      if (!response.ok) {
        console.log('⚠️ Server signout failed:', response.status, response.statusText)
        const errorText = await response.text()
        console.log('⚠️ Server signout error details:', errorText)
      } else {
        const result = await response.json()
        console.log('✅ Server signout successful:', result)
      }
      
      // Call client-side signout with scope
      const { error } = await supabase.auth.signOut({ scope })
      
      if (error) {
        console.error('❌ Client-side signout error:', error)
        throw error
      }
      
      // Clear local state
      setUser(null)
      setProfile(null)
      console.log('✅ Sign out complete')
      
      // Redirect to signin page
      if (typeof window !== 'undefined') {
        window.location.href = '/signin'
      }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      throw error
    }
  }

  useEffect(() => {
    let mounted = true

    // If we have an initial user, fetch their profile
    if (initialUser) {
      console.log('👤 Using initial user:', initialUser.email)
      const fetchProfile = async () => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialUser.id)
            .single()
          if (!profileError && mounted) {
            console.log('✅ Profile fetched:', profile)
            setProfile(profile)
          } else {
            console.log('⚠️ Profile error:', profileError?.message)
            // Create profile if it doesn't exist
            if (profileError?.code === 'PGRST116') {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: initialUser.id,
                  email: initialUser.email!,
                  full_name: initialUser.user_metadata.full_name || 
                            initialUser.user_metadata.name || 
                            initialUser.user_metadata.given_name,
                  avatar_url: initialUser.user_metadata.avatar_url,
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single()
              
              if (!createError && mounted) {
                console.log('✅ Profile created:', newProfile)
                setProfile(newProfile)
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Profile fetch failed:', error)
          if (mounted) setProfile(null)
        } finally {
          if (mounted) {
            setLoading(false)
            console.log('🏁 Initial user loading complete')
          }
        }
      }
      fetchProfile()
    } else {
      // Get initial user from server-side session
      const getInitialUser = async () => {
        try {
          console.log('🔍 Getting initial user from server...')
          
          // Try both getSession and getUser to ensure we get the user
          const [sessionResult, userResult] = await Promise.all([
            supabase.auth.getSession(),
            supabase.auth.getUser()
          ])
          
          const session = sessionResult.data.session
          const user = userResult.data.user
          const sessionError = sessionResult.error
          const userError = userResult.error
          
          console.log('📝 Initial auth results:', {
            hasSession: !!session,
            hasUser: !!user,
            userEmail: user?.email || session?.user?.email,
            sessionError: sessionError?.message,
            userError: userError?.message
          })
          
          if (!mounted) return
          
          // Use user from either source
          const currentUser = user || session?.user
          
          if (currentUser) {
            setUser(currentUser)
            console.log('👤 User found, fetching profile...')
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single()
              if (!profileError && mounted) {
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
                  
                  if (!createError && mounted) {
                    console.log('✅ Profile created:', newProfile)
                    setProfile(newProfile)
                  }
                }
              }
            } catch (error) {
              console.log('⚠️ Profile fetch failed:', error)
              if (mounted) setProfile(null)
            }
          } else {
            console.log('👤 No user found in session or user check')
            setUser(null)
            setProfile(null)
          }
        } catch (error) {
          console.error('❌ Session check error:', error)
          if (mounted) {
            setUser(null)
            setProfile(null)
          }
        } finally {
          if (mounted) {
            setLoading(false)
            console.log('🏁 Initial session loading complete')
          }
        }
      }

      getInitialUser()
    }

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
        if (session?.user) {
          setUser(session.user)
          console.log('👤 User authenticated, updating profile...')
          try {
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
            } else {
              console.log('⚠️ Profile update error:', error?.message)
            }
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
  }, [supabase, initialUser])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}