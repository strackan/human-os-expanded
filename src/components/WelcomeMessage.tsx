// /src/components/WelcomeMessage.tsx
'use client'

import { useState, useEffect } from 'react'
import { userApi } from '@/lib/api-client/user'

export default function WelcomeMessage() {
  const [firstName, setFirstName] = useState<string>('User')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFirstName() {
      try {
        const { data, error } = await userApi.getProfile()

        if (error || !data) {
          setFirstName('User')
          setLoading(false)
          return
        }

        setFirstName(data.firstName || 'User')
        setLoading(false)
      } catch (error) {
        console.error('Error loading first name:', error)
        setFirstName('User')
        setLoading(false)
      }
    }

    loadFirstName()
  }, [])

  if (loading) {
    return <span>Welcome back...</span>
  }

  return <span>Welcome back, {firstName}</span>
}