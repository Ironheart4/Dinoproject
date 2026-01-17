// Login.tsx — Authentication page for signing in and registering
// Notes:
// - Uses Supabase via `useAuth()` for sign-in/register flows
// - On successful login, redirects to home and session is managed globally by AuthProvider
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Dna, UserPlus, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    
    try {
      if (mode === 'login') {
        const result = await auth.login(form.email, form.password)
        if (result.success) {
          nav('/')
        } else {
          setError(result.error || 'Invalid email/password')
        }
      } else {
        const result = await auth.register(form.name, form.email, form.password)
        if (result.success) {
          setSuccess(result.message || 'Registration successful!')
          if (result.message?.includes('verify')) {
            // Email verification required
            setForm({ name: '', email: '', password: '' })
          } else {
            setMode('login')
            setForm({ name: '', email: form.email, password: '' })
          }
        } else {
          setError(result.error || 'Registration failed')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-3 sm:px-4">
      <div className="bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white text-center flex items-center justify-center gap-2">
          {mode === 'login' ? <><Dna className="text-green-400 w-5 h-5 sm:w-6 sm:h-6" /> Welcome Back!</> : <><UserPlus className="text-green-400 w-5 h-5 sm:w-6 sm:h-6" /> Create Account</>}
        </h2>
        <form onSubmit={submit} className="space-y-3 sm:space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input 
                className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition" 
                placeholder="Enter your name"
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                disabled={loading}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition" 
              placeholder="Enter your email"
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="w-full border border-gray-600 rounded-lg p-3 pr-12 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition" 
                placeholder="Enter your password"
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && <div className="text-red-400 text-sm bg-red-900/30 p-3 rounded-lg">{error}</div>}
          {success && (
            <div className="text-green-400 text-sm bg-green-900/30 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle size={18} /> {success}
            </div>
          )}
          <div>
            <button 
              className="w-full px-4 py-3 bg-primary hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> {mode === 'login' ? 'Signing In...' : 'Creating Account...'}</>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </div>
        </form>
        <p className="mt-6 text-sm text-center text-gray-400">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button 
            className="text-primary hover:text-green-400 font-semibold underline" 
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccess(null) }}
            disabled={loading}
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}
