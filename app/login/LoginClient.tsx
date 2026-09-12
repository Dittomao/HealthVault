'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Eye, EyeOff, HeartPulse, Sparkles } from 'lucide-react'
import { safeAuthDestination } from '@/lib/auth-navigation'
import ThemeControl from '@/app/components/ThemeControl'
import { createClient } from '@/utils/supabase/client'

type LoginClientProps = {
  callbackError: string | null
  requestedDestination: string | null
  resetStatus: string | null
}

type AuthMode = 'login' | 'signup' | 'forgot_password'

const modeContent: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Sign in to your vault',
    description: 'Access your health documents, reports, and family records in one secure place.',
    submit: 'Sign in',
  },
  signup: {
    eyebrow: 'Start here',
    title: 'Create an account',
    description: 'Build your private health hub and keep important records close whenever you need them.',
    submit: 'Create account',
  },
  forgot_password: {
    eyebrow: 'Account recovery',
    title: 'Reset your password',
    description: 'We will email you a secure, one-time link to choose a new password.',
    submit: 'Send recovery link',
  },
}

export default function LoginClient({
  callbackError,
  requestedDestination,
  resetStatus,
}: LoginClientProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    callbackError === 'Invalid_or_expired_link'
      ? 'This sign-in or recovery link is invalid or has expired.'
      : null,
  )
  const [mode, setMode] = useState<AuthMode>('login')
  const [message, setMessage] = useState<string | null>(
    resetStatus === 'success'
      ? 'Your password was updated. Sign in with your new password.'
      : null,
  )
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const content = modeContent[mode]

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError(null)
    setMessage(null)
    setPassword('')
    setShowPassword(false)
  }

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', '/reset-password')
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl.toString(),
      })
      if (recoveryError) throw recoveryError
      setMessage('If an account exists for this email, a secure recovery link has been sent.')
    } catch (resetError: unknown) {
      setError(resetError instanceof Error ? resetError.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const destination = safeAuthDestination(requestedDestination)
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: dob ? { date_of_birth: dob } : {},
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
          },
        })
        if (authError) throw authError
        if (data.user && data.user.identities?.length === 0) {
          setError('An account with this email already exists. Please sign in instead.')
          return
        }
        if (data.session === null) {
          changeMode('login')
          setMessage('Account created. Check your email to verify it before signing in.')
          return
        }
        router.push(destination)
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      router.push(destination)
    } catch (authError: unknown) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page flex min-h-screen items-center px-4 py-6 sm:px-7 lg:px-10 lg:py-10">
      <section className="auth-shell mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border p-2 lg:min-h-[680px] lg:grid-cols-[1.02fr_1fr] lg:rounded-[34px]" data-testid="auth-shell">
        <aside className="auth-artwork relative hidden min-h-[664px] overflow-hidden rounded-[26px] p-9 lg:flex lg:flex-col lg:justify-between xl:p-12" data-testid="auth-artwork">
          <div className="absolute -left-24 top-[31%] h-72 w-72 rounded-full bg-white/35 blur-3xl" />
          <div className="absolute -right-28 top-[29%] h-80 w-80 rounded-full bg-[#ffbf62]/45 blur-3xl" />
          <div className="absolute bottom-[-14%] left-[18%] h-96 w-96 rounded-full bg-[#ee6544]/50 blur-3xl" />

          <Link href="/" className="auth-artwork-copy relative z-10 flex w-fit items-center gap-2.5 text-sm font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-4 focus-visible:ring-offset-transparent">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171412] text-white shadow-sm"><HeartPulse className="h-5 w-5" /></span>
            HealthVault
          </Link>

          <div className="auth-artwork-copy relative z-10 max-w-md pb-3">
            <p className="mb-3 text-sm font-medium opacity-75">Your health, clearly organized.</p>
            <h2 className="text-[2.7rem] font-semibold leading-[1.08] tracking-[-0.045em] xl:text-[3.25rem]">
              Your personal hub for clearer health decisions.
            </h2>
            <div className="mt-8 flex items-center gap-3 text-sm font-medium opacity-80">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current/15 bg-white/20"><Sparkles className="h-4 w-4" /></span>
              Reports, prescriptions, bills, and family records—together.
            </div>
          </div>
        </aside>

        <div className="auth-panel relative flex min-h-[620px] flex-col rounded-[26px] px-5 pb-8 pt-5 sm:px-10 sm:pb-10 sm:pt-7 lg:min-h-0 lg:px-16 lg:py-12 xl:px-20">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="auth-text flex items-center gap-2 text-sm font-bold lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171412] text-white"><HeartPulse className="h-5 w-5" /></span>
              HealthVault
            </Link>
            <div className="hidden lg:block" />
            <ThemeControl />
          </header>

          <div className="my-auto w-full max-w-md self-center py-10">
            <div className="mb-8">
              <span className="auth-accent mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--auth-accent)_13%,transparent)]"><Sparkles className="h-[18px] w-[18px]" /></span>
              <p className="auth-accent mb-2 text-xs font-semibold uppercase tracking-[0.2em]">{content.eyebrow}</p>
              <h1 className="auth-text text-3xl font-semibold tracking-[-0.035em] sm:text-[2.55rem] sm:leading-tight">{content.title}</h1>
              <p className="auth-muted mt-3 max-w-sm text-sm leading-6">{content.description}</p>
            </div>

            {error && <div role="alert" aria-live="polite" className="auth-feedback-error mb-5 rounded-xl border px-4 py-3 text-sm">{error}</div>}
            {message && <div role="status" aria-live="polite" className="auth-feedback-success mb-5 rounded-xl border px-4 py-3 text-sm">{message}</div>}

            <form onSubmit={mode === 'forgot_password' ? handleResetPassword : handleAuth} className="space-y-5">
              <div>
                <label htmlFor="auth-email" className="auth-text mb-2 block text-sm font-medium">Email address</label>
                <input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required disabled={loading} className="auth-input h-12 w-full rounded-xl border px-4 text-sm outline-none transition disabled:cursor-not-allowed" />
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-dob" className="auth-text mb-2 block text-sm font-medium">Date of birth <span className="auth-muted font-normal">(optional)</span></label>
                  <input id="auth-dob" type="date" value={dob} onChange={(event) => setDob(event.target.value)} autoComplete="bday" disabled={loading} className="auth-input h-12 w-full rounded-xl border px-4 text-sm outline-none transition disabled:cursor-not-allowed" />
                  <p className="auth-muted mt-2 text-xs leading-5">Profile information only—never used as a recovery credential.</p>
                </div>
              )}

              {mode !== 'forgot_password' && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label htmlFor="auth-password" className="auth-text block text-sm font-medium">Password</label>
                    {mode === 'login' && <button type="button" onClick={() => changeMode('forgot_password')} className="auth-link text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)] focus-visible:ring-offset-2">Forgot password?</button>}
                  </div>
                  <div className="relative">
                    <input id="auth-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" minLength={6} required disabled={loading} className="auth-input h-12 w-full rounded-xl border px-4 pr-12 text-sm outline-none transition disabled:cursor-not-allowed" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="auth-icon-button absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="auth-primary group flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-[0_10px_22px_rgba(21,21,31,0.2)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current/35 border-t-current" />Processing...</> : <>{content.submit}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </form>

            <div className="auth-muted mt-8 flex items-center gap-3 text-xs" aria-hidden="true"><span className="auth-divider h-px flex-1" /><span>Private by design</span><span className="auth-divider h-px flex-1" /></div>

            <div className="auth-muted mt-6 text-center text-sm">
              {mode === 'login' && <p>New to HealthVault? <button type="button" onClick={() => changeMode('signup')} className="auth-link font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)] focus-visible:ring-offset-2">Create an account</button></p>}
              {mode === 'signup' && <p>Already have an account? <button type="button" onClick={() => changeMode('login')} className="auth-link font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)] focus-visible:ring-offset-2">Sign in</button></p>}
              {mode === 'forgot_password' && <button type="button" onClick={() => changeMode('login')} className="auth-link inline-flex items-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)] focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" />Back to sign in</button>}
            </div>
          </div>

          <p className="auth-muted text-center text-[11px] leading-5">By continuing, you agree to keep your account credentials private.</p>
        </div>
      </section>
    </main>
  )
}
