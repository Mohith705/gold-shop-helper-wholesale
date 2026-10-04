import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Package, History } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function StockDetailsPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const supabase = await createClient()

  // Fetch the stock item
  const { data: stockItem, error: stockError } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', params.id)
    .single()

  if (stockError || !stockItem) {
    notFound()
  }

  // Fetch wholesale history for this item
  const { data: history } = await supabase
    .from('wholesale_transactions')
    .select('*, customers(name)')
    .eq('stock_item_id', stockItem.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4">
          <Link href="/stock" className="text-amber-700/70 hover:text-amber-900 inline-flex items-center gap-2 text-sm font-semibold transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Stock
          </Link>
          <div className="relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900 tracking-tight flex items-center justify-center md:justify-start gap-3">
                <Package className="text-amber-500" /> {stockItem.item_name}
              </h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">Stock history and current balances</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 px-6 py-4 rounded-2xl text-center shadow-inner">
               <p className="text-amber-700/70 text-xs font-semibold uppercase tracking-wider mb-1">Current Fine Gold</p>
               <p className="text-2xl font-bold text-amber-900">{((Number(stockItem.net_weight) * Number(stockItem.touch_percentage)) / 100).toFixed(3)}g</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Current Weights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-500 font-medium text-sm">Gross Weight</span>
                <span className="font-bold text-gray-900">{Number(stockItem.gross_weight).toFixed(3)}g</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-500 font-medium text-sm">Net Weight</span>
                <span className="font-bold text-gray-900">{Number(stockItem.net_weight).toFixed(3)}g</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-500 font-medium text-sm">Touch %</span>
                <span className="font-bold text-gray-900">{Number(stockItem.touch_percentage).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-500 font-medium text-sm">Quantity</span>
                <span className="font-bold text-gray-900">{stockItem.quantity} pcs</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <History size={18} className="text-amber-500" />
              Usage History
            </h3>
            
            {history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((tx: any) => (
                  <Link href={`/wholesale-receipt/${tx.id}`} key={tx.id} className="block group">
                    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-amber-300 hover:shadow-md">
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-red-100 text-red-700">Deducted</span>
                           <span className="font-bold text-gray-900 text-sm">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">Given to <span className="font-semibold text-gray-800">{tx.customers?.name}</span> (Inv: {tx.invoice_number})</p>
                      </div>
                      <div className="flex gap-4 text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                        <div className="text-center">
                          <div className="text-gray-400 text-[10px] uppercase font-bold">Gross Wt</div>
                          <div className="font-semibold text-gray-700">{Number(tx.gross_weight).toFixed(3)}g</div>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                          <div className="text-gray-400 text-[10px] uppercase font-bold">Net Wt</div>
                          <div className="font-semibold text-gray-700">{Number(tx.net_weight).toFixed(3)}g</div>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                          <div className="text-gray-400 text-[10px] uppercase font-bold">Fine Cut</div>
                          <div className="font-bold text-amber-700">{Number(tx.fine_gold).toFixed(3)}g</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No transactions made against this stock yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
