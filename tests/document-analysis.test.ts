import { describe, expect, it } from 'vitest'
import {
  normalizeAnalysisResponse,
  normalizeStoredMetadata,
  pharmacySearchUrls,
  validateDocumentFile,
} from '@/lib/document-analysis'

describe('document analysis contracts', () => {
  it('rejects unsupported and oversized documents', () => {
    expect(validateDocumentFile({ type: 'text/plain', size: 1 })).toMatch(/PDF/)
    expect(validateDocumentFile({ type: 'application/pdf', size: 10 * 1024 * 1024 + 1 })).toMatch(/10 MB/)
    expect(validateDocumentFile({ type: 'image/png', size: 10 })).toBeNull()
  })

  it('normalizes canonical and legacy prescription output', () => {
    const canonical = normalizeAnalysisResponse('prescription', {
      type: 'prescription', summary: 'Summary', metadata: { items: [{ name: 'A/B Tablet', tata1mg: 'https://evil.example' }] },
    })
    expect(canonical?.metadata).toEqual({ items: [{ name: 'A/B Tablet', ...pharmacySearchUrls('A/B Tablet') }] })

    const legacy = normalizeStoredMetadata('prescription', JSON.stringify([{ name: 'Paracetamol' }]))
    expect(legacy).toEqual({ items: [{ name: 'Paracetamol', ...pharmacySearchUrls('Paracetamol') }] })
  })

  it('rejects incomplete provider output', () => {
    expect(normalizeAnalysisResponse('report', { type: 'report', summary: '' })).toBeNull()
    expect(normalizeAnalysisResponse('bill', { type: 'report', summary: 'x' })).toBeNull()
  })
})
