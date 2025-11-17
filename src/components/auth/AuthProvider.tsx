'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getDemoModeConfig } from '@/lib/demo-mode-config'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
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
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const mountTime = performance.now()
    console.log('⏱️ [AUTH] Provider mounted at', new Date().toISOString())

    // Check if demo mode is enabled (auto-enabled on localhost, disabled on production)
    const demoConfig = getDemoModeConfig()

    if (demoConfig.enabled) {
      // Auto-login as the configured demo user WITH real Supabase session
      // Following renubu.demo pattern: check for existing session first
      const autoDemoLogin = async () => {
        try {
          // First check if there's already a session (optimization from renubu.demo)
          const { data: { session } } = await supabase.auth.getSession()

          // If session exists, use it and skip demo login
          if (session?.user) {
            console.log('✅ [DEMO MODE] Existing session found:', session.user.email)
            setUser(session.user)
            setLoading(false)
            return
          }

          // No session exists, attempt demo auto-login
          const demoEmail = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL || 'justin@renubu.com'
          const demoPassword = process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD

          if (!demoPassword) {
            console.error('❌ [DEMO MODE] NEXT_PUBLIC_DEMO_USER_PASSWORD not configured')
            console.log('🎮 [DEMO MODE] Falling back to fake user (API calls will fail)')
            const demoUser = {
              id: demoConfig.userId,
              email: demoConfig.userEmail,
              user_metadata: { full_name: 'Justin Stracity', company_name: 'Renubu' },
              app_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as User
            setUser(demoUser)
            setLoading(false)
            return
          }

          console.log('🎮 [DEMO MODE] No session found, signing in as', demoEmail)
          const { data, error } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          })

          if (error) {
            console.error('❌ [DEMO MODE] Sign-in failed:', error.message)
            console.log('🎮 [DEMO MODE] Falling back to fake user (API calls will fail)')
            const demoUser = {
              id: demoConfig.userId,
              email: demoConfig.userEmail,
              user_metadata: { full_name: 'Justin Stracity', company_name: 'Renubu' },
              app_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as User
            setUser(demoUser)
            setLoading(false)
            return
          }

          if (data.user) {
            console.log('✅ [DEMO MODE] Auto-authenticated with real session:', demoEmail)
            console.log('🎮 [DEMO MODE] Reason:', demoConfig.reason)
            console.log('🎮 [DEMO MODE] Session established - API calls will work')
            setUser(data.user)
            setLoading(false)
            return
          }
        } catch (err) {
          console.error('❌ [DEMO MODE] Unexpected error:', err)
          setLoading(false)
        }
      }

      autoDemoLogin()
      return
    }

    const getUser = async () => {
      console.log('⏱️ [AUTH] Starting initial session fetch...', {
        timestamp: new Date().toISOString(),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      })
      const start = performance.now()

      try {
        // Add timeout detection
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getSession timeout after 30 seconds')), 30000)
        )

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

        const duration = performance.now() - start
        setUser(session?.user ?? null)

        console.log('⏱️ [AUTH] Session fetch result:', {
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          durationMs: duration.toFixed(2),
          isSlowQuery: duration > 1000
        })
      } catch (error: any) {
        const duration = performance.now() - start
        console.error('❌ [AUTH] Error loading user:', {
          error: error?.message || String(error),
          isTimeout: error?.message?.includes('timeout'),
          durationMs: duration.toFixed(2)
        })
        setUser(null)
      } finally {
        const end = performance.now()
        console.log(`⏱️ [AUTH] Initial session fetch completed in ${(end - start).toFixed(2)} ms`)
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
        setLoading(false)

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
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
