import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  try {
    // Add sample customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: 'Acme Corporation',
        domain: 'acme.com',
        industry: 'Technology',
        tier: 'enterprise',
        health_score: 75,
        primary_contact_name: 'John Smith',
        primary_contact_email: 'john.smith@acme.com'
      })
      .select()
      .single()

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 })
    }

    // Add sample customer properties
    const { data: properties, error: propertiesError } = await supabase
      .from('customer_properties')
      .insert({
        customer_id: customer.id,
        usage_score: 85,
        health_score: 75,
        nps_score: 8,
        current_arr: 50000.00,
        expansion_potential: 15000.00,
        risk_level: 'low'
      })
      .select()
      .single()

    if (propertiesError) {
      return NextResponse.json({ error: propertiesError.message }, { status: 500 })
    }

    // Add sample key dates (some approaching, some not)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const nextMonth = new Date(today)
    nextMonth.setDate(nextMonth.getDate() + 30)
    
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 90)

    const keyDates = [
      {
        customer_id: customer.id,
        date_type: 'renewal',
        date_value: tomorrow.toISOString().split('T')[0],
        description: 'Contract renewal date',
        alert_days: 30
      },
      {
        customer_id: customer.id,
        date_type: 'review',
        date_value: nextWeek.toISOString().split('T')[0],
        description: 'Quarterly business review',
        alert_days: 14
      },
      {
        customer_id: customer.id,
        date_type: 'expansion',
        date_value: nextMonth.toISOString().split('T')[0],
        description: 'Expansion opportunity discussion',
        alert_days: 30
      },
      {
        customer_id: customer.id,
        date_type: 'end',
        date_value: futureDate.toISOString().split('T')[0],
        description: 'Contract end date',
        alert_days: 60
      }
    ]

    const { data: dates, error: datesError } = await supabase
      .from('key_dates')
      .insert(keyDates)
      .select()

    if (datesError) {
      return NextResponse.json({ error: datesError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Sample data added successfully',
      customer,
      properties,
      keyDates: dates
    })

  } catch (error) {
    console.error('Error adding sample data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 