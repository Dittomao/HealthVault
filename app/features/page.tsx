import Link from 'next/link'
import { ArrowLeft, Shield, Zap, Lock, EyeOff, Smartphone } from 'lucide-react'

export default function FeaturesPage() {
  const features = [
    { title: 'Private Account Storage', desc: 'Documents are kept in private Supabase Storage and access is scoped to your signed-in account.', icon: EyeOff },
    { title: 'AI-Assisted Analysis', desc: 'Gemini can extract medicine names, review bills, and simplify dense medical language. Always confirm important medical or financial decisions with a qualified professional.', icon: Zap },
    { title: 'Owner-Scoped Access', desc: 'Supabase authentication, database Row Level Security, and Storage policies restrict records to their owner.', icon: Shield },
    { title: 'Cross-Device Sync', desc: 'Sign in to access your timeline, insurance details, and analyzed documents from supported browsers.', icon: Smartphone },
    { title: 'Free Core Tools', desc: 'The current core HealthVault tools are available without a subscription. File uploads support PDF, JPEG, PNG, and WebP files up to 10 MB.', icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Platform Features</h1>
          <p className="text-xl text-gray-500 max-w-2xl">Built to make health records easier to organize and understand.</p>
        </div>

        <div className="space-y-12">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col md:flex-row gap-6 items-start bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="bg-blue-50 p-4 rounded-xl shrink-0">
                <feature.icon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
