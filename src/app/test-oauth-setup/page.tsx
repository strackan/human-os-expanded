'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  const testOAuth = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      console.log('🔄 Testing OAuth setup...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/test-auth-flow`,
        },
      })

      if (error) {
        console.error('❌ OAuth error:', error)
        setResult({ error: error.message })
      } else {
        console.log('✅ OAuth initiated successfully')
        setResult({ success: true, data })
      }
    } catch (error) {
      console.error('❌ OAuth test failed:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OAuth Setup Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2 text-sm">
            <p><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</p>
            <p><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</p>
            <p><strong>GOOGLE_CLIENT_ID:</strong> {process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set'}</p>
            <p><strong>GOOGLE_SECRET:</strong> {process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET ? '✅ Set' : '❌ Not set'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">OAuth Test</h2>
          <button
            onClick={testOAuth}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Google OAuth'}
          </button>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Check that all environment variables are set (should show ✅)</li>
            <li>Click "Test Google OAuth" to initiate the OAuth flow</li>
            <li>Complete the Google OAuth process</li>
            <li>You should be redirected to `/test-auth-flow` after authentication</li>
            <li>Check the session state on the test page</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 