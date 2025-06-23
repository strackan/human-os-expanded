'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ManualAuth() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const clearAllCookies = () => {
    console.log('🧹 Clearing all cookies...')
    
    // Get all cookies and clear them
    document.cookie.split(";").forEach(function(c) { 
      const cookieName = c.trim().split('=')[0]
      if (cookieName) {
        document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/`
        document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/;domain=localhost`
        document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/;domain=127.0.0.1`
      }
    })
    
    localStorage.clear()
    sessionStorage.clear()
    
    window.location.reload()
  }

  const testDirectOAuth = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const supabase = createClient()
      
      console.log('🔐 Starting direct OAuth test...')
      
      // Clear any existing auth state first
      await supabase.auth.signOut({ scope: 'global' })
      
      // Start OAuth with minimal options
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/manual-auth`,
        }
      })
      
      console.log('🔐 OAuth result:', { data, error })
      
      if (error) {
        setResult({ success: false, error: error.message })
      } else if (data?.url) {
        console.log('🔗 Redirecting to:', data.url)
        window.location.href = data.url
      } else {
        setResult({ success: false, error: 'No OAuth URL generated' })
      }
    } catch (err) {
      console.error('🔐 OAuth error:', err)
      setResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentAuth = async () => {
    const supabase = createClient()
    
    const userResult = await supabase.auth.getUser()
    const sessionResult = await supabase.auth.getSession()
    
    setResult({
      success: true,
      user: userResult.data.user?.email,
      userError: userResult.error?.message,
      hasSession: !!sessionResult.data.session,
      sessionError: sessionResult.error?.message,
      cookies: document.cookie
    })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manual Auth Test</h1>
      
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={clearAllCookies}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            🧹 Clear Everything
          </button>
          
          <button
            onClick={testDirectOAuth}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Starting OAuth...' : '🔐 Test OAuth'}
          </button>
          
          <button
            onClick={checkCurrentAuth}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            📊 Check Auth State
          </button>
        </div>
        
        {result && (
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Click "Clear Everything" to reset all auth state</li>
            <li>Click "Test OAuth" to start a clean OAuth flow</li>
            <li>Complete Google sign-in</li>
            <li>Should redirect back here</li>
            <li>Click "Check Auth State" to verify authentication</li>
          </ol>
        </div>
      </div>
    </div>
  )
}