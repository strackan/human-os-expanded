'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthSimplePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [oauthUrl, setOauthUrl] = useState<string | null>(null)
  const supabase = createClient()

  const testOAuth = async () => {
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    setOauthUrl(null)

    try {
      console.log('🧪 Testing OAuth flow with PKCE...')
      
      // Use the correct callback route
      const redirectUrl = `${window.location.origin}/auth/callback?next=/test-oauth-simple`
      console.log('🔗 Redirect URL:', redirectUrl)
      
      // Let Supabase handle PKCE automatically
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Let Supabase handle PKCE automatically
        },
      })

      if (error) {
        console.error('❌ OAuth error:', error)
        setError(error.message)
        setDebugInfo({ error: error.message })
        return
      }

      console.log('✅ OAuth URL generated with PKCE:', data.url)
      setOauthUrl(data.url)
      setDebugInfo({ 
        success: true, 
        url: data.url,
        provider: 'google',
        redirectTo: redirectUrl,
        pkce: 'enabled',
        timestamp: new Date().toISOString()
      })

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        if (data.url) {
          console.log('🔄 Auto-redirecting to OAuth URL...')
          window.location.href = data.url
        }
      }, 3000)
    } catch (err) {
      console.error('❌ Test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      setDebugInfo({ 
        hasSession: !!session,
        user: session?.user?.email,
        userId: session?.user?.id,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const clearAuth = async () => {
    try {
      await supabase.auth.signOut()
      setDebugInfo({ message: 'Auth cleared', timestamp: new Date().toISOString() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">OAuth Test Page</h1>
          <p className="text-gray-600 mb-6">Testing Google OAuth flow with PKCE</p>
          
          <div className="space-y-4">
            <button
              onClick={testOAuth}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test OAuth Flow'}
            </button>
            
            <button
              onClick={checkAuth}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors ml-2"
            >
              Check Auth Status
            </button>
            
            <button
              onClick={clearAuth}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors ml-2"
            >
              Clear Auth
            </button>
          </div>
        </div>

        {oauthUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">OAuth URL Generated:</h3>
            <p className="text-sm text-blue-700 break-all">{oauthUrl}</p>
            <p className="text-xs text-blue-600 mt-2">Auto-redirecting in 3 seconds...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-2">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h3 className="font-medium mb-2">Debug Info:</h3>
            <pre className="text-sm bg-white p-2 rounded border overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 