'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestAuthPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    // Test basic connectivity
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        setConfig({
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSession: !!data.session,
          error: error?.message
        })
      } catch (err) {
        setConfig({ error: err })
      }
    }
    testConnection()
  }, [supabase])

  const handleSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        setMessage(`Sign up error: ${error.message}`)
      } else {
        setMessage(`Sign up successful! Check your email: ${data.user?.email}`)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setMessage(`Sign in error: ${error.message}`)
      } else {
        setMessage(`Sign in successful! User: ${data.user?.email}`)
        setUser(data.user)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setMessage(`Sign out error: ${error.message}`)
      } else {
        setMessage('Sign out successful!')
        setUser(null)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://127.0.0.1:3000/api/auth/callback'
        }
      })
      
      if (error) {
        setMessage(`Google sign in error: ${error.message}`)
      } else {
        setMessage('Google sign in initiated!')
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Auth Test Page</h1>
      
      {/* Configuration Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Configuration:</h2>
        <pre className="text-sm">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      {/* Current User */}
      {user && (
        <div className="mb-6 p-4 bg-green-100 rounded">
          <h2 className="font-semibold mb-2">Current User:</h2>
          <pre className="text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="mb-6 p-4 bg-blue-100 rounded">
          <p>{message}</p>
        </div>
      )}

      {/* Email/Password Form */}
      <div className="mb-6">
        <h2 className="font-semibold mb-4">Email/Password Test:</h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSignUp}
              className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign Up
            </button>
            <button
              onClick={handleSignIn}
              className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Google OAuth */}
      <div className="mb-6">
        <h2 className="font-semibold mb-4">Google OAuth Test:</h2>
        <button
          onClick={handleGoogleSignIn}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign in with Google
        </button>
      </div>

      {/* Sign Out */}
      {user && (
        <button
          onClick={handleSignOut}
          className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Sign Out
        </button>
      )}
    </div>
  )
} 