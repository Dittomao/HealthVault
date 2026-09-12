'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Coffee, Code2, HeartHandshake } from 'lucide-react'

const repositoryUrl = 'https://github.com/Dittomao/HealthVault'
const issueTrackerUrl = `${repositoryUrl}/issues`

const Github = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export default function ContributePage() {
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  const copyShareLink = async () => {
    const url = window.location.origin
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('Link copied to your clipboard.')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      textarea.remove()
      setShareStatus(copied ? 'Link copied to your clipboard.' : `Copy this link: ${url}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-12 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Contribute</h1>
          <p className="text-xl text-gray-500 max-w-2xl">HealthVault is an open-source project. Help improve healthcare document management for everyone.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
            <div className="bg-gray-900 w-12 h-12 rounded-xl flex items-center justify-center mb-6"><Github className="w-6 h-6 text-white" /></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Open Source</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">Help build tools, fix bugs, improve accessibility, or strengthen the project documentation.</p>
            <a href={repositoryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"><Github className="w-4 h-4" /> View Repository</a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6"><Coffee className="w-6 h-6 text-orange-600" /></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Sponsorship</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">A verified sponsorship provider has not been connected. HealthVault does not currently accept payments or donations through this site.</p>
            <div className="inline-flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-500 px-6 py-3 rounded-lg text-sm font-semibold" aria-disabled="true"><Coffee className="w-4 h-4" /> Not Available Yet</div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6"><Code2 className="w-6 h-6 text-blue-600" /></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Report Issues</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">Found a bug or have a feature request? Open an issue without including medical records, credentials, or other sensitive information.</p>
            <a href={issueTrackerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">Open Issue Tracker</a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
            <div className="bg-pink-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6"><HeartHandshake className="w-6 h-6 text-pink-600" /></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Spread the Word</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">Share HealthVault with someone who could benefit from simpler health-document organization.</p>
            <button type="button" onClick={() => void copyShareLink()} className="inline-flex items-center justify-center gap-2 w-full bg-white border border-gray-300 text-gray-900 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">Copy Link to Share</button>
            {shareStatus && <p className="mt-3 break-all text-sm text-gray-600" role="status">{shareStatus}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
