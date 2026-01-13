import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const body = await request.json()
  const { checkDate = new Date().toISOString().split('T')[0] } = body // Default to today

  try {
    // Get all active key dates that are approaching
    const { data: approachingDates, error: datesError } = await supabase
      .from('key_dates')
      .select(`
        *,
        customers!inner(name, domain)
      `)
      .eq('is_active', true)
      .gte('date_value', checkDate)
      .lte('date_value', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Within 30 days
      .order('date_value', { ascending: true })

    if (datesError) {
      return NextResponse.json({ error: datesError.message }, { status: 500 })
    }

    const results = []

    for (const keyDate of approachingDates || []) {
      const daysUntil = Math.ceil((new Date(keyDate.date_value).getTime() - new Date(checkDate).getTime()) / (1000 * 60 * 60 * 24))
      
      // Check if we should alert (within alert_days)
      if (daysUntil <= keyDate.alert_days && daysUntil >= 0) {
        // Check if we've already created an event for this date today
        const { data: existingLog } = await supabase
          .from('date_monitoring_log')
          .select('*')
          .eq('key_date_id', keyDate.id)
          .eq('check_date', checkDate)
          .single()

        if (!existingLog) {
          // Create event
          const eventTitle = `${keyDate.date_type.charAt(0).toUpperCase() + keyDate.date_type.slice(1)} approaching for ${keyDate.customers.name}`
          const eventDescription = `${keyDate.description || keyDate.date_type} is ${daysUntil} days away (${keyDate.date_value})`
          
          const { data: event, error: eventError } = await supabase
            .from('events')
            .insert({
              title: eventTitle,
              description: eventDescription,
              event_type: 'date_alert',
              customer_id: keyDate.customer_id,
              priority: daysUntil <= 7 ? 2 : 1, // High priority if within 7 days
              processed: false,
              event_date: new Date().toISOString(),
            })
            .select()
            .single()

          if (eventError) {
            console.error('Error creating event:', eventError)
            continue
          }

          // Create workflow if high priority
          let workflow = null
          if (daysUntil <= 7) {
            const { data: wf, error: wfError } = await supabase
              .from('workflows')
              .insert({ 
                event_id: event.id, 
                status: 'pending' 
              })
              .select()
              .single()
            
            if (!wfError) {
              workflow = wf
            }
          }

          // Log the monitoring check
          await supabase
            .from('date_monitoring_log')
            .insert({
              customer_id: keyDate.customer_id,
              key_date_id: keyDate.id,
              check_date: checkDate,
              days_until_date: daysUntil,
              event_created: true,
              event_id: event.id
            })

          results.push({
            keyDate,
            daysUntil,
            event,
            workflow
          })
        }
      }
    }

    return NextResponse.json({ 
      message: `Checked ${approachingDates?.length || 0} dates, created ${results.length} events`,
      results 
    })

  } catch (error) {
    console.error('Error checking approaching dates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 