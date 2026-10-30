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
  const initialOldGoldWeight = meta.old_gold_weight !== undefined ? Number(meta.old_gold_weight) : 0
  const payments = meta.payments || []

  const fineGold = Number(transaction.fine_gold) || 0
  const grossWeight = Number(transaction.gross_weight) || 0
  const netWeight = Number(transaction.net_weight) || Math.max(0, grossWeight - lessWeight)
  const rateAmount = Number(transaction.rate_amount) || 0
  const totalAmount = Number(transaction.total_amount) || 0

  // Separate sub-bill payments into gold and cash
  const subBillGoldWeight = payments.reduce((sum, p) => {
    const isGold = p.payment_type === 'GOLD' || Number(p.gold_weight) > 0 || String(p.payment_method || '').toLowerCase().includes('gold')
    return sum + (isGold ? Number(p.gold_weight || 0) : 0)
  }, 0)

  const subBillMoneyTotal = payments.reduce((sum, p) => {
    const isGold = p.payment_type === 'GOLD' || Number(p.gold_weight) > 0 || String(p.payment_method || '').toLowerCase().includes('gold')
    return sum + (!isGold ? Number(p.amount_paid || 0) : 0)
  }, 0)

  // Total gold received (initial order old gold + subsequent gold sub-bills)
  const totalGoldReceived = initialOldGoldWeight + subBillGoldWeight

  // Total direct currency paid
  const totalDirectCashPaid = payments.length > 0 ? subBillMoneyTotal : (meta.cash_paid || 0)

  // Money value of gold sub-bills
  const subBillGoldMoneyValue = payments.reduce((sum, p) => {
    const isGold = p.payment_type === 'GOLD' || Number(p.gold_weight) > 0 || String(p.payment_method || '').toLowerCase().includes('gold')
    if (isGold) {
      const gWt = Number(p.gold_weight || 0)
      const gRate = Number(p.gold_rate || rateAmount)
      return sum + (Number(p.amount_paid) || (gWt * gRate))
    }
    return sum
  }, 0)

  // Total value credited against order
  const totalValuePaid = totalDirectCashPaid + subBillGoldMoneyValue
  const cashBalanceDue = Math.max(0, totalAmount - totalValuePaid)

  // Remaining gold balance
  const pureGoldDiff = Math.max(0, fineGold - totalGoldReceived)
  const cashEquivalentInGold = (rateAmount > 0 && totalDirectCashPaid > 0) ? (totalDirectCashPaid / rateAmount) : 0
  const remainingGoldBalance = Math.max(0, pureGoldDiff - cashEquivalentInGold)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-3 sm:p-6 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500">
        
        {/* Navigation & Header (Mobile Responsive) */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/70 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-amber-100 sm:border-0 shadow-sm sm:shadow-none">
          <Link href="/" className="text-amber-700/80 hover:text-amber-900 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <DeleteWholesaleButton transactionId={transaction.id} />
            <Link 
              href={`/wholesale-receipt/${transaction.id}`}
              className="flex-1 sm:flex-none justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-md shadow-amber-500/20 hover:shadow-lg text-xs sm:text-sm"
            >
              <ReceiptText size={16} /> View Voucher (Bill)
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Shopkeeper Info */}
            <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-amber-100/70">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 sm:h-5 bg-amber-500 rounded-full"></span>
                Shopkeeper Information
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm bg-amber-50/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-100/60">
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-gray-500 text-[11px] block mb-0.5">Shop / Person Name</span>
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{customer?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block mb-0.5">Phone Number</span>
                  <span className="font-medium text-gray-900">{customer?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block mb-0.5">Voucher Number</span>
                  <span className="font-bold text-amber-900">{transaction.invoice_number ? `#${transaction.invoice_number}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block mb-0.5">Order Date</span>
                  <span className="font-medium text-gray-900">{new Date(transaction.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-amber-100/70">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 sm:h-5 bg-amber-500 rounded-full"></span>
                Order Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 text-xs sm:text-sm">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm col-span-2 sm:col-span-2">
                  <span className="text-gray-500 block mb-0.5 text-[11px]">Description</span> 
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">{transaction.item_name}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-0.5 text-[11px]">Stamp</span> 
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{stamp || '-'}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-0.5 text-[11px]">Gross Wt.</span> 
                  <span className="font-semibold text-gray-900">{grossWeight.toFixed(3)}g</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-0.5 text-[11px]">Less Wt.</span> 
                  <span className="font-semibold text-gray-900">{lessWeight.toFixed(3)}g</span>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 shadow-sm">
                  <span className="text-amber-800 block mb-0.5 text-[11px] font-medium">Net Wt.</span> 
                  <span className="font-bold text-amber-900 text-sm sm:text-base">{netWeight.toFixed(3)}g</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-0.5 text-[11px]">Touch %</span> 
                  <span className="font-semibold text-gray-900">{Number(transaction.touch_percentage).toFixed(2)}%</span>
                </div>

                <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200 shadow-sm">
                  <span className="text-amber-800 block mb-0.5 text-[11px] font-semibold">Fine Gold (Step 1)</span> 
                  <span className="font-bold text-amber-950 text-sm sm:text-base">{fineGold.toFixed(3)}g</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 block mb-0.5 text-[11px]">Gold Rate / g</span> 
                  <span className="font-semibold text-gray-900">{rateAmount > 0 ? `₹${rateAmount.toLocaleString('en-IN')}` : '-'}</span>
                </div>

                {initialOldGoldWeight > 0 && (
                  <div className="bg-emerald-50/90 p-3 rounded-xl border border-emerald-200 col-span-2 sm:col-span-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Coins size={16} className="text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-emerald-900 font-bold block">Initial Old Gold Deducted</span>
                        <span className="text-emerald-700 text-[11px]">Subtracted at order creation</span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-900 text-sm">-{initialOldGoldWeight.toFixed(3)}g</span>
                  </div>
                )}
              </div>

              {/* Total Card */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 sm:p-5 rounded-2xl text-white shadow-sm flex justify-between items-center">
                  <div>
                    <span className="text-[11px] text-amber-100 uppercase tracking-wider block font-semibold">Total Order Amount</span>
                    <span className="text-xs text-amber-100">Payable Gold &times; Rate</span>
                  </div>
                  <span className="font-black text-xl sm:text-2xl tracking-tight">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Dual Balance Summary (2 Types of Balance) */}
            <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-amber-100/70">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Scale size={18} className="text-amber-600 shrink-0" />
                Current Balance Summary (2 Types)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Type 1: Gold Weight Balance */}
                <div className="bg-amber-50/60 p-3.5 sm:p-4 rounded-2xl border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                      Type 1: Balance Gold Wt
                    </span>
                    <Coins size={14} className="text-amber-700" />
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xl sm:text-2xl font-black text-amber-950">{remainingGoldBalance.toFixed(3)}g</span>
                    <span className="text-[11px] text-amber-700">Remaining</span>
                  </div>
                  <div className="text-[11px] text-amber-800/80 pt-2 border-t border-amber-200/60 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Fine Gold:</span>
                      <span className="font-semibold">{fineGold.toFixed(3)}g</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>Total Gold Received:</span>
                      <span>-{totalGoldReceived.toFixed(3)}g</span>
                    </div>
                  </div>
                </div>

                {/* Type 2: Money Balance */}
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">
                      Type 2: Balance in Cash (₹)
                    </span>
                    <IndianRupee size={14} className="text-slate-600" />
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className={`text-xl sm:text-2xl font-black ${cashBalanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{cashBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-slate-500">Remaining</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Order Total:</span>
                      <span className="font-medium">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Total Value Paid:</span>
                      <span>₹{totalValuePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {meta.user_notes && (
              <div className="bg-white/80 p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-sm text-xs sm:text-sm">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Notes / Remarks</span>
                <p className="text-gray-800 whitespace-pre-wrap">{meta.user_notes}</p>
              </div>
            )}
          </div>

          {/* Right Column: Sub-Bills / Payments */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-amber-100/70 space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <IndianRupee size={18} className="text-amber-600" />
                  Payments &amp; Sub-Bills
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Add installment payments in Gold or Cash.</p>
              </div>

              {/* Add Payment / Sub-Bill Form */}
              <div className="bg-amber-50/60 p-3 sm:p-4 rounded-2xl border border-amber-200/70">
                <h3 className="font-bold text-amber-950 mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <PlusCircle size={14} className="text-amber-600" /> Add Sub-Bill (Gold or Cash)
                </h3>
                <WholesalePaymentForm 
                  transactionId={transaction.id}
                  defaultRate={rateAmount}
                  remainingGold={remainingGoldBalance}
                  remainingCash={cashBalanceDue}
                />
              </div>

              {/* Sub-Bills Transaction History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase tracking-wider border-b pb-2">
                  <span className="flex items-center gap-1.5">
                    <History size={14} /> Sub-Bill Records ({payments.length})
                  </span>
                  <span>Credit</span>
                </div>

                {payments.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-xl">
                    No sub-bills recorded yet.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {payments.map((p, idx) => {
                      const isGold = p.payment_type === 'GOLD' || Number(p.gold_weight) > 0 || String(p.payment_method || '').toLowerCase().includes('gold')
                      return (
                        <li key={p.id || idx} className="bg-white p-3 rounded-xl border border-amber-100/80 shadow-xs space-y-1.5 hover:border-amber-300 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isGold ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {isGold ? 'GOLD SETTLEMENT' : p.payment_method}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 block mt-1">
                                {new Date(p.payment_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="text-right">
                              {isGold ? (
                                <div>
                                  <span className="font-black text-amber-900 text-sm sm:text-base block">
                                    {Number(p.gold_weight).toFixed(3)}g
                                  </span>
                                  {Number(p.amount_paid) > 0 && (
                                    <span className="text-[11px] text-gray-500 block">
                                      ₹{Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="font-black text-emerald-700 text-sm sm:text-base block">
                                  ₹{Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          </div>

                          {p.notes && (
                            <p className="text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded-md italic">
                              {p.notes}
                            </p>
                          )}
                        </li>
                      )
                    })}
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
