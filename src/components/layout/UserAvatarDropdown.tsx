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
  const { user, profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const getFirstName = () => {
    if (!user) return 'User'
    
    // Try to get name from profile first
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]
    }
    
    // Then try user metadata from Google OAuth
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
    
    if (profile?.full_name) {
      const names = profile.full_name.split(' ')
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
    setIsOpen(false)
    
    try {
      await signOut('global') // Sign out from all sessions
      console.log('✅ User avatar dropdown - Sign out completed')
    } catch (error) {
      console.error('❌ User avatar dropdown - Sign out error:', error)
      // Reopen the popover if signout failed
      setIsOpen(true)
    }
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
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={`${getFirstName()}'s avatar`}
              className="h-8 w-8 rounded-full object-cover"
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
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={`${getFirstName()}'s avatar`}
                className="h-10 w-10 rounded-full object-cover"
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
            onClick={() => {
              console.log('🔘 Settings button clicked')
              setIsOpen(false)
              // Add settings navigation here if needed
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            tabIndex={0}
          >
            <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400" />
            Settings
          </button>
          <button
            onClick={() => {
              console.log('🔘 Sign out button clicked')
              handleSignOut()
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            tabIndex={0}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400" />
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 