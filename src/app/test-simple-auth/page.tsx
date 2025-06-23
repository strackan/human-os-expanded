'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestSimpleAuthPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testDirectOAuth = async () => {
    setLoading(true)
    setMessage('🔄 Testing direct OAuth flow...')
    
    try {
      // Use a simpler OAuth approach
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `http://127.0.0.1:54321/auth/v1/callback`,
        }
      })
      
      if (error) {
        setMessage(`❌ OAuth error: ${error.message}`)
        return
      }
      
      if (data?.url) {
        setMessage(`✅ OAuth URL generated: ${data.url.substring(0, 50)}...`)
        
        // Check cookies after OAuth URL generation
        setTimeout(() => {
          const cookies = document.cookie.split(';').map(c => c.trim())
          const codeVerifier = cookies.find(c => c.includes('auth-token-code-verifier'))
          
          if (codeVerifier) {
            setMessage(prev => prev + `\n✅ Code verifier cookie found: ${codeVerifier.split('=')[0]}`)
          } else {
            setMessage(prev => prev + `\n❌ No code verifier cookie found`)
          }
        }, 100)
      } else {
        setMessage('❌ No OAuth URL received')
      }
    } catch (error) {
      setMessage(`❌ Test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testSession = async () => {
    setMessage('🔄 Testing session...')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setMessage(`❌ Session error: ${error.message}`)
        return
      }
      
      if (session) {
        setMessage(`✅ Session found: ${session.user.email}`)
      } else {
        setMessage('❌ No session found')
      }
    } catch (error) {
      setMessage(`❌ Session test failed: ${error}`)
    }
  }

  const clearCookies = () => {
    const cookies = document.cookie.split(";")
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })
    setMessage('✅ Cookies cleared')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Simple Auth Test</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testDirectOAuth}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Direct OAuth'}
        </button>
        
        <button
          onClick={testSession}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Test Session
        </button>
        
        <button
          onClick={clearCookies}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Clear Cookies
        </button>
      </div>

      {message && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Results:</h3>
          <pre className="text-sm whitespace-pre-wrap">{message}</pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Current Cookies</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          {document.cookie ? (
            document.cookie.split(';').map((cookie, index) => (
              <p key={index} className="text-sm">
                <strong>{cookie.split('=')[0]}:</strong> {cookie.split('=')[1]?.substring(0, 20)}...
              </p>
            ))
          ) : (
            <p className="text-gray-500">No cookies found</p>
          )}
        </div>
      </div>
    </div>
  )
} 