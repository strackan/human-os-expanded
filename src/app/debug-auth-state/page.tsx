'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function DebugAuthState() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthState = async () => {
      const supabase = createClient()
      
      // Check multiple auth methods
      const userResult = await supabase.auth.getUser()
      const sessionResult = await supabase.auth.getSession()
      
      // Get all cookies
      const allCookies = document.cookie.split(';').map(c => {
        const [name, value] = c.trim().split('=')
        return { name, value: value?.substring(0, 100) }
      }).filter(c => c.name) // Remove empty entries
      
      // Filter auth cookies  
      const authCookies = allCookies.filter(c => 
        c.name.includes('supabase') || 
        c.name.includes('sb-') || 
        c.name.includes('auth') ||
        c.name.includes('token')
      )
      
      setAuthState({
        user: userResult.data.user,
        userError: userResult.error,
        session: sessionResult.data.session,
        sessionError: sessionResult.error,
        allCookies: allCookies.length,
        authCookies,
        timestamp: new Date().toISOString()
      })
      setLoading(false)
    }
    
    checkAuthState()
  }, [])

  const forceSignOut = async () => {
    const supabase = createClient()
    
    console.log('🔥 NUCLEAR SIGNOUT - Before:', await supabase.auth.getUser())
    
    // Multiple signout attempts
    await supabase.auth.signOut({ scope: 'global' })
    await supabase.auth.signOut({ scope: 'local' }) 
    await supabase.auth.signOut({ scope: 'others' })
    
    // Clear local storage
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear cookies manually - especially PKCE verifier cookies
    document.cookie.split(";").forEach(function(c) { 
      const cookieName = c.trim().split('=')[0]
      document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/;domain=localhost`
      document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/;domain=127.0.0.1`
      document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/`
    })
    
    console.log('🔥 NUCLEAR SIGNOUT - After:', await supabase.auth.getUser())
    
    // Force page reload
    window.location.href = '/signin'
  }

  const clearPKCECookies = () => {
    console.log('🧹 Clearing PKCE cookies...')
    
    // Clear specific PKCE cookies
    const pkcePatterns = ['sb-127-auth-token-code-verifier', 'sb-auth-token', 'sb-pkce-code-verifier']
    
    pkcePatterns.forEach(pattern => {
      document.cookie = `${pattern}=;expires=${new Date().toUTCString()};path=/`
      document.cookie = `${pattern}=;expires=${new Date().toUTCString()};path=/;domain=localhost`
      document.cookie = `${pattern}=;expires=${new Date().toUTCString()};path=/;domain=127.0.0.1`
    })
    
    window.location.reload()
  }

  if (loading) return <div className="p-8">Loading auth state...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth State Debug</h1>
      
      <div className="space-y-6">
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">User State:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              id: authState?.user?.id,
              email: authState?.user?.email,
              error: authState?.userError?.message
            }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Session State:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              hasSession: !!authState?.session,
              accessToken: authState?.session?.access_token?.substring(0, 30) + '...',
              refreshToken: authState?.session?.refresh_token?.substring(0, 30) + '...',
              error: authState?.sessionError?.message
            }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Auth Cookies ({authState?.authCookies?.length}):</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(authState?.authCookies, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Refresh State
          </button>
          
          <button 
            onClick={clearPKCECookies}
            className="px-4 py-2 bg-yellow-500 text-white rounded"
          >
            🧹 Clear PKCE Cookies
          </button>
          
          <button 
            onClick={forceSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            🔥 Nuclear Signout
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Last checked: {authState?.timestamp}
        </div>
      </div>
    </div>
  )
}