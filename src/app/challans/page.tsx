import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FileText, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default async function ChallansListPage() {
  const supabase = await createClient()

  const { data: challans, error } = await supabase
    .from('delivery_challans')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
          <div className="relative z-10 flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-amber-600 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900 tracking-tight">Delivery Challans</h1>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-2 ml-8">Manage and view transport delivery challans</p>
          </div>
          <div className="relative z-10 w-full sm:w-auto">
            <Link 
              href="/add-challan" 
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <Plus size={18} /> New Challan
            </Link>
          </div>
        </header>

        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 overflow-hidden">
          {(!challans || challans.length === 0) ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100">
                <FileText size={24} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Challans Found</h3>
              <p className="text-gray-500">Create your first delivery challan to get started.</p>
            </div>
          ) : (
            <div>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                  <thead className="bg-gradient-to-r from-amber-50/50 to-transparent text-amber-900/70 uppercase font-semibold text-xs border-b border-amber-100/50">
                    <tr>
                      <th className="p-5">D.C. No.</th>
                      <th className="p-5">Date</th>
                      <th className="p-5">Customer Name</th>
                      <th className="p-5">Place of Supply</th>
                      <th className="p-5 text-right">Total Amount</th>
                      <th className="p-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {challans.map((challan) => (
                      <tr key={challan.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-5 font-bold text-gray-900">{challan.dc_number}</td>
                        <td className="p-5 text-gray-600">{format(new Date(challan.dc_date), 'dd MMM yyyy')}</td>
                        <td className="p-5 font-semibold text-gray-800">{challan.customer_name}</td>
                        <td className="p-5 text-gray-600">{challan.place_of_supply || '-'}</td>
                        <td className="p-5 text-right font-bold text-gray-900">₹{Number(challan.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-5 text-center">
                          <Link 
                            href={`/challan/${challan.id}`}
                            className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs"
                          >
                            <FileText size={14} /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-gray-100">
                {challans.map((challan) => (
                  <div key={challan.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">{challan.customer_name}</div>
                        <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 inline-block px-2 py-0.5 rounded-md mb-2">{challan.dc_number}</div>
                        <div className="text-xs font-medium text-gray-500">{format(new Date(challan.dc_date), 'dd MMM yyyy')}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-lg">₹{Number(challan.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t border-gray-50">
                      <Link 
                        href={`/challan/${challan.id}`}
                        className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        <FileText size={16} /> View Challan
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
