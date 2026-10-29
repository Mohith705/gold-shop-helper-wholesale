import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, ReceiptText, PlusCircle, Coins, Scale, IndianRupee, History } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteWholesaleButton } from '@/components/DeleteWholesaleButton'
import { parseWholesaleNotes } from '@/utils/wholesaleNotes'
import { WholesalePaymentForm } from './WholesalePaymentForm'

export default async function WholesaleTransactionDetailsPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params
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
  const meta = parseWholesaleNotes(transaction.notes)

  const stamp = meta.stamp || (transaction as any).stamp || '-'
  const lessWeight = meta.less_weight !== undefined ? Number(meta.less_weight) : 0
  const oldGoldWeight = meta.old_gold_weight !== undefined ? Number(meta.old_gold_weight) : 0
  const payments = meta.payments || []

  const fineGold = Number(transaction.fine_gold) || 0
  const grossWeight = Number(transaction.gross_weight) || 0
  const netWeight = Number(transaction.net_weight) || Math.max(0, grossWeight - lessWeight)
  const rateAmount = Number(transaction.rate_amount) || 0
  const totalAmount = Number(transaction.total_amount) || 0

  const payableGold = Math.max(0, fineGold - oldGoldWeight)
  const totalCashPaid = payments.length > 0 
    ? payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)
    : (meta.cash_paid || 0)
  
  const cashBalanceDue = Math.max(0, totalAmount - totalCashPaid)
  const goldEquivalentFromCash = (rateAmount > 0 && totalCashPaid > 0) ? (totalCashPaid / rateAmount) : 0
  const remainingGoldBalance = Math.max(0, payableGold - goldEquivalentFromCash)
  const pureGoldDiff = fineGold - oldGoldWeight

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
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
              <ReceiptText size={18} /> View Voucher (Bill)
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shopkeeper Info */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-amber-100/60">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
                Shopkeeper Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
                <div>
                  <span className="text-gray-500 text-xs block mb-0.5">Shop / Person Name</span>
                  <span className="font-semibold text-gray-900 text-base">{customer?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block mb-0.5">Phone Number</span>
                  <span className="font-medium text-gray-900">{customer?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block mb-0.5">Voucher / Invoice No</span>
                  <span className="font-semibold text-amber-900">{transaction.invoice_number ? `#${transaction.invoice_number}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block mb-0.5">Order Date</span>
                  <span className="font-medium text-gray-900">{new Date(transaction.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-amber-100/60">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
                Order Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm col-span-2 sm:col-span-2">
                  <span className="text-gray-500 block mb-1 text-xs">Description</span> 
                  <span className="font-semibold text-gray-900 text-base">{transaction.item_name}</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-1 text-xs">Stamp</span> 
                  <span className="font-bold text-gray-900 text-base">{stamp || '-'}</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-1 text-xs">Gross Wt.</span> 
                  <span className="font-semibold text-gray-900">{grossWeight.toFixed(3)}g</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-1 text-xs">Less Wt.</span> 
                  <span className="font-semibold text-gray-900">{lessWeight.toFixed(3)}g</span>
                </div>

                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/70 shadow-sm">
                  <span className="text-amber-800 block mb-1 text-xs font-medium">Net Wt.</span> 
                  <span className="font-bold text-amber-900 text-base">{netWeight.toFixed(3)}g</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-1 text-xs">Touch %</span> 
                  <span className="font-semibold text-gray-900">{Number(transaction.touch_percentage).toFixed(2)}%</span>
                </div>

                <div className="bg-amber-100/60 p-3.5 rounded-xl border border-amber-200 shadow-sm">
                  <span className="text-amber-800 block mb-1 text-xs font-semibold">Fine Gold (Step 1)</span> 
                  <span className="font-bold text-amber-950 text-base">{fineGold.toFixed(3)}g</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-1 text-xs">Gold Rate / g</span> 
                  <span className="font-semibold text-gray-900">{rateAmount > 0 ? `₹${rateAmount.toLocaleString('en-IN')}` : '-'}</span>
                </div>

                {oldGoldWeight > 0 && (
                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 col-span-2 sm:col-span-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Coins size={16} className="text-emerald-700" />
                      <div>
                        <span className="text-xs text-emerald-800 font-semibold block">Old Gold Received (Step 2)</span>
                        <span className="text-xs text-emerald-600">Subtracted from Fine Gold</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-900">Old Gold: {oldGoldWeight.toFixed(3)}g</span>
                      <span className="text-xs text-emerald-700 block">Payable Gold: {payableGold.toFixed(3)}g</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 sm:p-5 rounded-2xl text-white shadow-sm flex justify-between items-center">
                  <div>
                    <span className="text-xs text-amber-100 uppercase tracking-wider block font-semibold">Total Amount (Step 3)</span>
                    <span className="text-xs text-amber-100">Payable Gold &times; Rate</span>
                  </div>
                  <span className="font-black text-2xl tracking-tight">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Dual Balance Display */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-amber-100/60">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Scale size={18} className="text-amber-600" />
                Current Balance Summary (2 Types)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type 1: Gold Weight */}
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80">
                  <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider block mb-1">
                    Type 1: Balance Gold Weight
                  </span>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xl font-bold text-amber-950">{pureGoldDiff.toFixed(3)}g</span>
                    <span className="text-[11px] text-amber-700">Fine Gold - Old Gold</span>
                  </div>
                  {totalCashPaid > 0 && rateAmount > 0 && (
                    <div className="text-xs text-emerald-800 pt-2 border-t border-amber-200/60 flex justify-between">
                      <span>After Cash Paid:</span>
                      <span className="font-semibold">{remainingGoldBalance.toFixed(3)}g due</span>
                    </div>
                  )}
                </div>

                {/* Type 2: Cash Amount */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider block mb-1">
                    Type 2: Balance Amount (₹)
                  </span>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-xl font-bold ${cashBalanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{cashBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-slate-500">Total - Cash Paid</span>
                  </div>
                  <div className="text-xs text-slate-600 pt-2 border-t border-slate-200 flex justify-between">
                    <span>Paid: ₹{totalCashPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className="font-medium">Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {meta.user_notes && (
              <div className="bg-white/80 p-5 rounded-2xl border border-amber-100 shadow-sm text-sm">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Notes / Remarks</span>
                <p className="text-gray-800 whitespace-pre-wrap">{meta.user_notes}</p>
              </div>
            )}
          </div>

          {/* Right Column: Payments / Sub-Bills Section */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-amber-100/60 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee size={18} className="text-amber-600" />
                Payments &amp; Sub-Bills
              </h2>

              <div className="space-y-3 bg-amber-50/30 p-4 rounded-2xl border border-amber-100/60 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Order Total</span>
                  <span className="font-semibold text-gray-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Paid</span>
                  <span className="font-bold text-emerald-600">₹{totalCashPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-px bg-amber-200/50"></div>
                <div className="flex justify-between items-center text-base font-bold">
                  <span className="text-gray-900">Balance Due</span>
                  <span className={cashBalanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}>
                    ₹{cashBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Add Payment / Sub-Bill Form */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <PlusCircle size={15} /> Add Sub-Bill / Payment
                </h3>
                <WholesalePaymentForm transactionId={transaction.id} />
              </div>

              {/* Payment History List */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <History size={14} /> Sub-Bill Transactions ({payments.length})
                </div>

                {payments.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-xl">
                    No sub-bills or payments recorded yet.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {payments.map((p, idx) => (
                      <li key={p.id || idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-xs space-y-1">
                        <div className="flex justify-between font-bold text-gray-900 text-sm">
                          <span>₹{Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                            {p.payment_method}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-[11px]">
                          <span>{new Date(p.payment_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {p.notes && <span className="text-gray-700 italic">{p.notes}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
