'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SetupPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      
      if (!token || type !== 'recovery') {
        setIsValidToken(false)
        setError('Invalid or missing password setup link. Please request a new one.')
        return
      }

      try {
        // Verify the token is valid
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        })

        if (error || !data.user) {
          setIsValidToken(false)
          setError('This password setup link has expired or is invalid. Please request a new one.')
        } else {
          setIsValidToken(true)
          setMessage(`Setting up password for: ${data.user.email}`)
        }
      } catch (err) {
        setIsValidToken(false)
        setError('Error validating setup link. Please try again.')
      }
    }

    checkTokenValidity()
  }, [searchParams, supabase.auth])

  const handleSetupPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your password')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password set up successfully! You can now sign in with your email and password.')
        
        // Redirect to signin after success
        setTimeout(() => {
          router.push('/signin?message=password_setup_complete')
        }, 2000)
      }
    } catch (err) {
      setError('Failed to set up password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidToken === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Validating setup link...</p>
        </div>
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h1 className="text-xl font-semibold text-red-900 mb-2">Invalid Setup Link</h1>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push('/signin')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Set Up Password
        </h1>
        <p className="text-gray-600 mb-8">
          Add a password to your account for local authentication
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Enter new password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={handleSetupPassword}
            disabled={isLoading || !password || !confirmPassword}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Set Up Password
              </>
            )}
          </button>

          <div className="text-sm text-gray-500">
            <p>After setting up your password, you'll be able to:</p>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>Sign in with email/password when OAuth is unavailable</li>
              <li>Access your account from any device</li>
              <li>Use both Google sign-in and local authentication</li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push('/signin')}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}