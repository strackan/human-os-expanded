'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthSimplePage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const testOAuth = async () => {
    setLoading(true)
    setMessage('🔄 Testing OAuth flow...')
    
    try {
      console.log('🔐 Starting OAuth test...')
      console.log('📝 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}?next=/dashboard`,
        }
      })
      
      if (error) {
        console.error('❌ OAuth error:', error)
        setMessage(`❌ OAuth error: ${error.message}`)
        return
      }
      
      if (data?.url) {
        console.log('✅ OAuth URL generated:', data.url)
        setMessage(`✅ OAuth URL generated successfully`)
        
        // Parse and show the OAuth URL details
        const urlObj = new URL(data.url)
        const redirectUri = urlObj.searchParams.get('redirect_uri')
        const clientId = urlObj.searchParams.get('client_id')
        const responseType = urlObj.searchParams.get('response_type')
        const scope = urlObj.searchParams.get('scope')
        
        setMessage(prev => prev + `\n\n📝 OAuth URL Analysis:`)
        setMessage(prev => prev + `\n   Redirect URI: ${redirectUri}`)
        setMessage(prev => prev + `\n   Client ID: ${clientId}`)
        setMessage(prev => prev + `\n   Response Type: ${responseType}`)
        setMessage(prev => prev + `\n   Scope: ${scope}`)
        
        // Show what should be configured in Google Console
        setMessage(prev => prev + `\n\n🔧 Required Google OAuth Console Settings:`)
        setMessage(prev => prev + `\n   Authorized Redirect URIs should include:`)
        setMessage(prev => prev + `\n   - ${redirectUri}`)
        
        // Ask user if they want to proceed
        if (confirm('OAuth URL generated successfully. Do you want to proceed with the OAuth flow?')) {
          window.location.href = data.url
        }
      } else {
        setMessage('❌ No OAuth URL received')
      }
    } catch (error) {
      console.error('❌ Test failed:', error)
      setMessage(`❌ Test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">OAuth Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testOAuth}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test OAuth Configuration'}
          </button>
          
          {message && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono whitespace-pre-wrap">
              {message}
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Expected Configuration:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Google OAuth Console should have redirect URI: <code>https://uuvdjjclwwulvyeboavk.supabase.co/auth/v1/callback</code></li>
              <li>Supabase Dashboard should have Google OAuth enabled</li>
              <li>Client ID and Secret should be correctly configured</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 