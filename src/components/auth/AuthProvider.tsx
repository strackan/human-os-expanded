'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface WorkspaceProfile {
  company_id: string | null
  is_admin: boolean
  status: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  companyId: string | null
  isAdmin: boolean
  status: number
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  companyId: null,
  isAdmin: false,
  status: 2, // Default to Pending
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
  const [loading, setLoading] = useState(true)
  const [workspaceProfile, setWorkspaceProfile] = useState<WorkspaceProfile>({
    company_id: null,
    is_admin: false,
    status: 2,
  })
  const router = useRouter()

  // Create Supabase client (no singleton needed - createBrowserClient handles it)
  const supabase = createClient()

  useEffect(() => {
    const mountTime = performance.now()
    console.log('⏱️ [AUTH] Provider mounted at', new Date().toISOString())

    const getUser = async () => {
      console.log('⏱️ [AUTH] Starting initial user fetch...')
      const start = performance.now()

      try {
        // Use getUser() instead of getSession() to avoid LockManager sync issues
        // getUser() makes a fresh request to Supabase Auth server every time
        // getSession() can hang due to LockManager API synchronization across tabs
        const userPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('User fetch timeout after 10 seconds')), 10000)
        )

        const { data: { user } } = await Promise.race([userPromise, timeoutPromise])
        setUser(user ?? null)
        console.log('⏱️ [AUTH] User fetch result:', {
          hasUser: !!user,
          userEmail: user?.email,
        })

        // TEMP: Workspace profile fetch disabled due to query hanging
        // Will re-enable after investigating Supabase client issue
        // For now, use default values
        setWorkspaceProfile({
          company_id: null,
          is_admin: false,
          status: 1, // Default to Active
        })
        console.log('⚠️ [AUTH] Workspace profile fetch temporarily disabled')
      } catch (error) {
        console.error('❌ [AUTH] Error loading user:', error)

        // If it's a timeout, try to clear corrupted auth state
        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn('⚠️ [AUTH] Session fetch timed out - clearing potentially corrupted auth state')
          try {
            // Clear localStorage auth keys that might be corrupted
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase') || key.includes('auth')) {
                console.log('[AUTH] Clearing:', key)
                localStorage.removeItem(key)
              }
            })
          } catch (storageError) {
            console.error('[AUTH] Failed to clear storage:', storageError)
          }
        }

        setUser(null)
        setWorkspaceProfile({
          company_id: null,
          is_admin: false,
          status: 2,
        })
      } finally {
        const end = performance.now()
        console.log(`⏱️ [AUTH] Initial session fetch took ${(end - start).toFixed(2)} ms`)
        setLoading(false)
      }
    }

    const fetchWorkspaceProfile = async (userId: string) => {
      try {
        console.log('⏱️ [AUTH] Fetching workspace profile for user:', userId)
        const profileStart = performance.now()

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id, is_admin, status')
          .eq('id', userId)
          .single()

        if (error) {
          // Check if error is due to missing columns (backward compatibility)
          if (error.message.includes('column') || error.code === 'PGRST116') {
            console.warn('⚠️ [AUTH] Workspace columns not found, using defaults')
            setWorkspaceProfile({
              company_id: null,
              is_admin: false,
              status: 1, // Assume active for backward compatibility
            })
          } else {
            console.error('❌ [AUTH] Error fetching workspace profile:', error)
            // Set defaults on error
            setWorkspaceProfile({
              company_id: null,
              is_admin: false,
              status: 1,
            })
          }
        } else if (profile) {
          console.log('⏱️ [AUTH] Workspace profile fetched:', {
            hasCompanyId: !!profile.company_id,
            isAdmin: profile.is_admin,
            status: profile.status,
            fetchTime: `${(performance.now() - profileStart).toFixed(2)} ms`,
          })
          setWorkspaceProfile({
            company_id: profile.company_id,
            is_admin: profile.is_admin ?? false,
            status: profile.status ?? 1,
          })
        }
      } catch (error) {
        console.error('❌ [AUTH] Unexpected error fetching workspace profile:', error)
        // Set defaults on unexpected error
        setWorkspaceProfile({
          company_id: null,
          is_admin: false,
          status: 1,
        })
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const eventTime = performance.now()
        console.log('⏱️ [AUTH] Auth state change:', {
          event,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          elapsedMs: (eventTime - mountTime).toFixed(2),
        })

        setUser(session?.user ?? null)
        setLoading(false)

        // Fetch workspace profile on auth state change
        if (session?.user) {
          await fetchWorkspaceProfile(session.user.id)
        } else {
          // Reset workspace profile on sign out
          setWorkspaceProfile({
            company_id: null,
            is_admin: false,
            status: 2,
          })
        }

        if (event === 'SIGNED_IN') {
          router.refresh()
        } else if (event === 'SIGNED_OUT') {
          router.push('/signin')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      console.log('⏱️ [AUTH] Provider unmounted at', new Date().toISOString())
    }
  }, [router]) // Removed supabase from dependencies since it's memoized

  const signOut = async () => {
    console.log('⏱️ [AUTH] Starting sign-out...')
    const start = performance.now()
    try {
      setLoading(true)

      // CRITICAL: Clear local state FIRST to prevent RouteGuard race condition
      console.log('⏱️ [AUTH] Clearing local state...')
      setUser(null)
      setWorkspaceProfile({
        company_id: null,
        is_admin: false,
        status: 2,
      })

      // Then call Supabase signOut with timeout
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign-out timeout')), 5000)
      )

      const result = await Promise.race([signOutPromise, timeoutPromise]) as any

      if (result?.error) {
        console.warn('⚠️ [AUTH] Sign-out error (local state already cleared):', result.error)
      }

      console.log(`✅ [AUTH] Sign-out completed in ${(performance.now() - start).toFixed(2)} ms`)

      // Add small delay to ensure state updates propagate through React
      setTimeout(() => {
        console.log('⏱️ [AUTH] Redirecting to /signin...')
        if (typeof window !== 'undefined') {
          window.location.href = '/signin'
        } else {
          router.push('/signin')
        }
      }, 100)

    } catch (error) {
      console.error('❌ [AUTH] Error signing out, forcing redirect:', error)
      // Ensure state is cleared even on error
      setUser(null)
      setWorkspaceProfile({
        company_id: null,
        is_admin: false,
        status: 2,
      })
      // Still add delay for consistency
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/signin'
        } else {
          router.push('/signin')
        }
      }, 100)
    } finally {
      setLoading(false)
    }
  }

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      signOut,
      companyId: workspaceProfile.company_id,
      isAdmin: workspaceProfile.is_admin,
      status: workspaceProfile.status,
    }),
    [user, loading, workspaceProfile]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
