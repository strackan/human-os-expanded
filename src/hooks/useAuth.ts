'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthUser {
  id: string
  email: string | undefined
  created_at: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })
  const router = useRouter()
  const supabase = createClient()

  const refreshAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success && data.authenticated && data.user) {
        setAuthState({
          user: data.user,
          loading: false,
          error: null
        })
        return { success: true, user: data.user }
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: data.error || 'Authentication failed'
        })
        return { success: false, error: data.error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error during auth refresh'
      setAuthState({
        user: null,
        loading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setAuthState({
        user: null,
        loading: false,
        error: null
      })
      router.push('/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [supabase, router])

  const checkAuthAndRefresh = useCallback(async () => {
    // First check local session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      setAuthState({
        user: null,
        loading: false,
        error: 'No session found'
      })
      return
    }

    // If session exists, refresh to get validated user data
    await refreshAuth()
  }, [supabase, refreshAuth])

  useEffect(() => {
    // Initial auth check
    checkAuthAndRefresh()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)
        
        if (event === 'SIGNED_IN' && session) {
          await refreshAuth()
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            loading: false,
            error: null
          })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await refreshAuth()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, refreshAuth, checkAuthAndRefresh])

  return {
    ...authState,
    refreshAuth,
    signOut,
    checkAuth: checkAuthAndRefresh
  }
}