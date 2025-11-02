import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Active Pieces webhook URL
const WEBHOOK_URL = 'https://cloud.activepieces.com/api/v1/webhooks/t5lf6IkC96XmCXQnzifiE/test'

// Calculate days until renewal
function calculateDaysUntilRenewal(renewalDate: string): number {
  const renewal = new Date(renewalDate + 'T00:00:00.000Z')
  const today = new Date()
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  
  const timeDifference = renewal.getTime() - todayUTC.getTime()
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24))
}

// Calculate renewal time urgency based on your existing logic
function calculateRenewalTimeUrgency(daysUntilRenewal: number): number {
  if (daysUntilRenewal < 90) {
    return 3 // critical
  } else if (daysUntilRenewal <= 105) {
    return 2 // monitor
  } else if (daysUntilRenewal <= 120) {
    return 1 // normal
  } else {
    return 0 // snooze
  }
}

// Get urgency label and status
function getUrgencyInfo(urgencyLevel: number) {
  const urgencyMap = {
    0: { label: 'SNOOZE', status: 'NORMAL', description: 'Long-term monitoring' },
    1: { label: 'NORMAL', status: 'NORMAL', description: 'Standard renewal timeline' },
    2: { label: 'MONITOR', status: 'MONITOR', description: 'Increase attention' },
    3: { label: 'CRITICAL', status: 'ESCALATED', description: 'Immediate action required' }
  }
  return urgencyMap[urgencyLevel as keyof typeof urgencyMap]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const supabase = await createClient()
    
    // Get the specific customer from the database
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, name, renewal_date')
      .eq('id', customerId)
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch customer', details: error.message },
        { status: 500 }
      )
    }
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (!customer.renewal_date) {
      return NextResponse.json(
        { error: 'Customer has no renewal date set' },
        { status: 400 }
      )
    }
    
    // Calculate urgency data
    const daysUntilRenewal = calculateDaysUntilRenewal(customer.renewal_date)
    const renewalTimeUrgency = calculateRenewalTimeUrgency(daysUntilRenewal)
    const urgencyInfo = getUrgencyInfo(renewalTimeUrgency)
    const todayDate = new Date().toISOString().split('T')[0]
    
    // Create payload with specific customer data - matching original format exactly
    const payload = {
      // Original fields (matching the HTML version)
      customer_id: customer.id,
      customer_name: customer.name,
      renewal_date: customer.renewal_date,
      triggered_at: new Date().toISOString(),
      source: "renubu_manual_trigger",
      
      // Calculated fields (matching the HTML version)
      today_date: todayDate,
      days_until_renewal: daysUntilRenewal,
      renewal_time_urgency: renewalTimeUrgency,
      renewal_status: urgencyInfo.status,
      urgency_label: urgencyInfo.label,
      urgency_description: urgencyInfo.description,
      calculated_at: new Date().toISOString()
    }
    
    // Debug log the complete payload (matching original)
    console.log('Complete payload being created:', JSON.stringify(payload, null, 2))
    console.log('Payload field count:', Object.keys(payload).length)
    
    // Send to Active Pieces webhook
    try {
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Renubu-Manual-Trigger/1.0'
        },
        body: JSON.stringify(payload)
      })
      
      let responseText = ''
      let responseData = null
      
      try {
        responseText = await webhookResponse.text()
        if (responseText) {
          responseData = JSON.parse(responseText)
        }
      } catch {
        console.log('Response is not valid JSON:', responseText)
        responseData = { raw_response: responseText }
      }
      
      return NextResponse.json({
        success: webhookResponse.ok,
        payload,
        webhook_status: webhookResponse.status,
        webhook_response: responseData || responseText,
        customer_source: 'specific_customer'
      })
      
    } catch (webhookError) {
      return NextResponse.json({
        success: false,
        payload,
        error: 'Failed to send webhook',
        details: webhookError instanceof Error ? webhookError.message : 'Unknown webhook error',
        customer_source: 'specific_customer'
      })
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}