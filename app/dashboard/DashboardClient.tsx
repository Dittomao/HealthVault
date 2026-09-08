'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { FileText, UploadCloud, HeartPulse, LogOut, ShoppingCart, ExternalLink, Receipt, AlertTriangle, Calendar, Lightbulb, IndianRupee, ChevronDown, ChevronUp, Users, Shield, Copy, CheckCircle2, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'


const SidebarItem = ({ icon: Icon, label, active, onClick, expanded }: any) => (
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

export default function DashboardClient({ user }: { user: any }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'jargon' | 'timeline' | 'family' | 'prescription' | 'bill' | 'insurance' | 'report'>('jargon')
  const [documents, setDocuments] = useState<any[]>([])
  const [familyProfiles, setFamilyProfiles] = useState<any[]>([])
  const [insurancePolicies, setInsurancePolicies] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  
  // Forms state
  const [familyForm, setFamilyForm] = useState({ full_name: '', relationship: '', date_of_birth: '', blood_group: '' })
  const [insuranceForm, setInsuranceForm] = useState({ provider_name: '', policy_number: '' })
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: docs } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    if (docs) setDocuments(docs)

    const { data: family } = await supabase.from('family_profiles').select('*').order('created_at', { ascending: false })
    if (family) setFamilyProfiles(family)

    const { data: insurance } = await supabase.from('insurance_policies').select('*').order('created_at', { ascending: false })
    if (insurance) setInsurancePolicies(insurance)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const triggerUpload = (mode: 'jargon' | 'prescription' | 'bill' | 'report') => {
    const input = document.getElementById(`file-input-${mode}`) as HTMLInputElement
    input?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'jargon' | 'prescription' | 'bill' | 'report') => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)

      try {
        const res = await fetch('/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: publicUrl, mimeType: file.type, mode })
        })

        const aiData = await res.json()
        if (aiData.error) throw new Error(aiData.error)

        let extraData: any = {};
        if (mode === 'bill') {
          extraData = { flaggedCharges: aiData.flaggedCharges || [], costSavingTips: aiData.costSavingTips || [], followUp: aiData.followUp || null, totalAmount: aiData.totalAmount || 'N/A', items: aiData.items || [] };
        } else if (mode === 'jargon') {
          extraData = { whatIsThis: aiData.whatIsThis, oweMoney: aiData.oweMoney, deadline: aiData.deadline };
        } else if (mode === 'report') {
          extraData = { recommendedActions: aiData.recommendedActions || [], appointments: aiData.appointments || [] };
        } else {
          extraData = aiData.items || [];
        }

        await supabase.from('documents').insert({
          user_id: user.id,
          document_type: aiData.type || mode,
          file_url: publicUrl,
          ai_summary: aiData.summary || 'Summary unavailable',
          flagged_charges: extraData
        })

        fetchData()
      } catch (error: any) {
        console.error('AI Analysis failed:', error)
        alert(error.message || 'Analysis failed.')
      } finally {
        setIsUploading(false)
      }
    } catch (error: any) {
      console.error('Upload failed:', error)
      alert(error.message || 'Upload failed.')
      setIsUploading(false)
    }
    e.target.value = ''
  }

  const saveFamilyProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('family_profiles').insert({ ...familyForm, user_id: user.id })
    if (error) alert(error.message)
    else { setFamilyForm({ full_name: '', relationship: '', date_of_birth: '', blood_group: '' }); fetchData() }
  }

  const saveInsurance = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    let document_url = null
    
    try {
      if (insuranceFile) {
        const fileExt = insuranceFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const { data, error: uploadError } = await supabase.storage.from('documents').upload(`${user.id}/${fileName}`, insuranceFile)
        
        if (uploadError) {
          throw new Error("File upload failed: " + uploadError.message)
        }
        
        const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(`${user.id}/${fileName}`)
        document_url = publicUrlData.publicUrl
      }
      
      const { error } = await supabase.from('insurance_policies').insert({ ...insuranceForm, document_url, user_id: user.id })
      if (error) throw error
      
      setInsuranceForm({ provider_name: '', policy_number: '' })
      setInsuranceFile(null)
      const fileInput = document.getElementById('insurance-file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const tabDocs = documents.filter(d => {
    if (activeTab === 'jargon') return d.document_type === 'jargon'
    if (activeTab === 'prescription') return d.document_type === 'prescription'
    if (activeTab === 'bill') return d.document_type === 'bill'
    if (activeTab === 'report') return d.document_type === 'report'
    return false
  })

  const tabs = [
    { id: 'jargon', label: 'Jargon Buster', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'family', label: 'Auto-Fill Profiles', icon: Users },
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
                  onClick={() => setActiveTab(tab.id as any)} 
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
             
             {/* Desktop Profile Pill */}
             <div className="hidden sm:flex ml-auto items-center gap-3 bg-[#f4f4f4] pr-4 pl-1 py-1 rounded-full border border-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
               <div className="w-8 h-8 rounded-full bg-[#E2FF6F] flex items-center justify-center font-bold text-[#1C1C1C] text-sm">
                 {user.email?.[0].toUpperCase()}
               </div>
               <span className="text-sm font-medium text-gray-700">{user.email}</span>
               <LogOut className="w-4 h-4 text-gray-400 ml-2" onClick={handleSignOut} />
             </div>
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
                    onClick={() => setActiveTab(tab.id as any)}
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
                       <button className="bg-white text-[#1C1C1C] w-full py-3.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                         View Analytics <ExternalLink className="w-4 h-4" />
                       </button>
                    </div>
                    <div className="absolute top-0 right-0 p-6 opacity-20"><Activity className="w-32 h-32" /></div>
                  </div>

                  {/* Documents List */}
                  <div className="lg:col-span-3 mt-4 space-y-6">
                    {tabDocs.map((doc: any) => (
                      <div key={doc.id} className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-lg text-gray-900 mb-2">Translated Summary</h4>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{doc.ai_summary}</p>
                      </div>
                    ))}
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
                          {documents.map((doc: any) => (
                            <div key={doc.id} className="bg-white rounded-2xl p-5 shadow-sm border border-white/50 flex flex-col md:flex-row md:items-center gap-4 hover:-translate-y-1 transition-transform">
                              <div className="bg-[#f4f4f4] w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                                {doc.document_type === 'prescription' ? <HeartPulse className="w-5 h-5 text-gray-900" /> : <FileText className="w-5 h-5 text-gray-900" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 capitalize">{doc.document_type}</h4>
                                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{doc.ai_summary}</p>
                              </div>
                              <div className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg shrink-0">
                                {new Date(doc.created_at).toLocaleDateString()}
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
                    {tabDocs.map((doc: any) => {
                      const extra = doc.flagged_charges || {}
                      const actions = extra.recommendedActions || []
                      const appointments = extra.appointments || []
                      
                      return (
                        <div key={doc.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                          <div className="p-8 flex-1 space-y-6">
                            <h3 className="text-xl font-medium text-gray-900">Report Insights</h3>
                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">{doc.ai_summary}</p>
                            
                            {actions.length > 0 && (
                              <div className="pt-2">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#1C1C1C]" /> Recommended Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                  {actions.map((action: string, i: number) => (
                                    <span key={i} className="bg-[#E2FF6F]/30 text-[#1C1C1C] text-sm px-4 py-2 rounded-full font-medium">{action}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* FAMILY & OTHERS (Generic Fallback for remaining tabs) */}
              {!isUploading && !['jargon', 'timeline', 'report'].includes(activeTab) && (
                <motion.div key="generic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#f4f4f4] rounded-[32px] p-8 md:p-10 text-center min-h-[400px] flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-3xl mb-4 shadow-sm">
                    <HeartPulse className="w-8 h-8 text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-medium text-gray-900 mb-2 capitalize">{activeTab} feature active</h2>
                  <p className="text-gray-500 max-w-sm mx-auto">This section uses the exact same Bento UI styling. Upload documents via the main button below to test this tab!</p>
                  <div className="mt-8">
                     <button onClick={() => document.getElementById('file-input-generic')?.click()} className="bg-[#1C1C1C] text-white px-8 py-3.5 rounded-full font-medium hover:scale-105 transition-transform shadow-xl">
                        Upload {activeTab}
                     </button>
                     <input id="file-input-generic" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, activeTab as any)} />
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
