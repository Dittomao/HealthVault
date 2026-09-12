import { describe, expect, it } from 'vitest'
import {
  isThemePreference,
  resolveTheme,
  THEME_INIT_SCRIPT,
} from '@/lib/theme'

describe('theme preferences', () => {
  it.each(['system', 'light', 'dark'])('accepts %s', value => {
    expect(isThemePreference(value)).toBe(true)
  })

  it.each([null, '', 'auto', 'sepia', 1])('rejects %s', value => {
    expect(isThemePreference(value)).toBe(false)
  })

  it('resolves system from the device preference', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('keeps an explicit preference regardless of the device', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('initializes the page theme before hydration', () => {
    expect(THEME_INIT_SCRIPT).toContain('prefers-color-scheme: dark')
    expect(THEME_INIT_SCRIPT).toContain('document.documentElement.dataset.theme')
    expect(THEME_INIT_SCRIPT).toContain('healthvault-theme')
  })
})
