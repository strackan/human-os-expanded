'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthDebugPage() {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [step, setStep] = useState(0)
  const supabase = createClient()

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testOAuthStepByStep = async () => {
    setLoading(true)
    setLogs([])
    setStep(1)
    
    try {
      addLog('🚀 Starting comprehensive OAuth debug...')
      
      // Step 1: Environment check
      addLog(`📋 Environment Variables:`)
      addLog(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing'}`)
      addLog(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}`)
      
      // Step 2: Supabase connectivity test
      setStep(2)
      addLog('🔗 Testing Supabase connectivity...')
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          addLog(`❌ Supabase connection failed: ${error.message}`)
        } else {
          addLog(`✅ Supabase connection successful`)
          addLog(`   Has session: ${!!data.session}`)
        }
      } catch (err) {
        addLog(`❌ Supabase connection error: ${err}`)
      }
      
      // Step 3: Clear cookies
      setStep(3)
      addLog('🧹 Clearing existing auth cookies...')
      const currentCookies = document.cookie.split(';').map(c => c.trim())
      const authCookies = currentCookies.filter(c => c.includes('auth-token'))
      authCookies.forEach(cookie => {
        const name = cookie.split('=')[0]
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        addLog(`   Cleared: ${name}`)
      })
      
      // Step 4: Test OAuth URL generation
      setStep(4)
      addLog('🔗 Testing OAuth URL generation...')
      
      const callbackUrl = `http://127.0.0.1:54321/auth/v1/callback`
      addLog(`   Using callback URL: ${callbackUrl}`)
      
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
          }
        })
        
        if (error) {
          addLog(`❌ OAuth URL generation failed: ${error.message}`)
          addLog(`   Error details: ${JSON.stringify(error)}`)
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
        setStep(5)
        setTimeout(() => {
          const newCookies = document.cookie.split(';').map(c => c.trim())
          addLog(`🍪 Cookies after OAuth URL generation: ${newCookies.length}`)
          newCookies.forEach(cookie => {
            addLog(`   - ${cookie.split('=')[0]}`)
          })
          
          const codeVerifier = newCookies.find(c => c.includes('auth-token-code-verifier'))
          if (codeVerifier) {
            addLog(`✅ Code verifier cookie found: ${codeVerifier.split('=')[0]}`)
          } else {
            addLog(`❌ No code verifier cookie found`)
          }
          
          // Step 6: Offer to proceed with OAuth
          setStep(6)
          addLog('🎯 Ready to proceed with OAuth flow')
          addLog('   Click "Proceed with OAuth" to continue to Google')
          addLog('   ⚠️  Make sure you have configured Google OAuth redirect URIs!')
        }, 500)
        
      } catch (error) {
        addLog(`❌ OAuth URL generation error: ${error}`)
        setStep(0)
      }
      
    } catch (error) {
      addLog(`❌ Debug failed: ${error}`)
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OAuth Debug Tool</h1>
      
      <div className="mb-6">
        <button
          onClick={testOAuthStepByStep}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Start OAuth Debug'}
        </button>
        
        {step >= 6 && (
          <button
            onClick={proceedWithOAuth}
            className="bg-green-500 text-white px-4 py-2 rounded mr-4"
          >
            Proceed with OAuth
          </button>
        )}
        
        <button
          onClick={clearLogs}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Clear Logs
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Current Step: {step}</h2>
        <div className="bg-gray-100 p-4 rounded">
          {step === 0 && <p>Ready to start debug</p>}
          {step === 1 && <p>Checking environment variables...</p>}
          {step === 2 && <p>Testing Supabase connectivity...</p>}
          {step === 3 && <p>Clearing auth cookies...</p>}
          {step === 4 && <p>Generating OAuth URL...</p>}
          {step === 5 && <p>Checking cookies...</p>}
          {step === 6 && <p>Ready to proceed with OAuth</p>}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p>No logs yet. Click "Start OAuth Debug" to begin.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
      
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
        <h3 className="font-semibold mb-2">⚠️ Important Notes:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Make sure Google OAuth is configured with redirect URI: <code>http://127.0.0.1:54321/auth/v1/callback</code></li>
          <li>Check that your Google OAuth credentials are correct in .env.local</li>
          <li>Ensure Supabase is running: <code>supabase status</code></li>
          <li>If OAuth hangs, check browser console for errors</li>
        </ul>
      </div>
    </div>
  )
} 