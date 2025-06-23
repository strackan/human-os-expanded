// src/components/auth/AuthButton.tsx
'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function AuthButton() {
  const [loading, setLoading] = useState(false)
  const { user, signOut } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const handleSignIn = async () => {
    console.log('🔐 handleSignIn called')
    setLoading(true)
    try {
      // Get the next param from the current URL
      const urlParams = new URLSearchParams(window.location.search)
      const next = urlParams.get('next') || '/dashboard'
      
      // Create the callback URL with the next param - using the new route structure
      const callbackUrl = `${location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
      
      console.log('🔐 Sign in with redirect:', { next, callbackUrl })
      console.log('🔐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🔐 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          // Removed queryParams to avoid PKCE code verifier issues
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
      await signOut('global')
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
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
        ) : null}
        Sign Out
      </button>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      Sign in with Google
    </button>
  )
}