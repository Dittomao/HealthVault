import Link from 'next/link'
import { ArrowLeft, CircleHelp, Code2, MessageSquareWarning } from 'lucide-react'

const issueTrackerUrl = 'https://github.com/Dittomao/HealthVault/issues'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Support</h1>
          <p className="text-xl text-gray-500 max-w-2xl">Report a problem, request a feature, or review known issues through the project tracker.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            <div className="bg-gray-900 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">GitHub Issue Tracker</h2>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">This is the currently available support channel. Before posting, avoid including medical documents, account credentials, API keys, or other sensitive personal information.</p>
            <a href={issueTrackerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
              <CircleHelp className="w-4 h-4" /> Open Issue Tracker
            </a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-blue-600">
              <MessageSquareWarning className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Direct Contact</h2>
            <p className="text-gray-600 leading-relaxed">Email, phone, postal support, and private message delivery are not configured yet. HealthVault will not claim that a message was sent when no delivery service is connected.</p>
            <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">For urgent medical concerns, contact a qualified healthcare professional or local emergency service—not the issue tracker.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
