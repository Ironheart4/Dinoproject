// auth.tsx — Authentication context using Supabase and backend user records
// Responsibilities:
// - Keeps Supabase session in sync with local app state
// - Fetches user profile from backend (/api/auth/me) to read roles and subscription status
// - Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment for production
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js' 

type UserData = {
  id: string
  name: string
  email: string
  role: string
}

type AuthContextType = {
  isAdmin: boolean
  isPremium: boolean
  token: string | null
  user: UserData | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from Supabase session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(session: Session | null) {
    if (session?.access_token && session?.user) {
      setToken(session.access_token)
      
      // If Supabase session exists, try to load extended profile from backend (roles, subscription)
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const userData = await res.json()
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email || session.user.email || '',
            role: userData.role,
          })
          const isAdminUser = userData.role === 'admin'
          setIsAdmin(isAdminUser)
          // Admins get premium features automatically
          setIsPremium(isAdminUser || userData.subscription?.status === 'active')
        } else {
          // User exists in Supabase but not in our DB yet - use basic info
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
        // Fallback to Supabase user data
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
      setToken(null)
      setUser(null)
      setIsAdmin(false)
      setIsPremium(false)
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
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

      // Session will be handled by onAuthStateChange
      return { success: true }
    } catch (err: any) {
      console.error('Login error', err)
      return { success: false, error: err.message || 'Login failed' }
    }
  }

  async function register(name: string, email: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed' }
      }

      // Create user in our database via backend
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      try {
        await fetch(`${API}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
      } catch (e) {
        // User creation in our DB will happen on first login if this fails
        console.log('Backend user creation deferred to first login')
      }

      // Check if email confirmation is required
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

  return (
    <AuthContext.Provider value={{ isAdmin, isPremium, token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
