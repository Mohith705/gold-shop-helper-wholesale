import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { notFound } from 'next/navigation'
import PrintButton from './PrintButton'
import { parseWholesaleNotes } from '@/utils/wholesaleNotes'

export default async function WholesaleReceiptPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params
  const supabase = await createClient()

  // Fetch the current transaction
  const { data: transaction, error } = await supabase
    .from('wholesale_transactions')
    .select(`*, customers(*)`)
    .eq('id', params.id)
    .single()

  if (error || !transaction) {
    notFound()
  }

  const customer = transaction.customers as any
  const meta = parseWholesaleNotes(transaction.notes)

  const stamp = meta.stamp || (transaction as any).stamp || '-'
  const lessWeight = meta.less_weight !== undefined ? Number(meta.less_weight) : 0
  const initialOldGoldWeight = meta.old_gold_weight !== undefined ? Number(meta.old_gold_weight) : 0
  const payments = meta.payments || []

  const grossWeight = Number(transaction.gross_weight) || 0
  const netWeight = Number(transaction.net_weight) || Math.max(0, grossWeight - lessWeight)
  const touch = Number(transaction.touch_percentage) || 0
  const fineGold = Number(transaction.fine_gold) || 0
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

  const totalGoldReceived = initialOldGoldWeight + subBillGoldWeight
  const totalDirectCashPaid = payments.length > 0 ? subBillMoneyTotal : (meta.cash_paid || 0)

  const subBillGoldMoneyValue = payments.reduce((sum, p) => {
    const isGold = p.payment_type === 'GOLD' || Number(p.gold_weight) > 0 || String(p.payment_method || '').toLowerCase().includes('gold')
    if (isGold) {
      const gWt = Number(p.gold_weight || 0)
      const gRate = Number(p.gold_rate || rateAmount)
      return sum + (Number(p.amount_paid) || (gWt * gRate))
    }
    return sum
  }, 0)

  const totalValuePaid = totalDirectCashPaid + subBillGoldMoneyValue
  const cashBalanceDue = Math.max(0, totalAmount - totalValuePaid)

  const pureGoldDiff = Math.max(0, fineGold - totalGoldReceived)
  const cashEquivalentInGold = (rateAmount > 0 && totalDirectCashPaid > 0) ? (totalDirectCashPaid / rateAmount) : 0
  const remainingGoldBalance = Math.max(0, pureGoldDiff - cashEquivalentInGold)

  // WhatsApp text summary
  const waText = `*VYSHNAVI JEWELLERS - WHOLESALE VOUCHER*
Voucher No: ${transaction.invoice_number ? `#${transaction.invoice_number}` : 'N/A'}
Date: ${new Date(transaction.created_at).toLocaleDateString('en-GB')}
Customer: ${customer?.name || 'Customer'}

*Item Details:*
- Description: ${transaction.item_name}
- Stamp: ${stamp}
- Gross Wt: ${grossWeight.toFixed(3)}g
- Less Wt: ${lessWeight.toFixed(3)}g
- Net Wt: ${netWeight.toFixed(3)}g
- Touch: ${touch.toFixed(2)}%
- Fine Gold: ${fineGold.toFixed(3)}g
${totalGoldReceived > 0 ? `- Gold Received (Old/Exchange): ${totalGoldReceived.toFixed(3)}g\n` : ''}- Gold Rate: ₹${rateAmount.toLocaleString('en-IN')}/g
*Total Order Amount:* ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
*Total Paid / Credited:* ₹${totalValuePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

*Current Balance:*
- Balance in Gold: ${remainingGoldBalance.toFixed(3)}g
- Balance in Cash: ₹${cashBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

Thank you for your business!`

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 p-2 sm:p-6 md:p-8 print:p-0 print:bg-white flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
        
        {/* Navigation Bar (Fully Mobile & Tablet Responsive) */}
        <div className="print:hidden flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 sm:gap-3 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100">
          <Link href="/" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/wholesale-transaction/${transaction.id}`}
              className="flex-1 sm:flex-none justify-center text-center text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Manage Sub-Bills
            </Link>
            {customer?.phone && (
              <a 
                href={`https://wa.me/91${customer.phone.replace(/\\D/g, '').slice(-10)}?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none justify-center bg-green-100 text-green-800 hover:bg-green-200 border border-green-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp
              </a>
            )}
            <div className="flex-1 sm:flex-none">
              <PrintButton />
            </div>
          </div>
        </div>

        {/* Voucher Container - Matches Handwritten Format (Responsive with horizontal table scroll) */}
        <div id="receipt-container" className="bg-white p-3.5 sm:p-8 md:p-10 print:p-0 shadow-lg print:shadow-none mx-auto w-full font-sans text-xs sm:text-sm border border-black/50 rounded-xl sm:rounded-none">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2.5 sm:gap-4 mb-4 sm:mb-6 border-b border-black/30 pb-3 sm:pb-4">
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-gray-700 w-14 sm:w-16">Name:</span>
                <span className="text-sm sm:text-lg font-black uppercase text-gray-900">{customer?.name || 'Customer'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-gray-700 w-14 sm:w-16">Ph #:</span>
                <span className="font-semibold text-gray-800">{customer?.phone || '-'}</span>
              </div>
            </div>
            <div className="space-y-0.5 sm:space-y-1 sm:text-right w-full sm:w-auto flex sm:flex-col justify-between">
              <div className="flex sm:justify-end gap-2">
                <span className="font-bold text-gray-700">Vou No:</span>
                <span className="font-bold text-gray-900">{transaction.invoice_number ? `#${transaction.invoice_number}` : '-'}</span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="font-bold text-gray-700">Date:</span>
                <span className="font-medium text-gray-900">{new Date(transaction.created_at).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>

          {/* Table Container with smooth horizontal scrolling on mobile */}
          <div className="mb-2 print:hidden block sm:hidden text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded text-center">
            &larr; Scroll horizontally to view all columns &rarr;
          </div>
          <div className="overflow-x-auto border border-black mb-4 sm:mb-6">
            <table className="w-full min-w-[650px] sm:min-w-[700px] border-collapse text-center">
              <thead>
                <tr className="border-b border-black divide-x divide-black font-bold bg-gray-100 text-gray-900 text-[11px] sm:text-xs">
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 w-16">Stamp</th>
                  <th className="p-2 w-20">G.wt</th>
                  <th className="p-2 w-20">Less wt</th>
                  <th className="p-2 w-20">Net wt</th>
                  <th className="p-2 w-16">Touch</th>
                  <th className="p-2 w-20">Gold</th>
                  <th className="p-2 w-20">Rate</th>
                  <th className="p-2 w-24">Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black border-b border-black">
                <tr className="divide-x divide-black h-16 sm:h-20 align-top">
                  <td className="p-2 text-left">
                    <span className="font-semibold text-gray-900 block">{transaction.item_name}</span>
                  </td>
                  <td className="p-2 font-medium">{stamp}</td>
                  <td className="p-2 font-medium">{grossWeight.toFixed(3)}</td>
                  <td className="p-2 font-medium">{lessWeight.toFixed(3)}</td>
                  <td className="p-2 font-bold">{netWeight.toFixed(3)}</td>
                  <td className="p-2 font-medium">{touch.toFixed(2)}</td>
                  <td className="p-2 font-bold text-amber-900">{fineGold.toFixed(3)}</td>
                  <td className="p-2 font-medium">{rateAmount > 0 ? rateAmount.toFixed(2) : '-'}</td>
                  <td className="p-2 font-bold text-gray-900">
                    {totalAmount > 0 ? totalAmount.toFixed(2) : '-'}
                  </td>
                </tr>

                {/* Old Gold / Gold Settlement Deductions (if received) */}
                {totalGoldReceived > 0 && (
                  <tr className="divide-x divide-black bg-amber-50/50 text-[11px] sm:text-xs">
                    <td className="p-2 text-left font-semibold text-amber-900" colSpan={6}>
                      Less Gold Received (Old Gold / Sub-Bills)
                    </td>
                    <td className="p-2 font-bold text-red-600">-{totalGoldReceived.toFixed(3)}</td>
                    <td className="p-2 text-gray-500">Payable:</td>
                    <td className="p-2 font-bold text-amber-900">{pureGoldDiff.toFixed(3)}g</td>
                  </tr>
                )}

                {/* Total Row */}
                <tr className="divide-x divide-black font-bold bg-gray-100 text-gray-900 text-[11px] sm:text-xs">
                  <td className="p-2 text-left" colSpan={2}>Total</td>
                  <td className="p-2">{grossWeight.toFixed(3)}</td>
                  <td className="p-2">{lessWeight.toFixed(3)}</td>
                  <td className="p-2">{netWeight.toFixed(3)}</td>
                  <td className="p-2"></td>
                  <td className="p-2 font-black">{pureGoldDiff.toFixed(3)}</td>
                  <td className="p-2"></td>
                  <td className="p-2 font-black">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>

                {/* Payments Received Row (Cash and Gold credits) */}
                <tr className="divide-x divide-black text-[11px] sm:text-xs">
                  <td className="p-2 text-left font-semibold text-gray-800" colSpan={6}>
                    Payments Received {payments.length > 0 ? `(${payments.length} sub-bill${payments.length > 1 ? 's' : ''})` : ''}
                  </td>
                  <td className="p-2" colSpan={2}>
                    {subBillGoldWeight > 0 ? `${subBillGoldWeight.toFixed(3)}g gold` : ''}
                  </td>
                  <td className="p-2 font-bold text-emerald-700">
                    ₹{totalValuePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Balance Row - Exact match to handwriting in photo */}
                <tr className="divide-x divide-black font-black bg-amber-100/50 text-xs sm:text-sm">
                  <td className="p-2.5 text-left uppercase tracking-wider text-amber-950" colSpan={4}>
                    Balance
                  </td>
                  <td className="p-2.5 text-left text-amber-900" colSpan={2}>
                    <span className="text-[10px] uppercase font-bold text-gray-600 block">Gold Balance:</span>
                    <span>{remainingGoldBalance.toFixed(3)}g</span>
                  </td>
                  <td className="p-2.5 text-right font-black text-red-600" colSpan={3}>
                    <span className="text-[10px] uppercase font-bold text-gray-600 block">Cash Balance:</span>
                    <span>₹{cashBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sub-Bills Breakdown (if payments were recorded) */}
          {payments.length > 0 && (
            <div className="mb-6 p-3 sm:p-4 bg-gray-50 border border-black/30 rounded-lg text-xs">
              <span className="font-bold text-gray-800 uppercase tracking-wider block mb-2">
                Sub-Bills &amp; Payment Breakdown:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {payments.map((p, idx) => {
                  const isGold = p.payment_type === 'GOLD' || Number(p.gold_weight) > 0 || String(p.payment_method || '').toLowerCase().includes('gold')
                  return (
                    <div key={p.id || idx} className="flex justify-between items-center border-b border-gray-200 pb-1.5 gap-2">
                      <span className="text-gray-700">
                        #{idx + 1} ({p.payment_method}) &bull; {new Date(p.payment_date).toLocaleDateString('en-GB')}:
                      </span>
                      <span className="font-bold text-gray-900 whitespace-nowrap">
                        {isGold ? (
                          <span className="text-amber-900">
                            {Number(p.gold_weight).toFixed(3)}g
                            {Number(p.amount_paid) > 0 && <span className="text-gray-500 font-normal text-[11px] ml-1">(₹{Number(p.amount_paid).toFixed(2)})</span>}
                          </span>
                        ) : (
                          <span className="text-emerald-700">
                            ₹{Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between items-end mt-12 sm:mt-20 pt-4">
            <div>
              <div className="w-32 sm:w-44 border-t border-black mb-1"></div>
              <p className="font-bold text-gray-800 text-xs sm:text-sm">Customer Signature</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 mb-6 sm:mb-8 text-xs sm:text-sm">For Vyshnavi Jewellers</p>
              <div className="w-36 sm:w-48 ml-auto border-t border-black mb-1"></div>
              <p className="font-bold text-gray-800 text-xs sm:text-sm">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
