import type { AnalysisMode } from '@/lib/document-analysis'

export type ProviderErrorKind = 'retryable' | 'model-unavailable' | 'invalid-response' | 'fatal'

export const DEFAULT_GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash'] as const

export function configuredGeminiModels(value = process.env.GEMINI_MODEL): string[] {
  const configured = value?.trim()
  return configured
    ? [configured, ...DEFAULT_GEMINI_MODELS.filter(model => model !== configured)]
    : [...DEFAULT_GEMINI_MODELS]
}

function errorDetails(error: unknown): { message: string; status: number | null } {
  if (typeof error !== 'object' || error === null) return { message: '', status: null }
  const record = error as Record<string, unknown>
  const message = typeof record.message === 'string' ? record.message.toLowerCase() : ''
  const status = typeof record.status === 'number'
    ? record.status
    : typeof record.code === 'number' ? record.code : null
  return { message, status }
}

export function classifyProviderError(error: unknown): ProviderErrorKind {
  const { message, status } = errorDetails(error)
  if (message.includes('invalid_response') || message.includes('empty_response') || message.includes('json')) {
    return 'invalid-response'
  }
  if (status === 404 || message.includes('not found') || message.includes('model is not supported')) {
    return 'model-unavailable'
  }
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504
    || message.includes('quota') || message.includes('rate limit') || message.includes('service unavailable')
    || message.includes('temporarily unavailable') || message.includes('timeout')) {
    return 'retryable'
  }
  return 'fatal'
}

const stringSchema = { type: 'string' }

export function analysisResponseSchema(mode: AnalysisMode): Record<string, unknown> {
  const base = {
    type: 'object',
    required: ['type', 'summary'],
    properties: { type: { type: 'string', enum: [mode] }, summary: stringSchema },
  }
  if (mode === 'jargon') {
    return { ...base, required: [...base.required, 'whatIsThis', 'oweMoney', 'deadline'], properties: {
      ...base.properties, whatIsThis: stringSchema, oweMoney: stringSchema, deadline: stringSchema,
    } }
  }
  if (mode === 'prescription') {
    return { ...base, required: [...base.required, 'items'], properties: { ...base.properties, items: {
      type: 'array', items: { type: 'object', required: ['name'], properties: { name: stringSchema } },
    } } }
  }
  if (mode === 'bill') {
    return { ...base, required: [...base.required, 'totalAmount', 'flaggedCharges', 'costSavingTips', 'items'], properties: {
      ...base.properties,
      totalAmount: stringSchema,
      flaggedCharges: { type: 'array', items: { type: 'object', required: ['item', 'billedAmount', 'fairPrice', 'reason', 'canDispute'], properties: {
        item: stringSchema, billedAmount: stringSchema, fairPrice: stringSchema, reason: stringSchema, canDispute: { type: 'boolean' },
      } } },
      costSavingTips: { type: 'array', items: stringSchema },
      followUp: { anyOf: [{ type: 'null' }, { type: 'object', required: ['recommendedDate', 'doctorType', 'notes'], properties: {
        recommendedDate: stringSchema, doctorType: stringSchema, notes: stringSchema,
      } }] },
      items: { type: 'array', items: stringSchema },
    } }
  }
  return { ...base, required: [...base.required, 'recommendedActions', 'appointments'], properties: {
    ...base.properties,
    recommendedActions: { type: 'array', items: stringSchema },
    appointments: { type: 'array', items: { type: 'object', required: ['doctorType', 'timeframe', 'reason'], properties: {
      doctorType: stringSchema, timeframe: stringSchema, reason: stringSchema,
    } } },
  } }
}

export function analysisPrompt(mode: AnalysisMode): string {
  if (mode === 'prescription') {
    return 'Read this prescription carefully. Expand common medical abbreviations and extract medicine names only when supported by the document. Do not provide purchase URLs or invent brands. Give a concise three-bullet summary.'
  }
  if (mode === 'bill') {
    return 'Analyze this medical bill. Identify totals and line items, potential inflated, duplicated, unnecessary, or hidden charges, fair-price estimates, dispute potential, cost-saving ideas, and appropriate follow-up. Give a concise three-bullet summary and avoid unsupported certainty.'
  }
  if (mode === 'report') {
    return 'Explain this health report with a concise three-bullet summary, simple recommended actions, and appropriate appointments with doctor type, timeframe, and reason. Do not diagnose beyond the document.'
  }
  return 'Translate this health document into plain, senior-friendly English. Explain what it is, whether the document says money is owed, any deadline, and a concise three-bullet summary. Do not add facts absent from the document.'
}
