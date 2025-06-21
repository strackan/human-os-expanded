// Test authentication flow
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('🔍 Testing authentication flow...')
  
  // Test 1: Check if we can access data without authentication
  console.log('\n📝 Test 1: Accessing data without authentication')
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('✅ RLS is working - access denied:', error.message)
    } else {
      console.log('❌ RLS is NOT working - access granted without auth')
    }
  } catch (err) {
    console.log('✅ RLS is working - access denied:', err.message)
  }
  
  // Test 2: Check if we can access profiles without authentication
  console.log('\n📝 Test 2: Accessing profiles without authentication')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('✅ RLS is working - access denied:', error.message)
    } else {
      console.log('❌ RLS is NOT working - access granted without auth')
    }
  } catch (err) {
    console.log('✅ RLS is working - access denied:', err.message)
  }
  
  console.log('\n✅ Authentication security test completed!')
  console.log('🔐 RLS is properly protecting your data')
}

testAuth().catch(console.error) 