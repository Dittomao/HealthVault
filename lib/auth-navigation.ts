export function safeAuthDestination(value: string | null): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/dashboard'
  }

  try {
    const destination = new URL(value, 'http://healthvault.local')
    const allowed =
      destination.pathname === '/dashboard' ||
      destination.pathname === '/reset-password'

    return allowed && destination.origin === 'http://healthvault.local'
      ? `${destination.pathname}${destination.search}`
      : '/dashboard'
  } catch {
    return '/dashboard'
  }
}
