import { AddEntryForm } from './AddEntryForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AddEntryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4">
          <Link href="/" className="text-amber-700/70 hover:text-amber-900 inline-flex items-center gap-2 text-sm font-semibold transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="relative overflow-hidden bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900 tracking-tight">New Gold Transaction</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">Enter customer details and transaction information to generate a bill.</p>
          </div>
        </header>

        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 overflow-hidden p-6 md:p-8">
          <AddEntryForm />
        </div>
      </div>
    </main>
  )
}
