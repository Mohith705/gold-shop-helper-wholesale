import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { ReportsFilter } from './ReportsFilter'
import { format, startOfDay, endOfDay } from 'date-fns'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string, to?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  
  const fromDate = params.from || format(new Date(), 'yyyy-MM-dd')
  const toDate = params.to || format(new Date(), 'yyyy-MM-dd')

  const { data: transactions } = await supabase
    .from('gold_transactions')
    .select('*, customers(*), payments(*)')
    .gte('created_at', startOfDay(new Date(fromDate)).toISOString())
    .lte('created_at', endOfDay(new Date(toDate)).toISOString())
    .order('created_at', { ascending: false })

  const validTransactions = transactions || []

  const totalWeight = validTransactions.reduce((sum, t) => sum + (t.weight_grams || 0), 0)
  const totalSales = validTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
  
  const totalPayments = validTransactions.reduce((sum, t) => {
    const paid = t.payments?.reduce((pSum: number, p: any) => pSum + (p.amount_paid || 0), 0) || 0
    return sum + paid
  }, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 gap-4 print:hidden relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900 tracking-tight">Sales Reports</h1>
            <p className="text-sm font-medium text-gray-500 mt-2">Filter and export transaction receipts</p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <Link href="/" className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all hover:shadow-md hover:-translate-y-0.5 group">
              <ArrowLeft size={16} className="text-gray-500 group-hover:-translate-x-1 transition-transform" /> Dashboard
            </Link>
          </div>
        </header>

        <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 print:shadow-none print:border-none print:p-0 transition-all hover:shadow-md">
          <div className="print:hidden mb-8">
            <ReportsFilter initialFrom={fromDate} initialTo={toDate} />
          </div>

          <div className="hidden print:block mb-8">
            <h2 className="text-2xl font-bold text-center text-black">Sales Report</h2>
            <p className="text-center text-gray-800 mt-1 font-medium">
              Period: {format(new Date(fromDate), 'dd MMM yyyy')} to {format(new Date(toDate), 'dd MMM yyyy')}
            </p>
          </div>

          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead className="bg-gradient-to-r from-amber-50/50 to-transparent text-amber-900/70 uppercase font-semibold text-xs print:bg-gray-100 border-b border-amber-100/50">
                  <tr>
                    <th className="p-5">Date</th>
                    <th className="p-5">Customer</th>
                    <th className="p-5">Item</th>
                    <th className="p-5 text-right">Weight (g)</th>
                    <th className="p-5 text-right">Total Amount (₹)</th>
                    <th className="p-5 text-right">Paid (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {validTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500 animate-in fade-in">
                        No transactions found for the selected dates.
                      </td>
                    </tr>
                  ) : (
                    validTransactions.map((t, i) => {
                      const paid = t.payments?.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0) || 0
                      return (
                        <tr key={t.id} className="hover:bg-amber-50/30 transition-colors animate-in slide-in-from-bottom-2 fade-in print:bg-transparent" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
                          <td className="p-5 text-gray-500 font-medium">{format(new Date(t.created_at), 'dd MMM yyyy')}</td>
                          <td className="p-5 font-semibold text-gray-900">{t.customers?.name}</td>
                          <td className="p-5 text-gray-700 font-medium">{t.item_name} {t.is_lump_sum && <span className="ml-2 inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] uppercase font-bold tracking-wider">Lump</span>}</td>
                          <td className="p-5 text-right text-gray-600 font-medium">{t.is_lump_sum && !t.weight_grams ? '-' : t.weight_grams?.toFixed(3)}</td>
                          <td className="p-5 text-right font-bold text-gray-900 tracking-tight">{t.total_amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td className="p-5 text-right text-emerald-600 font-bold tracking-tight">{paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {validTransactions.length > 0 && (
                  <tfoot className="bg-gradient-to-br from-amber-50 to-amber-100/50 font-bold text-gray-900 print:bg-gray-100 border-t-2 border-amber-200/50">
                    <tr>
                      <td colSpan={3} className="p-5 text-right">TOTALS:</td>
                      <td className="p-5 text-right text-amber-700">{totalWeight.toFixed(3)}</td>
                      <td className="p-5 text-right text-amber-700 text-base">₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="p-5 text-right text-emerald-700 text-base">₹{totalPayments.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-gray-100 print:hidden">
              {validTransactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500 animate-in fade-in">
                  No transactions found for the selected dates.
                </div>
              ) : (
                validTransactions.map((t, i) => {
                  const paid = t.payments?.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0) || 0
                  return (
                    <div key={t.id} className="p-5 space-y-4 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">{t.customers?.name}</div>
                          <div className="text-xs font-medium text-gray-500">{format(new Date(t.created_at), 'dd MMM yyyy')}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-lg">₹{t.total_amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                          <div className="text-xs font-semibold text-emerald-600">Paid: ₹{paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 text-sm">
                        <div className="text-gray-700 font-medium">{t.item_name} {t.is_lump_sum && <span className="ml-1 inline-block px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[9px] uppercase font-bold tracking-wider">Lump Sum</span>}</div>
                        <div className="text-gray-500">{t.is_lump_sum ? '-' : `${t.weight_grams}g`}</div>
                      </div>
                      
                      <div className="flex justify-end pt-1">
                        <Link 
                          href={`/transaction/${t.id}`}
                          className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
              {validTransactions.length > 0 && (
                <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl mt-4 space-y-2 border border-amber-200/50">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-amber-900/70">Total Weight</span>
                    <span className="font-bold text-amber-700">{totalWeight.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-amber-900/70">Total Sales</span>
                    <span className="font-bold text-amber-700">₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-amber-200/50 pt-2">
                    <span className="font-semibold text-emerald-800/70">Total Payments</span>
                    <span className="font-bold text-emerald-700">₹{totalPayments.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
