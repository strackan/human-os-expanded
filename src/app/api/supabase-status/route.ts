import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET() {
  const status = {
    environment: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      node_env: process.env.NODE_ENV,
      is_local: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost'),
    },
    connection: {
      status: 'Unknown',
      error: null as string | null,
    },
    database: {
      status: 'Unknown',
      tables: [] as string[],
      error: null as string | null,
    },
    auth: {
      status: 'Unknown',
      providers: [] as string[],
      error: null as string | null,
    }
  }

  // Test connection
  try {
    const supabase = createServiceRoleClient()
    
    // Test basic connection
    const { error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      status.connection.status = 'Error'
      status.connection.error = error.message
    } else {
      status.connection.status = 'Connected'
    }

    // Test database access - use raw SQL to get table list
    try {
      const { data: tables, error: dbError } = await supabase
        .rpc('get_tables')
        .select('*')
      
      if (dbError) {
        // Fallback to direct query
        const { error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
        
        if (fallbackError) {
          status.database.status = 'Error'
          status.database.error = fallbackError.message
        } else {
          status.database.status = 'Connected'
          status.database.tables = ['profiles'] // At least we know this table exists
        }
      } else {
        status.database.status = 'Connected'
        status.database.tables = tables?.map(t => t.table_name) || ['profiles']
      }
    } catch (dbError) {
      status.database.status = 'Error'
      status.database.error = dbError instanceof Error ? dbError.message : 'Unknown database error'
    }

    // Test auth configuration
    try {
      const { error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        status.auth.status = 'Error'
        status.auth.error = authError.message
      } else {
        status.auth.status = 'Connected'
        // Check for configured providers (this would need to be done differently in production)
        status.auth.providers = ['email', 'google'] // Assuming these are configured
      }
    } catch (authError) {
      status.auth.status = 'Error'
      status.auth.error = authError instanceof Error ? authError.message : 'Unknown auth error'
    }

  } catch (error) {
    status.connection.status = 'Error'
    status.connection.error = error instanceof Error ? error.message : 'Unknown connection error'
  }

  return NextResponse.json(status)
} 