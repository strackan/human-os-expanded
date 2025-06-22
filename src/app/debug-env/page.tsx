'use client'

import { useState, useEffect } from 'react'

export default function DebugEnvPage() {
  const [envInfo, setEnvInfo] = useState<any>({})

  useEffect(() => {
    setEnvInfo({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      userAgent: navigator.userAgent,
      location: window.location.href,
      timestamp: new Date().toLocaleTimeString()
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Environment Debug</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Environment Variables:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-100 p-2 rounded">
              {JSON.stringify(envInfo, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold">Browser Info:</h3>
            <p className="text-sm text-gray-700">User Agent: {navigator.userAgent}</p>
            <p className="text-sm text-gray-700">Location: {window.location.href}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 