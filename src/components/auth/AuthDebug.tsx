'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AuthDebug() {
  const [debug, setDebug] = useState<any>({})
  const [isVisible, setIsVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const [sessionResult, userResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser()
      ])
      
      const cookies = document.cookie.split(';').map(c => c.trim())
      
      setDebug({
        hasSession: !!sessionResult.data.session,
        hasUser: !!userResult.data.user,
        userEmail: userResult.data.user?.email,
        sessionError: sessionResult.error?.message,
        userError: userResult.error?.message,
        authCookies: cookies.filter(c => c.includes('auth-token')),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        timestamp: new Date().toLocaleTimeString()
      })
    }
    
    checkAuth()
    
    // Refresh every 5 seconds
    const interval = setInterval(checkAuth, 5000)
    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs z-50"
      >
        Debug Auth
      </button>
      
      {isVisible && (
        <div className="fixed bottom-16 left-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Auth Debug</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      )}
    </>
  )
} 