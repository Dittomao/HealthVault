import { describe, expect, it } from 'vitest'
import {
  isOwnedStoragePath,
  resolveStoragePath,
  storagePathFromLegacyUrl,
} from '@/lib/storage'

describe('storage contracts', () => {
  it('accepts only a direct object owned by the user', () => {
    expect(isOwnedStoragePath('user-1/report.pdf', 'user-1')).toBe(true)
    expect(isOwnedStoragePath('user-2/report.pdf', 'user-1')).toBe(false)
    expect(isOwnedStoragePath('user-1/folder/report.pdf', 'user-1')).toBe(false)
    expect(isOwnedStoragePath('user-1/../report.pdf', 'user-1')).toBe(false)
    expect(isOwnedStoragePath('user-1\\report.pdf', 'user-1')).toBe(false)
  })

  it('extracts safe paths from legacy public URLs', () => {
    expect(storagePathFromLegacyUrl(
      'https://example.supabase.co/storage/v1/object/public/documents/user-1/My%20Report.pdf',
    )).toBe('user-1/My Report.pdf')
    expect(storagePathFromLegacyUrl('https://example.com/report.pdf')).toBeNull()
    expect(storagePathFromLegacyUrl(
      'https://example.supabase.co/storage/v1/object/public/documents/user-1/%2E%2E/report.pdf',
    )).toBeNull()
  })

  it('prefers a canonical path over a legacy URL', () => {
    expect(resolveStoragePath('user-1/new.pdf', 'https://example.com/old.pdf')).toBe('user-1/new.pdf')
    expect(resolveStoragePath(null, 'not-a-url')).toBeNull()
  })
})
