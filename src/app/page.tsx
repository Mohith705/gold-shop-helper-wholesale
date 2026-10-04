import { Dashboard } from '@/components/Dashboard'
import { createClient } from '@/utils/supabase/server'
import { GoldTransaction } from '@/types'

export default async function Home() {
  const supabase = await createClient()

  const { data: retailTransactions, error: retailError } = await supabase
    .from('gold_transactions')
    .select('*, customers(*)')
    .order('created_at', { ascending: false })

  const { data: wholesaleTransactions, error: wholesaleError } = await supabase
    .from('wholesale_transactions')
    .select('*, customers(*)')
    .order('created_at', { ascending: false })

  if (retailError) console.error('Error fetching retail transactions:', retailError)
  if (wholesaleError) console.error('Error fetching wholesale transactions:', wholesaleError)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <header className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900 tracking-tight">
              Vyshnavi Jewellers
            </h1>
            <p className="text-gray-500 mt-2 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Official Billing & CRM System
            </p>
          </div>
        </header>
        <Dashboard 
          initialTransactions={(retailTransactions as any) || []} 
          initialWholesaleTransactions={(wholesaleTransactions as any) || []}
        />
      </div>
    </main>
  )
}
