import { describe, expect, it } from 'vitest'
import {
  analysisPrompt,
  analysisResponseSchema,
  classifyProviderError,
  configuredGeminiModels,
  DEFAULT_GEMINI_MODELS,
} from '@/lib/analysis-provider'

describe('analysis provider contracts', () => {
  it('uses a configured model first without duplicating fallbacks', () => {
    expect(configuredGeminiModels(' custom-model ')).toEqual([
      'custom-model',
      ...DEFAULT_GEMINI_MODELS,
    ])
    expect(configuredGeminiModels(DEFAULT_GEMINI_MODELS[0])).toEqual([
      ...DEFAULT_GEMINI_MODELS,
    ])
  })

  it.each([
    [{ status: 429, message: 'rate limit' }, 'retryable'],
    [{ status: 404, message: 'not found' }, 'model-unavailable'],
    [new Error('INVALID_RESPONSE'), 'invalid-response'],
    [new Error('permission denied'), 'fatal'],
  ] as const)('classifies provider failures', (error, expected) => {
    expect(classifyProviderError(error)).toBe(expected)
  })

  it('builds a mode-specific structured schema', () => {
    const schema = analysisResponseSchema('prescription') as {
      required: string[]
      properties: Record<string, unknown>
    }
    expect(schema.required).toContain('items')
    expect(schema.properties).toHaveProperty('items')
    expect(analysisPrompt('prescription')).not.toMatch(/https?:\/\//i)
  })
})
