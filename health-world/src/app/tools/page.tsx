import Link from "next/link";
import { HeartPulse, ArrowLeft, FileText, Calendar, Users, Receipt, Activity, Shield } from "lucide-react";

export default function ToolsPage() {
  const tools = [
    { title: 'Jargon Buster', desc: 'Translate confusing medical jargon and reports into plain, simple English.', icon: FileText, color: 'text-blue-500' },
    { title: 'Health Timeline', desc: 'A chronological view of your health documents and events.', icon: Calendar, color: 'text-purple-500' },
    { title: 'Auto-Fill Profiles', desc: 'Manage family profiles and auto-fill medical forms.', icon: Users, color: 'text-orange-500' },
    { title: 'Prescription Buy', desc: 'Upload prescriptions to extract medicines and get direct purchase links.', icon: HeartPulse, color: 'text-green-500' },
    { title: 'Bill Analyzer', desc: 'Analyze hospital bills instantly to catch overcharges and find savings.', icon: Receipt, color: 'text-red-500' },
    { title: 'Report Analyzer', desc: 'Analyze health reports and get recommended actions and follow-ups.', icon: Activity, color: 'text-indigo-500' },
    { title: 'Insurance Connect', desc: 'Securely store and share your insurance policies and documents.', icon: Shield, color: 'text-teal-500' },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-blue-100">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Our Health Tools</h1>
          <p className="text-xl text-gray-500 max-w-2xl">A complete suite of AI-powered utilities designed to simplify every aspect of your medical journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <Link key={i} href={`/dashboard`} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all group flex flex-col items-start text-left block">
              <div className={`w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-6 border border-gray-100 group-hover:bg-white transition-colors ${tool.color}`}>
                <tool.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
