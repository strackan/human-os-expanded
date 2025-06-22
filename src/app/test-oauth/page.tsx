'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [debug, setDebug] = useState<any>({})
  const supabase = createClient()

  const handleTestOAuth = async () => {
    setLoading(true)
    setDebug({})
    
    try {
      console.log('🔍 Testing OAuth flow...')
      console.log('📝 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('📝 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
      
      const callbackUrl = `${location.origin}/api/auth/callback`
      
      console.log('🔐 Creating OAuth URL with callback:', callbackUrl)
      
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
      
      console.log('📝 OAuth response:', { data, error })
      
      setDebug({
        hasData: !!data,
        hasUrl: !!data?.url,
        url: data?.url,
        error: error?.message,
        timestamp: new Date().toLocaleTimeString()
      })
      
      if (error) {
        console.error('❌ OAuth error:', error)
        throw error
      }
      
      if (data?.url) {
        console.log('🔗 OAuth URL generated:', data.url)
        console.log('🔄 Redirecting immediately...')
        
        // Redirect immediately
        window.location.href = data.url
      } else {
        console.error('❌ No OAuth URL received')
        throw new Error('No OAuth URL received')
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      setDebug(prev => ({ ...prev, error: error instanceof Error ? error.message : String(error) }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">OAuth Test</h1>
        
        <button
          onClick={handleTestOAuth}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : null}
          Test Google OAuth
        </button>
        
        {Object.keys(debug).length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Check browser console for detailed logs</p>
        </div>
      </div>
    </div>
  )
} 