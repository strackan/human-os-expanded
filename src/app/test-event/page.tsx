"use client"

import { useState } from 'react'

export default function TestEventPage() {
  const [message, setMessage] = useState('')
  const [value, setValue] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, value: Number(value) })
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
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold mb-2">Test Event Prioritization</h2>
        <div>
          <label className="block mb-1 font-medium">Message</label>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="Enter event message"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Value (integer)</label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="Enter value (integer)"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Event'}
        </button>
        {error && <div className="text-red-600 mt-2">Error: {error}</div>}
        {result && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <div><b>Event:</b> {JSON.stringify(result.event, null, 2)}</div>
            {result.workflow && <div className="mt-2 text-green-700"><b>Workflow created:</b> {JSON.stringify(result.workflow, null, 2)}</div>}
            {!result.workflow && <div className="mt-2 text-gray-600">No workflow created (priority not high)</div>}
          </div>
        )}
      </form>
    </div>
  )
} 