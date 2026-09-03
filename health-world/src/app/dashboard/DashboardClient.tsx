'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileText, UploadCloud, HeartPulse, LogOut, ShoppingCart, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardClient({ user }: { user: any }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setDocuments(data)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64Image = (reader.result as string).split(',')[1]

        const res = await fetch('/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image })
        })
        
        const aiData = await res.json()

        await supabase.from('documents').insert({
          user_id: user.id,
          document_type: aiData.type || 'document',
          file_url: publicUrl,
          ai_summary: aiData.summary || 'Summary unavailable',
          flagged_charges: aiData.items || []
        })

        fetchDocuments()
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Check console for details.')
    } finally {
      setIsUploading(false)
    }
  }

  // Calculate stats
  const totalBills = documents.filter(d => d.document_type === 'bill')
  const totalFlags = totalBills.reduce((acc, doc) => acc + (doc.flagged_charges?.length || 0), 0)
  const estimatedSavings = totalFlags * 150
  
  const totalPrescriptions = documents.filter(d => d.document_type === 'prescription').length

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <HeartPulse className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-gray-900">Health World</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">{user.email}</span>
          <button onClick={handleSignOut} className="text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 space-y-6">
          <label className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center border-dashed border-2 border-blue-200 cursor-pointer hover:bg-blue-50/50 transition-colors group relative overflow-hidden">
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {isUploading ? 'Our AI is analyzing your document...' : 'Upload Prescription or Bill'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              {isUploading ? 'Extracting medicines and scanning for junk fees...' : 'Drag and drop your document. Our AI will auto-detect if it is a bill or prescription.'}
            </p>
            <div className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium shadow-md">
              Browse Files
            </div>
          </label>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Processed Documents</h3>
            <div className="space-y-6">
              {documents.length === 0 && (
                <p className="text-gray-500 text-center py-4">No documents uploaded yet.</p>
              )}
              {documents.map((doc) => (
                <div key={doc.id} className="p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-white relative overflow-hidden">
                  
                  {/* Document Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${doc.document_type === 'prescription' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 capitalize">
                          {doc.document_type === 'prescription' ? 'Medical Prescription' : 'Hospital Bill'}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {/* Bill Badge */}
                    {doc.document_type === 'bill' && doc.flagged_charges && doc.flagged_charges.length > 0 && (
                      <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-200">
                        {doc.flagged_charges.length} Junk Fees Flagged
                      </span>
                    )}
                  </div>
                  
                  {/* AI Summary */}
                  <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                    <span className="font-semibold text-gray-900 block mb-2">AI Summary:</span>
                    {doc.ai_summary}
                  </div>

                  {/* Prescription Medicines List */}
                  {doc.document_type === 'prescription' && doc.flagged_charges && doc.flagged_charges.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                        Prescribed Medicines
                      </h4>
                      <div className="space-y-3">
                        {doc.flagged_charges.map((med: any, idx: number) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <span className="font-medium text-gray-900 mb-2 sm:mb-0">{med.name}</span>
                            <div className="flex items-center gap-2">
                              <a href={med.tata1mg} target="_blank" rel="noreferrer" className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-md hover:bg-orange-100 transition-colors font-medium border border-orange-200 flex items-center gap-1">
                                Tata 1mg <ExternalLink className="w-3 h-3" />
                              </a>
                              <a href={med.apollo} target="_blank" rel="noreferrer" className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-md hover:bg-teal-100 transition-colors font-medium border border-teal-200 flex items-center gap-1">
                                Apollo <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bill Flagged Charges */}
                  {doc.document_type === 'bill' && doc.flagged_charges && doc.flagged_charges.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="font-semibold text-red-600 text-sm mb-2">Unnecessary Charges Detected:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {doc.flagged_charges.map((charge: string, idx: number) => (
                          <li key={idx} className="bg-red-50 px-3 py-1 rounded-md inline-block mr-2 mb-2 border border-red-100">{charge}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                      View Original Document <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Profile Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Health Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-600">Bills Analyzed</span>
                <span className="font-bold text-gray-900">{totalBills.length}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-600">Prescriptions</span>
                <span className="font-bold text-gray-900">{totalPrescriptions}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              You have saved an estimated <span className="font-bold text-green-600">${estimatedSavings}</span> by identifying unnecessary hospital charges.
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
