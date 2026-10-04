'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Printer } from 'lucide-react'

export function ReportsFilter({ initialFrom, initialTo }: { initialFrom: string, initialTo: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)

  const handleApply = () => {
    const params = new URLSearchParams(searchParams)
    params.set('from', from)
    params.set('to', to)
    router.push(`/reports?${params.toString()}`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 bg-gradient-to-br from-amber-50/50 to-amber-100/30 p-5 rounded-2xl border border-amber-200/50 shadow-inner">
      <div className="w-full sm:w-auto">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">From Date</label>
        <input 
          type="date" 
          value={from} 
          onChange={(e) => setFrom(e.target.value)}
          className="w-full px-4 py-2.5 border border-amber-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white/80 transition-all shadow-sm"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">To Date</label>
        <input 
          type="date" 
          value={to} 
          onChange={(e) => setTo(e.target.value)}
          className="w-full px-4 py-2.5 border border-amber-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white/80 transition-all shadow-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-auto">
        <button 
          onClick={handleApply}
          className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
        >
          Apply Filter
        </button>
        <button 
          onClick={handlePrint}
          className="flex-1 sm:flex-none bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5"
        >
          <Printer size={16} className="text-gray-500" /> Print Summary
        </button>
        <button 
          onClick={() => router.push(`/reports/bills?from=${from}&to=${to}`)}
          className="flex-1 sm:flex-none bg-white border border-gray-200 text-amber-700 hover:bg-amber-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5"
        >
          Download All Bills
        </button>
      </div>
    </div>
  )
}
