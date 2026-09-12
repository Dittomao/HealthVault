'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'
import {
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme'

const options = [
  { value: 'system', label: 'System', icon: Laptop },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

const preferenceEvent = 'healthvault-theme-change'

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

function subscribePreference(listener: () => void) {
  window.addEventListener(preferenceEvent, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(preferenceEvent, listener)
    window.removeEventListener('storage', listener)
  }
}

function applyTheme(preference: ThemePreference, prefersDark: boolean) {
  const resolved = resolveTheme(preference, prefersDark)
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

export default function ThemeControl() {
  const preference = useSyncExternalStore(
    subscribePreference,
    readPreference,
    () => 'system',
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(readPreference(), media.matches)

    const syncSystemTheme = (event: MediaQueryListEvent) => {
      if (readPreference() === 'system') {
        applyTheme('system', event.matches)
      }
    }
    media.addEventListener('change', syncSystemTheme)
    return () => media.removeEventListener('change', syncSystemTheme)
  }, [])

  const selectTheme = (next: ThemePreference) => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // The selected theme still applies for this page load.
    }
    applyTheme(next, media.matches)
    window.dispatchEvent(new Event(preferenceEvent))
  }

  return (
    <fieldset aria-label="Color theme" className="theme-control">
      <legend className="sr-only">Color theme</legend>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={preference === value}
          aria-label={`${label} theme`}
          title={`${label} theme`}
          onClick={() => selectTheme(value)}
          className="theme-control__option"
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </fieldset>
  )
}
