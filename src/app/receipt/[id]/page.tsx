import { createClient } from '@/utils/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PrintButton } from '../../bill/[id]/PrintButton'

export default async function ReceiptPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { id } = await params
  
  const resolvedSearchParams = await searchParams
  const isAdmin = resolvedSearchParams?.mode === 'admin'

  if (!id) return notFound()

  // Fetch payment and join transaction and customer
  const { data: payment, error } = await supabase
    .from('payments')
    .select('*, gold_transactions(*, customers(*), payments(*))')
    .eq('id', id)
    .single()

  if (error || !payment) {
    return notFound()
  }

  const transaction = payment.gold_transactions
  const customer = transaction.customers
  const allPayments = transaction.payments || []
  
  // Calculate total paid up to now
  const totalPaid = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0)
  const balanceDue = transaction.total_amount - totalPaid

  // Calculate receipt number suffix (a, b, c...)
  const sortedPayments = [...allPayments].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
  const paymentIndex = sortedPayments.findIndex(p => p.id === payment.id)
  const receiptSuffix = String.fromCharCode(97 + (paymentIndex >= 0 ? paymentIndex : 0))
  const receiptNumber = `${transaction.invoice_number}${receiptSuffix}`

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 p-8 print:p-0 print:bg-white flex flex-col items-center">
      <div className="w-full max-w-xl space-y-6">
        <header className="flex justify-between items-center print:hidden w-full">
          <div>
            {isAdmin && (
              <Link href={`/transaction/${transaction.id}`} className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-2 text-sm font-medium">
                <ArrowLeft size={16} /> Back to Transaction
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(isAdmin && customer?.phone) && (
              <a 
                href={`https://wa.me/91${customer.phone.replace(/\\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${customer.name},\n\nWe have received your payment of ₹${payment.amount_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })} towards Invoice INV-${transaction.invoice_number}.\n\nTotal Invoice Amount: ₹${transaction.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nTotal Amount Paid: ₹${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nCurrent Balance Due: ₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nThank you!\nVyshnavi Jewellers`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp Receipt
              </a>
            )}
            <PrintButton 
              customerName={customer?.name || 'Customer'}
              itemName="Receipt"
              date={new Date(payment.payment_date).toLocaleDateString('en-IN')}
            />
          </div>
        </header>

        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0 text-center">
          <h1 className="text-2xl font-bold text-gray-900">PAYMENT RECEIPT</h1>
          <p className="text-gray-500 mt-1 uppercase tracking-wider font-medium">LAKSHMI SUMA JEWELLERY</p>
          
          <div className="mt-8 text-left space-y-4 text-sm border-t border-b border-gray-100 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Receipt No</span>
                <span className="font-medium text-gray-900">REC-{receiptNumber}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Date</span>
                <span className="font-medium text-gray-900">{new Date(payment.payment_date).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Received From</span>
                <span className="font-medium text-gray-900">{customer?.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Payment Mode</span>
                <span className="font-medium text-gray-900">{payment.payment_method}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <span className="text-gray-500 block text-xs uppercase tracking-wider mb-3">Item Details (Against Invoice INV-{transaction.invoice_number})</span>
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                <div className="col-span-2">
                  <span className="text-gray-500 mr-2">Item:</span>
                  <span className="font-medium text-gray-900">{transaction.item_name}</span>
                </div>
                <div><span className="text-gray-500 mr-2">Gross Wt:</span><span className="font-medium">{transaction.weight_grams}g</span></div>
                <div><span className="text-gray-500 mr-2">Net Wt:</span><span className="font-medium">{transaction.net_weight.toFixed(3)}g</span></div>
                <div><span className="text-gray-500 mr-2">Rate/g:</span><span className="font-medium">₹{transaction.gold_rate_per_gram.toLocaleString('en-IN')}</span></div>
                <div><span className="text-gray-500 mr-2">Making Chg:</span><span className="font-medium">₹{transaction.making_charges.toLocaleString('en-IN')}</span></div>
                <div className="col-span-2 border-t border-gray-200 mt-2 pt-2 flex justify-between">
                  <span className="text-gray-600 font-medium">Invoice Grand Total:</span>
                  <span className="font-bold text-gray-900">₹{transaction.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-medium">Amount Received</p>
            <p className="text-4xl font-bold text-green-600">₹{Number(payment.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            
            {balanceDue > 0 ? (
              <div className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                Current Balance Due: ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            ) : (
              <div className="mt-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
                Invoice Fully Paid ✓
              </div>
            )}
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between text-xs text-gray-500">
            <span>Customer Signature</span>
            <span>Authorized Signatory</span>
          </div>
        </div>
      </div>
    </main>
  )
}
