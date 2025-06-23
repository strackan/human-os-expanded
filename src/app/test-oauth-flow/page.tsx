'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthFlowPage() {
  const [step, setStep] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [cookieCount, setCookieCount] = useState(0)
  const [authCookieCount, setAuthCookieCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Update cookie counts on client side
    const cookies = document.cookie.split(';').filter(c => c.trim())
    setCookieCount(cookies.length)
    setAuthCookieCount(cookies.filter(c => c.includes('auth-token')).length)
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testOAuthFlow = async () => {
    setLoading(true)
    setLogs([])
    setStep(1)
    
    try {
      addLog('🚀 Starting OAuth flow test...')
      
      // Step 1: Check environment variables
      addLog(`📋 Environment check:`)
      addLog(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing'}`)
      addLog(`   Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}`)
      
      // Step 2: Check current cookies
      const currentCookies = document.cookie.split(';').map(c => c.trim())
      addLog(`🍪 Current cookies: ${currentCookies.length}`)
      currentCookies.forEach(cookie => {
        addLog(`   - ${cookie.split('=')[0]}`)
      })
      
      // Step 3: Clear any existing auth cookies
      addLog('🧹 Clearing existing auth cookies...')
      const authCookies = currentCookies.filter(c => c.includes('auth-token'))
      authCookies.forEach(cookie => {
        const name = cookie.split('=')[0]
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        addLog(`   Cleared: ${name}`)
      })
      
      // Step 4: Generate OAuth URL
      setStep(2)
      addLog('🔗 Generating OAuth URL...')
      
      const callbackUrl = `http://127.0.0.1:54321/auth/v1/callback`
      addLog(`   Callback URL: ${callbackUrl}`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        }
      })
      
      if (error) {
        addLog(`❌ OAuth URL generation failed: ${error.message}`)
        setStep(0)
        return
      }
      
      if (!data?.url) {
        addLog('❌ No OAuth URL received')
        setStep(0)
        return
      }
      
      addLog(`✅ OAuth URL generated successfully`)
      addLog(`   URL: ${data.url.substring(0, 100)}...`)
      
      // Step 5: Check cookies after OAuth URL generation
      setStep(3)
      setTimeout(() => {
        const newCookies = document.cookie.split(';').map(c => c.trim())
        addLog(`🍪 Cookies after OAuth URL generation: ${newCookies.length}`)
        newCookies.forEach(cookie => {
          addLog(`   - ${cookie.split('=')[0]}`)
        })
        
        const codeVerifier = newCookies.find(c => c.includes('auth-token-code-verifier'))
        if (codeVerifier) {
          addLog(`✅ Code verifier cookie found: ${codeVerifier.split('=')[0]}`)
          addLog(`   Value length: ${codeVerifier.split('=')[1]?.length || 0}`)
        } else {
          addLog(`❌ No code verifier cookie found`)
        }
        
        // Step 6: Offer to proceed with OAuth
        setStep(4)
        addLog('🎯 Ready to proceed with OAuth flow')
        addLog('   Click "Proceed with OAuth" to continue to Google')
      }, 500)
      
    } catch (error) {
      addLog(`❌ Test failed: ${error}`)
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const proceedWithOAuth = () => {
    addLog('🔄 Proceeding with OAuth...')
    addLog('   Redirecting to Google OAuth...')
    
    // Get the OAuth URL again and redirect
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `http://127.0.0.1:54321/auth/v1/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      }
    }).then(({ data, error }) => {
      if (error) {
        addLog(`❌ Failed to get OAuth URL: ${error.message}`)
        return
      }
      
      if (data?.url) {
        addLog(`✅ Redirecting to: ${data.url.substring(0, 100)}...`)
        window.location.href = data.url
      }
    })
  }

  const clearLogs = () => {
    setLogs([])
    setStep(0)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">OAuth Flow Test</h1>
      
      <div className="mb-6">
        <button
          onClick={testOAuthFlow}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-4 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Start OAuth Flow Test'}
        </button>
        
        {step === 4 && (
          <button
            onClick={proceedWithOAuth}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-4"
          >
            Proceed with OAuth
          </button>
        )}
        
        <button
          onClick={clearLogs}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Clear Logs
        </button>
      </div>

      {/* Progress Indicator */}
      {step > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Progress:</h3>
          <div className="flex space-x-2">
            <div className={`w-4 h-4 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-4 h-4 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-4 h-4 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-4 h-4 rounded-full ${step >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          </div>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Test Logs:</h3>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current State */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Current State</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Environment</h3>
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</p>
            <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Cookies</h3>
            <p><strong>Total:</strong> {cookieCount}</p>
            <p><strong>Auth Cookies:</strong> {authCookieCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 