"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check server-side auth status
      const response = await fetch('/api/auth/debug')
      const serverDebug = await response.json()
      
      // Check client-side auth status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      setDebugInfo({
        server: serverDebug,
        client: {
          hasSession: !!session,
          hasUser: !!user,
          sessionError: sessionError?.message || null,
          userError: userError?.message || null,
          userEmail: user?.email || null,
          userId: user?.id || null,
          sessionExpiresAt: session?.expires_at || null,
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(error.message)
      } else {
        await checkAuthStatus()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Checking authentication status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Page</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Server-side Debug Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Server-side Status</h2>
            {debugInfo?.server ? (
              <div className="space-y-2 text-sm">
                <p><strong>Environment:</strong> {debugInfo.server.nodeEnv}</p>
                <p><strong>Supabase URL:</strong> {debugInfo.server.supabaseUrl}</p>
                <p><strong>Supabase Key:</strong> {debugInfo.server.supabaseAnonKey}</p>
                <p><strong>Service Role Key:</strong> {debugInfo.server.serviceRoleKey}</p>
                <p><strong>Has Session:</strong> {debugInfo.server.hasSession ? 'Yes' : 'No'}</p>
                <p><strong>Has User:</strong> {debugInfo.server.hasUser ? 'Yes' : 'No'}</p>
                {debugInfo.server.userEmail && (
                  <p><strong>User Email:</strong> {debugInfo.server.userEmail}</p>
                )}
                {debugInfo.server.sessionError && (
                  <p className="text-red-600"><strong>Session Error:</strong> {debugInfo.server.sessionError}</p>
                )}
                {debugInfo.server.userError && (
                  <p className="text-red-600"><strong>User Error:</strong> {debugInfo.server.userError}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No server debug info available</p>
            )}
          </div>
          
          {/* Client-side Debug Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Client-side Status</h2>
            {debugInfo?.client ? (
              <div className="space-y-2 text-sm">
                <p><strong>Has Session:</strong> {debugInfo.client.hasSession ? 'Yes' : 'No'}</p>
                <p><strong>Has User:</strong> {debugInfo.client.hasUser ? 'Yes' : 'No'}</p>
                {debugInfo.client.userEmail && (
                  <p><strong>User Email:</strong> {debugInfo.client.userEmail}</p>
                )}
                {debugInfo.client.sessionExpiresAt && (
                  <p><strong>Session Expires:</strong> {new Date(debugInfo.client.sessionExpiresAt * 1000).toLocaleString()}</p>
                )}
                {debugInfo.client.sessionError && (
                  <p className="text-red-600"><strong>Session Error:</strong> {debugInfo.client.sessionError}</p>
                )}
                {debugInfo.client.userError && (
                  <p className="text-red-600"><strong>User Error:</strong> {debugInfo.client.userError}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No client debug info available</p>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Sign In with Google
            </button>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Sign Out
            </button>
            <button
              onClick={checkAuthStatus}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
        
        {/* Environment Variables Check */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
            <p><strong>SUPABASE_SERVICE_ROLE_KEY:</strong> {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'}</p>
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 