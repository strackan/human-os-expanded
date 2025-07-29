'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const supabase = createClient()

  const testOAuth = async () => {
    setLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      console.log('🧪 Testing OAuth flow...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/test-oauth`,
        },
      })

      if (error) {
        console.error('❌ OAuth error:', error)
        setError(error.message)
        setDebugInfo({ error: error.message })
        return
      }

      console.log('✅ OAuth URL generated:', data.url)
      setDebugInfo({ 
        success: true, 
        url: data.url,
        provider: 'google',
        redirectTo: `${window.location.origin}/auth/callback?next=/test-oauth`
      })

      // Don't redirect automatically, let user see the URL
      // window.location.href = data.url
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
        error: error?.message
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OAuth Test Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test OAuth Flow</h2>
            
            <div className="space-y-4">
              <button
                onClick={testOAuth}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Google OAuth'}
              </button>
              
              <button
                onClick={checkAuth}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
              >
                Check Auth Status
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold text-red-800">Error:</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {debugInfo && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-semibold text-blue-800">Debug Info:</h3>
                <pre className="text-sm text-blue-700 mt-2 whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
              <p><strong>Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
              <p><strong>Redirect URL:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Test Google OAuth" to generate the OAuth URL</li>
              <li>Copy the generated URL and paste it in a new tab</li>
              <li>Complete the Google OAuth flow</li>
              <li>You should be redirected back to this page</li>
              <li>Click "Check Auth Status" to verify authentication</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
} 