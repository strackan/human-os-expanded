'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function UserAvatarDropdown() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const router = useRouter()

  const getFirstName = () => {
    if (!user) return 'User'

    // Try user metadata from Google OAuth
    if (user?.user_metadata) {
      const metadata = user.user_metadata
      const name = metadata.given_name ||
                  metadata.name?.split(' ')[0] ||
                  metadata.full_name?.split(' ')[0]

      if (name) {
        return name
      }
    }

    // Fallback to email username if no name found
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0]
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    }

    return 'User'
  }

  const getUserInitials = () => {
    if (!user) return 'U'

    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    if (user?.user_metadata?.name) {
      const names = user.user_metadata.name.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    if (user?.email) {
      return user.email[0].toUpperCase()
    }

    return 'U'
  }

  const handleSignOut = async () => {
    console.log('🔐 User avatar dropdown - Sign out clicked')
    setIsSigningOut(true)
    setIsOpen(false)
    
    try {
      // Call signOut - this will handle client-side signout and form submission
      await signOut()
      console.log('✅ User avatar dropdown - Sign out completed')
      // The signOut function handles the form submission and server-side redirect
      // Keep the loading state active until the page actually redirects
    } catch (error) {
      console.error('❌ User avatar dropdown - Sign out error:', error)
      // Even if there's an error, try to redirect manually
      if (typeof window !== 'undefined') {
        window.location.href = `${window.location.origin}/signin`
      }
      // Reset loading state on error
      setIsSigningOut(false)
    }
  }

  const handleSettings = () => {
    console.log('🔘 Settings button clicked')
    setIsOpen(false)
    router.push('/settings')
  }

  const handleAvatarError = () => {
    console.log('🖼️ Avatar image failed to load, falling back to initials')
    setAvatarError(true)
  }

  if (!user) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="User menu"
          tabIndex={0}
          onClick={() => {
            console.log('🔘 Avatar button clicked, current isOpen:', isOpen)
          }}
        >
          {user.user_metadata?.avatar_url && !avatarError ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={`${getFirstName()}'s avatar`}
              className="h-8 w-8 rounded-full object-cover"
              onError={handleAvatarError}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {getUserInitials()}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 z-50" align="end">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {user.user_metadata?.avatar_url && !avatarError ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={`${getFirstName()}'s avatar`}
                className="h-10 w-10 rounded-full object-cover"
                onError={handleAvatarError}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{getFirstName()}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="py-1">
          <button
            onClick={handleSettings}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            tabIndex={0}
          >
            <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400" />
            Settings
          </button>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            tabIndex={0}
          >
            {isSigningOut ? (
              <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full mr-3"></div>
            ) : (
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400" />
            )}
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 