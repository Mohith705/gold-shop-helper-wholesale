import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { PrintButton } from './PrintButton'

export default async function StatementPage({ params }: { params: Promise<{ id: string }> }) {
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

  const payments = transaction.payments || []
  const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0)
  const balanceDue = transaction.total_amount - totalPaid

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Actions Header (Hidden in Print) */}
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
          <Link href={`/transaction/${id}`} className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft size={16} /> Back to Transaction
          </Link>
          <PrintButton />
        </header>

        {/* Printable Statement */}
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
          
          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Statement of Account</h1>
            <p className="text-gray-500 font-medium">Vyshnavi Jewellers</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <h2 className="text-gray-500 font-medium mb-1">Customer Details</h2>
              <p className="font-semibold text-gray-900 text-lg">{transaction.customers.name}</p>
              <p className="text-gray-700">{transaction.customers.phone}</p>
              <p className="text-gray-700 whitespace-pre-wrap">{transaction.customers.address}</p>
            </div>
            <div className="text-right">
              <h2 className="text-gray-500 font-medium mb-1">Statement Date</h2>
              <p className="font-semibold text-gray-900">{format(new Date(), 'dd MMM yyyy')}</p>
              <h2 className="text-gray-500 font-medium mt-4 mb-1">Item Reference</h2>
              <p className="font-semibold text-gray-900">{transaction.item_name}</p>
              <p className="text-gray-700">Date: {format(new Date(transaction.created_at), 'dd MMM yyyy')}</p>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Transaction Summary</h3>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
              <span className="text-gray-600">Total Invoice Amount</span>
              <span className="font-medium text-gray-900">₹{transaction.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Payments Ledger */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Payment History</h3>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-y">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No payments recorded.</td>
                  </tr>
                ) : (
                  payments.map((payment: any) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-gray-600">{format(new Date(payment.payment_date), 'dd MMM yyyy')}</td>
                      <td className="px-4 py-3 text-gray-600">{payment.payment_method}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">{payment.amount_paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Final Balance */}
          <div className="flex justify-end pt-4 border-t-2 border-gray-200">
            <div className="w-full max-w-sm">
              <div className="flex justify-between items-center py-2 text-sm text-gray-600">
                <span>Total Amount:</span>
                <span>₹{transaction.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm text-gray-600 border-b border-gray-200">
                <span>Less Payments:</span>
                <span className="text-emerald-600">- ₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-4 text-xl font-bold">
                <span className="text-gray-900">Balance Due:</span>
                <span className={balanceDue > 0 ? "text-red-600" : "text-emerald-600"}>
                  ₹{balanceDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  )
}
