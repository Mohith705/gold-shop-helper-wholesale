'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addWholesaleTransaction } from '../actions'
import { Calculator, Loader2, Contact, RotateCcw, CheckCircle2, Coins, ArrowRight, Scale, IndianRupee } from 'lucide-react'
import { StockItem } from '@/types'

const DRAFT_KEY = 'wholesale_order_draft_v2'

export function AddWholesaleForm({ 
  availableStock = [],
  existingCustomers = []
}: { 
  availableStock?: StockItem[]
  existingCustomers?: { id: string; name: string; phone?: string | null; address?: string | null }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [isContactPickerSupported, setIsContactPickerSupported] = useState(false)

  // Customer Details
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')

  // Order Details
  const [itemName, setItemName] = useState<string>('')
  const [stamp, setStamp] = useState<string>('')
  const [grossWeight, setGrossWeight] = useState<number>(0)
  const [lessWeight, setLessWeight] = useState<number>(0)
  const [netWeight, setNetWeight] = useState<number>(0)
  const [touchPercentage, setTouchPercentage] = useState<number>(0)
  const [rateAmount, setRateAmount] = useState<number>(0)

  // Old Gold Details
  const [oldGoldWeight, setOldGoldWeight] = useState<number>(0)

  // Payment Details
  const [cashPaid, setCashPaid] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash')

  // Additional fields
  const [notes, setNotes] = useState<string>('')

  // Detect Contact Picker API support (Chrome on Android, etc.)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      setIsContactPickerSupported(true)
    }
  }, [])

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const d = JSON.parse(saved)
        if (d.name) setName(d.name)
        if (d.phone) setPhone(d.phone)
        if (d.itemName) setItemName(d.itemName)
        if (d.stamp !== undefined) setStamp(d.stamp)
        if (d.grossWeight !== undefined) setGrossWeight(d.grossWeight)
        if (d.lessWeight !== undefined) setLessWeight(d.lessWeight)
        if (d.netWeight !== undefined) setNetWeight(d.netWeight)
        if (d.touchPercentage !== undefined) setTouchPercentage(d.touchPercentage)
        if (d.rateAmount !== undefined) setRateAmount(d.rateAmount)
        if (d.oldGoldWeight !== undefined) setOldGoldWeight(d.oldGoldWeight)
        if (d.cashPaid !== undefined) setCashPaid(d.cashPaid)
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod)
        if (d.notes) setNotes(d.notes)
        setHasDraft(true)
      }
    } catch (e) {
      console.error('Failed to load saved draft', e)
    }
    setIsInitialized(true)
  }, [])

  // Auto-save draft on change and when switching tabs/apps
  useEffect(() => {
    if (!isInitialized) return

    const saveDraftNow = () => {
      const draftData = {
        name,
        phone,
        itemName,
        stamp,
        grossWeight,
        lessWeight,
        netWeight,
        touchPercentage,
        rateAmount,
        oldGoldWeight,
        cashPaid,
        paymentMethod,
        notes
      }
      const hasContent = Boolean(
        name || phone || itemName || stamp || grossWeight > 0 || lessWeight > 0 ||
        netWeight > 0 || touchPercentage > 0 || rateAmount > 0 || oldGoldWeight > 0 ||
        cashPaid > 0 || notes
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
    itemName,
    stamp,
    grossWeight,
    lessWeight,
    netWeight,
    touchPercentage,
    rateAmount,
    oldGoldWeight,
    cashPaid,
    paymentMethod,
    notes
  ])

  // Auto-calculate Net Weight = Gross Wt - Less Wt
  useEffect(() => {
    if (!isInitialized) return
    if (grossWeight > 0 || lessWeight > 0) {
      const calculated = parseFloat(Math.max(0, grossWeight - lessWeight).toFixed(3))
      setNetWeight(calculated)
    } else if (grossWeight === 0 && lessWeight === 0) {
      setNetWeight(0)
    }
  }, [isInitialized, grossWeight, lessWeight])

  // Calculation formulas requested by user:
  // 1. net wt * touch (fine gold)
  // 2. fine gold - old gold weight (payable gold)
  // 3. payable gold * gold rate = Total amount
  const fineGold = parseFloat(((netWeight * touchPercentage) / 100).toFixed(3))
  const payableGold = parseFloat(Math.max(0, fineGold - (oldGoldWeight || 0)).toFixed(3))
  const totalAmount = parseFloat((payableGold * (rateAmount || 0)).toFixed(2))

  // Balance calculations:
  // Balance amount (money) = totalAmount - cashPaid
  // Balance gold = payableGold - (gold equivalent of cash paid) OR (fineGold - oldGoldWeight)
  const cashBalanceDue = parseFloat(Math.max(0, totalAmount - (cashPaid || 0)).toFixed(2))
  const goldEquivalentFromCash = (rateAmount > 0 && cashPaid > 0) ? parseFloat((cashPaid / rateAmount).toFixed(3)) : 0
  const remainingGoldBalance = parseFloat(Math.max(0, payableGold - goldEquivalentFromCash).toFixed(3))
  const pureGoldDiff = parseFloat((fineGold - (oldGoldWeight || 0)).toFixed(3))

  // Native Web Contact Picker API Handler
  const handlePickContact = async () => {
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      alert('Contact Picker is supported on modern mobile browsers. On other devices, your draft is auto-saved so you can safely switch to Contacts.')
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
      setStamp('')
      setGrossWeight(0)
      setLessWeight(0)
      setNetWeight(0)
      setTouchPercentage(0)
      setRateAmount(0)
      setOldGoldWeight(0)
      setCashPaid(0)
      setPaymentMethod('Cash')
      setNotes('')
      setHasDraft(false)
    }
  }

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
      {/* Hidden Fields */}
      <input type="hidden" name="transaction_type" value="RECEIPT" />
      <input type="hidden" name="net_weight" value={netWeight} />
      <input type="hidden" name="fine_gold" value={fineGold} />
      <input type="hidden" name="total_amount" value={totalAmount} />

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

      {/* Section 1: Customer Details */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Shopkeeper Details</h3>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm" 
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm" 
            />
          </div>
        </div>
      </section>

      {/* Section 2: Order Details */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
          <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Gold Item Details
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description / Item Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input 
              name="item_name" 
              type="text" 
              value={itemName} 
              onChange={e => setItemName(e.target.value)} 
              placeholder="e.g. Chain cb, Bangles, Tops" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stamp <span className="text-amber-700 font-semibold text-xs">(Owner enters)</span>
            </label>
            <input 
              name="stamp" 
              type="number" 
              step="any"
              value={stamp} 
              onChange={e => setStamp(e.target.value)} 
              placeholder="e.g. 916, 750, 22" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm font-semibold text-gray-900" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Wt (g)</label>
            <input 
              name="gross_weight" 
              type="number" 
              step="0.001" 
              value={grossWeight || ''} 
              onChange={e => setGrossWeight(parseFloat(e.target.value) || 0)} 
              placeholder="0.000" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Less Wt (g) <span className="text-amber-700 font-semibold text-xs">(Deductions)</span>
            </label>
            <input 
              name="less_weight" 
              type="number" 
              step="0.001" 
              value={lessWeight || ''} 
              onChange={e => setLessWeight(parseFloat(e.target.value) || 0)} 
              placeholder="0.000" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm" 
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Net Wt (g)</label>
              <span className="text-[11px] text-amber-700 font-medium">G.wt - Less wt</span>
            </div>
            <input 
              type="number" 
              step="0.001" 
              value={netWeight || ''} 
              onChange={e => setNetWeight(parseFloat(e.target.value) || 0)} 
              placeholder="0.000" 
              className="w-full px-4 py-2.5 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors font-bold text-gray-900 bg-amber-50/40 shadow-sm" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Touch % (Tnch)</label>
            <input 
              name="touch_percentage" 
              type="number" 
              step="0.01" 
              value={touchPercentage || ''} 
              onChange={e => setTouchPercentage(parseFloat(e.target.value) || 0)} 
              placeholder="e.g. 91.6" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm" 
            />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <div className="bg-amber-100/60 rounded-xl p-3 border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Fine Gold (Step 1)</span>
                <span className="text-xs text-amber-700">Net Wt &times; Touch</span>
              </div>
              <span className="text-xl font-black text-amber-950">{fineGold.toFixed(3)}g</span>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gold Rate / g (₹)</label>
            <input 
              name="rate_amount" 
              type="number" 
              step="0.01" 
              value={rateAmount || ''} 
              onChange={e => setRateAmount(parseFloat(e.target.value) || 0)} 
              placeholder="e.g. 8500" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm font-semibold" 
            />
          </div>
        </div>
      </section>

      {/* Section 3: Old Gold Details */}
      <section className="space-y-4 bg-amber-50/50 p-5 rounded-2xl border border-amber-200/60 shadow-sm">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
          <div className="flex items-center gap-2">
            <Coins className="text-amber-700" size={18} />
            <h3 className="text-base font-semibold text-amber-950">Old Gold Details (Optional)</h3>
          </div>
          <span className="text-xs text-amber-800 bg-amber-200/50 px-2 py-0.5 rounded-md font-medium">
            Exchange Gold
          </span>
        </div>
        <p className="text-xs text-amber-800/80">
          Enter only the old gold weight if the customer is trading in gold. This will be subtracted from the Fine Gold before multiplying with the gold rate.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Gold Weight (g)</label>
            <input 
              name="old_gold_weight" 
              type="number" 
              step="0.001" 
              value={oldGoldWeight || ''} 
              onChange={e => setOldGoldWeight(parseFloat(e.target.value) || 0)} 
              placeholder="0.000" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm font-semibold text-gray-900" 
            />
          </div>

          <div className="sm:col-span-1 md:col-span-2 bg-white p-3.5 rounded-xl border border-amber-200/70">
            <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
              <span>Payable Gold Wt (Step 2):</span>
              <span className="font-semibold text-gray-900">
                {fineGold.toFixed(3)}g - {(oldGoldWeight || 0).toFixed(3)}g
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-amber-900">
              <span>Net Gold to Pay:</span>
              <span className="text-base text-amber-700">{payableGold.toFixed(3)}g</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Calculation Summary */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex justify-between items-center border-b border-amber-400/40 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
            <Calculator size={14} /> Total Amount Calculation
          </span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white font-medium">Step 3 Formula</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="bg-white/10 p-2.5 rounded-xl">
            <span className="text-amber-100 block text-xs">1. Item Fine Gold</span>
            <span className="font-bold text-base">{fineGold.toFixed(3)}g</span>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl">
            <span className="text-amber-100 block text-xs">2. Less Old Gold</span>
            <span className="font-bold text-base">- {(oldGoldWeight || 0).toFixed(3)}g = {payableGold.toFixed(3)}g</span>
          </div>
          <div className="bg-white/20 p-2.5 rounded-xl border border-white/30">
            <span className="text-amber-100 block text-xs">3. Total Amount (&times; Rate)</span>
            <span className="font-black text-lg">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

      {/* Section 5: Money / Cash Given & Balance Details */}
      <section className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IndianRupee className="text-amber-600" size={20} />
            Money Given &amp; Balance Details
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cash / Money Given (₹)</label>
            <input 
              name="cash_paid" 
              type="number" 
              step="0.01" 
              value={cashPaid || ''} 
              onChange={e => setCashPaid(parseFloat(e.target.value) || 0)} 
              placeholder="e.g. 10000" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm font-semibold text-gray-900" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select 
              name="payment_method" 
              value={paymentMethod} 
              onChange={e => setPaymentMethod(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white shadow-sm"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>

        {/* Balance Card showing both Gold weight balance and Money balance */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Scale size={15} className="text-slate-500" />
              Order Balance (Visible to Owner)
            </span>
            <span className="text-xs font-semibold text-slate-500">2 Types of Balance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Balance Type 1: Gold Weight Balance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Type 1: Balance in Gold Wt</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-amber-700">
                  {pureGoldDiff > 0 ? `${pureGoldDiff}g` : '0.000g'}
                </span>
                <span className="text-[11px] text-gray-500">Fine Gold - Old Gold</span>
              </div>
              {cashPaid > 0 && rateAmount > 0 && (
                <div className="text-[11px] text-emerald-700 pt-1 border-t border-slate-100 flex justify-between">
                  <span>After Cash Paid:</span>
                  <span className="font-semibold">{remainingGoldBalance}g remaining</span>
                </div>
              )}
            </div>

            {/* Balance Type 2: Money Balance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Type 2: Balance in Cash (₹)</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-lg font-bold ${cashBalanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ₹{cashBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-gray-500">Total - Cash Paid</span>
              </div>
              <div className="text-[11px] text-gray-500 pt-1 border-t border-slate-100 flex justify-between">
                <span>Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                <span className="text-emerald-600 font-semibold">Paid: ₹{(cashPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Details */}
      <section className="space-y-4 border-t pt-6">
        <h3 className="text-base font-semibold text-gray-900">Additional Notes / Remarks</h3>
        <textarea 
          name="notes" 
          rows={3} 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          placeholder="Any specific instructions, delivery dates, or terms for this wholesale voucher..." 
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none shadow-sm"
        />
      </section>

      {/* Form Submission */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {hasDraft && (
          <button
            type="button"
            onClick={handleReset}
            className="sm:w-1/3 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw size={16} />
            Reset Form
          </button>
        )}
        <button 
          type="submit" 
          disabled={isPending}
          className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
        >
          {isPending ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
          {isPending ? 'Generating Voucher...' : 'Save Wholesale Order & View Voucher'}
        </button>
      </div>
    </form>
  )
}
