'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestProfilePage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const testProfileAccess = async () => {
      try {
        console.log('🔍 Testing profile access...')
        
        // Test 1: Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('👤 User check:', { user: !!user, email: user?.email, error: userError?.message })
        
        // Test 2: Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('📝 Session check:', { session: !!session, error: sessionError?.message })
        
        // Test 3: Try to access profile
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          console.log('👤 Profile check:', { 
            profile: !!profile, 
            profileData: profile,
            error: profileError?.message,
            errorCode: profileError?.code 
          })
          
          // Test 4: Try to access profile by email
          const { data: profileByEmail, error: profileByEmailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .single()
          
          console.log('📧 Profile by email check:', { 
            profile: !!profileByEmail, 
            profileData: profileByEmail,
            error: profileByEmailError?.message,
            errorCode: profileByEmailError?.code 
          })
          
          setResults({
            user: { hasUser: !!user, email: user?.email, error: userError?.message },
            session: { hasSession: !!session, error: sessionError?.message },
            profile: { hasProfile: !!profile, data: profile, error: profileError?.message, errorCode: profileError?.code },
            profileByEmail: { hasProfile: !!profileByEmail, data: profileByEmail, error: profileByEmailError?.message, errorCode: profileByEmailError?.code }
          })
        } else {
          setResults({ error: 'No user found' })
        }
      } catch (error) {
        console.error('❌ Test failed:', error)
        setResults({ error: error })
      } finally {
        setLoading(false)
      }
    }
    
    testProfileAccess()
  }, [supabase])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Access Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  )
} 