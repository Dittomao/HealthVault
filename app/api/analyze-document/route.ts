import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isAllowedDocumentType, isAnalysisMode, MAX_DOCUMENT_BYTES, normalizeAnalysisResponse, type AnalysisMode } from '@/lib/document-analysis'

export const maxDuration = 60

const MODELS_TO_TRY = ['gemini-3.6-flash', 'gemini-3.5-flash']
const MAX_RETRIES = 2

function getPrescriptionPrompt(): string {
  return `You are an expert Indian pharmacist and medical AI assistant who reads doctor handwriting on prescriptions. Analyze the uploaded prescription carefully. Expand common abbreviations (Tab, Cap, Syp, Inj, Oint, BD, TDS, OD, SOS), identify real Indian medicine brands only when supported by the document, and provide a concise three-bullet summary. For every medicine, generate Tata 1mg and Apollo search URLs using its URL-encoded name. Respond with ONLY raw JSON in this exact shape: {"type":"prescription","summary":"- bullet 1\\n- bullet 2\\n- bullet 3","items":[{"name":"Medicine Name","tata1mg":"https://www.1mg.com/search/all?name=Medicine%20Name","apollo":"https://www.apollopharmacy.in/search-medicines/Medicine%20Name"}]}`
}

function getBillPrompt(): string {
  return `You are an expert Indian healthcare cost analyst and patient advocate. Analyze the uploaded hospital or medical bill. Identify line items and total, flag inflated, duplicated, unnecessary, or hidden charges, estimate a fair price and whether each can be disputed, provide cost-saving suggestions, and recommend follow-up timing, doctor type, and warning signs. Respond with ONLY raw JSON in this exact shape: {"type":"bill","summary":"- Total bill...\\n- Potential overcharges...\\n- Follow-up...","totalAmount":"₹12,500","flaggedCharges":[{"item":"Charge","billedAmount":"₹500","fairPrice":"₹100","reason":"Why it is flagged","canDispute":true}],"costSavingTips":["Suggestion"],"followUp":{"recommendedDate":"2 weeks from discharge","doctorType":"General Physician","notes":"What to monitor"},"items":["charge description"]}`
}

function getJargonPrompt(): string {
  return `You are a helpful, senior-citizen-friendly medical assistant. Translate the uploaded medical document, lab report, insurance letter, or health document into very simple plain English. State what it is, whether money is owed and the amount, any important deadline, and a concise three-bullet summary. Respond with ONLY raw JSON in this exact shape: {"type":"jargon","whatIsThis":"This is a blood test report.","oweMoney":"No","deadline":"None","summary":"- Simple point 1\\n- Simple point 2\\n- Simple point 3"}`
}

function getReportPrompt(): string {
  return `You are an expert Indian medical assistant. Analyze the uploaded health report and provide a concise three-bullet summary, two or three simple recommended actions, and suggested appointments with doctor type, timeframe, and reason. Do not diagnose beyond the document. Respond with ONLY raw JSON in this exact shape: {"type":"report","summary":"- Finding 1\\n- Finding 2\\n- Finding 3","recommendedActions":["Action"],"appointments":[{"doctorType":"Cardiologist","timeframe":"Within 1 week","reason":"Reason"}]}`
}

function getPrompt(mode: AnalysisMode): string {
  if (mode === 'bill') return getBillPrompt()
  if (mode === 'jargon') return getJargonPrompt()
  if (mode === 'report') return getReportPrompt()
  return getPrescriptionPrompt()
}

function isOwnedStoragePath(path: string, userId: string): boolean {
  const prefix = `${userId}/`
  const name = path.slice(prefix.length)
  return path.startsWith(prefix) && name.length > 0 && !name.includes('/') && !path.includes('..') && !path.includes('\\')
}

function extractJson(text: string): unknown {
  let jsonText = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const firstBrace = jsonText.indexOf('{')
  const lastBrace = jsonText.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) jsonText = jsonText.slice(firstBrace, lastBrace + 1)
  return JSON.parse(jsonText) as unknown
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

    let body: unknown
    try { body = await req.json() as unknown } catch { return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 }) }
    const requestData = typeof body === 'object' && body !== null ? body as Record<string, unknown> : null
    const mode = requestData?.mode
    const storagePath = requestData?.storagePath
    if (!isAnalysisMode(mode)) return NextResponse.json({ error: 'Unsupported analysis mode.' }, { status: 400 })
    if (typeof storagePath !== 'string' || !isOwnedStoragePath(storagePath, user.id)) {
      return NextResponse.json({ error: 'Invalid document storage path.' }, { status: 400 })
    }

    const { data: file, error: downloadError } = await supabase.storage.from('documents').download(storagePath)
    if (downloadError || !file) return NextResponse.json({ error: 'Uploaded document was not found.' }, { status: 404 })
    if (!isAllowedDocumentType(file.type)) return NextResponse.json({ error: 'Unsupported document type.' }, { status: 400 })
    if (file.size > MAX_DOCUMENT_BYTES) return NextResponse.json({ error: 'Document exceeds the 10 MB limit.' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Document analysis is not configured.' }, { status: 503 })
    const ai = new GoogleGenAI({ apiKey })
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
    let providerUnavailable = false

    for (const model of MODELS_TO_TRY) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.info(`[HealthVault] Analysis mode=${mode} model=${model} attempt=${attempt + 1}`)
          const response = await ai.models.generateContent({ model, contents: [getPrompt(mode), { inlineData: { data: base64, mimeType: file.type } }] })
          if (typeof response.text !== 'string' || !response.text.trim()) throw new Error('EMPTY_RESPONSE')
          const parsed = extractJson(response.text)
          if (!normalizeAnalysisResponse(mode, parsed)) throw new Error('INVALID_RESPONSE')
          return NextResponse.json(parsed)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : ''
          if (message.includes('404') || message.includes('429') || message.toLowerCase().includes('quota')) { providerUnavailable = true; break }
          if (message.includes('503') || message.includes('Service Unavailable')) {
            providerUnavailable = true
            if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000))
            continue
          }
          if (message.includes('JSON') || message.includes('INVALID_RESPONSE') || message.includes('EMPTY_RESPONSE')) continue
          console.error(`[HealthVault] Analysis provider error model=${model}`)
          providerUnavailable = true
          break
        }
      }
    }

    return NextResponse.json({ error: providerUnavailable ? 'Document analysis is temporarily unavailable. Please try again.' : 'The document could not be analyzed.' }, { status: providerUnavailable ? 503 : 502 })
  } catch (error: unknown) {
    console.error('[HealthVault] Unexpected analysis route error', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 })
  }
}
