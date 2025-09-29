'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
      } catch (error) {
        console.error('❌ [AUTH] Error loading user:', error)
        setUser(null)
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
