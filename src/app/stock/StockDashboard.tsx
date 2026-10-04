'use client'

import { StockItem } from '@/types'
import { useState } from 'react'
import { PlusCircle, Package } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function StockDashboard({ initialStock }: { initialStock: StockItem[] }) {
  const [stock, setStock] = useState<StockItem[]>(initialStock)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    item_name: '',
    gross_weight: '',
    net_weight: '',
    touch_percentage: '',
    quantity: '1'
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
        quantity: Number(formData.quantity)
      }).select()

      if (error) throw error
      if (data) {
        setStock([data[0], ...stock])
        setIsAdding(false)
        setFormData({ item_name: '', gross_weight: '', net_weight: '', touch_percentage: '', quantity: '1' })
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-amber-100/50 overflow-hidden">
        {stock.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="h-10 w-10 text-amber-300 mx-auto mb-3" />
            <p>No stock available. Add items to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-amber-50/50 border-b border-amber-100/50 text-xs font-semibold text-amber-900/70 uppercase tracking-wider">
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Gross Wt</th>
                  <th className="p-4">Net Wt</th>
                  <th className="p-4">Touch %</th>
                  <th className="p-4">Fine Gold</th>
                  <th className="p-4">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stock.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{item.item_name}</td>
                    <td className="p-4 text-gray-600">{Number(item.gross_weight).toFixed(3)}g</td>
                    <td className="p-4 text-gray-600">{Number(item.net_weight).toFixed(3)}g</td>
                    <td className="p-4 text-gray-600">{Number(item.touch_percentage).toFixed(2)}%</td>
                    <td className="p-4 font-semibold text-amber-700">
                      {((Number(item.net_weight) * Number(item.touch_percentage)) / 100).toFixed(3)}g
                    </td>
                    <td className="p-4 text-gray-600">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
