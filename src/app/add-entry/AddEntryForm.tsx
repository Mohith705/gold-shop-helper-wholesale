'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addCustomerAndTransaction } from '../actions'
import { Calculator, Loader2 } from 'lucide-react'

export function AddEntryForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [weight, setWeight] = useState<number>(0)
  const [wastage, setWastage] = useState<number>(0)
  const [rate, setRate] = useState<number>(0)
  const [makingCharges, setMakingCharges] = useState<number>(0)
  
  // Lump Sum States
  const [isLumpSum, setIsLumpSum] = useState<boolean>(false)
  const [gstIncluded, setGstIncluded] = useState<boolean>(false)
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(0)

  // Calculations
  let netWeight = 0, taxableAmount = 0, cgst = 0, sgst = 0, totalAmount = 0

  if (isLumpSum) {
    if (gstIncluded) {
      taxableAmount = lumpSumAmount / 1.03
      totalAmount = lumpSumAmount
    } else {
      taxableAmount = lumpSumAmount
      totalAmount = lumpSumAmount * 1.03
    }
    cgst = taxableAmount * 0.015
    sgst = taxableAmount * 0.015
  } else {
    netWeight = weight + (weight * (wastage / 100))
    taxableAmount = (netWeight * rate) + makingCharges
    cgst = taxableAmount * 0.015
    sgst = taxableAmount * 0.015
    totalAmount = taxableAmount + cgst + sgst
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addCustomerAndTransaction(formData)
      if (res?.error) {
        alert(res.error)
      } else if (res?.success) {
        router.push(`/bill/${res.transactionId}?mode=admin`)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="is_lump_sum" value={isLumpSum.toString()} />
      <input type="hidden" name="gst_included" value={gstIncluded.toString()} />

      <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-amber-100/50 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-inner border border-amber-200/50 w-full sm:w-auto">
          <button type="button" onClick={() => setIsLumpSum(false)} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${!isLumpSum ? 'bg-white shadow-md text-amber-900 scale-100 sm:scale-105' : 'text-amber-700/70 hover:text-amber-900 hover:bg-white/50'}`}>Detailed Entry</button>
          <button type="button" onClick={() => setIsLumpSum(true)} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${isLumpSum ? 'bg-white shadow-md text-amber-900 scale-100 sm:scale-105' : 'text-amber-700/70 hover:text-amber-900 hover:bg-white/50'}`}>Total Cost (Lump Sum)</button>
        </div>
      </div>

      {/* Customer Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required name="name" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input name="phone" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea name="address" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"></textarea>
          </div>
        </div>
      </section>

      {/* Transaction Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Item Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name / Description</label>
            <input required name="item_name" type="text" placeholder="e.g. 22K Gold Chain" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
            <input name="hsn_code" type="text" defaultValue="7113" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          
          {isLumpSum && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (₹)</label>
                <input required name="lump_sum_amount" type="number" step="0.01" value={lumpSumAmount || ''} onChange={e => setLumpSumAmount(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white" />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={gstIncluded} onChange={e => setGstIncluded(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Does this include 3% GST?</span>
                </label>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight (grams) {isLumpSum && <span className="text-gray-400 font-normal">(Optional)</span>}</label>
            <input required={!isLumpSum} name="weight_grams" type="number" step="0.001" value={weight || ''} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wastage (%) {isLumpSum && <span className="text-gray-400 font-normal">(Optional)</span>}</label>
            <input required={!isLumpSum} name="wastage_percentage" type="number" step="0.01" value={wastage || ''} onChange={e => setWastage(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gold Rate (per gram) {isLumpSum && <span className="text-gray-400 font-normal">(Optional)</span>}</label>
            <input required={!isLumpSum} name="gold_rate_per_gram" type="number" step="0.01" value={rate || ''} onChange={e => setRate(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Making Charges (₹) {isLumpSum && <span className="text-gray-400 font-normal">(Optional)</span>}</label>
            <input name="making_charges" type="number" step="0.01" value={makingCharges || ''} onChange={e => setMakingCharges(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
        </div>
      </section>

      {/* Calculator Summary */}
      <section className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-8 rounded-3xl border border-amber-200/60 shadow-[0_4px_20px_rgb(251,191,36,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-amber-300/20 transition-colors duration-700"></div>
        <div className="flex items-center gap-2 text-amber-900 font-semibold mb-4">
          <Calculator size={20} />
          <h3>Live Estimate</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-amber-600/70 mb-1">Net Weight</p>
            <p className="font-semibold text-amber-900">{netWeight.toFixed(3)} g</p>
          </div>
          <div>
            <p className="text-amber-600/70 mb-1">Taxable Value</p>
            <p className="font-semibold text-amber-900">₹{taxableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-amber-600/70 mb-1">CGST (1.5%) + SGST (1.5%)</p>
            <p className="font-semibold text-amber-900">₹{(cgst + sgst).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-amber-600/70 mb-1">Grand Total</p>
            <p className="font-bold text-xl text-amber-900">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </section>

      {/* Payment Section */}
      <section className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Payment Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
            <input name="amount_paid" type="number" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select name="payment_method" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white">
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </section>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 className="animate-spin" size={20} /> : null}
        {isPending ? 'Processing...' : 'Save & Generate Bill'}
      </button>
    </form>
  )
}
