import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'
import {
  analysisPrompt,
  analysisResponseSchema,
  classifyProviderError,
  configuredGeminiModels,
} from '@/lib/analysis-provider'
import {
  isAllowedDocumentType,
  isAnalysisMode,
  MAX_DOCUMENT_BYTES,
  normalizeAnalysisResponse,
} from '@/lib/document-analysis'
import { isOwnedStoragePath } from '@/lib/storage'
import { createClient } from '@/utils/supabase/server'

export const maxDuration = 60

const MAX_RETRIES = 2

function parseProviderResponse(text: unknown): unknown {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('EMPTY_RESPONSE')
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('INVALID_RESPONSE')
  }
}

function retryDelay(attempt: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000))
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      )
    }

    let body: unknown
    try {
      body = await request.json() as unknown
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request.' },
        { status: 400 },
      )
    }

    const requestData =
      typeof body === 'object' && body !== null
        ? body as Record<string, unknown>
        : null
    const mode = requestData?.mode
    const storagePath = requestData?.storagePath

    if (!isAnalysisMode(mode)) {
      return NextResponse.json(
        { error: 'Unsupported analysis mode.' },
        { status: 400 },
      )
    }
    if (
      typeof storagePath !== 'string' ||
      !isOwnedStoragePath(storagePath, user.id)
    ) {
      return NextResponse.json(
        { error: 'Invalid document storage path.' },
        { status: 400 },
      )
    }

    const { data: file, error: downloadError } =
      await supabase.storage.from('documents').download(storagePath)
    if (downloadError || !file) {
      return NextResponse.json(
        { error: 'Uploaded document was not found.' },
        { status: 404 },
      )
    }
    if (!isAllowedDocumentType(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported document type.' },
        { status: 400 },
      )
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        { error: 'Document exceeds the 10 MB limit.' },
        { status: 400 },
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Document analysis is not configured.' },
        { status: 503 },
      )
    }

    const ai = new GoogleGenAI({ apiKey })
    const base64 = Buffer.from(
      await file.arrayBuffer(),
    ).toString('base64')
    let temporarilyUnavailable = false

    for (const model of configuredGeminiModels()) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.info(
            `[HealthVault] Analysis mode=${mode} model=${model} attempt=${attempt + 1}`,
          )
          const response = await ai.models.generateContent({
            model,
            contents: [
              analysisPrompt(mode),
              {
                inlineData: {
                  data: base64,
                  mimeType: file.type,
                },
              },
            ],
            config: {
              responseMimeType: 'application/json',
              responseJsonSchema: analysisResponseSchema(mode),
            },
          })
          const normalized = normalizeAnalysisResponse(
            mode,
            parseProviderResponse(response.text),
          )
          if (!normalized) throw new Error('INVALID_RESPONSE')
          return NextResponse.json(normalized)
        } catch (error: unknown) {
          const kind = classifyProviderError(error)
          if (kind === 'retryable') {
            temporarilyUnavailable = true
            if (attempt < MAX_RETRIES) {
              await retryDelay(attempt)
              continue
            }
          } else if (kind === 'model-unavailable') {
            temporarilyUnavailable = true
          } else if (
            kind === 'invalid-response' &&
            attempt < MAX_RETRIES
          ) {
            continue
          } else if (kind === 'fatal') {
            console.error(
              `[HealthVault] Analysis provider error model=${model}`,
            )
            return NextResponse.json(
              { error: 'The document could not be analyzed.' },
              { status: 502 },
            )
          }
          break
        }
      }
    }

    return NextResponse.json(
      {
        error: temporarilyUnavailable
          ? 'Document analysis is temporarily unavailable. Please try again.'
          : 'The document could not be analyzed.',
      },
      { status: temporarilyUnavailable ? 503 : 502 },
    )
  } catch (error: unknown) {
    console.error(
      '[HealthVault] Unexpected analysis route error',
      error instanceof Error ? error.name : 'UnknownError',
    )
    return NextResponse.json(
      { error: 'Unexpected server error.' },
      { status: 500 },
    )
  }
}
