'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'

export default function AuthSuccess() {
  const { user, loading } = useAuth()
  const [clientCheck, setClientCheck] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    const checkAuthState = async () => {
      const supabase = createClient()
      
      // Check auth state
      const userResult = await supabase.auth.getUser()
      const sessionResult = await supabase.auth.getSession()
      
      setClientCheck({
        user: userResult.data.user?.email,
        userError: userResult.error?.message,
        hasSession: !!sessionResult.data.session,
        sessionError: sessionResult.error?.message
      })
      
      // Get all cookies
      setCookies(document.cookie)
    }
    
    checkAuthState()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Success Debug</h1>
      
      <div className="space-y-6">
        <div className="p-4 border rounded bg-green-50">
          <h2 className="font-semibold mb-2">AuthProvider State:</h2>
          <pre className="text-sm">
            {JSON.stringify({ user: user?.email, loading }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded bg-blue-50">
          <h2 className="font-semibold mb-2">Direct Client Check:</h2>
          <pre className="text-sm">
            {JSON.stringify(clientCheck, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">All Cookies:</h2>
          <pre className="text-xs break-all">
            {cookies || 'No cookies'}
          </pre>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => window.location.href = '/tasks/do'}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go to Tasks
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}