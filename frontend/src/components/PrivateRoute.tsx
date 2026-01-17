// PrivateRoute.tsx — Guard component for routes that require authentication
// Behavior:
// - Shows a loader while auth state is resolving
// - Redirects to /login when there is no authenticated user/session
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Loader2 } from 'lucide-react'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth()
  
  // Wait for auth to finish loading before making decision
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }
  
  // If no token/user, redirect to login
  if (!token || !user) return <Navigate to="/login" replace />
  
  return <>{children}</>
}
