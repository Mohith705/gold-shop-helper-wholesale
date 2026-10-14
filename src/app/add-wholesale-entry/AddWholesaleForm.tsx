'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addWholesaleTransaction } from '../actions'
import { Calculator, Loader2, Contact, RotateCcw, CheckCircle2 } from 'lucide-react'
import { StockItem, Customer } from '@/types'

const DRAFT_KEY = 'wholesale_order_draft_v1'

export function AddWholesaleForm({ 
  availableStock,
  existingCustomers = []
}: { 
  availableStock: StockItem[]
  existingCustomers?: { id: string; name: string; phone?: string | null; address?: string | null }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [isContactPickerSupported, setIsContactPickerSupported] = useState(false)

  // Customer & Form State
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [itemName, setItemName] = useState<string>('')
  const [transactionType, setTransactionType] = useState<'SALE' | 'RECEIPT'>('SALE')
  const [grossWeight, setGrossWeight] = useState<number>(0)
  const [netWeight, setNetWeight] = useState<number>(0)
  const [touchPercentage, setTouchPercentage] = useState<number>(0)
  const [stonesWeight, setStonesWeight] = useState<number>(0)
  const [stonesPrice, setStonesPrice] = useState<number>(0)
  const [beadsWeight, setBeadsWeight] = useState<number>(0)
  const [extraBeads, setExtraBeads] = useState<number>(0)
  const [rateAmount, setRateAmount] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  
  // Multiple stock deductions
  const [stockDeductions, setStockDeductions] = useState<{ id: string, stock_id: string, gross: number, net: number }[]>([])

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
        if (d.transactionType) setTransactionType(d.transactionType)
        if (d.name) setName(d.name)
        if (d.phone) setPhone(d.phone)
        if (d.itemName) setItemName(d.itemName)
        if (d.grossWeight !== undefined) setGrossWeight(d.grossWeight)
        if (d.netWeight !== undefined) setNetWeight(d.netWeight)
        if (d.touchPercentage !== undefined) setTouchPercentage(d.touchPercentage)
        if (d.stonesWeight !== undefined) setStonesWeight(d.stonesWeight)
        if (d.stonesPrice !== undefined) setStonesPrice(d.stonesPrice)
        if (d.beadsWeight !== undefined) setBeadsWeight(d.beadsWeight)
        if (d.extraBeads !== undefined) setExtraBeads(d.extraBeads)
        if (d.rateAmount !== undefined) setRateAmount(d.rateAmount)
        if (d.totalAmount !== undefined) setTotalAmount(d.totalAmount)
        if (d.notes) setNotes(d.notes)
        if (d.stockDeductions && Array.isArray(d.stockDeductions)) {
          setStockDeductions(d.stockDeductions)
        }
        setHasDraft(true)
      }
    } catch (e) {
      console.error('Failed to load saved draft', e)
    }
    setIsInitialized(true)
  }, [])

  // Auto-save draft on every change and when switching tabs/apps
  useEffect(() => {
    if (!isInitialized) return

    const saveDraftNow = () => {
      const draftData = {
        transactionType,
        name,
        phone,
        itemName,
        grossWeight,
        netWeight,
        touchPercentage,
        stonesWeight,
        stonesPrice,
        beadsWeight,
        extraBeads,
        rateAmount,
        totalAmount,
        notes,
        stockDeductions
      }
      const hasContent = Boolean(
        name || phone || itemName || grossWeight > 0 || netWeight > 0 ||
        touchPercentage > 0 || stonesWeight > 0 || stonesPrice > 0 ||
        beadsWeight > 0 || extraBeads > 0 || rateAmount > 0 || totalAmount > 0 ||
        notes || stockDeductions.length > 0
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

    // Immediate sync when tab visibility changes or user minimizes/leaves browser
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
    transactionType,
    name,
    phone,
    itemName,
    grossWeight,
    netWeight,
    touchPercentage,
    stonesWeight,
    stonesPrice,
    beadsWeight,
    extraBeads,
    rateAmount,
    totalAmount,
    notes,
    stockDeductions
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
        // Clean phone number (remove spaces, hyphens)
        contactTel = contactTel.replace(/[\s-]/g, '')
        if (contactName && !name) setName(contactName)
        if (contactTel) setPhone(contactTel)
      }
    } catch (err) {
      console.log('Contact selection dismissed or cancelled:', err)
    }
  }

  // Autocomplete shopkeeper from database
  const handleNameChange = (val: string) => {
    setName(val)
    if (existingCustomers && existingCustomers.length > 0) {
      const match = existingCustomers.find(c => c.name?.toLowerCase() === val.trim().toLowerCase())
      if (match && match.phone && !phone) {
        setPhone(match.phone)
      }
    }
  }

  // Clear Form / Discard Draft
  const handleReset = () => {
    if (confirm('Are you sure you want to clear the form? All entered details will be reset.')) {
      localStorage.removeItem(DRAFT_KEY)
      setName('')
      setPhone('')
      setItemName('')
      setGrossWeight(0)
      setNetWeight(0)
      setTouchPercentage(0)
      setStonesWeight(0)
      setStonesPrice(0)
      setBeadsWeight(0)
      setExtraBeads(0)
      setRateAmount(0)
      setTotalAmount(0)
      setNotes('')
      setStockDeductions([])
      setHasDraft(false)
    }
  }

  const addStockDeduction = () => {
    setStockDeductions([...stockDeductions, { id: Date.now().toString(), stock_id: '', gross: 0, net: 0 }])
  }

  const removeStockDeduction = (id: string) => {
    setStockDeductions(stockDeductions.filter(d => d.id !== id))
  }

  const updateStockDeduction = (id: string, field: 'stock_id' | 'gross' | 'net', value: string | number) => {
    setStockDeductions(stockDeductions.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  // Calculate fine gold
  const fineGold = (netWeight * touchPercentage) / 100

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addWholesaleTransaction(formData)
      if (res?.error) {
        alert(res.error)
      } else if (res?.success) {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch (e) {}
        router.push(`/wholesale-receipt/${res.transactionId}`)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="transaction_type" value={transactionType} />
      <input type="hidden" name="stock_deductions" value={JSON.stringify(stockDeductions.filter(d => d.stock_id))} />
      
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
          <button type="button" onClick={() => setTransactionType('SALE')} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${transactionType === 'SALE' ? 'bg-white shadow-md text-amber-900 scale-100 sm:scale-105' : 'text-amber-700/70 hover:text-amber-900 hover:bg-white/50'}`}>Give Gold (Sale)</button>
          <button type="button" onClick={() => setTransactionType('RECEIPT')} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${transactionType === 'RECEIPT' ? 'bg-white shadow-md text-amber-900 scale-100 sm:scale-105' : 'text-amber-700/70 hover:text-amber-900 hover:bg-white/50'}`}>Receive Old Gold</button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium text-gray-900">Shopkeeper Details</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name / Person</label>
            <input 
              required 
              name="name" 
              type="text" 
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              list="wholesale-customers-list"
              placeholder="e.g. Sri Lakshmi Jewellers"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" 
            />
            {existingCustomers.length > 0 && (
              <datalist id="wholesale-customers-list">
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
              <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
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
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Gold Details</h3>
        
        {transactionType === 'SALE' && availableStock.length > 0 && (
          <div className="mb-4 bg-amber-50 p-5 rounded-xl border border-amber-100 space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-amber-900">Source from Stock (Optional)</label>
              <button type="button" onClick={addStockDeduction} className="text-xs bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-300 transition-colors cursor-pointer">
                + Add Stock Source
              </button>
            </div>
            
            {stockDeductions.length === 0 && (
              <p className="text-sm text-amber-700/70 italic">No stock selected. This will be a Custom Entry.</p>
            )}

            {stockDeductions.map((deduction) => (
              <div key={deduction.id} className="flex flex-col sm:flex-row gap-3 items-end bg-white p-3 rounded-lg border border-amber-100">
                <div className="w-full sm:flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Select Stock Block</label>
                  <select 
                    value={deduction.stock_id} 
                    onChange={e => updateStockDeduction(deduction.id, 'stock_id', e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="">-- Select --</option>
                    {availableStock.map(stock => (
                      <option key={stock.id} value={stock.id}>{stock.item_name} (Avail: {stock.net_weight}g)</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Gross (g)</label>
                  <input type="number" step="0.001" value={deduction.gross || ''} onChange={e => updateStockDeduction(deduction.id, 'gross', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="w-full sm:w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Net (g)</label>
                  <input type="number" step="0.001" value={deduction.net || ''} onChange={e => updateStockDeduction(deduction.id, 'net', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
                <button type="button" onClick={() => removeStockDeduction(deduction.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
            <input required name="item_name" type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder={transactionType === 'SALE' ? "e.g. Chain cb" : "e.g. Old Ring"} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Wt (g)</label>
            <input required name="gross_weight" type="number" step="0.001" value={grossWeight || ''} onChange={e => setGrossWeight(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Net Wt (g)</label>
            <input required name="net_weight" type="number" step="0.001" value={netWeight || ''} onChange={e => setNetWeight(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Touch (Tnch) %</label>
            <input required name="touch_percentage" type="number" step="0.01" value={touchPercentage || ''} onChange={e => setTouchPercentage(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div className="md:col-span-2 lg:col-span-4 mt-2">
            <h4 className="text-sm font-medium text-gray-900 border-b pb-2 mb-3">Stones & Beads (Optional)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stones Wt (g)</label>
                <input name="stones_weight" type="number" step="0.001" value={stonesWeight || ''} onChange={e => setStonesWeight(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stones Price (₹)</label>
                <input name="stones_price" type="number" step="0.01" value={stonesPrice || ''} onChange={e => setStonesPrice(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Beads Wt (g)</label>
                <input name="beads_weight" type="number" step="0.001" value={beadsWeight || ''} onChange={e => setBeadsWeight(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Extra Beads</label>
                <input name="extra_beads" type="number" step="0.001" value={extraBeads || ''} onChange={e => setExtraBeads(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-4 bg-amber-50 rounded-xl p-3 border border-amber-100 flex flex-col justify-center items-center mt-2">
             <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Fine Gold Calculation</span>
             <span className="text-lg font-bold text-amber-900">{fineGold.toFixed(3)}g</span>
          </div>
          <div className="md:col-span-2 lg:col-span-4 mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Item Image (Optional)</label>
            <input name="image" type="file" accept="image/*" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Money Equivalents (Optional)</h3>
        <p className="text-sm text-gray-500 mb-4">If part of this transaction involves cash, you can enter it here.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate / gram (₹)</label>
            <input name="rate_amount" type="number" step="0.01" value={rateAmount || ''} onChange={e => setRateAmount(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
            <input name="total_amount" type="number" step="0.01" value={totalAmount || ''} onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors" />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Additional Notes</h3>
        <textarea name="notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any specific details, conditions, or notes about this order..." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"></textarea>
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
          {isPending ? 'Processing...' : `Save ${transactionType === 'SALE' ? 'Sale' : 'Receipt'}`}
        </button>
      </div>
    </form>
  )
}

