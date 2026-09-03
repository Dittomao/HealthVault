'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileText, UploadCloud, HeartPulse, LogOut, ShoppingCart, ExternalLink, Receipt, AlertTriangle, Calendar, Lightbulb, IndianRupee, ChevronDown, ChevronUp, Users, Shield, Copy, CheckCircle2, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardClient({ user }: { user: any }) {
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
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-gray-900 selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 p-2 rounded-lg">
            <HeartPulse className="text-white w-5 h-5" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-gray-900">HealthVault</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500 hidden sm:block">{user.email}</span>
          <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 font-medium text-sm px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="sticky top-24">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Menu</h2>
            <nav className="flex flex-col gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all duration-200 ${
                      isActive 
                        ? 'bg-white text-gray-900 font-semibold shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {isUploading && (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center mb-8 h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Analyzing document...</h3>
              <p className="text-sm text-gray-500">This usually takes a few seconds.</p>
            </div>
          )}

          {/* Jargon Buster */}
          {!isUploading && activeTab === 'jargon' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-left">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Understand Medical Documents</h2>
                  <p className="text-gray-500 max-w-lg text-sm leading-relaxed">
                    Upload confusing lab reports, hospital letters, or insurance forms. Our system will translate them into plain, simple English.
                  </p>
                </div>
                <button
                  onClick={() => triggerUpload('jargon')}
                  className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shadow-sm shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Document
                </button>
                <input id="file-input-jargon" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'jargon')} />
              </div>

              {tabDocs.map(doc => {
                const isPdf = doc.file_url?.toLowerCase().endsWith('.pdf');
                return (
                <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 bg-gray-100 relative min-h-[200px] border-r border-gray-100 flex items-center justify-center">
                    {isPdf ? (
                      <iframe src={`${doc.file_url}#view=FitH`} className="absolute inset-0 w-full h-full" title="Document Preview" />
                    ) : (
                      <img src={doc.file_url} alt="Document" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Document Summary</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">What is this?</p>
                        <p className="text-base text-gray-900">{doc.flagged_charges?.whatIsThis || 'Medical Document'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Do I owe money?</p>
                          <p className={`text-base font-medium ${doc.flagged_charges?.oweMoney?.toLowerCase().includes('yes') ? 'text-red-600' : 'text-green-600'}`}>
                            {doc.flagged_charges?.oweMoney || 'No'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Deadlines</p>
                          <p className="text-base font-medium text-gray-900">{doc.flagged_charges?.deadline || 'None'}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Key Details</p>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {doc.ai_summary}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Timeline */}
          {!isUploading && activeTab === 'timeline' && (
            <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-10 pb-6 border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Health Timeline</h2>
                <p className="text-gray-500 text-sm">A chronological view of your documents and events.</p>
              </div>

              <div className="space-y-8">
                {documents.map(doc => {
                  let dateStr = new Date(doc.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                  let title = ''
                  let tagClass = ''
                  
                  if (doc.document_type === 'jargon') { title = 'Document Analyzed'; tagClass = 'bg-blue-50 text-blue-700 border-blue-200' }
                  else if (doc.document_type === 'prescription') { title = 'Prescription Uploaded'; tagClass = 'bg-green-50 text-green-700 border-green-200' }
                  else if (doc.document_type === 'bill') { title = 'Hospital Bill Analyzed'; tagClass = 'bg-red-50 text-red-700 border-red-200' }
                  else if (doc.document_type === 'report') { title = 'Health Report Analyzed'; tagClass = 'bg-purple-50 text-purple-700 border-purple-200' }
                  
                  return (
                    <div key={doc.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-3 h-3 rounded-full bg-gray-300 group-hover:bg-gray-900 transition-colors"></div>
                        <div className="w-px h-full bg-gray-200 my-2 group-hover:bg-gray-300 transition-colors"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <span className="text-sm font-medium text-gray-500 shrink-0 w-24">{dateStr}</span>
                          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${tagClass} w-fit`}>
                            {doc.document_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 sm:ml-28">{doc.ai_summary}</p>
                      </div>
                    </div>
                  )
                })}
                {documents.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500">No events found. Upload a document to start your timeline.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Family Profiles */}
          {!isUploading && activeTab === 'family' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Family Profiles</h2>
                  <p className="text-gray-500 text-sm">Save details to quickly auto-fill hospital forms.</p>
                </div>

                <form onSubmit={saveFamilyProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input type="text" required value={familyForm.full_name} onChange={e => setFamilyForm({...familyForm, full_name: e.target.value})} className="w-full text-sm border border-gray-300 rounded-md px-3 py-2.5 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
                    <select required value={familyForm.relationship} onChange={e => setFamilyForm({...familyForm, relationship: e.target.value})} className="w-full text-sm border border-gray-300 rounded-md px-3 py-2.5 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all bg-white">
                      <option value="">Select...</option>
                      <option value="Self">Self</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                    <input type="date" required value={familyForm.date_of_birth} onChange={e => setFamilyForm({...familyForm, date_of_birth: e.target.value})} className="w-full text-sm border border-gray-300 rounded-md px-3 py-2.5 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                    <input type="text" value={familyForm.blood_group} onChange={e => setFamilyForm({...familyForm, blood_group: e.target.value})} className="w-full text-sm border border-gray-300 rounded-md px-3 py-2.5 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all" placeholder="e.g. O+" />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" className="bg-gray-900 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                      Save Profile
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {familyProfiles.map(p => {
                    const textToCopy = `Name: ${p.full_name}\nRelation: ${p.relationship}\nDOB: ${p.date_of_birth}\nBlood Group: ${p.blood_group}`
                    return (
                      <div key={p.id} className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors bg-gray-50/50">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-base font-semibold text-gray-900">{p.full_name}</h3>
                          <span className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-2 py-1 rounded shadow-sm">{p.relationship}</span>
                        </div>
                        <div className="space-y-1.5 text-sm text-gray-600 mb-5">
                          <p><span className="font-medium text-gray-900">DOB:</span> {p.date_of_birth}</p>
                          <p><span className="font-medium text-gray-900">Blood Group:</span> {p.blood_group || 'N/A'}</p>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(textToCopy, p.id)}
                          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                        >
                          {copied === p.id ? <><CheckCircle2 className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Details</>}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Prescription */}
          {!isUploading && activeTab === 'prescription' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-left">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Prescription Analysis</h2>
                  <p className="text-gray-500 max-w-lg text-sm leading-relaxed">
                    Upload a handwritten prescription. We'll extract the medicines and provide direct links to purchase them online.
                  </p>
                </div>
                <button
                  onClick={() => triggerUpload('prescription')}
                  className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shadow-sm shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Prescription
                </button>
                <input id="file-input-prescription" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'prescription')} />
              </div>

              {tabDocs.map(doc => {
                const isPdf = doc.file_url?.toLowerCase().endsWith('.pdf');
                return (
                <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 bg-gray-100 relative min-h-[200px] border-r border-gray-100 flex items-center justify-center">
                    {isPdf ? (
                      <iframe src={`${doc.file_url}#view=FitH`} className="absolute inset-0 w-full h-full" title="Document Preview" />
                    ) : (
                      <img src={doc.file_url} alt="Prescription" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap mb-6 border-b border-gray-100 pb-6">{doc.ai_summary}</p>
                    
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Medicines Found</h4>
                    <div className="space-y-3">
                      {Array.isArray(doc.flagged_charges) && doc.flagged_charges.map((med: any, i: number) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-3">
                          <span className="font-medium text-gray-900 text-base">{med.name}</span>
                          <div className="flex flex-wrap gap-2">
                            {med.tata1mg && (
                              <a href={med.tata1mg} target="_blank" className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm">
                                Tata 1mg <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {med.apollo && (
                              <a href={med.apollo} target="_blank" className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm">
                                Apollo <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Bill Analyzer */}
          {!isUploading && activeTab === 'bill' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-left">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hospital Bill Analyzer</h2>
                  <p className="text-gray-500 max-w-lg text-sm leading-relaxed">
                    Check if your hospital bills contain overcharges, duplicate items, or unnecessary fees.
                  </p>
                </div>
                <button
                  onClick={() => triggerUpload('bill')}
                  className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shadow-sm shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Bill
                </button>
                <input id="file-input-bill" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'bill')} />
              </div>

              {tabDocs.map(doc => {
                const charges = doc.flagged_charges || {}
                const isExpanded = expandedDoc === doc.id
                const isPdf = doc.file_url?.toLowerCase().endsWith('.pdf');
                return (
                  <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-1/4 bg-gray-100 relative min-h-[150px] border-r border-gray-100 flex items-center justify-center">
                        {isPdf ? (
                          <iframe src={`${doc.file_url}#view=FitH`} className="absolute inset-0 w-full h-full" title="Document Preview" />
                        ) : (
                          <img src={doc.file_url} alt="Bill" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">Analysis Summary</h3>
                          <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-md border border-gray-200 w-fit">
                            Total: {charges.totalAmount || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{doc.ai_summary}</p>
                        <button onClick={() => setExpandedDoc(isExpanded ? null : doc.id)} className="mt-4 flex items-center gap-1.5 text-gray-900 font-medium text-sm hover:underline w-fit">
                          {isExpanded ? 'Hide Details' : 'Show Full Analysis'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-6 md:p-8 space-y-8">
                        {/* Overcharges */}
                        {charges.flaggedCharges && charges.flaggedCharges.length > 0 && (
                          <div className="bg-white p-6 rounded-lg border border-red-100 shadow-sm">
                            <h4 className="text-base font-semibold text-red-700 flex items-center gap-2 mb-4">
                              <AlertTriangle className="w-5 h-5" /> Potential Overcharges
                            </h4>
                            <div className="space-y-3">
                              {charges.flaggedCharges.map((fc: any, i: number) => (
                                <div key={i} className="bg-red-50/50 p-4 rounded-md border border-red-50 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm text-gray-900">{fc.item}</p>
                                    <p className="text-red-700 text-xs mt-1">{fc.reason}</p>
                                  </div>
                                  <div className="flex flex-col md:text-right gap-1 shrink-0 bg-white px-3 py-2 rounded border border-red-100">
                                    <span className="text-xs font-medium text-gray-500 line-through">Billed: {fc.billedAmount}</span>
                                    <span className="text-sm font-semibold text-green-700">Fair: {fc.fairPrice}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Cost cutting tips */}
                        {charges.costSavingTips && charges.costSavingTips.length > 0 && (
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                              <Lightbulb className="w-5 h-5 text-yellow-500" /> Recommendations
                            </h4>
                            <ul className="space-y-3">
                              {charges.costSavingTips.map((tip: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-700">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                  <span className="leading-relaxed">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Report Analyzer */}
          {!isUploading && activeTab === 'report' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-left">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Health Report Analyzer</h2>
                  <p className="text-gray-500 max-w-lg text-sm leading-relaxed">
                    Upload your health report (blood test, MRI, etc.). We'll analyze it, recommend basic actions, and suggest appointments if needed.
                  </p>
                </div>
                <button
                  onClick={() => triggerUpload('report')}
                  className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shadow-sm shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Report
                </button>
                <input id="file-input-report" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'report')} />
              </div>

              {tabDocs.map(doc => {
                const isPdf = doc.file_url?.toLowerCase().endsWith('.pdf');
                const actions = doc.flagged_charges?.recommendedActions || [];
                const appointments = doc.flagged_charges?.appointments || [];
                
                return (
                <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 bg-gray-100 relative min-h-[200px] border-r border-gray-100 flex items-center justify-center">
                    {isPdf ? (
                      <iframe src={`${doc.file_url}#view=FitH`} className="absolute inset-0 w-full h-full" title="Document Preview" />
                    ) : (
                      <img src={doc.file_url} alt="Report" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex-1 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Summary</h3>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{doc.ai_summary}</div>
                    </div>

                    {actions.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recommended Actions</h4>
                        <ul className="space-y-2">
                          {actions.map((action: string, i: number) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-700">
                              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {appointments.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Suggested Appointments</h4>
                        <div className="space-y-3">
                          {appointments.map((appt: any, i: number) => (
                            <div key={i} className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-gray-900">{appt.doctorType}</span>
                                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">{appt.timeframe}</span>
                              </div>
                              <p className="text-sm text-gray-600">{appt.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Insurance */}
          {!isUploading && activeTab === 'insurance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Insurance Policies</h2>
                  <p className="text-gray-500 text-sm">Securely store your policies for easy sharing.</p>
                </div>

                <form onSubmit={saveInsurance} className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider Name</label>
                    <input type="text" required value={insuranceForm.provider_name} onChange={e => setInsuranceForm({...insuranceForm, provider_name: e.target.value})} className="w-full text-sm border border-gray-300 rounded-md px-3 py-2.5 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all" placeholder="e.g. Star Health" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Policy Number</label>
                    <input type="text" required value={insuranceForm.policy_number} onChange={e => setInsuranceForm({...insuranceForm, policy_number: e.target.value})} className="w-full text-sm border border-gray-300 rounded-md px-3 py-2.5 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all" placeholder="Enter number..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Policy Document (Optional)</label>
                    <input id="insurance-file-input" type="file" accept="image/*,application/pdf" onChange={e => setInsuranceFile(e.target.files?.[0] || null)} className="w-full text-sm border border-gray-300 rounded-md px-3 py-2.5 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" disabled={isSaving} className="bg-gray-900 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Policy'}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {insurancePolicies.map(p => {
                    const textToCopy = `Provider: ${p.provider_name}\nPolicy No: ${p.policy_number}`
                    return (
                      <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors shadow-sm flex flex-col h-full">
                        <div className="bg-gray-100 text-gray-700 w-10 h-10 rounded-md flex items-center justify-center mb-4 border border-gray-200">
                          <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{p.provider_name}</h3>
                        <p className="text-sm text-gray-600 font-mono bg-gray-50 px-2.5 py-1.5 rounded border border-gray-100 mb-5 break-all inline-block w-fit">
                          {p.policy_number}
                        </p>
                        
                        <div className="mt-auto space-y-2">
                          {p.document_url && (
                            <a href={p.document_url} target="_blank" className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-blue-100">
                              <ExternalLink className="w-4 h-4" /> View Document
                            </a>
                          )}
                          <button 
                            onClick={() => copyToClipboard(textToCopy, p.id)}
                            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                          >
                            {copied === p.id ? <><CheckCircle2 className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Details</>}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
