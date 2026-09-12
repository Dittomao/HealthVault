export const THEME_STORAGE_KEY = 'healthvault-theme'

export const THEME_PREFERENCES = [
  'system',
  'light',
  'dark',
] as const

export type ThemePreference =
  (typeof THEME_PREFERENCES)[number]

export type ResolvedTheme = 'light' | 'dark'

export function isThemePreference(
  value: unknown,
): value is ThemePreference {
  return typeof value === 'string' &&
    THEME_PREFERENCES.some(theme => theme === value)
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light'
  }
  return preference
}

export const THEME_INIT_SCRIPT = `(() => {
  try {
    const saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    const preference = saved === 'light' || saved === 'dark' || saved === 'system'
      ? saved
      : 'system';
    const resolved = preference === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {
    const resolved = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }
})();`
