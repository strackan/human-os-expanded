'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const checkAuthState = async () => {
    setLoading(true)
    try {
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Check localStorage for tokens
      const localStorageTokens = localStorage.getItem('supabase.auth.token')
      const sessionStorageTokens = sessionStorage.getItem('supabase.auth.token')
      
      // Check cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      setDebugInfo({
        session: session ? {
          access_token: session.access_token ? 'present' : 'missing',
          refresh_token: session.refresh_token ? 'present' : 'missing',
          expires_at: session.expires_at,
          expires_in: session.expires_at ? 
            Math.max(0, session.expires_at - Math.floor(Date.now() / 1000)) : null
        } : null,
        user: user ? {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        } : null,
        errors: {
          session: sessionError?.message || null,
          user: userError?.message || null
        },
        storage: {
          localStorage: localStorageTokens ? 'present' : 'missing',
          sessionStorage: sessionStorageTokens ? 'present' : 'missing',
          localStorageContent: localStorageTokens ? JSON.parse(localStorageTokens) : null
        },
        cookies: {
          hasAuthCookies: Object.keys(cookies).some(key => key.includes('auth')),
          cookieNames: Object.keys(cookies).filter(key => key.includes('auth')),
          allCookies: cookies
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const clearAuthData = async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear localStorage
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.expires_at')
      localStorage.removeItem('supabase.auth.refresh_token')
      
      // Clear sessionStorage
      sessionStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.expires_at')
      sessionStorage.removeItem('supabase.auth.refresh_token')
      
      // Clear any auth-related cookies
      document.cookie.split(';').forEach(cookie => {
        const [key] = cookie.trim().split('=')
        if (key.includes('auth')) {
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      })
      
      alert('Auth data cleared! Please refresh the page.')
      setDebugInfo(null)
    } catch (error) {
      alert(`Error clearing auth data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testOAuthFlow = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        alert(`OAuth error: ${error.message}`)
      } else if (data?.url) {
        // Open OAuth URL in new window for testing
        window.open(data.url, '_blank', 'width=500,height=600')
      }
    } catch (error) {
      alert(`Error testing OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={checkAuthState}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Auth State'}
          </button>
          
          <button
            onClick={clearAuthData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Clear Auth Data
          </button>
          
          <button
            onClick={testOAuthFlow}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Test OAuth Flow
          </button>
        </div>

        {debugInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            
            {debugInfo.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 font-medium">Error:</p>
                <p className="text-red-700">{debugInfo.error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Session Info */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Session</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(debugInfo.session, null, 2)}
                  </pre>
                </div>

                {/* User Info */}
                <div>
                  <h3 className="text-lg font-medium mb-2">User</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(debugInfo.user, null, 2)}
                  </pre>
                </div>

                {/* Storage Info */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Storage</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(debugInfo.storage, null, 2)}
                  </pre>
                </div>

                {/* Cookie Info */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Cookies</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(debugInfo.cookies, null, 2)}
                  </pre>
                </div>

                {/* Errors */}
                {debugInfo.errors && (debugInfo.errors.session || debugInfo.errors.user) && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Errors</h3>
                    <pre className="bg-red-50 border border-red-200 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(debugInfo.errors, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Last updated: {debugInfo.timestamp}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click "Check Auth State" to see current authentication status</li>
            <li>If you see corrupted tokens or errors, click "Clear Auth Data"</li>
            <li>Try "Test OAuth Flow" to see if OAuth is working</li>
            <li>Check the browser console for any JavaScript errors</li>
            <li>Try opening the page in an incognito/private window</li>
            <li>Disable browser extensions temporarily</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
