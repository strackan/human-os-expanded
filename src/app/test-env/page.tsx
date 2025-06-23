'use client'

import { useState } from 'react'

export default function TestEnvPage() {
  const [envInfo, setEnvInfo] = useState<any>({})

  const checkEnv = () => {
    const info = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'missing',
      NODE_ENV: process.env.NODE_ENV,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
    }
    setEnvInfo(info)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Environment Test</h1>
      
      <button
        onClick={checkEnv}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-6"
      >
        Check Environment Variables
      </button>

      {Object.keys(envInfo).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {envInfo.NEXT_PUBLIC_SUPABASE_URL || 'missing'}</p>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {envInfo.NEXT_PUBLIC_SUPABASE_ANON_KEY}</p>
            <p><strong>NODE_ENV:</strong> {envInfo.NODE_ENV}</p>
            <p><strong>Has URL:</strong> {envInfo.hasUrl ? '✅' : '❌'}</p>
            <p><strong>Has Key:</strong> {envInfo.hasKey ? '✅' : '❌'}</p>
            <p><strong>URL Length:</strong> {envInfo.urlLength}</p>
            <p><strong>Key Length:</strong> {envInfo.keyLength}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
        <div className="space-y-2">
          <p>1. Verify environment variables are loaded correctly</p>
          <p>2. Check that Supabase URL points to your local instance</p>
          <p>3. Ensure the anon key matches your local Supabase project</p>
          <p>4. Try the simple auth test at <a href="/test-simple-auth" className="text-blue-600 hover:underline">/test-simple-auth</a></p>
        </div>
      </div>
    </div>
  )
} 