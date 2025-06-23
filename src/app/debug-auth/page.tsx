// Debug page to test auth state
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const { user, loading } = useAuth()
  const [clientUser, setClientUser] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      setClientUser(user)
      setCookies(document.cookie)
    }
    checkAuth()
  }, [supabase])

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Auth Provider State:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify({ user: user?.email, loading }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Client Auth State:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify({ user: clientUser?.email }, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Browser Cookies:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {cookies || 'No cookies'}
          </pre>
        </div>

        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}