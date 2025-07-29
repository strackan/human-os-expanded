'use client'

import { useState, useEffect } from 'react'

export default function DebugAuthPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDebug = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/debug')
      const data = await response.json()
      setDebugData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDebug()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Authentication Debug</h1>
      
      <div className="mb-6">
        <button 
          onClick={runDebug}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Running Debug...' : 'Run Debug Again'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {debugData && (
        <div className="space-y-6">
          {/* Environment Info */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Environment</h2>
            <pre className="text-sm">{JSON.stringify(debugData.environment, null, 2)}</pre>
          </div>

          {/* Cookie Information */}
          <div className="bg-blue-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Cookies</h2>
            <div className="mb-2">
              <strong>Total Cookies:</strong> {debugData.cookies.total}
            </div>
            <div className="mb-2">
              <strong>All Cookie Names:</strong>
              <ul className="list-disc list-inside ml-4">
                {debugData.cookies.allNames.map((name: string, index: number) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            </div>
            <div className="mb-2">
              <strong>Supabase Cookies:</strong>
              <ul className="list-disc list-inside ml-4">
                {debugData.cookies.supabase.map((cookie: any, index: number) => (
                  <li key={index}>{cookie.name}: {cookie.value}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Auth Cookies Check:</strong>
              <pre className="text-sm mt-2">{JSON.stringify(debugData.cookies.authCookies, null, 2)}</pre>
            </div>
          </div>

          {/* Manual Validation */}
          <div className="bg-green-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Manual Token Validation</h2>
            <div className="mb-2">
              <strong>Valid:</strong> {debugData.manualValidation.isValid ? '✅ Yes' : '❌ No'}
            </div>
            <div className="mb-2">
              <strong>Error:</strong> {debugData.manualValidation.error || 'None'}
            </div>
            <div className="mb-2">
              <strong>Has Token:</strong> {debugData.manualValidation.hasToken ? '✅ Yes' : '❌ No'}
            </div>
            {debugData.manualValidation.user && (
              <div>
                <strong>User:</strong> {debugData.manualValidation.user.email} ({debugData.manualValidation.user.id})
              </div>
            )}
          </div>

          {/* Standard Methods */}
          <div className="bg-yellow-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Standard Supabase Methods</h2>
            <div className="mb-2">
              <strong>Session:</strong> {debugData.standardMethods.session ? 
                `✅ ${debugData.standardMethods.session.user} (expires: ${debugData.standardMethods.session.expiresAt})` : 
                '❌ None'
              }
            </div>
            <div className="mb-2">
              <strong>Session Error:</strong> {debugData.standardMethods.sessionError || 'None'}
            </div>
            <div className="mb-2">
              <strong>User:</strong> {debugData.standardMethods.user ? 
                `✅ ${debugData.standardMethods.user.email} (${debugData.standardMethods.user.id})` : 
                '❌ None'
              }
            </div>
            <div className="mb-2">
              <strong>User Error:</strong> {debugData.standardMethods.userError || 'None'}
            </div>
            <div className="mb-2">
              <strong>Validation:</strong> {debugData.standardMethods.validation.isValid ? '✅ Valid' : '❌ Invalid'}
            </div>
            <div>
              <strong>Validation Error:</strong> {debugData.standardMethods.validation.error || 'None'}
            </div>
          </div>

          {/* Fresh Client Test */}
          <div className="bg-purple-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Fresh Client Test</h2>
            <div className="mb-2">
              <strong>Session:</strong> {debugData.freshClient.session ? 
                `✅ ${debugData.freshClient.session.user} (expires: ${debugData.freshClient.session.expiresAt})` : 
                '❌ None'
              }
            </div>
            <div>
              <strong>Error:</strong> {debugData.freshClient.error || 'None'}
            </div>
          </div>

          {/* Raw Data */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Raw Debug Data</h2>
            <pre className="text-xs overflow-auto">{JSON.stringify(debugData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
} 