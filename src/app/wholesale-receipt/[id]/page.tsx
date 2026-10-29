import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
  const oldGoldWeight = meta.old_gold_weight !== undefined ? Number(meta.old_gold_weight) : 0
  const payments = meta.payments || []

  const grossWeight = Number(transaction.gross_weight) || 0
  const netWeight = Number(transaction.net_weight) || Math.max(0, grossWeight - lessWeight)
  const touch = Number(transaction.touch_percentage) || 0
  const fineGold = Number(transaction.fine_gold) || 0
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

  // WhatsApp text summary
  const waText = `*VYSHNAVI JEWELLERS - WHOLESALE VOUCHER*
Voucher No: ${transaction.invoice_number || 'N/A'}
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
${oldGoldWeight > 0 ? `- Old Gold Wt: ${oldGoldWeight.toFixed(3)}g\n- Payable Gold: ${payableGold.toFixed(3)}g\n` : ''}- Gold Rate: ₹${rateAmount.toLocaleString('en-IN')}/g
*Total Amount:* ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
*Cash Paid:* ₹${totalCashPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

*Balance:*
- Balance in Gold: ${pureGoldDiff.toFixed(3)}g${totalCashPaid > 0 ? ` (${remainingGoldBalance.toFixed(3)}g after cash)` : ''}
- Balance in Cash: ₹${cashBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

Thank you for your business!`

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 p-4 sm:p-8 print:p-0 print:bg-white flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Navigation - Hidden when printing */}
        <div className="print:hidden flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <Link href="/" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2 text-sm font-semibold transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex gap-3">
            <Link
              href={`/wholesale-transaction/${transaction.id}`}
              className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Manage Sub-Bills
            </Link>
            {customer?.phone && (
              <a 
                href={`https://wa.me/91${customer.phone.replace(/\\D/g, '').slice(-10)}?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp Voucher
              </a>
            )}
            <PrintButton />
          </div>
        </div>

        {/* Voucher / Bill Container - Matches Handwritten Format */}
        <div id="receipt-container" className="bg-white p-6 sm:p-10 print:p-0 shadow-lg print:shadow-none mx-auto w-full font-sans text-xs sm:text-sm border border-black/40">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b border-black/20 pb-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-gray-700 w-16">Name:</span>
                <span className="text-base sm:text-lg font-black uppercase text-gray-900">{customer?.name || 'Customer'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-gray-700 w-16">Ph #:</span>
                <span className="font-semibold text-gray-800">{customer?.phone || '-'}</span>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div className="flex justify-end gap-2">
                <span className="font-bold text-gray-700">Vou No:</span>
                <span className="font-bold text-gray-900">{transaction.invoice_number ? `#${transaction.invoice_number}` : '-'}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="font-bold text-gray-700">Date:</span>
                <span className="font-medium text-gray-900">{new Date(transaction.created_at).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>

          {/* Ledger Table - Matching photo columns: Description | Stamp | G.wt | Less wt | Net wt | Touch | Gold | Rate | Amt */}
          <div className="overflow-x-auto border border-black mb-6">
            <table className="w-full min-w-[700px] border-collapse text-center">
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
                <tr className="divide-x divide-black h-20 align-top">
                  <td className="p-2 text-left">
                    <span className="font-semibold text-gray-900">{transaction.item_name}</span>
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

                {/* Old Gold Deduction Row (if given) */}
                {oldGoldWeight > 0 && (
                  <tr className="divide-x divide-black bg-amber-50/50 text-[11px] sm:text-xs">
                    <td className="p-2 text-left font-semibold text-amber-900" colSpan={6}>
                      Less Old Gold Weight (Exchanged)
                    </td>
                    <td className="p-2 font-bold text-red-600">-{oldGoldWeight.toFixed(3)}</td>
                    <td className="p-2 text-gray-500">Payable:</td>
                    <td className="p-2 font-bold text-amber-900">{payableGold.toFixed(3)}g</td>
                  </tr>
                )}

                {/* Total Row */}
                <tr className="divide-x divide-black font-bold bg-gray-100 text-gray-900 text-[11px] sm:text-xs">
                  <td className="p-2 text-left" colSpan={2}>Total</td>
                  <td className="p-2">{grossWeight.toFixed(3)}</td>
                  <td className="p-2">{lessWeight.toFixed(3)}</td>
                  <td className="p-2">{netWeight.toFixed(3)}</td>
                  <td className="p-2"></td>
                  <td className="p-2 font-black">{payableGold.toFixed(3)}</td>
                  <td className="p-2"></td>
                  <td className="p-2 font-black">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>

                {/* Cash Paid / Payments Received Row */}
                <tr className="divide-x divide-black text-[11px] sm:text-xs">
                  <td className="p-2 text-left font-semibold text-gray-800" colSpan={6}>
                    Cash / Money Paid {payments.length > 1 ? `(${payments.length} sub-bills)` : ''}
                  </td>
                  <td className="p-2" colSpan={2}>
                    {goldEquivalentFromCash > 0 ? `${goldEquivalentFromCash.toFixed(3)}g eq.` : ''}
                  </td>
                  <td className="p-2 font-bold text-emerald-700">
                    ₹{totalCashPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Balance Row - Exact match to handwriting in photo */}
                <tr className="divide-x divide-black font-black bg-amber-100/50 text-xs sm:text-sm">
                  <td className="p-2.5 text-left uppercase tracking-wider text-amber-950" colSpan={4}>
                    Balance
                  </td>
                  <td className="p-2.5 text-left text-amber-900" colSpan={2}>
                    <span className="text-[10px] uppercase font-bold text-gray-600 block">Gold Balance:</span>
                    <span>{pureGoldDiff.toFixed(3)}g</span>
                  </td>
                  <td className="p-2.5 text-right font-black text-red-600" colSpan={3}>
                    <span className="text-[10px] uppercase font-bold text-gray-600 block">Cash Balance:</span>
                    <span>₹{cashBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sub-Bills Breakdown (if multiple payments were recorded) */}
          {payments.length > 0 && (
            <div className="mb-6 p-3.5 bg-gray-50 border border-black/30 rounded-lg text-xs">
              <span className="font-bold text-gray-800 uppercase tracking-wider block mb-2">Sub-Bills / Payment Breakdown:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {payments.map((p, idx) => (
                  <div key={p.id || idx} className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">
                      #{idx + 1} ({p.payment_method}) &bull; {new Date(p.payment_date).toLocaleDateString('en-GB')}:
                    </span>
                    <span className="font-bold text-gray-900">
                      ₹{Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between items-end mt-20 pt-6">
            <div>
              <div className="w-44 border-t border-black mb-1"></div>
              <p className="font-bold text-gray-800 text-xs sm:text-sm">Customer Signature</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 mb-8 text-xs sm:text-sm">For Vyshnavi Jewellers</p>
              <div className="w-48 ml-auto border-t border-black mb-1"></div>
              <p className="font-bold text-gray-800 text-xs sm:text-sm">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
