'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useEffect, useState } from 'react'

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/debug-session')
        const data = await response.json()
        setSessionData(data)
      } catch (error) {
        console.error('Failed to check session:', error)
      }
    }

    checkSession()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Auth Provider State:</h2>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>User: {user ? user.email : 'None'}</p>
          <p>User ID: {user?.id || 'None'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Session API State:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Actions:</h2>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/customers'}
            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          >
            Go to Customers
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}
