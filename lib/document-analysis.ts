export const ANALYSIS_MODES = ['jargon', 'prescription', 'bill', 'report'] as const
export const DASHBOARD_TABS = ['jargon', 'timeline', 'family', 'prescription', 'bill', 'report', 'insurance'] as const

export type AnalysisMode = (typeof ANALYSIS_MODES)[number]
export type DashboardTab = (typeof DASHBOARD_TABS)[number]

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

export interface Medicine {
  name: string
  tata1mg?: string
  apollo?: string
}

export interface FlaggedCharge {
  item: string
  billedAmount: string
  fairPrice: string
  reason: string
  canDispute: boolean
}

export interface FollowUp {
  recommendedDate: string
  doctorType: string
  notes: string
}

export interface Appointment {
  doctorType: string
  timeframe: string
  reason: string
}

export interface JargonMetadata {
  whatIsThis: string
  oweMoney: string
  deadline: string
}

export interface PrescriptionMetadata {
  items: Medicine[]
}

export interface BillMetadata {
  totalAmount: string
  flaggedCharges: FlaggedCharge[]
  costSavingTips: string[]
  followUp: FollowUp | null
  items: string[]
}

export interface ReportMetadata {
  recommendedActions: string[]
  appointments: Appointment[]
}

export type AnalysisMetadata = JargonMetadata | PrescriptionMetadata | BillMetadata | ReportMetadata

export interface AnalysisResult {
  type: AnalysisMode
  summary: string
  metadata: AnalysisMetadata
}

export interface HealthDocument {
  id: string
  user_id: string
  document_type: AnalysisMode
  storage_path: string | null
  file_url: string | null
  ai_summary: string
  flagged_charges: unknown
  created_at: string
}

export interface FamilyProfile {
  id: string
  user_id: string
  full_name: string
  relationship: string
  date_of_birth: string
  blood_group: string | null
  created_at: string
}

export interface InsurancePolicy {
  id: string
  user_id: string
  provider_name: string
  policy_number: string
  storage_path: string | null
  document_url: string | null
  created_at: string
}

export function isAnalysisMode(value: unknown): value is AnalysisMode {
  return typeof value === 'string' && ANALYSIS_MODES.some(mode => mode === value)
}

export function isDashboardTab(value: unknown): value is DashboardTab {
  return typeof value === 'string' && DASHBOARD_TABS.some(tab => tab === value)
}

export function isAllowedDocumentType(value: string): value is (typeof ALLOWED_DOCUMENT_TYPES)[number] {
  return ALLOWED_DOCUMENT_TYPES.some(type => type === value)
}

export function validateDocumentFile(file: { type: string; size: number }): string | null {
  if (!isAllowedDocumentType(file.type)) {
    return 'Choose a PDF, JPEG, PNG, or WebP file.'
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return 'The file must be 10 MB or smaller.'
  }
  return null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown): boolean {
  return value === true
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function parseStoredValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

export function pharmacySearchUrls(name: string): Pick<Medicine, 'tata1mg' | 'apollo'> {
  const encodedName = encodeURIComponent(name)
  return {
    tata1mg: `https://www.1mg.com/search/all?name=${encodedName}`,
    apollo: `https://www.apollopharmacy.in/search-medicines/${encodedName}`,
  }
}

function normalizeMedicine(value: unknown): Medicine | null {
  const item = asRecord(value)
  if (!item) return null
  const name = asString(item.name).trim()
  if (!name) return null
  return { name, ...pharmacySearchUrls(name) }
}

function normalizeMedicines(value: unknown): Medicine[] {
  return Array.isArray(value)
    ? value.map(normalizeMedicine).filter((item): item is Medicine => item !== null)
    : []
}

function normalizeFlaggedCharge(value: unknown): FlaggedCharge | null {
  const item = asRecord(value)
  if (!item) return null
  const name = asString(item.item).trim()
  if (!name) return null
  return {
    item: name,
    billedAmount: asString(item.billedAmount, 'Not provided'),
    fairPrice: asString(item.fairPrice, 'Not provided'),
    reason: asString(item.reason, 'No reason provided'),
    canDispute: asBoolean(item.canDispute),
  }
}

function normalizeFollowUp(value: unknown): FollowUp | null {
  const item = asRecord(value)
  if (!item) return null
  const recommendedDate = asString(item.recommendedDate).trim()
  const doctorType = asString(item.doctorType).trim()
  const notes = asString(item.notes).trim()
  if (!recommendedDate && !doctorType && !notes) return null
  return {
    recommendedDate: recommendedDate || 'Not provided',
    doctorType: doctorType || 'Not provided',
    notes: notes || 'Not provided',
  }
}

function normalizeAppointment(value: unknown): Appointment | null {
  const item = asRecord(value)
  if (!item) return null
  const doctorType = asString(item.doctorType).trim()
  if (!doctorType) return null
  return {
    doctorType,
    timeframe: asString(item.timeframe, 'Not provided'),
    reason: asString(item.reason, 'Not provided'),
  }
}

export function normalizeStoredMetadata(mode: AnalysisMode, value: unknown): AnalysisMetadata {
  const parsed = parseStoredValue(value)
  const record = asRecord(parsed)

  if (mode === 'prescription') {
    const items = Array.isArray(parsed) ? parsed : record?.items
    return { items: normalizeMedicines(items) }
  }

  if (mode === 'jargon') {
    return {
      whatIsThis: asString(record?.whatIsThis, 'Not provided'),
      oweMoney: asString(record?.oweMoney, 'Not provided'),
      deadline: asString(record?.deadline, 'Not provided'),
    }
  }

  if (mode === 'bill') {
    const flaggedCharges = Array.isArray(record?.flaggedCharges)
      ? record.flaggedCharges.map(normalizeFlaggedCharge).filter((item): item is FlaggedCharge => item !== null)
      : []
    return {
      totalAmount: asString(record?.totalAmount, 'Not provided'),
      flaggedCharges,
      costSavingTips: asStringArray(record?.costSavingTips),
      followUp: normalizeFollowUp(record?.followUp),
      items: asStringArray(record?.items),
    }
  }

  const appointments = Array.isArray(record?.appointments)
    ? record.appointments.map(normalizeAppointment).filter((item): item is Appointment => item !== null)
    : []
  return {
    recommendedActions: asStringArray(record?.recommendedActions),
    appointments,
  }
}

export function normalizeAnalysisResponse(mode: AnalysisMode, value: unknown): AnalysisResult | null {
  const record = asRecord(value)
  if (!record || record.type !== mode) return null
  const summary = asString(record.summary).trim()
  if (!summary) return null
  const metadata = asRecord(record.metadata)

  if (mode === 'prescription') {
    return { type: mode, summary, metadata: normalizeStoredMetadata(mode, metadata?.items ?? record.items) }
  }
  if (mode === 'jargon') {
    return { type: mode, summary, metadata: normalizeStoredMetadata(mode, metadata ?? record) }
  }
  if (mode === 'bill') {
    return { type: mode, summary, metadata: normalizeStoredMetadata(mode, metadata ?? record) }
  }
  return { type: mode, summary, metadata: normalizeStoredMetadata(mode, metadata ?? record) }
}

export function metadataForStorage(result: AnalysisResult): import('@/types/database').Json {
  if (result.type === 'prescription') {
    return (result.metadata as PrescriptionMetadata).items as unknown as import('@/types/database').Json
  }
  return result.metadata as unknown as import('@/types/database').Json
}

export function isHealthDocument(value: unknown): value is HealthDocument {
  const record = asRecord(value)
  return Boolean(record && typeof record.id === 'string' && typeof record.user_id === 'string' &&
    isAnalysisMode(record.document_type) &&
    (typeof record.storage_path === 'string' || record.storage_path === null) &&
    (typeof record.file_url === 'string' || record.file_url === null) &&
    typeof record.ai_summary === 'string' && typeof record.created_at === 'string')
}

export function isFamilyProfile(value: unknown): value is FamilyProfile {
  const record = asRecord(value)
  return Boolean(record && typeof record.id === 'string' && typeof record.user_id === 'string' &&
    typeof record.full_name === 'string' && typeof record.relationship === 'string' &&
    typeof record.date_of_birth === 'string' && typeof record.created_at === 'string' &&
    (typeof record.blood_group === 'string' || record.blood_group === null))
}

export function isInsurancePolicy(value: unknown): value is InsurancePolicy {
  const record = asRecord(value)
  return Boolean(record && typeof record.id === 'string' && typeof record.user_id === 'string' &&
    typeof record.provider_name === 'string' && typeof record.policy_number === 'string' &&
    typeof record.created_at === 'string' &&
    (typeof record.storage_path === 'string' || record.storage_path === null) &&
    (typeof record.document_url === 'string' || record.document_url === null))
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}
