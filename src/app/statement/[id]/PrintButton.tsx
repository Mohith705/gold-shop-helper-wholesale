'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-all"
    >
      <Printer size={18} /> Print Statement
    </button>
  )
}
