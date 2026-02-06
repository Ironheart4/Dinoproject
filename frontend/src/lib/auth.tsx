// ============================================================================
// auth.tsx — Authentication Context & Hook for DinoProject
// ============================================================================
// PURPOSE: Manages user authentication state across the entire app.
// Uses React Context to provide auth data to any component that needs it.
//
// KEY CONCEPTS:
// 1. Supabase handles the actual login/register (email/password auth)
// 2. Our backend stores extended user data (name, role, subscription)
// 3. This context combines both to give components full user info
//
// HOW IT WORKS:
// 1. On app load, checks if user has existing Supabase session
// 2. If yes, fetches extended profile from our backend (/api/auth/me)
// 3. Stores combined user data in React state
// 4. Provides login/register/logout functions
//
// USAGE EXAMPLE:
//   function MyComponent() {
//     const { user, isAdmin, login, logout } = useAuth()
//     
//     if (!user) return <p>Please log in</p>
//     return <p>Hello {user.name}! {isAdmin && '(Admin)'}</p>
//   }
//
// IMPORTANT:
// - Admin users can log in to BOTH the main site AND admin panel
// - The role is stored in our database (users.role column)
// - Premium status comes from subscription table
// ============================================================================
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js' 

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** User data stored in our database (not Supabase auth.users) */
type UserData = {
  id: string       // UUID matching Supabase auth.users.id
  name: string     // Display name
  email: string    // Email address
  role: string     // "user" or "admin" - determines permissions
}

/** Shape of the auth context - what components can access */
type AuthContextType = {
  isAdmin: boolean    // Quick check: is user an admin?
  isPremium: boolean  // Quick check: does user have premium/subscription?
  token: string | null      // JWT token for API calls
  user: UserData | null     // User profile data
  loading: boolean          // True while checking auth state
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>
  logout: () => Promise<void>
}

// Create the context with null default (must be used inside AuthProvider)
const AuthContext = createContext<AuthContextType | null>(null)

// ============================================================================
// AUTH PROVIDER COMPONENT
// Wrap your app with this to enable auth throughout
// ============================================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State for auth data
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)  // Start loading until we check session

  // ============================================================================
  // INITIALIZE AUTH ON APP LOAD
  // Check for existing Supabase session when app starts
  // ============================================================================
  useEffect(() => {
    // Get initial session (from localStorage/cookies)
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
      setLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    // This fires when user logs in/out in any tab
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [])

  // ============================================================================
  // HANDLE SESSION CHANGES
  // Called when user logs in, logs out, or session refreshes
  // ============================================================================
  async function handleSession(session: Session | null) {
    if (session?.access_token && session?.user) {
      // User is logged in - store token
      setToken(session.access_token)
      
      // Fetch extended profile from our backend (roles, subscription status)
      // This gives us info not stored in Supabase auth.users
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const userData = await res.json()
          // Store combined user data
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email || session.user.email || '',
            role: userData.role,
          })
          // Set permission flags
          const isAdminUser = userData.role === 'admin'
          setIsAdmin(isAdminUser)
          // Admins automatically get premium features
          setIsPremium(isAdminUser || userData.subscription?.status === 'active')
        } else {
          // User exists in Supabase but not yet in our DB
          // Use basic info from Supabase until backend creates their record
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: 'user',
          })
          setIsAdmin(false)
          setIsPremium(false)
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
        // Fallback to Supabase user data on network error
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: 'user',
        })
        setIsAdmin(false)
        setIsPremium(false)
      }
    } else {
      // No session - user is logged out
      setToken(null)
      setUser(null)
      setIsAdmin(false)
      setIsPremium(false)
    }
  }

  // ============================================================================
  // LOGIN FUNCTION
  // Authenticates user with Supabase and triggers session handling
  // ============================================================================
  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use Supabase auth - they handle password verification
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.session) {
        return { success: false, error: 'Login failed' }
      }

      // Session will be handled by onAuthStateChange listener automatically
      return { success: true }
    } catch (err: any) {
      console.error('Login error', err)
      return { success: false, error: err.message || 'Login failed' }
    }
  }

  // ============================================================================
  // REGISTER FUNCTION
  // Creates new user in Supabase auth + our database
  // ============================================================================
  async function register(name: string, email: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },  // Store name in Supabase user_metadata
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed' }
      }

      // Also create user in our database via backend
      // This ensures we have their record for roles, favorites, etc.
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      try {
        await fetch(`${API}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
      } catch (e) {
        // If backend call fails, user will be created on first login
        console.log('Backend user creation deferred to first login')
      }

      // Check if email confirmation is required (Supabase setting)
      if (data.user && !data.session) {
        return { 
          success: true, 
          message: 'Registration successful! Please check your email to verify your account.' 
        }
      }

      return { success: true, message: 'Registration successful!' }
    } catch (err: any) {
      console.error('Register error', err)
      return { success: false, error: err.message || 'Registration failed' }
    }
  }

  // ============================================================================
  // LOGOUT FUNCTION
  // Signs out user from Supabase and clears local state
  // ============================================================================
  async function logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
      setToken(null)
      setUser(null)
      setIsAdmin(false)
      setIsPremium(false)
    } catch (err) {
      console.error('Logout error', err)
    }
  }

  // Provide auth state and functions to all children
  return (
    <AuthContext.Provider value={{ isAdmin, isPremium, token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// useAuth HOOK
// Use this in any component to access auth state and functions
// ============================================================================
/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 * @example
 *   const { user, isAdmin, login, logout } = useAuth()
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
