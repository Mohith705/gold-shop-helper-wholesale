import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, ReceiptText, PlusCircle, History } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteWholesaleButton } from '@/components/DeleteWholesaleButton'
import { Pencil } from 'lucide-react'

export default async function WholesaleTransactionDetailsPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const supabase = await createClient()
  const { id } = params

  if (!id) return notFound()

  const { data: transaction, error } = await supabase
    .from('wholesale_transactions')
    .select('*, customers(*)')
    .eq('id', id)
    .single()

  if (error || !transaction) {
    return notFound()
  }

  const customer = transaction.customers as any

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Link href="/" className="text-amber-700/70 hover:text-amber-900 inline-flex items-center gap-2 text-sm font-semibold transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <DeleteWholesaleButton transactionId={transaction.id} />
            <Link 
              href={`/wholesale-receipt/${transaction.id}`}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <ReceiptText size={18} /> View Voucher
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                Shopkeeper Info
              </h2>
              <div className="space-y-4 text-sm bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-gray-500 w-24 font-medium">Name</span> <span className="font-semibold text-gray-900 text-base">{customer?.name}</span></p>
                <div className="h-px bg-gray-200/50 w-full"></div>
                <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-gray-500 w-24 font-medium">Phone</span> <span className="text-gray-900 font-medium">{customer?.phone || 'N/A'}</span></p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                Item Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm relative z-10">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm md:col-span-2 sm:col-span-3">
                  <span className="text-gray-500 block mb-1 font-medium">Description</span> 
                  <span className="font-semibold text-gray-900">{transaction.item_name} {transaction.transaction_type === 'RECEIPT' && <span className="inline-block ml-2 text-[10px] uppercase tracking-wider text-green-700 font-bold bg-green-100 rounded px-2 py-0.5">Received Old Gold</span>}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Gross Wt.</span> <span className="font-semibold text-gray-900">{transaction.gross_weight}g</span></div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Net Wt.</span> <span className="font-semibold text-gray-900">{transaction.net_weight}g</span></div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Touch %</span> <span className="font-semibold text-gray-900">{transaction.touch_percentage}%</span></div>
                
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 shadow-sm sm:col-span-3">
                  <span className="text-gray-500 block mb-1 font-medium">Fine Gold (Cut)</span> 
                  <span className="font-bold text-amber-600 text-lg">{transaction.fine_gold}g</span>
                </div>
              </div>
            </div>
            
            {transaction.image_url && (
              <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                  Image
                </h2>
                <div className="flex justify-center">
                  <img src={transaction.image_url} alt="Item" className="max-w-xs rounded-xl shadow-sm border border-gray-200" />
                </div>
              </div>
            )}
            
            {transaction.notes && (
              <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                  Additional Notes
                </h2>
                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50">
                  <p className="text-gray-700 whitespace-pre-wrap">{transaction.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                Money Info
              </h2>
              
              <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Rate / g</span>
                  <span className="font-semibold text-gray-900 text-base">₹{transaction.rate_amount ? Number(transaction.rate_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</span>
                </div>
                <div className="h-px bg-gray-200/50 w-full"></div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-900 font-medium">Total Amount</span>
                  <span className="text-gray-900 text-base">₹{transaction.total_amount ? Number(transaction.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</span>
                </div>
              </div>
            </div>
            
            {(transaction.stock_deductions || transaction.stock_item_id) && (
              <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md">
                <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <History size={16} className="text-amber-500" />
                  Stock Details
                </h2>
                <p className="text-sm text-gray-600 mb-4">This transaction deducted weight from stock blocks.</p>
                
                {transaction.stock_deductions && Array.isArray(transaction.stock_deductions) ? (
                  <div className="space-y-3">
                    {transaction.stock_deductions.map((d: any, idx: number) => (
                      <div key={idx} className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex flex-col gap-2 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span className="font-medium text-xs uppercase tracking-wider text-gray-500">Gross</span>
                          <span className="font-semibold">{d.gross}g</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span className="font-medium text-xs uppercase tracking-wider text-gray-500">Net</span>
                          <span className="font-semibold">{d.net}g</span>
                        </div>
                        <Link href={`/stock/${d.stock_id}`} className="block w-full py-1.5 mt-1 bg-white border border-amber-200 text-amber-700 text-center rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors">
                          View Block
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Link href={`/stock/${transaction.stock_item_id}`} className="block w-full py-2 bg-amber-50 text-amber-700 text-center rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">
                    View Stock Block
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
