'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success')
      const error = searchParams.get('error')
      const next = searchParams.get('next') || '/dashboard'
      
      if (success) {
        // Session was successfully created server-side, refresh and navigate
        await supabase.auth.getSession() // Ensure session is loaded client-side
        router.push(next)
        router.refresh()
      } else if (error) {
        console.error('Auth callback error:', error)
        const errorParam = error === 'auth_failed' ? 'auth_failed' : 'no_code'
        router.push(`/signin?error=${errorParam}`)
      } else {
        // No explicit success/error params - check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard')
          router.refresh()
        } else {
          // No session, redirect to signin
          router.push('/signin?error=no_session')
        }
      }
    }

    handleCallback()
  }, [router, searchParams, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}