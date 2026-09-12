import { describe, expect, it } from 'vitest'
import { safeAuthDestination } from '@/lib/auth-navigation'

describe('authentication navigation', () => {
  it.each([
    ['/dashboard', '/dashboard'],
    ['/dashboard?tab=bill', '/dashboard?tab=bill'],
    ['/reset-password', '/reset-password'],
  ])('allows local authentication destinations', (value, expected) => {
    expect(safeAuthDestination(value)).toBe(expected)
  })

  it.each([
    null,
    'https://evil.example/dashboard',
    '//evil.example/dashboard',
    '/contact',
    '/dashboard\\evil',
  ])('rejects unsafe or unsupported destinations', value => {
    expect(safeAuthDestination(value)).toBe('/dashboard')
  })
})
