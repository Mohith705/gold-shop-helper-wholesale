'use client'

import { addWholesalePayment } from '@/app/actions'
import { useState, useTransition } from 'react'
import { Loader2, PlusCircle, Coins, IndianRupee } from 'lucide-react'

export function WholesalePaymentForm({ 
  transactionId,
  defaultRate = 0,
  remainingGold = 0,
  remainingCash = 0
}: { 
  transactionId: string
  defaultRate?: number
  remainingGold?: number
  remainingCash?: number
}) {
  const [isPending, startTransition] = useTransition()
  const [paymentMode, setPaymentMode] = useState<'MONEY' | 'GOLD'>('GOLD')
  const [method, setMethod] = useState<string>('Old Gold Settlement')
  
  // Money fields
  const [amountPaid, setAmountPaid] = useState<string>('')
  
  // Gold fields
  const [goldWeight, setGoldWeight] = useState<string>('')
  const [goldRate, setGoldRate] = useState<string>(defaultRate > 0 ? String(defaultRate) : '')
  
  // Notes
  const [notes, setNotes] = useState<string>('')

  // Calculate live equivalent
  const parsedWeight = parseFloat(goldWeight) || 0
  const parsedRate = parseFloat(goldRate) || defaultRate || 0
  const goldMoneyEquivalent = parsedWeight * parsedRate

  const handleModeChange = (mode: 'MONEY' | 'GOLD') => {
    setPaymentMode(mode)
    if (mode === 'GOLD') {
      setMethod('Old Gold Settlement')
    } else {
      setMethod('Cash')
    }
  }

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod)
    if (newMethod.toLowerCase().includes('gold')) {
      setPaymentMode('GOLD')
    }
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addWholesalePayment(formData)
      if (res?.error) {
        alert(res.error)
      } else {
        setAmountPaid('')
        setGoldWeight('')
        setNotes('')
        const form = document.getElementById('wholesale-payment-form') as HTMLFormElement
        if (form) form.reset()
      }
    })
  }

  return (
    <form id="wholesale-payment-form" action={handleSubmit} className="space-y-3.5">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <input type="hidden" name="payment_type" value={paymentMode} />

      {/* Mode Selector Tabs (Mobile & Tablet Optimized) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-amber-100/60 rounded-xl border border-amber-200">
        <button
          type="button"
          onClick={() => handleModeChange('GOLD')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            paymentMode === 'GOLD'
              ? 'bg-white text-amber-950 shadow-sm'
              : 'text-amber-800 hover:text-amber-950'
          }`}
        >
          <Coins size={14} className="text-amber-600 shrink-0" />
          <span>Pay in Gold (g)</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('MONEY')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            paymentMode === 'MONEY'
              ? 'bg-white text-amber-950 shadow-sm'
              : 'text-amber-800 hover:text-amber-950'
          }`}
        >
          <IndianRupee size={14} className="text-amber-600 shrink-0" />
          <span>Pay in Cash / ₹</span>
        </button>
      </div>

      {paymentMode === 'GOLD' ? (
        /* Gold Settlement Form */
        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-amber-950">
              Gold Weight Given (g) <span className="text-red-600">*</span>
            </label>
            {remainingGold > 0 && (
              <button
                type="button"
                onClick={() => setGoldWeight(String(remainingGold.toFixed(3)))}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold cursor-pointer underline"
              >
                Due: {remainingGold.toFixed(3)}g
              </button>
            )}
          </div>
          <input 
            required 
            name="gold_weight" 
            type="number" 
            step="any"
            value={goldWeight}
            onChange={e => setGoldWeight(e.target.value)}
            placeholder="e.g. 3.372"
            className="w-full px-3 py-2 text-base sm:text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50/20 font-bold text-gray-900" 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Method / Type</label>
              <select 
                name="payment_method" 
                value={method}
                onChange={e => handleMethodChange(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Old Gold Settlement">Old Gold Settlement</option>
                <option value="Pure Gold Received">Pure Gold Received</option>
                <option value="Gold Exchange">Gold Exchange</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gold Rate / g (₹)</label>
              <input 
                name="gold_rate" 
                type="number" 
                step="any"
                value={goldRate}
                onChange={e => setGoldRate(e.target.value)}
                placeholder="e.g. 8500"
                className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white" 
              />
            </div>
          </div>

          {/* Money equivalent live preview */}
          {parsedWeight > 0 && parsedRate > 0 && (
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs flex justify-between items-center text-amber-900">
              <span className="font-medium">Money Value Credit:</span>
              <span className="font-bold text-sm">
                ₹{goldMoneyEquivalent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <input type="hidden" name="amount_paid" value={goldMoneyEquivalent > 0 ? goldMoneyEquivalent.toFixed(2) : ''} />
        </div>
      ) : (
        /* Cash / Money Form */
        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-amber-950">
              Payment Amount (₹) <span className="text-red-600">*</span>
            </label>
            {remainingCash > 0 && (
              <button
                type="button"
                onClick={() => setAmountPaid(String(remainingCash.toFixed(2)))}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold cursor-pointer underline"
              >
                Due: ₹{remainingCash.toLocaleString('en-IN')}
              </button>
            )}
          </div>
          <input 
            required 
            name="amount_paid" 
            type="number" 
            step="any" 
            value={amountPaid}
            onChange={e => setAmountPaid(e.target.value)}
            placeholder="e.g. 5000"
            className="w-full px-3 py-2 text-base sm:text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50/20 font-bold text-gray-900" 
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
            <select 
              name="payment_method" 
              value={method}
              onChange={e => handleMethodChange(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="Card">Card</option>
              <option value="Old Gold Settlement">Old Gold Settlement (Pay in Gold)</option>
            </select>
          </div>
        </div>
      )}

      {/* Common Notes Field */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Sub-Bill Notes / Remarks</label>
        <input 
          name="notes" 
          type="text" 
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={paymentMode === 'GOLD' ? 'e.g. 22k old chain piece, test passed' : 'e.g. 2nd instalment, GPay ref #1234'}
          className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white shadow-sm" 
        />
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-[0.99]"
      >
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
        <span>{isPending ? 'Saving Sub-Bill...' : `Add Sub-Bill (${paymentMode === 'GOLD' ? 'Gold' : 'Cash'})`}</span>
      </button>
    </form>
  )
}
