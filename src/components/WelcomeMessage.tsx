// /src/components/WelcomeMessage.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function WelcomeMessage() {
  const [firstName, setFirstName] = useState<string>('User')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFirstName() {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setFirstName('User')
          setLoading(false)
          return
        }

        // Get profile (only has full_name, not first_name)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        // If profile has full_name, parse first name from it
        if (!profileError && profile?.full_name) {
          const name = profile.full_name.split(' ')[0]
          if (name) {
            setFirstName(name)
            setLoading(false)
            return
          }
        }

        // Fallback: extract from user auth metadata
        if (user.user_metadata?.name) {
          const name = user.user_metadata.name.split(' ')[0]
          if (name) {
            setFirstName(name)
            setLoading(false)
            return
          }
        }

        if (user.user_metadata?.full_name) {
          const name = user.user_metadata.full_name.split(' ')[0]
          if (name) {
            setFirstName(name)
            setLoading(false)
            return
          }
        }

        // Last resort: use email prefix
        if (user.email) {
          const emailPrefix = user.email.split('@')[0]
          setFirstName(emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1))
        }
        
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