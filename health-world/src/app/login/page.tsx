'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { HeartPulse, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              date_of_birth: dob
            }
          }
        })
        if (error) throw error
        
        if (data?.user && data?.user?.identities?.length === 0) {
           setError('An account with this email already exists. Please sign in instead.')
           return
        }

        if (data?.session === null) {
          alert('Sign up successful! Please check your email to verify your account before logging in.')
          setMode('login')
          return
        }
        
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-2 rounded-xl mb-4">
            <HeartPulse className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Health World</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your health.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-black"
              placeholder="you@example.com"
              required
            />
          </div>
          
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-black"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Used to verify your identity if you forget your password.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-black"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button 
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors block w-full"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          
          {mode === 'login' && (
            <button 
              type="button"
              onClick={() => alert('Forgot Password flow with DOB verification will be implemented here!')}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Forgot your password?
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
