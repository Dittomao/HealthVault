import { NextResponse } from 'next/server'
import { safeAuthDestination } from '@/lib/auth-navigation'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeAuthDestination(url.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
    console.error('[HealthVault] Authentication callback failed', error.name)
  }

  const loginUrl = new URL('/login', url.origin)
  loginUrl.searchParams.set('error', 'Invalid_or_expired_link')
  return NextResponse.redirect(loginUrl)
}
