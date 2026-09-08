import Link from "next/link";
import { ArrowLeft, Shield, Zap, Lock, EyeOff, Smartphone } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    { title: '100% Private by Design', desc: 'Your medical data is yours alone. We use secure databases and never sell your personal information to third parties.', icon: EyeOff },
    { title: 'AI-Powered Analysis', desc: 'Our advanced AI models can read messy handwriting, analyze complex bills, and simplify dense medical jargon instantly.', icon: Zap },
    { title: 'Bank-Grade Security', desc: 'All documents are stored using Supabase with robust Row Level Security (RLS) policies.', icon: Shield },
    { title: 'Cross-Device Sync', desc: 'Access your health timeline, insurance documents, and prescriptions from your phone, tablet, or laptop.', icon: Smartphone },
    { title: 'No Hidden Fees', desc: 'The core tools of HealthVault are 100% free to use. We believe basic healthcare management should be accessible to everyone.', icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Platform Features</h1>
          <p className="text-xl text-gray-500 max-w-2xl">Built with privacy, speed, and simplicity in mind.</p>
        </div>

        <div className="space-y-12">
          {features.map((feat, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-6 items-start bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="bg-blue-50 p-4 rounded-xl shrink-0">
                <feat.icon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
