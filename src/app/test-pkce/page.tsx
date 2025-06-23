'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestPKCEPage() {
  const [cookies, setCookies] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // Get current cookies
    const currentCookies = document.cookie.split(';').map(c => c.trim())
    setCookies(currentCookies)
  }, [])

  const testOAuthFlow = async () => {
    setMessage('🔄 Testing OAuth flow...')
    
    try {
      // Test the OAuth URL generation without redirecting
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `http://127.0.0.1:54321/auth/v1/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        }
      })
      
      if (error) {
        setMessage(`❌ OAuth error: ${error.message}`)
        return
      }
      
      if (data?.url) {
        setMessage(`✅ OAuth URL generated successfully`)
        
        // Check if code verifier cookie was set
        const updatedCookies = document.cookie.split(';').map(c => c.trim())
        const codeVerifierCookie = updatedCookies.find(c => c.includes('auth-token-code-verifier'))
        
        if (codeVerifierCookie) {
          setMessage(prev => prev + `\n✅ Code verifier cookie found: ${codeVerifierCookie.split('=')[0]}`)
        } else {
          setMessage(prev => prev + `\n❌ No code verifier cookie found`)
        }
        
        // Update cookies display
        setCookies(updatedCookies)
      } else {
        setMessage('❌ No OAuth URL received')
      }
    } catch (error) {
      setMessage(`❌ Test failed: ${error}`)
    }
  }

  const clearAllCookies = () => {
    const cookies = document.cookie.split(";")
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=127.0.0.1"
    })
    setMessage('✅ All cookies cleared')
    setCookies([])
  }

  const checkCookieSettings = () => {
    const testCookie = 'test_cookie=value; path=/; max-age=60'
    document.cookie = testCookie
    
    setTimeout(() => {
      const hasTestCookie = document.cookie.includes('test_cookie')
      if (hasTestCookie) {
        setMessage('✅ Cookies are working - test cookie was set and retrieved')
      } else {
        setMessage('❌ Cookies are not working - test cookie was not set')
      }
      
      // Clean up test cookie
      document.cookie = 'test_cookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
    }, 100)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">PKCE Flow Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current Cookies */}
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

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <button
              onClick={testOAuthFlow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Test OAuth Flow
            </button>
            <button
              onClick={clearAllCookies}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Clear All Cookies
            </button>
            <button
              onClick={checkCookieSettings}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Test Cookie Settings
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <pre className="text-sm whitespace-pre-wrap">{message}</pre>
        </div>
      )}

      {/* Navigation */}
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
            href="/clear-auth"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded inline-block"
          >
            Clear Auth Page
          </a>
        </div>
      </div>
    </div>
  )
} 