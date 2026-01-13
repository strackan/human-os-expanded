// src/components/auth/AuthButton.tsx
'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function AuthButton() {
  const [loading, setLoading] = useState(false)
  const { user, signOut } = useAuth()
  const supabase = createClient()

  const handleSignIn = async () => {
    console.log('🔐 handleSignIn called')
    setLoading(true)
    try {
      // Get the next param from the current URL
      const urlParams = new URLSearchParams(window.location.search)
      const next = urlParams.get('next') || '/dashboard'
      
      // Create the redirect URL to our callback route
      const redirectUrl = `${location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
      
      console.log('🔐 Sign in with redirect:', { next, redirectUrl })
      console.log('🔐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🔐 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Using simple OAuth flow for local development
        }
      })
      
      console.log('🔐 OAuth response:', { data, error })
      
      if (error) {
        console.error('❌ Sign in error:', error.message)
        throw error
      }
      
      // Check if we got a URL to redirect to
      if (data?.url) {
        console.log('🔗 Redirecting to Google OAuth:', data.url)
        window.location.href = data.url
      } else {
        console.error('❌ No OAuth URL received')
        throw new Error('No OAuth URL received')
      }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      alert('Error signing in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      // Use the new signOut function from AuthProvider
      await signOut()
      console.log('✅ AuthButton signout completed')
      // The signOut function handles the redirect automatically
    } catch (error) {
      console.error('❌ Sign out error:', error)
      alert('Error signing out. Please try again.')
      setLoading(false)
    }
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50"
      >
        {loading ? 'Signing out...' : 'Sign Out'}
      </button>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50"
    >
      {loading ? 'Signing in...' : 'Sign In'}
    </button>
  )
}