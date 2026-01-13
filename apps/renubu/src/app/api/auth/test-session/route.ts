import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = performance.now()
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  try {
    // Test 1: Create Supabase client
    console.log('🧪 [TEST] Creating Supabase client...')
    const clientStart = performance.now()
    const supabase = await createClient()
    const clientDuration = performance.now() - clientStart

    results.tests.push({
      name: 'Create Supabase Client',
      success: true,
      durationMs: clientDuration.toFixed(2)
    })

    // Test 2: Get session
    console.log('🧪 [TEST] Testing getSession()...')
    const sessionStart = performance.now()

    const sessionPromise = supabase.auth.getSession()
    const sessionTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('getSession timeout')), 15000)
    )

    try {
      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        sessionTimeoutPromise
      ]) as any

      const sessionDuration = performance.now() - sessionStart

      results.tests.push({
        name: 'Get Session',
        success: !sessionError,
        durationMs: sessionDuration.toFixed(2),
        hasSession: !!session,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        error: sessionError?.message
      })

      // Test 3: Query profiles table (if authenticated)
      if (session?.user) {
        console.log('🧪 [TEST] Testing profiles table query...')
        const profileStart = performance.now()

        const profilePromise = supabase
          .from('profiles')
          .select('id, company_id, is_admin, status')
          .eq('id', session.user.id)
          .single()

        const profileTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('profiles query timeout')), 15000)
        )

        try {
          const { data: profile, error: profileError } = await Promise.race([
            profilePromise,
            profileTimeoutPromise
          ]) as any

          const profileDuration = performance.now() - profileStart

          results.tests.push({
            name: 'Query Profiles Table',
            success: !profileError,
            durationMs: profileDuration.toFixed(2),
            profile,
            error: profileError?.message
          })
        } catch (profileErr: any) {
          results.tests.push({
            name: 'Query Profiles Table',
            success: false,
            error: profileErr.message,
            isTimeout: profileErr.message?.includes('timeout')
          })
        }
      }

    } catch (sessionErr: any) {
      const sessionDuration = performance.now() - sessionStart
      results.tests.push({
        name: 'Get Session',
        success: false,
        durationMs: sessionDuration.toFixed(2),
        error: sessionErr.message,
        isTimeout: sessionErr.message?.includes('timeout')
      })
    }

    // Test 4: Simple database query (bypassing auth)
    console.log('🧪 [TEST] Testing simple database query...')
    const dbStart = performance.now()

    const dbPromise = supabase
      .from('workflow_definitions')
      .select('id, name')
      .limit(1)

    const dbTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('database query timeout')), 15000)
    )

    try {
      const { data, error } = await Promise.race([dbPromise, dbTimeoutPromise]) as any
      const dbDuration = performance.now() - dbStart

      results.tests.push({
        name: 'Simple Database Query',
        success: !error,
        durationMs: dbDuration.toFixed(2),
        recordCount: data?.length || 0,
        error: error?.message
      })
    } catch (dbErr: any) {
      const dbDuration = performance.now() - dbStart
      results.tests.push({
        name: 'Simple Database Query',
        success: false,
        durationMs: dbDuration.toFixed(2),
        error: dbErr.message,
        isTimeout: dbErr.message?.includes('timeout')
      })
    }

  } catch (err: any) {
    results.fatalError = {
      message: err.message,
      stack: err.stack
    }
  }

  const totalDuration = performance.now() - startTime
  results.totalDurationMs = totalDuration.toFixed(2)
  results.summary = {
    totalTests: results.tests.length,
    passed: results.tests.filter((t: any) => t.success).length,
    failed: results.tests.filter((t: any) => !t.success).length,
    timeouts: results.tests.filter((t: any) => t.isTimeout).length
  }

  console.log('🧪 [TEST] Test results:', results)

  return NextResponse.json(results, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
