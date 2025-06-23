'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'

export default function ClearAuthPage() {
  const { user, loading } = useAuth()
  const [message, setMessage] = useState('')
  const [cookies, setCookies] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Get current cookies
    const currentCookies = document.cookie.split(';').map(c => c.trim())
    setCookies(currentCookies)
  }, [])

  const clearAllCookies = () => {
    const cookies = document.cookie.split(";")
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=127.0.0.1"
    })
    setMessage('✅ All cookies cleared!')
    setTimeout(() => window.location.reload(), 1000)
  }

  const clearAuthCookies = () => {
    const authCookieNames = [
      'sb-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token-code-verifier',
      'sb-127-auth-token',
      'sb-127-auth-token-code-verifier',
      'sb-uuvdjjclwwulvyeboavk-auth-token',
      'sb-uuvdjjclwwulvyeboavk-auth-token-code-verifier'
    ]
    
    authCookieNames.forEach(name => {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=127.0.0.1"
    })
    setMessage('✅ Auth cookies cleared!')
    setTimeout(() => window.location.reload(), 1000)
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setMessage('✅ Signed out successfully!')
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setMessage('❌ Sign out failed: ' + error)
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      setMessage(`Session: ${session ? '✅' : '❌'} | User: ${user ? '✅' : '❌'} | Session Error: ${sessionError?.message || 'none'} | User Error: ${userError?.message || 'none'}`)
    } catch (error) {
      setMessage('❌ Auth check failed: ' + error)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug & Clear</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current State */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
            <p><strong>Has User:</strong> {user ? 'true' : 'false'}</p>
            <p><strong>User Email:</strong> {user?.email || 'none'}</p>
            <p><strong>User ID:</strong> {user?.id || 'none'}</p>
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current Cookies</h2>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {cookies.map((cookie, index) => (
              <p key={index} className="text-sm">
                <strong>{cookie.split('=')[0]}:</strong> {cookie.split('=')[1]?.substring(0, 20)}...
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={clearAllCookies}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Clear All Cookies
          </button>
          <button
            onClick={clearAuthCookies}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
          >
            Clear Auth Cookies
          </button>
          <button
            onClick={signOut}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
          <button
            onClick={checkAuth}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Check Auth
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-2">Result:</h3>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Navigation</h2>
        <div className="space-x-4">
          <a
            href="/login"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-block"
          >
            Go to Login
          </a>
          <a
            href="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded inline-block"
          >
            Go to Dashboard
          </a>
          <a
            href="/test-auth"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded inline-block"
          >
            Test Auth Page
          </a>
        </div>
      </div>
    </div>
  )
} 