import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_DOCUMENT_BYTES, pharmacySearchUrls } from '@/lib/document-analysis'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  download: vi.fn(),
  generateContent: vi.fn(),
  getUser: vi.fn(),
  googleGenAI: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: mocks.generateContent }

    constructor(options: unknown) {
      mocks.googleGenAI(options)
    }
  },
}))

import { POST } from '@/app/api/analyze-document/route'

const user = { id: 'user-1' }
const storagePath = `${user.id}/report.pdf`

function request(body: BodyInit): Request {
  return new Request('http://localhost/api/analyze-document', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

function jsonRequest(body: unknown): Request {
  return request(JSON.stringify(body))
}

function documentFile(
  type = 'application/pdf',
  size = 4,
): { type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> } {
  return {
    type,
    size,
    arrayBuffer: vi.fn().mockResolvedValue(Uint8Array.from([1, 2, 3, 4]).buffer),
  }
}

async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>
}

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
  vi.stubEnv('GEMINI_MODEL', '')
  mocks.getUser.mockResolvedValue({ data: { user }, error: null })
  mocks.download.mockResolvedValue({ data: documentFile(), error: null })
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
    storage: { from: vi.fn().mockReturnValue({ download: mocks.download }) },
  })
  mocks.generateContent.mockResolvedValue({
    text: JSON.stringify({
      type: 'report',
      summary: 'A concise summary',
      recommendedActions: [],
      appointments: [],
    }),
  })
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('POST /api/analyze-document', () => {
  it('rejects unauthenticated access before reading the request body', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const response = await POST(request('{invalid'))

    expect(response.status).toBe(401)
    await expect(responseJson(response)).resolves.toEqual({
      error: 'Authentication required.',
    })
    expect(mocks.download).not.toHaveBeenCalled()
    expect(mocks.googleGenAI).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON', async () => {
    const response = await POST(request('{"mode":'))

    expect(response.status).toBe(400)
    await expect(responseJson(response)).resolves.toEqual({
      error: 'Invalid JSON request.',
    })
    expect(mocks.download).not.toHaveBeenCalled()
  })

  it('rejects a storage path owned by another user', async () => {
    const response = await POST(jsonRequest({
      mode: 'report',
      storagePath: 'user-2/report.pdf',
    }))

    expect(response.status).toBe(400)
    await expect(responseJson(response)).resolves.toEqual({
      error: 'Invalid document storage path.',
    })
    expect(mocks.download).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'unsupported',
      file: documentFile('text/plain'),
      error: 'Unsupported document type.',
    },
    {
      name: 'oversized',
      file: documentFile('application/pdf', MAX_DOCUMENT_BYTES + 1),
      error: 'Document exceeds the 10 MB limit.',
    },
  ])('rejects $name files before calling Gemini', async ({ file, error }) => {
    mocks.download.mockResolvedValue({ data: file, error: null })

    const response = await POST(jsonRequest({ mode: 'report', storagePath }))

    expect(response.status).toBe(400)
    await expect(responseJson(response)).resolves.toEqual({ error })
    expect(mocks.googleGenAI).not.toHaveBeenCalled()
    expect(mocks.generateContent).not.toHaveBeenCalled()
  })

  it('returns the canonical normalized response from Gemini output', async () => {
    mocks.generateContent.mockResolvedValue({
      text: JSON.stringify({
        type: 'prescription',
        summary: '  Take the prescribed medicine.  ',
        metadata: {
          items: [{ name: 'A/B Tablet', tata1mg: 'https://untrusted.example' }],
        },
      }),
    })

    const response = await POST(jsonRequest({ mode: 'prescription', storagePath }))

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toEqual({
      type: 'prescription',
      summary: 'Take the prescribed medicine.',
      metadata: {
        items: [{ name: 'A/B Tablet', ...pharmacySearchUrls('A/B Tablet') }],
      },
    })
    expect(mocks.googleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' })
    expect(mocks.download).toHaveBeenCalledWith(storagePath)
    expect(mocks.generateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-3.6-flash',
      contents: expect.arrayContaining([
        expect.objectContaining({
          inlineData: { data: 'AQIDBA==', mimeType: 'application/pdf' },
        }),
      ]),
      config: expect.objectContaining({ responseMimeType: 'application/json' }),
    }))
  })

  it('returns a provider error after malformed output exhausts retries and fallbacks', async () => {
    mocks.generateContent.mockResolvedValue({ text: 'not-json' })

    const response = await POST(jsonRequest({ mode: 'report', storagePath }))

    expect(response.status).toBe(502)
    await expect(responseJson(response)).resolves.toEqual({
      error: 'The document could not be analyzed.',
    })
    expect(mocks.generateContent).toHaveBeenCalledTimes(6)
  })

  it('retries malformed output on the same model before succeeding', async () => {
    mocks.generateContent
      .mockResolvedValueOnce({ text: '' })
      .mockResolvedValueOnce({ text: '{invalid' })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          type: 'report',
          summary: 'Recovered response',
          recommendedActions: ['Book a follow-up'],
          appointments: [],
        }),
      })

    const response = await POST(jsonRequest({ mode: 'report', storagePath }))

    expect(response.status).toBe(200)
    expect(mocks.generateContent).toHaveBeenCalledTimes(3)
    expect(mocks.generateContent.mock.calls.map(([call]) => call.model)).toEqual([
      'gemini-3.6-flash',
      'gemini-3.6-flash',
      'gemini-3.6-flash',
    ])
  })

  it('falls back to the next model when the first model is unavailable', async () => {
    mocks.generateContent
      .mockRejectedValueOnce({ status: 404, message: 'model not found' })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          type: 'report',
          summary: 'Fallback response',
          recommendedActions: [],
          appointments: [],
        }),
      })

    const response = await POST(jsonRequest({ mode: 'report', storagePath }))

    expect(response.status).toBe(200)
    expect(mocks.generateContent).toHaveBeenCalledTimes(2)
    expect(mocks.generateContent.mock.calls.map(([call]) => call.model)).toEqual([
      'gemini-3.6-flash',
      'gemini-3.5-flash',
    ])
  })
})
