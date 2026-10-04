import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, ReceiptText, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PaymentForm } from './PaymentForm'
import { DeleteButton } from './DeleteButton'
import { Pencil, FileSpreadsheet } from 'lucide-react'

export default async function TransactionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  if (!id) return notFound()

  const { data: transaction, error } = await supabase
    .from('gold_transactions')
    .select('*, customers(*), payments(*)')
    .eq('id', id)
    .single()

  if (error || !transaction) {
    return notFound()
  }

  const customer = transaction.customers
  const payments = transaction.payments || []
  
  const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0)
  const balanceDue = transaction.total_amount - totalPaid

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Link href="/" className="text-amber-700/70 hover:text-amber-900 inline-flex items-center gap-2 text-sm font-semibold transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href={`/transaction/${transaction.id}/edit`}
              className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Pencil size={18} className="text-gray-500" /> Edit
            </Link>
            <DeleteButton transactionId={transaction.id} />
            <Link 
              href={`/statement/${transaction.id}`}
              className="bg-white text-amber-700 hover:bg-amber-50 border border-amber-200/60 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <FileSpreadsheet size={18} className="text-amber-600" /> Statement
            </Link>
            <Link 
              href={`/bill/${transaction.id}?mode=admin`}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <ReceiptText size={18} /> View Bill
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                Customer Info
              </h2>
              <div className="space-y-4 text-sm bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-gray-500 w-24 font-medium">Name</span> <span className="font-semibold text-gray-900 text-base">{customer?.name}</span></p>
                <div className="h-px bg-gray-200/50 w-full"></div>
                <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-gray-500 w-24 font-medium">Phone</span> <span className="text-gray-900 font-medium">{customer?.phone || 'N/A'}</span></p>
                <div className="h-px bg-gray-200/50 w-full"></div>
                <p className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4"><span className="text-gray-500 w-24 font-medium pt-1">Address</span> <span className="text-gray-900 leading-relaxed">{customer?.address || 'N/A'}</span></p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                Item Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm relative z-10">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Item Name</span> <span className="font-semibold text-gray-900">{transaction.item_name} {transaction.is_lump_sum && <span className="block mt-1 text-[10px] uppercase tracking-wider text-amber-600 font-bold bg-amber-50 rounded px-2 py-0.5 w-fit">Lump Sum</span>}</span></div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Gross Wt.</span> <span className="font-semibold text-gray-900">{transaction.is_lump_sum && !transaction.weight_grams ? '-' : `${transaction.weight_grams}g`}</span></div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Wastage</span> <span className="font-semibold text-gray-900">{transaction.is_lump_sum && !transaction.wastage_percentage ? '-' : `${transaction.wastage_percentage}%`}</span></div>
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Net Wt.</span> <span className="font-bold text-amber-600 text-base">{transaction.is_lump_sum && !transaction.net_weight ? '-' : `${transaction.net_weight.toFixed(3)}g`}</span></div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Gold Rate/g</span> <span className="font-semibold text-gray-900">{transaction.is_lump_sum && !transaction.gold_rate_per_gram ? '-' : `₹${transaction.gold_rate_per_gram.toLocaleString('en-IN')}`}</span></div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><span className="text-gray-500 block mb-1 font-medium">Making Chg.</span> <span className="font-semibold text-gray-900">{transaction.is_lump_sum && !transaction.making_charges ? '-' : `₹${transaction.making_charges.toLocaleString('en-IN')}`}</span></div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100/50 relative z-10">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-2xl text-white shadow-md shadow-amber-500/20 flex justify-between items-center">
                  <span className="font-medium text-amber-50">Grand Total</span>
                  <span className="font-bold text-2xl tracking-tight">₹{transaction.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-amber-100/50 transition-all hover:shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                Payments
              </h2>
              
              <div className="space-y-4 mb-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Total Amount</span>
                  <span className="font-semibold text-gray-900 text-base">₹{transaction.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-px bg-gray-200/50 w-full"></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Total Paid</span>
                  <span className="font-bold text-green-600 text-base">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg pt-4 border-t border-gray-200/50">
                  <span className="text-gray-900">Balance</span>
                  <span className={balanceDue > 0 ? "text-red-600" : "text-gray-900"}>
                    ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {balanceDue > 0 ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2 text-sm">
                    <PlusCircle size={16} /> Add Payment
                  </h3>
                  <PaymentForm transactionId={transaction.id} />
                </div>
              ) : (
                <div className="bg-green-50 text-green-700 p-3 rounded-xl text-center text-sm font-medium border border-green-100">
                  Fully Paid
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Payment History</h3>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No payments yet.</p>
              ) : (
                <ul className="space-y-3">
                  {payments.map((p: any) => (
                    <li key={p.id} className="text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between font-medium text-gray-900">
                        <span>₹{Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600">{p.payment_method}</span>
                          <Link href={`/receipt/${p.id}?mode=admin`} className="text-amber-600 hover:text-amber-900 ml-2" title="View Receipt">
                            <ReceiptText size={16} />
                          </Link>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(p.payment_date).toLocaleString('en-IN')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
