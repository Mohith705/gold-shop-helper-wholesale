'use client'

import { GoldTransaction, WholesaleTransaction } from '@/types'
import Link from 'next/link'
import { PlusCircle, ReceiptText, User, Search, Filter, FileText, ArrowRightLeft } from 'lucide-react'
import { useState } from 'react'

export function Dashboard({ 
  initialTransactions,
  initialWholesaleTransactions
}: { 
  initialTransactions: GoldTransaction[],
  initialWholesaleTransactions: WholesaleTransaction[]
}) {
  const [activeTab, setActiveTab] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')

  // Filter and sort Retail transactions
  const filteredRetail = initialTransactions.filter(tx => {
    const query = searchQuery.toLowerCase()
    return (
      tx.customers?.name?.toLowerCase().includes(query) ||
      tx.customers?.phone?.toLowerCase().includes(query) ||
      tx.item_name.toLowerCase().includes(query)
    )
  }).sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === 'amount_desc') return b.total_amount - a.total_amount
    if (sortBy === 'amount_asc') return a.total_amount - b.total_amount
    return 0
  })

  // Filter and sort Wholesale transactions
  const filteredWholesale = initialWholesaleTransactions.filter(tx => {
    const query = searchQuery.toLowerCase()
    return (
      tx.customers?.name?.toLowerCase().includes(query) ||
      tx.customers?.phone?.toLowerCase().includes(query) ||
      tx.item_name.toLowerCase().includes(query)
    )
  }).sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === 'amount_desc') return (b.total_amount || 0) - (a.total_amount || 0)
    if (sortBy === 'amount_asc') return (a.total_amount || 0) - (b.total_amount || 0)
    return 0
  })

  const currentList = activeTab === 'RETAIL' ? filteredRetail : filteredWholesale;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 delay-150">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Recent Transactions</h2>
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <Link 
            href="/challans" 
            className="w-full sm:w-auto justify-center bg-white border border-amber-200/60 text-amber-900 hover:bg-amber-50 hover:border-amber-300 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <FileText size={18} className="text-amber-600" />
            <span>Challans</span>
          </Link>
          <Link 
            href="/reports" 
            className="w-full sm:w-auto justify-center bg-white border border-amber-200/60 text-amber-900 hover:bg-amber-50 hover:border-amber-300 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <FileText size={18} className="text-amber-600" />
            <span>Reports</span>
          </Link>
          <Link 
            href="/stock" 
            className="w-full sm:w-auto justify-center bg-white border border-amber-200/60 text-amber-900 hover:bg-amber-50 hover:border-amber-300 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <FileText size={18} className="text-amber-600" />
            <span>Stock</span>
          </Link>
          <Link 
            href="/add-wholesale-entry" 
            className="w-full sm:w-auto justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-md shadow-amber-500/20 hover:shadow-lg text-sm sm:text-base"
          >
            <PlusCircle size={18} />
            <span>Wholesale</span>
          </Link>
          <Link 
            href="/add-entry" 
            className="w-full sm:w-auto justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-md shadow-amber-500/20 hover:shadow-lg text-sm sm:text-base"
          >
            <PlusCircle size={18} />
            <span>Retail</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('RETAIL')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'RETAIL' ? 'border-amber-600 text-amber-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Retail Orders
        </button>
        <button 
          onClick={() => setActiveTab('WHOLESALE')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'WHOLESALE' ? 'border-amber-600 text-amber-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Wholesale Orders
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-amber-100/50 flex flex-col md:flex-row gap-4 justify-between items-center transition-all hover:shadow-md">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by name, phone, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all bg-white/50 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-gray-400" size={18} />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer bg-white"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-amber-100/50 overflow-hidden transition-all hover:shadow-md">
        {currentList.length === 0 ? (
          <div className="p-16 text-center text-gray-500 animate-in fade-in">
            <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <ReceiptText className="h-10 w-10 text-amber-400" />
            </div>
            <p className="text-xl font-medium text-gray-900 tracking-tight">No transactions found</p>
            <p className="mt-2 text-gray-500">Try adjusting your search or create a new entry.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50/50 to-transparent border-b border-amber-100/50 text-sm font-semibold text-amber-900/70 uppercase tracking-wider">
                    <th className="p-5">Customer</th>
                    <th className="p-5">Item</th>
                    <th className="p-5">Details</th>
                    <th className="p-5">Amount</th>
                    <th className="p-5">Date</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentList.map((tx: any, i: number) => (
                    <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors group animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-2.5 rounded-2xl text-amber-600 shadow-sm shadow-amber-200/20 group-hover:scale-110 transition-transform">
                            <User size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{tx.customers?.name}</div>
                            <div className="text-xs font-medium text-gray-500">{tx.customers?.phone || 'No phone'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-gray-700 font-medium">{tx.item_name} {activeTab === 'RETAIL' && tx.is_lump_sum && <span className="ml-2 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] uppercase font-bold tracking-wider">Lump Sum</span>}</td>
                      <td className="p-5">
                        {activeTab === 'RETAIL' ? (
                          <span className="text-gray-600 font-medium">{tx.is_lump_sum ? '-' : `${tx.weight_grams}g`}</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-gray-600 font-medium">{tx.gross_weight}g Gross</span>
                            {(Number(tx.stones_weight) > 0 || Number(tx.beads_weight) > 0 || Number(tx.extra_beads) > 0) && (
                              <span className="text-[10px] text-gray-500 font-medium mt-1">
                                {Number(tx.stones_weight) > 0 ? `S: ${tx.stones_weight}g ` : ''}
                                {Number(tx.beads_weight) > 0 ? `B: ${tx.beads_weight}g ` : ''}
                                {Number(tx.extra_beads) > 0 ? `Ex.B: ${tx.extra_beads}g` : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-5 font-bold text-gray-900 tracking-tight">₹{tx.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-5 text-gray-500 text-sm font-medium">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                          {activeTab === 'RETAIL' ? (
                            <>
                              <Link 
                                href={`/transaction/${tx.id}`}
                                className="text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                              >
                                <User size={16} />
                                View
                              </Link>
                              <Link 
                                href={`/bill/${tx.id}?mode=admin`}
                                className="text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                              >
                                <ReceiptText size={16} />
                                Bill
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link 
                                href={`/wholesale-transaction/${tx.id}`}
                                className="text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                              >
                                <User size={16} />
                                View
                              </Link>
                              <Link 
                                href={`/wholesale-receipt/${tx.id}`}
                                className="text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                              >
                                <ReceiptText size={16} />
                                Voucher
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-gray-100">
              {currentList.map((tx: any, i: number) => (
                <div key={tx.id} className="p-5 space-y-4 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-2.5 rounded-xl text-amber-600 shadow-sm shadow-amber-200/20">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{tx.customers?.name}</div>
                        <div className="text-xs font-medium text-gray-500">{tx.customers?.phone || 'No phone'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">₹{tx.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs font-medium text-gray-500">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 text-sm">
                    <div className="flex justify-between items-center">
                      <div className="text-gray-700 font-medium">{tx.item_name} {activeTab === 'RETAIL' && tx.is_lump_sum && <span className="ml-1 inline-block px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[9px] uppercase font-bold tracking-wider">Lump Sum</span>}</div>
                      <div className="text-gray-500 font-semibold">{activeTab === 'RETAIL' ? (tx.is_lump_sum ? '-' : `${tx.weight_grams}g`) : `${tx.gross_weight}g Gross`}</div>
                    </div>
                    {activeTab === 'WHOLESALE' && (Number(tx.stones_weight) > 0 || Number(tx.beads_weight) > 0 || Number(tx.extra_beads) > 0) && (
                      <div className="text-[11px] text-gray-500 font-medium text-right flex justify-end gap-2">
                        {Number(tx.stones_weight) > 0 && <span>S: {tx.stones_weight}g</span>}
                        {Number(tx.beads_weight) > 0 && <span>B: {tx.beads_weight}g</span>}
                        {Number(tx.extra_beads) > 0 && <span>Ex.B: {tx.extra_beads}g</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full">
                    {activeTab === 'RETAIL' ? (
                      <>
                        <Link 
                          href={`/transaction/${tx.id}`}
                          className="flex-1 justify-center text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          <User size={16} /> View
                        </Link>
                        <Link 
                          href={`/bill/${tx.id}?mode=admin`}
                          className="flex-1 justify-center text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          <ReceiptText size={16} /> Bill
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link 
                          href={`/wholesale-transaction/${tx.id}`}
                          className="flex-1 justify-center text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          <User size={16} /> View
                        </Link>
                        <Link 
                          href={`/wholesale-receipt/${tx.id}`}
                          className="flex-1 justify-center text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          <ReceiptText size={16} /> Voucher
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
