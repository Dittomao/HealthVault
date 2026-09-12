'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ComponentType } from 'react'
import type { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { FileText, UploadCloud, HeartPulse, LogOut, ExternalLink, Receipt, AlertTriangle, Calendar, Lightbulb, ChevronDown, ChevronUp, Users, Shield, Copy, CheckCircle2, Activity, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  errorMessage, isDashboardTab, isFamilyProfile, isHealthDocument, isInsurancePolicy,
  metadataForStorage, normalizeAnalysisResponse, normalizeStoredMetadata,
  validateDocumentFile, type AnalysisMode, type BillMetadata,
  type DashboardTab, type FamilyProfile, type HealthDocument,
  type InsurancePolicy, type JargonMetadata, type PrescriptionMetadata,
  type ReportMetadata,
} from '@/lib/document-analysis'

type SidebarItemProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
  expanded: boolean
}

const SidebarItem = ({ icon: Icon, label, active, onClick, expanded }: SidebarItemProps) => (
  <button 
    onClick={onClick} 
    className={`p-3 rounded-2xl flex items-center transition-all overflow-hidden ${active ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
    style={{ justifyContent: expanded ? 'flex-start' : 'center' }}
  >
    <Icon className="w-6 h-6 shrink-0" />
    <AnimatePresence>
      {expanded && (
        <motion.span 
          initial={{ opacity: 0, width: 0, marginLeft: 0 }}
          animate={{ opacity: 1, width: 'auto', marginLeft: 16 }}
          exit={{ opacity: 0, width: 0, marginLeft: 0 }}
          className="font-medium whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
)

export default function DashboardClient({ user, initialTab }: { user: User; initialTab: DashboardTab }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [documents, setDocuments] = useState<HealthDocument[]>([])
  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>([])
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [familyForm, setFamilyForm] = useState({ full_name: '', relationship: '', date_of_birth: '', blood_group: '' })
  const [insuranceForm, setInsuranceForm] = useState({ provider_name: '', policy_number: '' })
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab = isDashboardTab(requestedTab)
    ? requestedTab
    : initialTab

  const selectTab = useCallback((tab: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    window.history.pushState(null, '', `?${params.toString()}`)
  }, [searchParams])

  const loadDocuments = useCallback(async () => {
    const { data, error } = await supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) throw new Error(`Documents could not be loaded: ${error.message}`)
    setDocuments((data ?? []).filter(isHealthDocument))
  }, [supabase, user.id])

  const loadFamilyProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('family_profiles').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) throw new Error(`Family profiles could not be loaded: ${error.message}`)
    setFamilyProfiles((data ?? []).filter(isFamilyProfile))
  }, [supabase, user.id])

  const loadInsurancePolicies = useCallback(async () => {
    const { data, error } = await supabase.from('insurance_policies').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) throw new Error(`Insurance policies could not be loaded: ${error.message}`)
    setInsurancePolicies((data ?? []).filter(isInsurancePolicy))
  }, [supabase, user.id])

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([loadDocuments(), loadFamilyProfiles(), loadInsurancePolicies()])
      const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      if (failures.length > 0) setStatus({ kind: 'error', message: failures.map(failure => errorMessage(failure.reason, 'Data could not be loaded.')).join(' ') })
    }
    void load()
  }, [loadDocuments, loadFamilyProfiles, loadInsurancePolicies])

  const handleSignOut = async () => {
    setStatus(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setStatus({ kind: 'error', message: `Sign out failed: ${error.message}` })
      return
    }
    router.replace('/login')
    router.refresh()
  }

  const triggerUpload = (mode: AnalysisMode) => {
    document.getElementById(`file-input-${mode}`)?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, mode: AnalysisMode) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file || isUploading) return
    const validationError = validateDocumentFile(file)
    if (validationError) {
      setStatus({ kind: 'error', message: validationError })
      input.value = ''
      return
    }

    setIsUploading(true)
    setStatus(null)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${crypto.randomUUID()}_${safeName}`
    let uploaded = false

    try {
      const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file, { contentType: file.type })
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      uploaded = true

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath, mode }),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
          ? payload.error : 'Analysis failed.'
        throw new Error(message)
      }
      const analysis = normalizeAnalysisResponse(mode, payload)
      if (!analysis) throw new Error('The analysis result was incomplete. Please try again.')
      const { error: insertError } = await supabase.from('documents').insert({
        user_id: user.id,
        document_type: mode,
        storage_path: storagePath,
        file_url: null,
        ai_summary: analysis.summary,
        flagged_charges: metadataForStorage(analysis),
      })
      if (insertError) throw new Error(`Analysis could not be saved: ${insertError.message}`)
      uploaded = false
      await loadDocuments()
      setStatus({ kind: 'success', message: 'Document analyzed and saved.' })
    } catch (error: unknown) {
      if (uploaded) await supabase.storage.from('documents').remove([storagePath])
      setStatus({ kind: 'error', message: errorMessage(error, 'Document upload failed.') })
    } finally {
      setIsUploading(false)
      input.value = ''
    }
  }

  const saveFamilyProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSaving) return
    setIsSaving(true)
    setStatus(null)
    try {
      const { error } = await supabase.from('family_profiles').insert({ ...familyForm, user_id: user.id })
      if (error) throw error
      setFamilyForm({ full_name: '', relationship: '', date_of_birth: '', blood_group: '' })
      await loadFamilyProfiles()
      setStatus({ kind: 'success', message: 'Family profile saved.' })
    } catch (error: unknown) {
      setStatus({ kind: 'error', message: errorMessage(error, 'Family profile could not be saved.') })
    } finally {
      setIsSaving(false)
    }
  }

  const saveInsurance = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSaving) return
    setIsSaving(true)
    setStatus(null)
    let documentPath: string | null = null
    let uploadedPath: string | null = null

    try {
      if (insuranceFile) {
        const validationError = validateDocumentFile(insuranceFile)
        if (validationError) throw new Error(validationError)
        const safeName = insuranceFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        uploadedPath = `${user.id}/${crypto.randomUUID()}_${safeName}`
        const { error: uploadError } = await supabase.storage.from('documents').upload(uploadedPath, insuranceFile, { contentType: insuranceFile.type })
        if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`)
        documentPath = uploadedPath
      }

      const { error } = await supabase.from('insurance_policies').insert({ ...insuranceForm, storage_path: documentPath, document_url: null, user_id: user.id })
      if (error) throw error
      uploadedPath = null
      setInsuranceForm({ provider_name: '', policy_number: '' })
      setInsuranceFile(null)
      const fileInput = document.getElementById('insurance-file-input') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
      await loadInsurancePolicies()
      setStatus({ kind: 'success', message: 'Insurance policy saved.' })
    } catch (error: unknown) {
      if (uploadedPath) await supabase.storage.from('documents').remove([uploadedPath])
      setStatus({ kind: 'error', message: errorMessage(error, 'Insurance policy could not be saved.') })
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (error: unknown) {
      setStatus({ kind: 'error', message: errorMessage(error, 'Details could not be copied.') })
    }
  }

  const openStoredDocument = async (storagePath: string | null, legacyUrl: string | null) => {
    try {
      if (storagePath) {
        const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, 60)
        if (error || !data.signedUrl) throw new Error(error?.message || 'A secure link could not be created.')
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
        return
      }
      if (legacyUrl) window.open(legacyUrl, '_blank', 'noopener,noreferrer')
    } catch (error: unknown) {
      setStatus({ kind: 'error', message: errorMessage(error, 'Document could not be opened.') })
    }
  }

  const deleteDocument = async (document: HealthDocument) => {
    if (!window.confirm('Delete this document and its stored file? This cannot be undone.')) return
    setStatus(null)
    const { error } = await supabase.from('documents').delete().eq('id', document.id).eq('user_id', user.id)
    if (error) {
      setStatus({ kind: 'error', message: `Document could not be deleted: ${error.message}` })
      return
    }
    if (document.storage_path) {
      const { error: storageError } = await supabase.storage.from('documents').remove([document.storage_path])
      if (storageError) setStatus({ kind: 'error', message: `Record deleted, but its file could not be removed: ${storageError.message}` })
      else setStatus({ kind: 'success', message: 'Document deleted.' })
    } else {
      setStatus({ kind: 'success', message: 'Document deleted.' })
    }
    await loadDocuments()
  }

  const deleteFamilyProfile = async (profile: FamilyProfile) => {
    if (!window.confirm(`Delete the profile for ${profile.full_name}?`)) return
    const { error } = await supabase.from('family_profiles').delete().eq('id', profile.id).eq('user_id', user.id)
    if (error) setStatus({ kind: 'error', message: `Profile could not be deleted: ${error.message}` })
    else {
      await loadFamilyProfiles()
      setStatus({ kind: 'success', message: 'Family profile deleted.' })
    }
  }

  const deleteInsurancePolicy = async (policy: InsurancePolicy) => {
    if (!window.confirm(`Delete the ${policy.provider_name} policy and its stored file?`)) return
    const { error } = await supabase.from('insurance_policies').delete().eq('id', policy.id).eq('user_id', user.id)
    if (error) {
      setStatus({ kind: 'error', message: `Policy could not be deleted: ${error.message}` })
      return
    }
    if (policy.storage_path) {
      const { error: storageError } = await supabase.storage.from('documents').remove([policy.storage_path])
      if (storageError) setStatus({ kind: 'error', message: `Policy deleted, but its file could not be removed: ${storageError.message}` })
      else setStatus({ kind: 'success', message: 'Insurance policy deleted.' })
    } else {
      setStatus({ kind: 'success', message: 'Insurance policy deleted.' })
    }
    await loadInsurancePolicies()
  }

  const tabDocs = documents.filter(document => document.document_type === activeTab)

  const tabs = [
    { id: 'jargon', label: 'Jargon Buster', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'family', label: 'Family Profiles', icon: Users },
    { id: 'prescription', label: 'Prescription Buy', icon: HeartPulse },
    { id: 'bill', label: 'Bill Analyzer', icon: Receipt },
    { id: 'report', label: 'Report Analyzer', icon: Activity },
    { id: 'insurance', label: 'Insurance Connect', icon: Shield },
  ] as const

  return (
    <div className="min-h-screen bg-[#E4E9E2] p-2 md:p-4 lg:p-6 flex font-sans selection:bg-[#E2FF6F]">
      <div className="bg-white w-full flex-1 rounded-[24px] md:rounded-[40px] shadow-2xl flex overflow-hidden border border-white/50">
        
        {/* Dark Sidebar (Expanding Bento Style) */}
        <motion.div 
          initial={false}
          animate={{ width: isSidebarExpanded ? 260 : 96 }}
          onHoverStart={() => setIsSidebarExpanded(true)}
          onHoverEnd={() => setIsSidebarExpanded(false)}
          className="bg-[#1C1C1C] my-4 ml-4 rounded-[32px] hidden sm:flex flex-col py-8 justify-between shrink-0 shadow-lg relative z-20 overflow-hidden"
        >
          <div className="flex flex-col gap-8 w-full">
            <div className="flex items-center px-6">
              <div className="bg-white/10 p-3 rounded-2xl shrink-0 flex items-center justify-center">
                <HeartPulse className="text-white w-6 h-6" />
              </div>
              <AnimatePresence>
                {isSidebarExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, width: 'auto', marginLeft: 16 }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    className="text-white font-bold text-xl whitespace-nowrap"
                  >
                    HealthVault
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3 w-full px-4">
              {tabs.map(tab => (
                <SidebarItem 
                  key={tab.id} 
                  icon={tab.icon} 
                  label={tab.label} 
                  active={activeTab === tab.id} 
                  onClick={() => selectTab(tab.id)}
                  expanded={isSidebarExpanded} 
                />
              ))}
            </div>
          </div>
          
          <div className="px-4">
            <button onClick={handleSignOut} className="w-full p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl flex items-center transition-all overflow-hidden" style={{ justifyContent: isSidebarExpanded ? 'flex-start' : 'center' }}>
              <LogOut className="w-6 h-6 shrink-0" />
              <AnimatePresence>
                {isSidebarExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, width: 'auto', marginLeft: 16 }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    className="font-medium whitespace-nowrap"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col pt-8 px-6 sm:px-12 pb-8 overflow-y-auto relative no-scrollbar">
          
          {/* Header */}
          <header className="flex justify-between items-center mb-10 shrink-0">
             <div className="sm:hidden flex items-center gap-2">
                <div className="bg-[#1C1C1C] p-2 rounded-xl">
                  <HeartPulse className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">HealthVault</span>
             </div>
             <button type="button" onClick={() => void handleSignOut()} className="sm:hidden ml-auto inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
               <LogOut className="h-4 w-4" /> Sign out
             </button>

             {/* Desktop Profile Pill */}
             <button type="button" onClick={() => void handleSignOut()} className="hidden sm:flex ml-auto items-center gap-3 bg-[#f4f4f4] pr-4 pl-1 py-1 rounded-full border border-gray-100 hover:bg-gray-200 transition-colors">
               <span className="w-8 h-8 rounded-full bg-[#E2FF6F] flex items-center justify-center font-bold text-[#1C1C1C] text-sm">
                 {user.email?.[0].toUpperCase()}
               </span>
               <span className="text-sm font-medium text-gray-700">{user.email}</span>
               <LogOut className="w-4 h-4 text-gray-400 ml-2" />
               <span className="sr-only">Sign out</span>
             </button>
          </header>

          <div className="shrink-0">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-[3.5rem] font-medium tracking-tight text-[#1a1a1a] leading-[1.1] mb-8"
            >
              Managing <span className="inline-block bg-[#f4f4f4] rounded-2xl p-2 mx-1"><Shield className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900" /></span> Your Health<br/>
              <span className="flex items-center gap-4 mt-2">
                and <span className="bg-[#E2FF6F] px-4 py-1 rounded-[20px] inline-block -rotate-2">✨</span> Records
              </span>
            </motion.h1>

            {/* Pill Tabs */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-2 mb-10 border-b border-transparent pb-2"
            >
              {tabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#1C1C1C] text-white shadow-md scale-105' 
                        : 'bg-[#f4f4f4] text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </motion.div>
          </div>

          {/* Bento Content Area */}
          <div className="flex-1 relative">
            {status && (
              <div className={`mb-5 rounded-2xl border px-5 py-3 text-sm font-medium ${status.kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`} role="status">
                {status.message}
              </div>
            )}
            <AnimatePresence mode="wait">
              
              {isUploading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-[32px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C1C1C] mb-4"></div>
                  <h3 className="text-xl font-medium text-gray-900 mb-1">Analyzing Document...</h3>
                  <p className="text-sm text-gray-500 font-medium">Extracting health insights</p>
                </motion.div>
              )}

              {/* JARGON BUSTER */}
              {!isUploading && activeTab === 'jargon' && (
                <motion.div key="jargon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Upload Bento Card */}
                  <div className="lg:col-span-2 bg-[#f4f4f4] rounded-[32px] p-8 md:p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-6">
                        <FileText className="w-6 h-6 text-gray-900" />
                      </div>
                      <h2 className="text-3xl font-medium text-gray-900 mb-3">Jargon Buster</h2>
                      <p className="text-gray-500 max-w-sm text-base leading-relaxed">
                        Upload confusing lab reports or insurance forms. We translate them into simple 5th-grade English.
                      </p>
                    </div>
                    <div className="mt-8 relative z-10">
                      <button onClick={() => document.getElementById('file-input-jargon')?.click()} className="bg-white text-gray-900 px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-2 shadow-sm">
                        <UploadCloud className="w-5 h-5" /> Upload Document
                      </button>
                      <input id="file-input-jargon" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'jargon')} />
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/40 rounded-full blur-3xl group-hover:bg-white/60 transition-all duration-700"></div>
                  </div>

                  {/* Info Bento Card */}
                  <div className="bg-[#1C1C1C] rounded-[32px] p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-medium mb-2">Take Your Health to the Next Level</h3>
                      <p className="text-gray-400 text-sm">Automate your health tracking.</p>
                    </div>
                    <div className="mt-8 relative z-10">
                       <button type="button" onClick={() => selectTab('timeline')} className="bg-white text-[#1C1C1C] w-full py-3.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                         View Timeline <Calendar className="w-4 h-4" />
                       </button>
                    </div>
                    <div className="absolute top-0 right-0 p-6 opacity-20"><Activity className="w-32 h-32" /></div>
                  </div>

                  {/* Documents List */}
                  <div className="lg:col-span-3 mt-4 space-y-6">
                    {tabDocs.length === 0 && (
                      <div className="rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No translated documents yet.</div>
                    )}
                    {tabDocs.map((doc) => {
                      const metadata = normalizeStoredMetadata('jargon', doc.flagged_charges) as JargonMetadata
                      return (
                      <div key={doc.id} className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-lg text-gray-900 mb-4">Translated Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                          <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">What is this?</p><p className="text-sm text-gray-800">{metadata.whatIsThis}</p></div>
                          <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Do I owe money?</p><p className="text-sm text-gray-800">{metadata.oweMoney}</p></div>
                          <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Deadline</p><p className="text-sm text-gray-800">{metadata.deadline}</p></div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{doc.ai_summary}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {(doc.storage_path || doc.file_url) && <button type="button" onClick={() => void openStoredDocument(doc.storage_path, doc.file_url)} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold"><ExternalLink className="h-4 w-4" />View source</button>}
                          <button type="button" onClick={() => void deleteDocument(doc)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"><Trash2 className="h-4 w-4" />Delete</button>
                        </div>
                      </div>
                    )})}
                  </div>

                </motion.div>
              )}

              {/* TIMELINE */}
              {!isUploading && activeTab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  <div className="lg:col-span-3 bg-[#E2FF6F] rounded-[32px] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="bg-[#1C1C1C] text-white w-12 h-12 rounded-2xl flex items-center justify-center">
                         <Calendar className="w-6 h-6" />
                       </div>
                       <h2 className="text-3xl font-medium text-[#1C1C1C]">Chronological Timeline</h2>
                    </div>
                    <div className="bg-white/40 rounded-[24px] p-6 max-h-[500px] overflow-y-auto no-scrollbar">
                      {documents.length === 0 ? (
                        <p className="text-[#1C1C1C]/60 text-center py-10 font-medium">No medical history found. Start uploading documents!</p>
                      ) : (
                        <div className="space-y-4">
                          {documents.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-2xl p-5 shadow-sm border border-white/50 flex flex-col md:flex-row md:items-center gap-4 hover:-translate-y-1 transition-transform">
                              <div className="bg-[#f4f4f4] w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                                {doc.document_type === 'prescription' ? <HeartPulse className="w-5 h-5 text-gray-900" /> : doc.document_type === 'bill' ? <Receipt className="w-5 h-5 text-gray-900" /> : doc.document_type === 'report' ? <Activity className="w-5 h-5 text-gray-900" /> : <FileText className="w-5 h-5 text-gray-900" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 capitalize">{doc.document_type}</h4>
                                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{doc.ai_summary}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                                  {Number.isNaN(Date.parse(doc.created_at)) ? 'Date unavailable' : new Date(doc.created_at).toLocaleDateString()}
                                </span>
                                <button type="button" onClick={() => void deleteDocument(doc)} aria-label={`Delete ${doc.document_type} document`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* REPORT ANALYZER */}
              {!isUploading && activeTab === 'report' && (
                <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  
                  <div className="bg-[#f4f4f4] rounded-[32px] p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-medium text-gray-900 mb-2">Triage Nurse AI</h2>
                      <p className="text-gray-500 max-w-md text-base">Get instant insights from complex lab reports and clear next-step recommendations.</p>
                    </div>
                    <button onClick={() => document.getElementById('file-input-report')?.click()} className="bg-[#1C1C1C] text-white px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-lg whitespace-nowrap">
                      Analyze Lab Report
                    </button>
                    <input id="file-input-report" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'report')} />
                  </div>

                  <div className="space-y-6">
                    {tabDocs.length === 0 && <div className="rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No analyzed reports yet.</div>}
                    {tabDocs.map((doc) => {
                      const extra = normalizeStoredMetadata('report', doc.flagged_charges) as ReportMetadata
                      const actions = extra.recommendedActions
                      const appointments = extra.appointments

                      return (
                        <div key={doc.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                          <div className="p-8 flex-1 space-y-6">
                            <h3 className="text-xl font-medium text-gray-900">Report Insights</h3>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-2xl">{doc.ai_summary}</p>
                            {actions.length > 0 && (
                              <div className="pt-2">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#1C1C1C]" /> Recommended Actions</h4>
                                <div className="flex flex-wrap gap-2">{actions.map((action, index) => <span key={index} className="bg-[#E2FF6F]/30 text-[#1C1C1C] text-sm px-4 py-2 rounded-full font-medium">{action}</span>)}</div>
                              </div>
                            )}
                            {appointments.length > 0 && (
                              <div className="pt-2 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Suggested Appointments</h4>
                                <div className="grid gap-3 md:grid-cols-2">{appointments.map((appointment, index) => (
                                  <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="flex items-start justify-between gap-3"><p className="font-semibold text-gray-900">{appointment.doctorType}</p><span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600">{appointment.timeframe}</span></div>
                                    <p className="mt-2 text-sm text-gray-600">{appointment.reason}</p>
                                  </div>
                                ))}</div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 border-t border-gray-100 p-6 md:w-full">
                            {(doc.storage_path || doc.file_url) && <button type="button" onClick={() => void openStoredDocument(doc.storage_path, doc.file_url)} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold"><ExternalLink className="h-4 w-4" />View source</button>}
                            <button type="button" onClick={() => void deleteDocument(doc)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"><Trash2 className="h-4 w-4" />Delete</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* FAMILY PROFILES */}
              {!isUploading && activeTab === 'family' && (
                <motion.div key="family" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="bg-[#f4f4f4] rounded-[32px] p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-8"><div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"><Users className="w-6 h-6" /></div><div><h2 className="text-3xl font-medium text-gray-900">Family Profiles</h2><p className="text-gray-500">Save details to quickly fill health forms.</p></div></div>
                    <form onSubmit={saveFamilyProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required value={familyForm.full_name} onChange={event => setFamilyForm({ ...familyForm, full_name: event.target.value })} placeholder="Full name" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-gray-400" />
                      <select required value={familyForm.relationship} onChange={event => setFamilyForm({ ...familyForm, relationship: event.target.value })} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-gray-400"><option value="">Relationship</option><option>Self</option><option>Spouse</option><option>Parent</option><option>Child</option><option>Other</option></select>
                      <input type="date" required value={familyForm.date_of_birth} onChange={event => setFamilyForm({ ...familyForm, date_of_birth: event.target.value })} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-gray-400" aria-label="Date of birth" />
                      <input value={familyForm.blood_group} onChange={event => setFamilyForm({ ...familyForm, blood_group: event.target.value })} placeholder="Blood group (optional)" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-gray-400" />
                      <button disabled={isSaving} className="md:col-span-2 rounded-full bg-[#1C1C1C] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Profile'}</button>
                    </form>
                  </div>
                  {familyProfiles.length === 0 ? <div className="rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No saved family profiles.</div> : <div className="grid gap-4 md:grid-cols-2">{familyProfiles.map(profile => {
                    const copyText = `Name: ${profile.full_name}\nRelation: ${profile.relationship}\nDOB: ${profile.date_of_birth}\nBlood Group: ${profile.blood_group || 'N/A'}`
                    return <div key={profile.id} className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold">{profile.full_name}</h3><span className="rounded-full bg-[#E2FF6F]/40 px-3 py-1 text-xs font-semibold">{profile.relationship}</span></div><p className="mt-4 text-sm text-gray-600">DOB: {profile.date_of_birth}</p><p className="mt-1 text-sm text-gray-600">Blood group: {profile.blood_group || 'N/A'}</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => void copyToClipboard(copyText, profile.id)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">{copied === profile.id ? <><CheckCircle2 className="w-4 h-4 text-green-600" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Details</>}</button><button type="button" onClick={() => void deleteFamilyProfile(profile)} aria-label={`Delete ${profile.full_name} profile`} className="rounded-full border border-red-200 p-3 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>
                  })}</div>}
                </motion.div>
              )}

              {/* PRESCRIPTION BUY */}
              {!isUploading && activeTab === 'prescription' && (
                <motion.div key="prescription" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="bg-[#f4f4f4] rounded-[32px] p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"><div><h2 className="text-3xl font-medium text-gray-900 mb-2">Prescription Buy</h2><p className="text-gray-500 max-w-md">Extract medicines from a prescription and open trusted pharmacy searches.</p></div><button onClick={() => triggerUpload('prescription')} className="rounded-full bg-[#1C1C1C] px-6 py-3.5 text-sm font-semibold text-white"><UploadCloud className="inline w-5 h-5 mr-2" />Upload Prescription</button><input id="file-input-prescription" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={event => void handleFileUpload(event, 'prescription')} /></div>
                  {tabDocs.length === 0 && <div className="rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No analyzed prescriptions yet.</div>}
                  {tabDocs.map(doc => {
                    const metadata = normalizeStoredMetadata('prescription', doc.flagged_charges) as PrescriptionMetadata
                    return <div key={doc.id} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm"><h3 className="text-xl font-medium">Prescription Summary</h3><p className="mt-3 whitespace-pre-wrap rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">{doc.ai_summary}</p><h4 className="mt-6 mb-3 text-sm font-semibold">Medicines Found</h4>{metadata.items.length === 0 ? <p className="text-sm text-gray-500">No medicines were extracted.</p> : <div className="space-y-3">{metadata.items.map((medicine, index) => <div key={`${medicine.name}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"><span className="font-semibold">{medicine.name}</span><div className="flex gap-2">{medicine.tata1mg && <a href={medicine.tata1mg} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-3 py-2 text-xs font-semibold">Tata 1mg <ExternalLink className="inline w-3 h-3" /></a>}{medicine.apollo && <a href={medicine.apollo} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-3 py-2 text-xs font-semibold">Apollo <ExternalLink className="inline w-3 h-3" /></a>}</div></div>)}</div>}<div className="mt-6 flex flex-wrap gap-2">{(doc.storage_path || doc.file_url) && <button type="button" onClick={() => void openStoredDocument(doc.storage_path, doc.file_url)} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold"><ExternalLink className="h-4 w-4" />View source</button>}<button type="button" onClick={() => void deleteDocument(doc)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"><Trash2 className="h-4 w-4" />Delete</button></div></div>
                  })}
                </motion.div>
              )}

              {/* BILL ANALYZER */}
              {!isUploading && activeTab === 'bill' && (
                <motion.div key="bill" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="bg-[#f4f4f4] rounded-[32px] p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"><div><h2 className="text-3xl font-medium text-gray-900 mb-2">Bill Analyzer</h2><p className="text-gray-500 max-w-md">Find potential overcharges and practical savings in hospital bills.</p></div><button onClick={() => triggerUpload('bill')} className="rounded-full bg-[#1C1C1C] px-6 py-3.5 text-sm font-semibold text-white"><UploadCloud className="inline w-5 h-5 mr-2" />Upload Bill</button><input id="file-input-bill" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={event => void handleFileUpload(event, 'bill')} /></div>
                  {tabDocs.length === 0 && <div className="rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No analyzed bills yet.</div>}
                  {tabDocs.map(doc => {
                    const metadata = normalizeStoredMetadata('bill', doc.flagged_charges) as BillMetadata
                    const expanded = expandedDoc === doc.id
                    return <div key={doc.id} className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm"><div className="p-8"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><h3 className="text-xl font-medium">Bill Summary</h3><span className="rounded-full bg-[#E2FF6F]/40 px-4 py-2 text-sm font-semibold">Total: {metadata.totalAmount}</span></div><p className="mt-4 whitespace-pre-wrap text-sm text-gray-600">{doc.ai_summary}</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => setExpandedDoc(expanded ? null : doc.id)} className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold">{expanded ? 'Hide details' : 'Show full analysis'}{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>{(doc.storage_path || doc.file_url) && <button type="button" onClick={() => void openStoredDocument(doc.storage_path, doc.file_url)} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold"><ExternalLink className="h-4 w-4" />View source</button>}<button type="button" onClick={() => void deleteDocument(doc)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"><Trash2 className="h-4 w-4" />Delete</button></div></div>{expanded && <div className="space-y-5 border-t border-gray-100 bg-gray-50 p-8">{metadata.flaggedCharges.length > 0 && <section><h4 className="mb-3 flex items-center gap-2 font-semibold text-red-700"><AlertTriangle className="w-5 h-5" />Potential Overcharges</h4><div className="space-y-3">{metadata.flaggedCharges.map((charge, index) => <div key={index} className="rounded-2xl border border-red-100 bg-white p-4"><div className="flex flex-col md:flex-row md:items-start justify-between gap-3"><div><p className="font-semibold">{charge.item}</p><p className="mt-1 text-sm text-red-700">{charge.reason}</p></div><div className="text-sm"><p>Billed: {charge.billedAmount}</p><p className="font-semibold text-green-700">Fair: {charge.fairPrice}</p><p className="text-xs text-gray-500">{charge.canDispute ? 'Can be disputed' : 'Dispute not indicated'}</p></div></div></div>)}</div></section>}{metadata.costSavingTips.length > 0 && <section><h4 className="mb-3 flex items-center gap-2 font-semibold"><Lightbulb className="w-5 h-5 text-yellow-500" />Cost-saving tips</h4><ul className="space-y-2">{metadata.costSavingTips.map((tip, index) => <li key={index} className="flex gap-2 text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />{tip}</li>)}</ul></section>}{metadata.followUp && <section className="rounded-2xl bg-white p-5"><h4 className="font-semibold">Follow-up</h4><p className="mt-2 text-sm"><strong>When:</strong> {metadata.followUp.recommendedDate}</p><p className="mt-1 text-sm"><strong>Doctor:</strong> {metadata.followUp.doctorType}</p><p className="mt-1 text-sm text-gray-600">{metadata.followUp.notes}</p></section>}{metadata.flaggedCharges.length === 0 && metadata.costSavingTips.length === 0 && !metadata.followUp && <p className="text-sm text-gray-500">No additional structured details were provided.</p>}</div>}</div>
                  })}
                </motion.div>
              )}

              {/* INSURANCE CONNECT */}
              {!isUploading && activeTab === 'insurance' && (
                <motion.div key="insurance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="bg-[#f4f4f4] rounded-[32px] p-8 md:p-10"><div className="flex items-center gap-4 mb-8"><div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"><Shield className="w-6 h-6" /></div><div><h2 className="text-3xl font-medium text-gray-900">Insurance Connect</h2><p className="text-gray-500">Keep policy details ready for quick access.</p></div></div><form onSubmit={saveInsurance} className="grid grid-cols-1 md:grid-cols-2 gap-4"><input required value={insuranceForm.provider_name} onChange={event => setInsuranceForm({ ...insuranceForm, provider_name: event.target.value })} placeholder="Provider name" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-gray-400" /><input required value={insuranceForm.policy_number} onChange={event => setInsuranceForm({ ...insuranceForm, policy_number: event.target.value })} placeholder="Policy number" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-gray-400" /><input id="insurance-file-input" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={event => setInsuranceFile(event.target.files?.[0] ?? null)} className="md:col-span-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-semibold" /><button disabled={isSaving} className="md:col-span-2 rounded-full bg-[#1C1C1C] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Policy'}</button></form></div>
                  {insurancePolicies.length === 0 ? <div className="rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No saved insurance policies.</div> : <div className="grid gap-4 md:grid-cols-2">{insurancePolicies.map(policy => {
                    const copyText = `Provider: ${policy.provider_name}\nPolicy No: ${policy.policy_number}`
                    return <div key={policy.id} className="flex flex-col rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100"><Shield className="w-5 h-5" /></div><h3 className="text-lg font-semibold">{policy.provider_name}</h3><p className="mt-2 break-all rounded-xl bg-gray-50 px-3 py-2 font-mono text-sm text-gray-600">{policy.policy_number}</p><div className="mt-5 space-y-2">{(policy.storage_path || policy.document_url) && <button type="button" onClick={() => void openStoredDocument(policy.storage_path, policy.document_url)} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E2FF6F]/40 px-4 py-2.5 text-sm font-semibold"><ExternalLink className="w-4 h-4" />View Document</button>}<div className="flex gap-2"><button type="button" onClick={() => void copyToClipboard(copyText, policy.id)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">{copied === policy.id ? <><CheckCircle2 className="w-4 h-4 text-green-600" />Copied</> : <><Copy className="w-4 h-4" />Copy Details</>}</button><button type="button" onClick={() => void deleteInsurancePolicy(policy)} aria-label={`Delete ${policy.provider_name} policy`} className="rounded-full border border-red-200 p-3 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div></div>
                  })}</div>}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
