// src/components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: any
  loading: boolean
  signOut: (scope?: 'local' | 'global') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    console.time('🧐 [AUTH] Session init')

    const getSession = async () => {
      try {
        console.log('🧐 [AUTH] Fetching current session…')
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ [AUTH] Error fetching session:', error)
        } else {
          console.log('✅ [AUTH] Session fetched:', {
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
          })
        }

        setUser(session?.user ?? null)
      } catch (err) {
        console.error('❌ [AUTH] Unexpected error:', err)
      } finally {
        setLoading(false)
        console.timeEnd('🧐 [AUTH] Session init')
      }
    }

    getSession()

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🛡️ [AUTH] State change event:', event, {
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
        })
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async (scope: 'local' | 'global' = 'local') => {
    console.log(`🔐 [AUTH] Signing out (${scope})…`)
    const { error } = await supabase.auth.signOut({ scope })
    if (error) {
      console.error('❌ [AUTH] Signout error:', error)
    } else {
      console.log('✅ [AUTH] Signed out successfully')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
