"use client"

import { useAuth } from '@/components/auth/AuthProvider'
import { useState, useEffect } from 'react'

export default function TestSignoutPage() {
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [signoutCompleted, setSignoutCompleted] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    addLog('Starting signout process...')
    
    try {
      addLog('Calling signOut function...')
      await signOut('global')
      addLog('Signout completed successfully')
      setSignoutCompleted(true)
    } catch (error) {
      addLog(`Signout error: ${error}`)
      setIsSigningOut(false)
    }
  }

  // Reset signout completed state when user changes
  useEffect(() => {
    if (user && signoutCompleted) {
      setSignoutCompleted(false)
    }
  }, [user, signoutCompleted])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Test Signout</h1>
        
        {signoutCompleted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-green-800 mb-2">✅ Signout Successful!</h2>
            <p className="text-green-700 mb-4">
              You have been successfully signed out. The page detected that you are no longer authenticated.
            </p>
            <a href="/signin" className="text-blue-600 hover:underline">Go to signin</a>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">⚠️ Not Signed In</h2>
            <p className="text-yellow-700 mb-4">
              You need to be signed in to test signout functionality.
            </p>
            <a href="/signin" className="text-blue-600 hover:underline">Go to signin</a>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Signout Logs</h2>
            <div className="bg-white rounded p-4 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Test Signout</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Current User</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Provider:</strong> {user.app_metadata?.provider || 'Unknown'}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Signout Test</h2>
        <p className="text-gray-600 mb-4">
          Click the button below to test the signout functionality. You will be immediately signed out and redirected.
        </p>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isSigningOut ? 'Signing out...' : 'Test Signout'}
        </button>
      </div>

      <div className="bg-gray-100 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-4">Logs</h2>
        <div className="bg-white rounded p-4 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Click the signout button to start testing.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 