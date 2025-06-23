'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase'

export default function TestSignOutPage() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const testSignOut = async () => {
    setLoading(true)
    setMessage('🔄 Testing sign out...')
    
    try {
      // Test the AuthProvider signOut
      await signOut()
      setMessage('✅ AuthProvider signOut completed')
      
      // Verify session is cleared
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setMessage(prev => prev + '\n✅ Session verified as cleared')
        } else {
          setMessage(prev => prev + '\n❌ Session still exists')
        }
      }, 1000)
      
    } catch (error) {
      setMessage(`❌ Sign out failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testDirectSignOut = async () => {
    setLoading(true)
    setMessage('🔄 Testing direct Supabase sign out...')
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setMessage(`❌ Direct sign out failed: ${error.message}`)
      } else {
        setMessage('✅ Direct sign out completed')
        
        // Verify session is cleared
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            setMessage(prev => prev + '\n✅ Session verified as cleared')
          } else {
            setMessage(prev => prev + '\n❌ Session still exists')
          }
        }, 1000)
      }
    } catch (error) {
      setMessage(`❌ Direct sign out failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const clearCookies = () => {
    const cookies = document.cookie.split(";")
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })
    setMessage('✅ All cookies cleared')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sign Out Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Current State</h2>
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <p><strong>User:</strong> {user ? user.email : 'None'}</p>
          <p><strong>User ID:</strong> {user?.id || 'None'}</p>
          <p><strong>Cookies:</strong> {document.cookie.split(';').filter(c => c.trim()).length}</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={testSignOut}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test AuthProvider Sign Out
        </button>
        
        <button
          onClick={testDirectSignOut}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Direct Supabase Sign Out
        </button>
        
        <button
          onClick={clearCookies}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Clear All Cookies
        </button>
        
        <a
          href="/login"
          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded inline-block text-center"
        >
          Go to Login Page
        </a>
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