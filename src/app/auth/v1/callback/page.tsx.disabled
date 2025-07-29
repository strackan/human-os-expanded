'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SupabaseCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Handling Supabase OAuth callback...')
        
        // Get the next parameter from the URL
        const next = searchParams.get('next') || '/dashboard'
        console.log('🎯 Redirect target:', next)

        // Check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError(sessionError.message)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('✅ User authenticated:', session.user.email)
          // Redirect to the intended destination
          router.replace(next)
        } else {
          console.log('❌ No session found')
          setError('Authentication failed. No session found.')
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ Callback error:', error)
        setError('An error occurred during authentication.')
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => router.push('/signin')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return null
} 