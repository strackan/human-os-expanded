'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get URL search params
        const { searchParams } = new URL(window.location.href)
        const code = searchParams.get('code')
        const next = searchParams.get('next') ?? '/dashboard'
        
        if (code) {
          console.log('🔐 Processing OAuth callback with code...')
          
          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('❌ OAuth callback error:', error)
            router.push('/signin?error=auth_callback_failed')
            return
          }
          
          if (data.session) {
            console.log('✅ OAuth session established:', data.session.user.email)
            // Successful authentication - redirect to intended page
            router.push(next.startsWith('/') ? next : '/dashboard')
          } else {
            console.warn('⚠️ No session data received')
            router.push('/signin?error=no_session')
          }
        } else {
          // No code parameter - might be an error
          const error = searchParams.get('error')
          if (error) {
            console.error('❌ OAuth error in callback:', error)
            router.push(`/signin?error=oauth_error&details=${error}`)
          } else {
            console.warn('⚠️ No code or error in callback')
            router.push('/signin?error=invalid_callback')
          }
        }
      } catch (error) {
        console.error('❌ Error in auth callback:', error)
        router.push('/signin?error=callback_exception')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Completing authentication...
        </h1>
        <p className="text-gray-600">
          Please wait while we finish signing you in.
        </p>
      </div>
    </div>
  )
}
