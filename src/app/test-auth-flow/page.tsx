'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase'

export default function TestAuthFlow() {
  const { user, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const supabase = createClient()

  const checkSession = async () => {
    setIsChecking(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      setDebugInfo({
        hasSession: !!session,
        hasUser: !!currentUser,
        userEmail: currentUser?.email || session?.user?.email,
        sessionError: error?.message,
        userError: userError?.message,
        sessionData: session ? {
          access_token: session.access_token?.substring(0, 20) + '...',
          refresh_token: session.refresh_token?.substring(0, 20) + '...',
          expires_at: session.expires_at
        } : null
      })
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsChecking(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setDebugInfo(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Flow Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Auth State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? user.email : 'None'}</p>
              <p><strong>User ID:</strong> {user?.id || 'None'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              <button
                onClick={checkSession}
                disabled={isChecking}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isChecking ? 'Checking...' : 'Check Session'}
              </button>
              
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
              
              <a
                href="/api/debug-session"
                target="_blank"
                className="block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
              >
                Debug Session API
              </a>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Environment Info */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="space-y-2 text-sm">
            <p><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
            <p><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
            <p><strong>GOOGLE_CLIENT_ID:</strong> {process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 