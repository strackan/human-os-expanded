// /src/app/test-update/page.tsx - TEMPORARY TEST PAGE
'use client'

import { useState } from 'react'

export default function TestUpdatePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const updateProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/update-profile-name', { method: 'POST' })
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
      <h1 className="text-2xl font-bold mb-4">Update Profile Name</h1>
      
      <button
        onClick={updateProfile}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update Profile Name'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}