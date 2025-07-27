'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testOAuthFlow = async () => {
    setLoading(true)
    setLogs([])
    
    try {
      addLog('🚀 Starting OAuth debug test...')
      
      // Step 1: Check environment variables
      addLog(`📋 Environment check:`)
      addLog(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing'}`)
      addLog(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}`)
      addLog(`   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID: ${process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID ? '✅ Present' : '❌ Missing'}`)
      addLog(`   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET: ${process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET ? '✅ Present' : '❌ Missing'}`)
      
      // Step 2: Check current URL and origin
      addLog(`🌐 Current URL: ${window.location.href}`)
      addLog(`🌐 Origin: ${window.location.origin}`)
      
      // Step 3: Test OAuth URL generation
      addLog('🔗 Testing OAuth URL generation...')
      
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}?next=/dashboard`
      
      addLog(`   Redirect URL: ${redirectUrl}`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      })
      
      if (error) {
        addLog(`❌ OAuth URL generation failed: ${error.message}`)
        addLog(`   Error details: ${JSON.stringify(error)}`)
        return
      }
      
      if (!data?.url) {
        addLog('❌ No OAuth URL received')
        return
      }
      
      addLog(`✅ OAuth URL generated successfully`)
      addLog(`   URL: ${data.url.substring(0, 100)}...`)
      
      // Step 4: Check if URL contains expected parameters
      const urlObj = new URL(data.url)
      addLog(`🔍 URL Analysis:`)
      addLog(`   Protocol: ${urlObj.protocol}`)
      addLog(`   Host: ${urlObj.host}`)
      addLog(`   Path: ${urlObj.pathname}`)
      addLog(`   Client ID: ${urlObj.searchParams.get('client_id') ? '✅ Present' : '❌ Missing'}`)
      addLog(`   Redirect URI: ${urlObj.searchParams.get('redirect_uri')}`)
      addLog(`   Response Type: ${urlObj.searchParams.get('response_type')}`)
      addLog(`   Scope: ${urlObj.searchParams.get('scope')}`)
      
      // Step 5: Test the OAuth flow
      addLog('🔄 Testing OAuth flow...')
      addLog('   Click the button below to test the actual OAuth flow')
      
    } catch (error) {
      addLog(`❌ Test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const startOAuthFlow = async () => {
    setLoading(true)
    addLog('🔄 Starting actual OAuth flow...')
    
    try {
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}?next=/dashboard`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      })
      
      if (error) {
        addLog(`❌ OAuth error: ${error.message}`)
        return
      }
      
      if (data?.url) {
        addLog('✅ Redirecting to Google OAuth...')
        window.location.href = data.url
      } else {
        addLog('❌ No OAuth URL received')
      }
    } catch (error) {
      addLog(`❌ OAuth flow failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OAuth Debug Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">OAuth Configuration Test</h2>
          
          <div className="space-y-4">
            <button
              onClick={testOAuthFlow}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test OAuth Configuration'}
            </button>
            
            <button
              onClick={startOAuthFlow}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
            >
              {loading ? 'Starting...' : 'Start OAuth Flow'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click "Test OAuth Configuration" to start.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="space-y-2 text-sm">
            <p>1. Check the logs above for any configuration issues</p>
            <p>2. Verify your Google OAuth Console settings</p>
            <p>3. Ensure redirect URIs are correctly configured</p>
            <p>4. Check Supabase Dashboard OAuth settings</p>
          </div>
        </div>
      </div>
    </div>
  )
} 