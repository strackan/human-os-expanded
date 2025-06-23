'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthSimplePage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [cookies, setCookies] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Only access document on client side
    if (typeof window !== 'undefined') {
      const currentCookies = document.cookie.split(';').map(c => c.trim())
      setCookies(currentCookies)
    }
  }, [])

  const testSimpleOAuth = async () => {
    setLoading(true)
    setMessage('🔄 Testing simple OAuth flow...')
    
    try {
      // Clear any existing cookies first
      if (typeof window !== 'undefined') {
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim()
          if (name.includes('auth-token')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          }
        })
      }
      
      setMessage(prev => prev + '\n🧹 Cleared existing auth cookies')
      
      // Use simple OAuth without PKCE parameters
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://127.0.0.1:54321/auth/v1/callback',
          // Remove queryParams to avoid PKCE issues
        }
      })
      
      if (error) {
        setMessage(prev => prev + `\n❌ OAuth error: ${error.message}`)
        return
      }
      
      if (data?.url) {
        setMessage(prev => prev + `\n✅ OAuth URL generated successfully`)
        
        // Check cookies after OAuth URL generation
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const newCookies = document.cookie.split(';').map(c => c.trim())
            setCookies(newCookies)
            const codeVerifier = newCookies.find(c => c.includes('auth-token-code-verifier'))
            
            if (codeVerifier) {
              setMessage(prev => prev + `\n✅ Code verifier cookie found: ${codeVerifier.split('=')[0]}`)
            } else {
              setMessage(prev => prev + `\n❌ No code verifier cookie found`)
            }
            
            setMessage(prev => prev + `\n🎯 Ready to proceed with OAuth`)
            setMessage(prev => prev + `\n   Click "Proceed with OAuth" to continue`)
          }
        }, 500)
      } else {
        setMessage(prev => prev + `\n❌ No OAuth URL received`)
      }
    } catch (error) {
      setMessage(prev => prev + `\n❌ Test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const proceedWithOAuth = () => {
    setMessage('🔄 Proceeding with OAuth...')
    
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://127.0.0.1:54321/auth/v1/callback',
      }
    }).then(({ data, error }) => {
      if (error) {
        setMessage(prev => prev + `\n❌ Failed to get OAuth URL: ${error.message}`)
        return
      }
      
      if (data?.url) {
        setMessage(prev => prev + `\n✅ Redirecting to Google OAuth...`)
        window.location.href = data.url
      }
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Simple OAuth Test (No PKCE)</h1>
      
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded mb-6">
        <h3 className="font-semibold mb-2">⚠️ This test removes PKCE parameters:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>No <code>access_type: 'offline'</code></li>
          <li>No <code>prompt: 'select_account'</code></li>
          <li>Uses simple OAuth flow</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <button
              onClick={testSimpleOAuth}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Simple OAuth'}
            </button>
            <button
              onClick={proceedWithOAuth}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Proceed with OAuth
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current Cookies</h2>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {cookies.map((cookie, index) => (
              <p key={index} className="text-sm">
                <strong>{cookie.split('=')[0]}:</strong> {cookie.split('=')[1]?.substring(0, 20)}...
              </p>
            ))}
            {cookies.length === 0 && <p className="text-gray-500">No cookies found</p>}
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <pre className="text-sm whitespace-pre-wrap">{message}</pre>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Navigation</h2>
        <div className="space-x-4">
          <a
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded inline-block"
          >
            Go to Login
          </a>
          <a
            href="/test-oauth"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded inline-block"
          >
            Test with PKCE
          </a>
        </div>
      </div>
    </div>
  )
} 