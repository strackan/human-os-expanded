'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase'

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, refreshSession } = useAuth()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        console.log('🔄 Auth success page - processing session...', { attempts })
        
        // Get the next parameter
        const next = searchParams.get('next') || '/dashboard'
        
        // Force refresh the session
        console.log('🔄 Forcing session refresh...')
        await refreshSession()
        
        // Wait a bit for the auth state to update
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if we have a user now
        if (user) {
          console.log('✅ User authenticated, redirecting to:', next)
          router.replace(next)
          return
        }
        
        // If no user and we haven't tried too many times, retry
        if (attempts < 3) {
          console.log(`🔄 Attempt ${attempts + 1}: No user found, retrying...`)
          setAttempts(attempts + 1)
          return
        }
        
        // Try to get the user directly from Supabase
        console.log('🔄 Checking Supabase session directly...')
        const { data: { user: directUser }, error: userError } = await supabase.auth.getUser()
        
        if (directUser && !userError) {
          console.log('✅ Direct user check successful, redirecting to:', next)
          router.replace(next)
        } else {
          console.log('❌ No user found after all attempts, redirecting to signin')
          router.replace('/signin?error=no_user')
        }
      } catch (error) {
        console.error('❌ Auth success page error:', error)
        setError('Authentication failed')
        router.replace('/signin?error=auth_failed')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthSuccess()
  }, [user, loading, router, searchParams, refreshSession, supabase.auth, attempts])

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
          {attempts > 0 && (
            <p className="text-sm text-gray-500 mt-2">Attempt {attempts}/3</p>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button
            onClick={() => router.push('/signin')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-green-600 mb-4">✅ Authentication successful!</div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}