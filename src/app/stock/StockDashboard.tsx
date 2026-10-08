'use client'

import { StockItem } from '@/types'
import { useState } from 'react'
import { PlusCircle, Package } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export function StockDashboard({ initialStock }: { initialStock: StockItem[] }) {
  const [stock, setStock] = useState<StockItem[]>(initialStock)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    item_name: '',
    gross_weight: '',
    net_weight: '',
    touch_percentage: '',
    quantity: '1',
    stones_weight: '0',
    stones_price: '0',
    beads_weight: '0'
  })

  const supabase = createClient()

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase.from('stock_items').insert({
        item_name: formData.item_name,
        gross_weight: Number(formData.gross_weight),
        net_weight: Number(formData.net_weight),
        touch_percentage: Number(formData.touch_percentage),
        quantity: Number(formData.quantity),
        stones_weight: Number(formData.stones_weight),
        stones_price: Number(formData.stones_price),
        beads_weight: Number(formData.beads_weight)
      }).select()

      if (error) throw error
      if (data) {
        setStock([data[0], ...stock])
        setIsAdding(false)
        setFormData({ item_name: '', gross_weight: '', net_weight: '', touch_percentage: '', quantity: '1', stones_weight: '0', stones_price: '0', beads_weight: '0' })
      }
    } catch (err) {
      console.error('Error adding stock:', err)
      alert('Failed to add stock.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-amber-100/50">
        <h2 className="text-xl font-bold text-gray-800">Current Stock</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-md shadow-amber-500/20"
        >
          <PlusCircle size={18} />
          <span>{isAdding ? 'Cancel' : 'Add Stock'}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddStock} className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200/60 animate-in slide-in-from-top-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Stock Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
              <input required type="text" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. Chain cb" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gross Wt (g)</label>
              <input required type="number" step="0.001" value={formData.gross_weight} onChange={e => setFormData({...formData, gross_weight: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Net Wt (g)</label>
              <input required type="number" step="0.001" value={formData.net_weight} onChange={e => setFormData({...formData, net_weight: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Touch %</label>
              <input required type="number" step="0.01" value={formData.touch_percentage} onChange={e => setFormData({...formData, touch_percentage: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. 96.00" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stones Wt (g)</label>
              <input type="number" step="0.001" value={formData.stones_weight} onChange={e => setFormData({...formData, stones_weight: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stones Price (₹)</label>
              <input type="number" step="0.01" value={formData.stones_price} onChange={e => setFormData({...formData, stones_price: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Beads Wt (g)</label>
              <input type="number" step="0.001" value={formData.beads_weight} onChange={e => setFormData({...formData, beads_weight: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
              <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button disabled={loading} type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Stock'}
            </button>
          </div>
        </form>
      )}

      {stock.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col justify-center">
            <p className="text-amber-700/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Pieces</p>
            <p className="text-2xl font-bold text-amber-900">{stock.reduce((sum, item) => sum + Number(item.quantity), 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col justify-center">
            <p className="text-amber-700/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Gross Wt</p>
            <p className="text-2xl font-bold text-amber-900">{stock.reduce((sum, item) => sum + Number(item.gross_weight), 0).toFixed(3)}g</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col justify-center">
            <p className="text-amber-700/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Net Wt</p>
            <p className="text-2xl font-bold text-amber-900">{stock.reduce((sum, item) => sum + Number(item.net_weight), 0).toFixed(3)}g</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col justify-center">
            <p className="text-amber-700/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Fine Gold</p>
            <p className="text-2xl font-bold text-amber-900">{stock.reduce((sum, item) => sum + ((Number(item.net_weight) * Number(item.touch_percentage)) / 100), 0).toFixed(3)}g</p>
          </div>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-amber-100/50 overflow-hidden">
        {stock.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="h-10 w-10 text-amber-300 mx-auto mb-3" />
            <p>No stock available. Add items to get started.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-amber-50/50 border-b border-amber-100/50 text-xs font-semibold text-amber-900/70 uppercase tracking-wider">
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Gross Wt</th>
                    <th className="p-4">Net Wt</th>
                    <th className="p-4">Stones (Wt/₹)</th>
                    <th className="p-4">Beads Wt</th>
                    <th className="p-4">Touch %</th>
                    <th className="p-4">Fine Gold</th>
                    <th className="p-4">Qty</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stock.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{item.item_name}</td>
                      <td className="p-4 text-gray-600">{Number(item.gross_weight).toFixed(3)}g</td>
                      <td className="p-4 text-gray-600">{Number(item.net_weight).toFixed(3)}g</td>
                      <td className="p-4 text-gray-600">
                        {Number(item.stones_weight) > 0 || Number(item.stones_price) > 0 
                          ? `${Number(item.stones_weight).toFixed(3)}g / ₹${Number(item.stones_price).toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {Number(item.beads_weight) > 0 ? `${Number(item.beads_weight).toFixed(3)}g` : '-'}
                      </td>
                      <td className="p-4 text-gray-600">{Number(item.touch_percentage).toFixed(2)}%</td>
                      <td className="p-4 font-semibold text-amber-700">
                        {((Number(item.net_weight) * Number(item.touch_percentage)) / 100).toFixed(3)}g
                      </td>
                      <td className="p-4 text-gray-600">{item.quantity}</td>
                      <td className="p-4 text-right">
                        <Link href={`/stock/${item.id}`} className="text-amber-600 hover:text-amber-800 font-semibold text-sm transition-colors">
                          View History
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {stock.map((item, i) => (
                <div key={item.id} className="p-5 space-y-4 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-2.5 rounded-xl text-amber-600 shadow-sm shadow-amber-200/20">
                        <Package size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.item_name}</div>
                        <div className="text-xs font-medium text-gray-500">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-700">{((Number(item.net_weight) * Number(item.touch_percentage)) / 100).toFixed(3)}g</div>
                      <div className="text-xs font-medium text-gray-500">Fine Gold</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 text-sm text-center">
                    <div>
                      <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Gross</div>
                      <div className="text-gray-700 font-medium">{Number(item.gross_weight).toFixed(3)}g</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Net</div>
                      <div className="text-gray-700 font-medium">{Number(item.net_weight).toFixed(3)}g</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Touch</div>
                      <div className="text-gray-700 font-medium">{Number(item.touch_percentage).toFixed(2)}%</div>
                    </div>
                  </div>

                  {(Number(item.stones_weight) > 0 || Number(item.beads_weight) > 0) && (
                    <div className="grid grid-cols-2 gap-2 bg-amber-50/30 p-3 rounded-xl border border-amber-100/50 text-sm text-center">
                      <div>
                        <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Stones (Wt / ₹)</div>
                        <div className="text-gray-700 font-medium">
                          {Number(item.stones_weight) > 0 ? `${Number(item.stones_weight).toFixed(3)}g` : '-'}
                          {Number(item.stones_price) > 0 ? ` / ₹${Number(item.stones_price).toFixed(2)}` : ''}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Beads Wt</div>
                        <div className="text-gray-700 font-medium">
                          {Number(item.beads_weight) > 0 ? `${Number(item.beads_weight).toFixed(3)}g` : '-'}
                        </div>
                      </div>
                    </div>
                  )}

                  <Link href={`/stock/${item.id}`} className="block w-full py-2.5 bg-amber-50 text-amber-700 text-center rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">
                    View History
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
