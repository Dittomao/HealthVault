'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Eye, EyeOff, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react'
import ThemeControl from '@/app/components/ThemeControl'
import { createClient } from '@/utils/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let mounted = true
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (mounted) {
        setHasRecoverySession(Boolean(data.session))
        setChecking(false)
      }
    }
    void checkSession()
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && (event === 'PASSWORD_RECOVERY' || session)) {
        setHasRecoverySession(true)
        setChecking(false)
      }
    })
    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [supabase])

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    await supabase.auth.signOut()
    router.replace('/login?reset=success')
    router.refresh()
  }

  return (
    <main className="auth-page flex min-h-screen items-center px-4 py-6 sm:px-7 lg:px-10 lg:py-10">
      <section className="auth-shell mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border p-2 lg:min-h-[680px] lg:grid-cols-[1.02fr_1fr] lg:rounded-[34px]">
        <aside className="auth-artwork relative hidden min-h-[664px] overflow-hidden rounded-[26px] p-9 lg:flex lg:flex-col lg:justify-between xl:p-12" data-testid="auth-artwork">
          <Link href="/" className="auth-artwork-copy relative z-10 flex w-fit items-center gap-2.5 text-sm font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171412] text-white shadow-sm"><HeartPulse className="h-5 w-5" /></span>
            HealthVault
          </Link>
          <div className="auth-artwork-copy relative z-10 max-w-md pb-3">
            <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-current/15 bg-white/20"><ShieldCheck className="h-6 w-6" /></span>
            <p className="mb-3 text-sm font-medium opacity-75">A secure step back in.</p>
            <h2 className="text-[2.7rem] font-semibold leading-[1.08] tracking-[-0.045em] xl:text-[3.25rem]">Choose a fresh password. Keep your records protected.</h2>
            <p className="mt-7 max-w-sm text-sm leading-6 opacity-80">Recovery links are single-use and time limited for your privacy.</p>
          </div>
        </aside>

        <div className="auth-panel flex min-h-[620px] flex-col rounded-[26px] px-5 pb-8 pt-5 sm:px-10 sm:pb-10 sm:pt-7 lg:min-h-0 lg:px-16 lg:py-12 xl:px-20">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="auth-text flex items-center gap-2 text-sm font-bold lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171412] text-white"><HeartPulse className="h-5 w-5" /></span>
              HealthVault
            </Link>
            <div className="hidden lg:block" />
            <ThemeControl />
          </header>

          <div className="my-auto w-full max-w-md self-center py-10">
            <span className="auth-accent mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--auth-accent)_13%,transparent)]"><Sparkles className="h-[18px] w-[18px]" /></span>
            <p className="auth-accent mb-2 text-xs font-semibold uppercase tracking-[0.2em]">Account recovery</p>
            <h1 className="auth-text text-3xl font-semibold tracking-[-0.035em] sm:text-[2.55rem] sm:leading-tight">Choose a new password</h1>
            <p className="auth-muted mt-3 text-sm leading-6">This page works only after opening the secure recovery link sent to your email.</p>

            {checking ? (
              <div role="status" className="auth-muted mt-8 flex items-center gap-3 text-sm"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />Checking your recovery link…</div>
            ) : !hasRecoverySession ? (
              <div role="alert" className="auth-feedback-error mt-8 rounded-xl border p-4 text-sm leading-6">
                This recovery link is invalid or expired. <Link href="/login" className="auth-link font-semibold underline underline-offset-2">Request a new link</Link>.
              </div>
            ) : (
              <form onSubmit={updatePassword} className="mt-8 space-y-5">
                {error && <div role="alert" className="auth-feedback-error rounded-xl border px-4 py-3 text-sm">{error}</div>}
                <div>
                  <label htmlFor="new-password" className="auth-text mb-2 block text-sm font-medium">New password</label>
                  <div className="relative">
                    <input id="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required disabled={loading} className="auth-input h-12 w-full rounded-xl border px-4 pr-12 text-sm outline-none transition disabled:cursor-not-allowed" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="auth-icon-button absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="auth-text mb-2 block text-sm font-medium">Confirm password</label>
                  <input id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" required disabled={loading} className="auth-input h-12 w-full rounded-xl border px-4 text-sm outline-none transition disabled:cursor-not-allowed" />
                </div>
                <button type="submit" disabled={loading} className="auth-primary group flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-[0_10px_22px_rgba(21,21,31,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Updating…' : <>Update password<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </form>
            )}

            <Link href="/login" className="auth-link mt-8 inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" />Back to sign in</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
