import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const body = await request.json()
  const { message, value } = body

  if (typeof value !== 'number' || typeof message !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Prioritization rule
  const priority = value > 5 ? 2 : 1

  // Insert event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      title: message,
      description: message,
      event_type: 'test',
      priority,
      processed: false,
      event_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 })
  }

  let workflow = null
  if (priority === 2) {
    // Create workflow for high priority
    const { data: wf, error: wfError } = await supabase
      .from('workflows')
      .insert({ event_id: event.id, status: 'pending' })
      .select()
      .single()
    if (wfError) {
      return NextResponse.json({ error: wfError.message }, { status: 500 })
    }
    workflow = wf
  }

  return NextResponse.json({ event, workflow })
} 