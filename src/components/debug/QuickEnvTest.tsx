// Create this file: src/components/debug/QuickEnvTest.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function QuickEnvTest() {
  const [status, setStatus] = useState('Testing...')

  useEffect(() => {
    const test = async () => {
      try {
        // Test 1: Environment variables
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        console.log('🔍 Env Test:', { 
          hasUrl, 
          hasKey,
          urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
        })
        
        if (!hasUrl || !hasKey) {
          setStatus('❌ Missing environment variables')
          return
        }

        setStatus('✅ Environment variables found, testing connection...')

        // Test 2: Client creation
        const supabase = createClient()
        console.log('✅ Supabase client created')

        // Test 3: Simple connection test with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
        )

        const sessionPromise = supabase.auth.getSession()
        
        const result = await Promise.race([sessionPromise, timeoutPromise])
        
        setStatus('✅ All tests passed! Auth should work now.')
        console.log('✅ Full test successful, session result:', result)
        
      } catch (error) {
        console.error('❌ Test failed:', error)
        setStatus(`❌ Test failed: ${error}`)
      }
    }

    test()
  }, [])

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-800 mb-2">🧪 Environment & Connection Test</h4>
      <p className="text-sm text-blue-700">{status}</p>
      <p className="text-xs text-blue-600 mt-2">Check browser console for detailed logs</p>
    </div>
  )
}