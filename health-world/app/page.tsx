import Image from "next/image";
import Link from "next/link";
import { HeartPulse, ArrowRight, FileText, Receipt } from "lucide-react";

export default function Home() {
  return (
    <div 
      className="min-h-screen font-sans selection:bg-blue-100 relative overflow-x-hidden"
      style={{
        backgroundImage: 'url(/bg-hills.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#9cc6e9'
      }}
    >
      {/* Floating Navbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
        <nav className="bg-white rounded-full px-2 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 pl-4">
            <div className="bg-gray-900 p-1.5 rounded-lg">
              <HeartPulse className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">HealthVault</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/tools" className="hover:text-gray-900 transition-colors">Tools</Link>
            <Link href="/features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
            <Link href="/contribute" className="hover:text-gray-900 transition-colors">Contribute</Link>
          </div>

          <div className="flex items-center">
            <Link href="/login" className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col items-center pt-32 md:pt-40 px-4 text-center">
        
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 mb-6 flex items-center justify-center gap-3 drop-shadow-sm">
          Health 
          <div className="bg-gray-900 p-3 md:p-5 rounded-[1.25rem] -rotate-6 transform shadow-xl">
            <HeartPulse className="text-white w-12 h-12 md:w-16 md:h-16" />
          </div>
          Vault
        </h1>
        
        <p className="max-w-xl text-lg md:text-xl text-gray-700 mb-10 leading-relaxed font-medium">
          Analyze, manage, convert, and protect your health documents entirely in your browser. No jargon, no complicated forms, and no limits.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 w-full">
          <Link href="/dashboard" className="bg-[#4F8EF7] text-white px-8 py-3.5 rounded-full text-base font-semibold shadow-md hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
            Open the tools
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex justify-center gap-8 text-sm font-medium text-gray-700 mb-20 max-w-3xl mx-auto drop-shadow-sm">
          <span className="flex items-center gap-1.5"><span className="text-yellow-400 text-lg">⭐</span> 100% Free</span>
          <span className="flex items-center gap-1.5"><span className="text-green-500 text-lg">✅</span> Private by Design</span>
          <span className="flex items-center gap-1.5"><span className="text-red-500 text-lg">⚡</span> AI Powered</span>
        </div>

        {/* Feature Mockup Box */}
        <div className="w-full max-w-5xl mx-auto bg-white rounded-t-[2rem] shadow-2xl p-10 md:p-16 min-h-[400px]">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="bg-gray-900 p-1 rounded">
                <HeartPulse className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">HealthVault</span>
              <div className="flex gap-4 ml-6 text-xs font-medium text-gray-500">
                <Link href="/tools" className="hover:text-gray-900">Tools</Link>
                <Link href="/features" className="hover:text-gray-900">Features</Link>
                <Link href="/contact" className="hover:text-gray-900">Contact</Link>
                <Link href="/contribute" className="hover:text-gray-900">Pricing</Link>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">Every health tool, in one place.</h2>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto mb-8">Search or filter to find the right tool. Everything runs privately in your browser.</p>
            
            <div className="flex justify-center mb-8">
              <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 flex items-center w-64">
                <span className="text-gray-400 text-sm">🔍 Search tools...</span>
              </div>
            </div>

            <div className="flex justify-center gap-2 mb-12">
              <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-xs font-medium">All</span>
              <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-medium">Edit</span>
              <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-medium">Security</span>
              <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-medium">Convert</span>
              <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-medium">Optimize</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow text-left">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Jargon Buster</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Translate any medical document right here — simple, 100% plain English.</p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow text-left">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center mb-6">
                <HeartPulse className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Prescription Buy</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Upload prescriptions to extract medicines and get direct purchase links.</p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow text-left">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center mb-6">
                <Receipt className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Bill Analyzer</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Analyze hospital bills instantly to catch overcharges and find savings.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
