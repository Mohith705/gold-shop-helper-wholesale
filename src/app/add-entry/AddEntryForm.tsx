'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addCustomerAndTransaction } from '../actions'
import { Calculator, Loader2, Contact, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Customer } from '@/types'

const DRAFT_KEY = 'retail_order_draft_v1'

export function AddEntryForm({
  existingCustomers = []
}: {
  existingCustomers?: { id: string; name: string; phone?: string | null; address?: string | null }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [isContactPickerSupported, setIsContactPickerSupported] = useState(false)

  // Customer states
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [address, setAddress] = useState<string>('')

  // Item & Calculation states
  const [itemName, setItemName] = useState<string>('')
  const [hsnCode, setHsnCode] = useState<string>('7113')
  const [weight, setWeight] = useState<number>(0)
  const [wastage, setWastage] = useState<number>(0)
  const [rate, setRate] = useState<number>(0)
  const [makingCharges, setMakingCharges] = useState<number>(0)
  
  // Old Gold Exchange
  const [oldGoldWeight, setOldGoldWeight] = useState<number>(0)
  const [oldGoldTouch, setOldGoldTouch] = useState<number>(0)
  const [oldGoldRate, setOldGoldRate] = useState<number>(0)
  const [oldGoldValue, setOldGoldValue] = useState<number>(0)

  // Lump Sum States
  const [isLumpSum, setIsLumpSum] = useState<boolean>(false)
  const [gstIncluded, setGstIncluded] = useState<boolean>(false)
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(0)

  // Payment & Notes
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash')
  const [notes, setNotes] = useState<string>('')

  // Detect Contact Picker API support (Mobile Chrome, Samsung Internet, Edge, etc.)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      setIsContactPickerSupported(true)
    }
  }, [])

  // Restore draft from localStorage on mount (prevents loss on tab switch or page refresh)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const d = JSON.parse(saved)
        if (d.name) setName(d.name)
        if (d.phone) setPhone(d.phone)
        if (d.address) setAddress(d.address)
        if (d.itemName) setItemName(d.itemName)
        if (d.hsnCode) setHsnCode(d.hsnCode)
        if (d.isLumpSum !== undefined) setIsLumpSum(d.isLumpSum)
        if (d.gstIncluded !== undefined) setGstIncluded(d.gstIncluded)
        if (d.lumpSumAmount !== undefined) setLumpSumAmount(d.lumpSumAmount)
        if (d.weight !== undefined) setWeight(d.weight)
        if (d.wastage !== undefined) setWastage(d.wastage)
        if (d.rate !== undefined) setRate(d.rate)
        if (d.makingCharges !== undefined) setMakingCharges(d.makingCharges)
        if (d.oldGoldWeight !== undefined) setOldGoldWeight(d.oldGoldWeight)
        if (d.oldGoldTouch !== undefined) setOldGoldTouch(d.oldGoldTouch)
        if (d.oldGoldRate !== undefined) setOldGoldRate(d.oldGoldRate)
        if (d.oldGoldValue !== undefined) setOldGoldValue(d.oldGoldValue)
        if (d.amountPaid !== undefined) setAmountPaid(d.amountPaid)
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod)
        if (d.notes) setNotes(d.notes)
        setHasDraft(true)
      }
    } catch (e) {
      console.error('Failed to load retail draft', e)
    }
    setIsInitialized(true)
  }, [])

  // Auto-save draft on every change and when switching tabs/apps
  useEffect(() => {
    if (!isInitialized) return

    const saveDraftNow = () => {
      const draftData = {
        name,
        phone,
        address,
        itemName,
        hsnCode,
        isLumpSum,
        gstIncluded,
        lumpSumAmount,
        weight,
        wastage,
        rate,
        makingCharges,
        oldGoldWeight,
        oldGoldTouch,
        oldGoldRate,
        oldGoldValue,
        amountPaid,
        paymentMethod,
        notes
      }
      const hasContent = Boolean(
        name || phone || address || itemName || weight > 0 || 
        lumpSumAmount > 0 || rate > 0 || makingCharges > 0 || 
        oldGoldWeight > 0 || amountPaid > 0 || notes
      )
      if (hasContent) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData))
        setHasDraft(true)
      } else {
        localStorage.removeItem(DRAFT_KEY)
        setHasDraft(false)
      }
    }

    saveDraftNow()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveDraftNow()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', saveDraftNow)
    window.addEventListener('beforeunload', saveDraftNow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', saveDraftNow)
      window.removeEventListener('beforeunload', saveDraftNow)
    }
  }, [
    isInitialized,
    name,
    phone,
    address,
    itemName,
    hsnCode,
    isLumpSum,
    gstIncluded,
    lumpSumAmount,
    weight,
    wastage,
    rate,
    makingCharges,
    oldGoldWeight,
    oldGoldTouch,
    oldGoldRate,
    oldGoldValue,
    amountPaid,
    paymentMethod,
    notes
  ])

  // Native Web Contact Picker API Handler
  const handlePickContact = async () => {
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      alert('Contact Picker is supported on modern mobile browsers (like Chrome on Android). On other devices, you can switch to your contacts app and copy-paste safely—your typed draft will NOT be lost!')
      return
    }
    try {
      // @ts-ignore
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false })
      if (contacts && contacts[0]) {
        const c = contacts[0]
        const contactName = c.name && c.name.length > 0 ? c.name[0] : ''
        let contactTel = c.tel && c.tel.length > 0 ? c.tel[0] : ''
        contactTel = contactTel.replace(/[\s-]/g, '')
        if (contactName && !name) setName(contactName)
        if (contactTel) setPhone(contactTel)
      }
    } catch (err) {
      console.log('Contact selection dismissed:', err)
    }
  }

  // Autocomplete customer from database
  const handleNameChange = (val: string) => {
    setName(val)
    if (existingCustomers && existingCustomers.length > 0) {
      const match = existingCustomers.find(c => c.name?.toLowerCase() === val.trim().toLowerCase())
      if (match) {
        if (match.phone && !phone) setPhone(match.phone)
        if (match.address && !address) setAddress(match.address)
      }
    }
  }

  // Clear Form / Discard Draft
  const handleReset = () => {
    if (confirm('Are you sure you want to clear the form? All entered details will be reset.')) {
      localStorage.removeItem(DRAFT_KEY)
      setName('')
      setPhone('')
      setAddress('')
      setItemName('')
      setHsnCode('7113')
      setIsLumpSum(false)
      setGstIncluded(false)
      setLumpSumAmount(0)
      setWeight(0)
      setWastage(0)
      setRate(0)
      setMakingCharges(0)
      setOldGoldWeight(0)
      setOldGoldTouch(0)
      setOldGoldRate(0)
      setOldGoldValue(0)
      setAmountPaid(0)
      setPaymentMethod('Cash')
      setNotes('')
      setHasDraft(false)
    }
  }

  useEffect(() => {
    if (oldGoldWeight > 0 && oldGoldTouch > 0 && oldGoldRate > 0) {
      const val = oldGoldWeight * (oldGoldTouch / 100) * oldGoldRate
      setOldGoldValue(Number(val.toFixed(2)))
    }
  }, [oldGoldWeight, oldGoldTouch, oldGoldRate])

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
  
  const balanceAfterOldGold = Math.max(0, totalAmount - oldGoldValue)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addCustomerAndTransaction(formData)
      if (res?.error) {
        alert(res.error)
      } else if (res?.success) {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch (e) {}
        router.push(`/bill/${res.transactionId}?mode=admin`)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="is_lump_sum" value={isLumpSum.toString()} />
      <input type="hidden" name="gst_included" value={gstIncluded.toString()} />

      {/* Draft Status Banner */}
      {hasDraft && (
        <div className="flex items-center justify-between bg-amber-50/90 border border-amber-200/80 px-4 py-2.5 rounded-2xl text-xs text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Draft automatically saved &mdash; switching tabs will <strong>not</strong> clear your data.</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-amber-800 hover:text-red-600 font-semibold transition-colors cursor-pointer ml-2 shrink-0"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      )}

      <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-amber-100/50 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-inner border border-amber-200/50 w-full sm:w-auto">
          <button type="button" onClick={() => setIsLumpSum(false)} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${!isLumpSum ? 'bg-white shadow-md text-amber-900 scale-100 sm:scale-105' : 'text-amber-700/70 hover:text-amber-900 hover:bg-white/50'}`}>Detailed Entry</button>
          <button type="button" onClick={() => setIsLumpSum(true)} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${isLumpSum ? 'bg-white shadow-md text-amber-900 scale-100 sm:scale-105' : 'text-amber-700/70 hover:text-amber-900 hover:bg-white/50'}`}>Total Cost (Lump Sum)</button>
        </div>
      </div>

      {/* Customer Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
          {isContactPickerSupported && (
            <button
              type="button"
              onClick={handlePickContact}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Contact size={14} className="text-amber-700" />
              Pick from Phone Contacts
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input 
              required 
              name="name" 
              type="text" 
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              list="retail-customers-list"
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" 
            />
            {existingCustomers.length > 0 && (
              <datalist id="retail-customers-list">
                {existingCustomers.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.phone ? `${c.phone}` : ''}
                  </option>
                ))}
              </datalist>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              {isContactPickerSupported && (
                <button
                  type="button"
                  onClick={handlePickContact}
                  className="text-xs text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Contact size={12} /> Pick
                </button>
              )}
            </div>
            <input 
              name="phone" 
              type="tel" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9848012345"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea 
              name="address" 
              rows={2} 
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Customer city, street, or address..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            ></textarea>
          </div>
        </div>
      </section>

      {/* Transaction Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Item Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name / Description <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              name="item_name" 
              type="text" 
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="e.g. 22K Gold Chain" 
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" 
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              name="hsn_code" 
              type="text" 
              value={hsnCode}
              onChange={e => setHsnCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" 
            />
          </div>
          
          {isLumpSum && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (₹) <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input name="lump_sum_amount" type="number" step="0.01" value={lumpSumAmount || ''} onChange={e => setLumpSumAmount(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight (grams) <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input name="weight_grams" type="number" step="0.001" value={weight || ''} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wastage (%) <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input name="wastage_percentage" type="number" step="0.01" value={wastage || ''} onChange={e => setWastage(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gold Rate (per gram) <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input name="gold_rate_per_gram" type="number" step="0.01" value={rate || ''} onChange={e => setRate(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Making Charges (₹) {isLumpSum && <span className="text-gray-400 font-normal">(Optional)</span>}</label>
            <input name="making_charges" type="number" step="0.01" value={makingCharges || ''} onChange={e => setMakingCharges(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div className="md:col-span-2 mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Item Image (Optional)</label>
            <input name="image" type="file" accept="image/*" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
            <p className="text-xs text-gray-500 mt-1">This image will appear on the bill.</p>
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
          <div className="bg-amber-100/50 p-2 rounded-lg border border-amber-200">
            <p className="text-amber-800 font-bold mb-1">Grand Total</p>
            <p className="font-black text-xl text-amber-900">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </section>

      {/* Old Gold Exchange */}
      <section className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Old Gold Exchange (Optional)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
            <input type="number" step="0.001" name="old_gold_weight" value={oldGoldWeight || ''} onChange={e => setOldGoldWeight(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-gray-50/50" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Touch (%)</label>
            <input type="number" step="0.01" name="old_gold_touch" value={oldGoldTouch || ''} onChange={e => setOldGoldTouch(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-gray-50/50" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gold Price (₹/g)</label>
            <input type="number" step="0.01" name="old_gold_rate" value={oldGoldRate || ''} onChange={e => setOldGoldRate(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-gray-50/50" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Value (₹)</label>
            <input type="number" step="0.01" name="old_gold_value" value={oldGoldValue || ''} onChange={e => setOldGoldValue(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-gray-50/50 font-semibold text-amber-900" />
          </div>
        </div>
        {oldGoldValue > 0 && (
          <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-green-800 text-sm font-semibold flex justify-between items-center">
            <span>Net Payable (After Old Gold):</span>
            <span className="text-lg">₹{balanceAfterOldGold.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </section>

      {/* Payment Section */}
      <section className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Additional Payment (Money)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
            <input 
              name="amount_paid" 
              type="number" 
              step="0.01" 
              value={amountPaid || ''}
              onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select 
              name="payment_method" 
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Additional Notes</h3>
        <textarea 
          name="notes" 
          rows={3} 
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any specific details, conditions, or notes about this order..." 
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
        ></textarea>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        {hasDraft && (
          <button
            type="button"
            onClick={handleReset}
            className="sm:w-1/3 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            Reset Form
          </button>
        )}
        <button 
          type="submit" 
          disabled={isPending}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? <Loader2 className="animate-spin" size={20} /> : null}
          {isPending ? 'Processing...' : 'Save & Generate Bill'}
        </button>
      </div>
    </form>
  )
}

