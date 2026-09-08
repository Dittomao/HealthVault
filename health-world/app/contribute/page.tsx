'use client'

import Link from "next/link";
import { ArrowLeft, Coffee, Code2, HeartHandshake } from "lucide-react";

const Github = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

export default function ContributePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Contribute</h1>
          <p className="text-xl text-gray-500 max-w-2xl">HealthVault is a community-driven project. Help us make healthcare management accessible to everyone.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
            <div className="bg-gray-900 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Github className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Open Source</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">
              Are you a developer? Our codebase is entirely open-source on GitHub. Help us build new tools, fix bugs, or improve the AI prompts.
            </p>
            <a href="https://github.com/Dittomao/HealthVault" target="_blank" className="inline-flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
              <Github className="w-4 h-4" /> View Repository
            </a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
            <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Coffee className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Sponsor Us</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">
              We rely on donations to pay for server costs, Gemini AI API usage, and domain hosting. Keep HealthVault 100% free by buying us a coffee.
            </p>
            <button onClick={() => alert("Sponsorship integration coming soon!")} className="inline-flex items-center justify-center gap-2 w-full bg-orange-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm">
              <Coffee className="w-4 h-4" /> Buy us a Coffee
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Code2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Report Issues</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">
              Found a bug or have a feature request? Open an issue on our tracker so we can investigate it and make the platform better.
            </p>
            <a href="https://github.com/Dittomao/HealthVault/issues" target="_blank" className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Open Issue Tracker
            </a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
            <div className="bg-pink-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <HeartHandshake className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Spread the Word</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-1">
              The simplest way to contribute is to share HealthVault with your friends, family, and social networks who might benefit from it.
            </p>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.origin)
              alert("Link copied to clipboard!")
            }} className="inline-flex items-center justify-center gap-2 w-full bg-white border border-gray-300 text-gray-900 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
              Copy Link to Share
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
