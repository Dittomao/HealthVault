import Image from "next/image";
import { Search, FileText, Calendar, ShieldCheck, HeartPulse, Pill, Activity, Receipt, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Floating Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <HeartPulse className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Health World</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Tools</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
          </nav>
          <button className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2 group">
            Install the App
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 flex flex-col items-center pt-40 px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 drop-shadow-sm flex items-center justify-center flex-wrap gap-2">
          Health 
          <span className="inline-block bg-blue-600 p-2 md:p-3 rounded-2xl md:rounded-3xl shadow-lg mx-2 rotate-3 hover:rotate-6 transition-transform">
            <HeartPulse className="text-white w-10 h-10 md:w-16 md:h-16" />
          </span> 
          World
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-gray-800 mb-8 font-medium leading-relaxed drop-shadow-sm">
          Merge, analyze, schedule, and manage your health documents entirely in your browser. Simple, unified, and built for everyone.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button className="bg-blue-600 text-white px-8 py-3.5 rounded-full text-lg font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2">
            Open the tools
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="bg-white text-gray-900 px-8 py-3.5 rounded-full text-lg font-semibold shadow-md hover:bg-gray-50 hover:scale-105 transition-all">
            Install the App
          </button>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm font-semibold text-gray-700 mb-12 bg-white/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/50 shadow-sm">
          <span className="flex items-center gap-2"><span className="text-yellow-500 text-lg">⭐</span> 100% Free</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600" /> Private by Design</span>
          <span className="flex items-center gap-2"><span className="text-red-500 text-lg">⚡</span> Works Offline</span>
        </div>

        {/* Tools Card */}
        <div className="bg-white/95 backdrop-blur-xl w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-white p-8 md:p-12 mb-20 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Every health tool, in one place.</h2>
            <p className="text-gray-500">Search or filter to find the right tool. Everything runs privately.</p>
            
            <div className="mt-6 flex justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search tools..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer shadow-md">All</span>
              <span className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border border-gray-200">Analyze</span>
              <span className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border border-gray-200">Schedule</span>
              <span className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border border-gray-200">Pharmacy</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tool 1 */}
            <div className="group bg-blue-50/50 border border-blue-100 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Jargon-Busting Ingestion</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Snap a photo of a confusing document. Get instant 3-bullet summaries: What is this? Do I owe money? Deadline?
              </p>
            </div>

            {/* Tool 2 */}
            <div className="group bg-indigo-50/50 border border-indigo-100 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Unified Timeline</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Extracts dates from all uploads, placing follow-ups, appointments, and deadlines on a single, clear schedule.
              </p>
            </div>

            {/* Tool 3 */}
            <div className="group bg-emerald-50/50 border border-emerald-100 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">One-Click Auto-Fill</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Uses securely stored family data to instantly fill in blank PDF forms, complex medical intake clipboards, or registrations.
              </p>
            </div>

            {/* Tool 4 */}
            <div className="group bg-purple-50/50 border border-purple-100 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Prescription & Pharmacy</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Upload prescriptions to get medicine options and buy on platforms like TATA 1mg, Apollo HealthCare, and more.
              </p>
            </div>

            {/* Tool 5 */}
            <div className="group bg-rose-50/50 border border-rose-100 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="bg-rose-100 text-rose-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hospital Bill Analyzer</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Upload your hospital bills to analyze them instantly. Flags unnecessary charges and recommends cost-saving actions.
              </p>
            </div>

            {/* Tool 6 */}
            <div className="group bg-orange-50/50 border border-orange-100 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Insurance Direct Connect</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Connect your health insurance directly to our platform. Hospitals can access it without long paperwork processes.
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
