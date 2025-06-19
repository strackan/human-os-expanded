"use client"

import { useState } from 'react'

export default function TestDateMonitoringPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const addSampleData = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      // Add sample customer and key dates
      const customerRes = await fetch('/api/add-sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await customerRes.json()
      if (!customerRes.ok) {
        throw new Error(data.error || 'Failed to add sample data')
      }
      
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkApproachingDates = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const res = await fetch('/api/check-approaching-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          checkDate: new Date().toISOString().split('T')[0] 
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold mb-4">Test Date Monitoring System</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Step 1: Add Sample Data</h3>
            <p className="text-gray-600 mb-2">
              This will add a sample customer and key dates to test the monitoring system.
            </p>
            <button
              onClick={addSampleData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Sample Data'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Step 2: Check Approaching Dates</h3>
            <p className="text-gray-600 mb-2">
              This will check for any key dates that are approaching and create events/workflows.
            </p>
            <button
              onClick={checkApproachingDates}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Approaching Dates'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <h4 className="font-semibold mb-2">Result:</h4>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ul className="text-sm space-y-1">
            <li>• Key dates are stored in the <code>key_dates</code> table</li>
            <li>• The system checks for dates within 30 days of today</li>
            <li>• If a date is within the <code>alert_days</code> window, an event is created</li>
            <li>• If the date is within 7 days, a workflow is also created</li>
            <li>• The system prevents duplicate events for the same date on the same day</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 