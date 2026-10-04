import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { WholesaleTransaction } from '@/types'
import { notFound } from 'next/navigation'
import PrintButton from './PrintButton'

export default async function WholesaleReceiptPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
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

  // Fetch all wholesale transactions for this customer to calculate Closing Balance
  const { data: allTransactions } = await supabase
    .from('wholesale_transactions')
    .select('fine_gold, transaction_type, total_amount')
    .eq('customer_id', transaction.customer_id)
    .lte('created_at', transaction.created_at)

  let goldBalance = 0
  let moneyBalance = 0

  if (allTransactions) {
    allTransactions.forEach(tx => {
      if (tx.transaction_type === 'SALE') {
        goldBalance += Number(tx.fine_gold)
        moneyBalance += Number(tx.total_amount || 0)
      } else {
        goldBalance -= Number(tx.fine_gold)
        moneyBalance -= Number(tx.total_amount || 0)
      }
    })
  }

  const customer = transaction.customers as any

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 p-8 print:p-0 print:bg-white flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Navigation - Hidden when printing */}
        <div className="print:hidden flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <Link href="/" className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-2 text-sm font-semibold transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex gap-3">
            {customer?.phone && (
              <a 
                href={`https://wa.me/91${customer.phone.replace(/\\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${customer.name},\n\nHere are your wholesale transaction details with Vyshnavi Jewellers:\nInvoice No: ${transaction.invoice_number}\nItem: ${transaction.item_name}\nFine Gold: ${Number(transaction.fine_gold).toFixed(3)}g\nTotal Amount: ₹${transaction.total_amount ? Number(transaction.total_amount).toFixed(2) : '0.00'}\n\nRegards,\nVyshnavi Jewellers`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp Voucher
              </a>
            )}
            <PrintButton />
          </div>
        </div>

        {/* Receipt Container */}
        <div id="receipt-container" className="bg-white p-8 sm:p-12 print:p-0 shadow-lg print:shadow-none mx-auto w-full max-w-4xl font-sans text-sm border border-gray-200">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider">{customer?.name}</h1>
              <p className="text-gray-600 mt-1">Ph # {customer?.phone}</p>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-[80px_1fr] text-left">
                <span className="font-semibold text-gray-700">Vou.No.:</span>
                <span className="font-medium">{transaction.invoice_number}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] text-left mt-1">
                <span className="font-semibold text-gray-700">Date:</span>
                <span className="font-medium">{new Date(transaction.created_at).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-black mb-8 text-center">
            <thead>
              <tr className="border-b border-black divide-x divide-black font-semibold">
                <th className="p-2 w-10">S</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 w-24">Gross Wt.</th>
                <th className="p-2 w-24">Net Wt.</th>
                <th className="p-2 w-20">Tnch</th>
                <th className="p-2 w-24">Gold</th>
                <th className="p-2 w-20">Rate</th>
                <th className="p-2 w-24">Amt.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black border-b border-black">
              <tr className="divide-x divide-black h-24 align-top">
                <td className="p-2">1</td>
                <td className="p-2 text-left">{transaction.item_name} {transaction.transaction_type === 'RECEIPT' ? '(Recv)' : ''}</td>
                <td className="p-2">{Number(transaction.gross_weight).toFixed(3)}</td>
                <td className="p-2">{Number(transaction.net_weight).toFixed(3)}</td>
                <td className="p-2">{Number(transaction.touch_percentage).toFixed(2)}</td>
                <td className="p-2">{Number(transaction.fine_gold).toFixed(3)}</td>
                <td className="p-2">{transaction.rate_amount ? Number(transaction.rate_amount).toFixed(2) : ''}</td>
                <td className="p-2">{transaction.total_amount ? Number(transaction.total_amount).toFixed(2) : ''}</td>
              </tr>
              {/* Total Row */}
              <tr className="divide-x divide-black font-semibold bg-gray-50/50">
                <td className="p-2 text-left" colSpan={3}>Total</td>
                <td className="p-2">{Number(transaction.net_weight).toFixed(3)}</td>
                <td className="p-2"></td>
                <td className="p-2">{Number(transaction.fine_gold).toFixed(3)}</td>
                <td className="p-2"></td>
                <td className="p-2">{transaction.total_amount ? Number(transaction.total_amount).toFixed(2) : ''}</td>
              </tr>
              {/* Closing Balance Row */}
              <tr className="divide-x divide-black font-semibold">
                <td className="p-2 text-left" colSpan={4}>Cl. Balance</td>
                <td className="p-2"></td>
                <td className="p-2">{Math.abs(goldBalance).toFixed(3)}</td>
                <td className="p-2">{goldBalance > 0 ? 'Dr.' : goldBalance < 0 ? 'Cr.' : 'Nil'}</td>
                <td className="p-2">{Math.abs(moneyBalance) > 0 ? Math.abs(moneyBalance).toFixed(2) : 'Nil'}</td>
              </tr>
            </tbody>
          </table>

          {/* Item Image */}
          {transaction.image_url && (
            <div className="mb-8 flex justify-center">
              <div className="border border-gray-300 p-2 max-w-sm rounded-lg shadow-sm">
                <img src={transaction.image_url} alt="Item" className="w-full h-auto rounded" />
              </div>
            </div>
          )}

          {/* Footer Signatures */}
          <div className="flex justify-between items-end mt-24 mb-4">
            <div>
               <div className="w-40 border-t border-black mb-1"></div>
               <p className="font-semibold text-gray-700">Customer Signature</p>
            </div>
            <div className="text-center text-xs text-gray-500 pb-2">
              Page 1 Of 1
            </div>
            <div className="text-right">
               <p className="font-semibold text-gray-800 mb-6">For Vyshnavi Jewellers</p>
               <div className="w-48 ml-auto border-t border-black mb-1"></div>
               <p className="font-semibold text-gray-700">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
