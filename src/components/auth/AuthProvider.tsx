'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  company_id: string | null
  status: number
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
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
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Helper: Check/create user profile and handle workspace logic
  const handleUserProfile = async (authUser: User) => {
    try {
      console.log('[WORKSPACE] Checking profile for user:', authUser.email)

      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_id, status, is_admin')
        .eq('id', authUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = not found, which is okay for first-time users
        console.error('[WORKSPACE] Error fetching profile:', profileError)
        throw profileError
      }

      if (existingProfile) {
        console.log('[WORKSPACE] Profile found:', {
          status: existingProfile.status,
          is_admin: existingProfile.is_admin,
          has_company: !!existingProfile.company_id
        })

        // Check status
        if (existingProfile.status === 0) {
          // Disabled user
          console.log('[WORKSPACE] User is disabled')
          router.push('/no-access')
          return null
        }

        if (existingProfile.status === 2) {
          // Pending invitation - activate them
          console.log('[WORKSPACE] Activating pending user')
          const { data: activated } = await supabase
            .from('profiles')
            .update({ status: 1 })
            .eq('id', authUser.id)
            .select('id, email, full_name, company_id, status, is_admin')
            .single()

          return activated
        }

        // Status = 1 (Active)
        return existingProfile
      }

      // No profile exists - this is the first user! Create company and admin profile
      console.log('[WORKSPACE] First time user - creating company and admin profile')

      // Create company
      const companyName = authUser.email?.split('@')[1] || 'My Company'
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName })
        .select()
        .single()

      if (companyError) {
        console.error('[WORKSPACE] Error creating company:', companyError)
        throw companyError
      }

      // Create profile as admin
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
          company_id: newCompany.id,
          status: 1, // Active
          is_admin: true // First user is admin
        })
        .select('id, email, full_name, company_id, status, is_admin')
        .single()

      if (newProfileError) {
        console.error('[WORKSPACE] Error creating profile:', newProfileError)
        throw newProfileError
      }

      console.log('[WORKSPACE] Created new company and admin profile')
      return newProfile
    } catch (error) {
      console.error('[WORKSPACE] Error in handleUserProfile:', error)
      return null
    }
  }

  useEffect(() => {
    const mountTime = performance.now()
    console.log('⏱️ [AUTH] Provider mounted at', new Date().toISOString())

    const getUser = async () => {
      console.log('⏱️ [AUTH] Starting initial session fetch...')
      const start = performance.now()

      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        console.log('⏱️ [AUTH] Session fetch result:', {
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
        })

        // If user exists, check/create their profile
        if (session?.user) {
          const userProfile = await handleUserProfile(session.user)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('❌ [AUTH] Error loading user:', error)
        setUser(null)
        setProfile(null)
      } finally {
        const end = performance.now()
        console.log(`⏱️ [AUTH] Initial session fetch took ${(end - start).toFixed(2)} ms`)
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const eventTime = performance.now()
        console.log('⏱️ [AUTH] Auth state change:', {
          event,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          elapsedMs: (eventTime - mountTime).toFixed(2),
        })

        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' && session?.user) {
          // Check/create profile for newly signed in user
          const userProfile = await handleUserProfile(session.user)
          setProfile(userProfile)
          setLoading(false)
          router.refresh()
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setLoading(false)
          router.push('/signin')
        } else {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      console.log('⏱️ [AUTH] Provider unmounted at', new Date().toISOString())
    }
  }, [supabase, router])

  const signOut = async () => {
    console.log('⏱️ [AUTH] Starting sign-out...')
    const start = performance.now()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/signin')
      console.log(`✅ [AUTH] Sign-out completed in ${(performance.now() - start).toFixed(2)} ms`)
    } catch (error) {
      console.error('❌ [AUTH] Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
