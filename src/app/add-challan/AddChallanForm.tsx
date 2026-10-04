'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDeliveryChallan } from '../actions'
import { Loader2, Plus, Trash2 } from 'lucide-react'

export function AddChallanForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [items, setItems] = useState<{ id: string, desc: string, hsn: string, uom: string, qty: number, rate: number }[]>([
    { id: '1', desc: '', hsn: '', uom: 'GMS', qty: 0, rate: 0 }
  ])

  const [gstIncluded, setGstIncluded] = useState<boolean>(false)

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), desc: '', hsn: '', uom: 'GMS', qty: 0, rate: 0 }])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const itemsWithTaxable = items.map(item => {
    const rawTotal = Number(item.qty) * Number(item.rate)
    return {
      ...item,
      taxable: gstIncluded ? rawTotal / 1.03 : rawTotal
    }
  })

  const totalTaxable = itemsWithTaxable.reduce((sum, item) => sum + item.taxable, 0)
  
  // Auto calculate GST (1.5% CGST, 1.5% SGST)
  const cgst = totalTaxable * 0.015
  const sgst = totalTaxable * 0.015
  const igst = 0
  const totalAmount = totalTaxable + cgst + sgst + igst

  async function handleSubmit(formData: FormData) {
    formData.append('items', JSON.stringify(itemsWithTaxable))
    formData.append('total_taxable_value', totalTaxable.toString())
    formData.append('cgst_amount', cgst.toString())
    formData.append('sgst_amount', sgst.toString())
    formData.append('igst_amount', igst.toString())
    formData.append('total_amount', totalAmount.toString())

    startTransition(async () => {
      const res = await createDeliveryChallan(formData)
      if (res?.error) {
        alert(res.error)
      } else if (res?.success) {
        router.push(`/challan/${res.challanId}`)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Party Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name / Business Name</label>
            <input required name="customer_name" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input name="customer_address" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input name="customer_gstin" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input name="customer_state" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Transport Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transportation Mode</label>
            <input name="transport_mode" type="text" placeholder="e.g. By Hand, Bus, Train" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
            <input name="vehicle_number" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply</label>
            <input name="place_of_supply" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-2">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
              <input type="checkbox" checked={gstIncluded} onChange={(e) => setGstIncluded(e.target.checked)} className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500" />
              GST Included in Rate
            </label>
            <button type="button" onClick={addItem} className="text-sm bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-200 transition-colors flex items-center gap-1">
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {itemsWithTaxable.map((item, index) => (
            <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm">
                  <Trash2 size={14} />
                </button>
              )}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="col-span-2 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description of Goods</label>
                  <input required type="text" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">HSN Code</label>
                  <input type="text" value={item.hsn} onChange={e => updateItem(item.id, 'hsn', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Qty (Wt)</label>
                  <input required type="number" step="0.001" value={item.qty || ''} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rate</label>
                  <input required type="number" step="0.01" value={item.rate || ''} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Taxable Value</label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 h-[38px] flex items-center">
                    {item.taxable.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Tax Summary (Auto 3%)</h3>
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100/50">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600 font-medium">Total Taxable Value</span>
            <span className="text-xl font-bold text-gray-900">₹{totalTaxable.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
              <label className="block text-xs font-medium text-amber-700 mb-1">CGST (1.5%)</label>
              <div className="font-semibold text-lg text-amber-950">₹{cgst.toFixed(2)}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
              <label className="block text-xs font-medium text-amber-700 mb-1">SGST (1.5%)</label>
              <div className="font-semibold text-lg text-amber-950">₹{sgst.toFixed(2)}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
              <label className="block text-xs font-medium text-amber-700 mb-1">IGST (0%)</label>
              <div className="font-semibold text-lg text-amber-950">₹{igst.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="h-px bg-amber-200/50 w-full mb-4"></div>
          
          <div className="flex justify-between items-center">
            <span className="text-amber-900 font-semibold">Total Amount After Tax</span>
            <span className="text-2xl font-black text-amber-600 tracking-tight">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
      >
        {isPending ? <Loader2 className="animate-spin" size={20} /> : null}
        {isPending ? 'Saving Challan...' : 'Create Delivery Challan'}
      </button>
    </form>
  )
}
