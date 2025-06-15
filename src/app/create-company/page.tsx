'use client'

import { useState } from 'react'

export default function CreateCompanyPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const createCompany = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-company', { method: 'POST' })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Request failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create Company</h1>
      
      <button
        onClick={createCompany}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Company'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
} 