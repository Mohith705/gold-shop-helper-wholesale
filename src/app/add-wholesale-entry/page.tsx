import { AddWholesaleForm } from './AddWholesaleForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function AddWholesaleEntryPage() {
  const supabase = await createClient()
  const { data: stockItems } = await supabase.from('stock_items').select('*').gt('net_weight', 0)
  const { data: customers } = await supabase.from('customers').select('*').order('name')

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-3 sm:p-6 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col gap-3 sm:gap-4">
          <Link href="/" className="text-amber-700/80 hover:text-amber-900 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="relative overflow-hidden bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/60">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900 tracking-tight">Wholesale Order</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Create ledger orders based on Touch / Purity and Old Gold settlements.</p>
          </div>
        </header>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/60 overflow-hidden p-4 sm:p-6 md:p-8">
          <AddWholesaleForm availableStock={stockItems || []} existingCustomers={customers || []} />
        </div>
      </div>
    </main>
  )
}
