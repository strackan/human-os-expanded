"use client"

import { useState } from "react"
import { authService } from "@/lib/auth-service"

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  email?: string
}

export default function PasswordResetModal({ isOpen, onClose, email = "" }: PasswordResetModalProps) {
  const [resetEmail, setResetEmail] = useState(email)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const minPasswordLength = authService.getMinPasswordLength()

  const handleResetPassword = async () => {
    // Validate inputs
    if (!resetEmail || !newPassword || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (newPassword.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters long`)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🔐 Starting password reset for:", resetEmail)
      console.log("🔐 New password length:", newPassword.length)
      
      // Call the auth service to update the password
      const result = await authService.updatePassword(resetEmail, newPassword)
      
      console.log("🔐 Password reset result:", result)
      
      if (result.success) {
        console.log("✅ Password reset successful")
        setSuccess(true)
        
        // Clear form
        setResetEmail("")
        setNewPassword("")
        setConfirmPassword("")
        
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 3000)
      } else {
        console.error("❌ Password reset failed:", result.error)
        setError(result.error || "Failed to reset password. Please try again.")
      }
      
    } catch (error) {
      console.error("❌ Password reset error:", error)
      setError("Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setResetEmail("")
      setNewPassword("")
      setConfirmPassword("")
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successful!</h3>
            <p className="text-sm text-gray-600">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Since email verification isn't working yet, you can reset your password directly here.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder={`Enter new password (min ${minPasswordLength} characters)`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

                             <div className="flex gap-3 pt-2">
                 <button
                   type="button"
                   onClick={handleResetPassword}
                   disabled={isLoading || !resetEmail || !newPassword || !confirmPassword}
                   className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {isLoading ? (
                     <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                   ) : (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                     </svg>
                   )}
                   Reset Password
                 </button>
                 <button
                   type="button"
                   onClick={handleClose}
                   disabled={isLoading}
                   className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                 >
                   Cancel
                 </button>
               </div>
               
               {success && (
                 <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                   <p className="text-xs text-blue-800 mb-2">
                     <strong>Debug Info:</strong> You can test the authentication by trying to sign in with the new password.
                   </p>
                   <button
                     type="button"
                     onClick={async () => {
                       try {
                         const response = await fetch('/api/auth/check-user', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ email: resetEmail, password: newPassword })
                         })
                         const result = await response.json()
                         console.log('🔍 Debug check result:', result)
                         alert(`User exists: ${result.exists}\nAuthenticated: ${result.authenticated}\nError: ${result.error || 'None'}`)
                       } catch (error) {
                         console.error('Debug check failed:', error)
                         alert('Debug check failed')
                       }
                     }}
                     className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                   >
                     Test Authentication
                   </button>
                 </div>
               )}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Note:</strong> This is a temporary solution while email verification is being set up. 
                In production, password resets should be done via email verification links.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
