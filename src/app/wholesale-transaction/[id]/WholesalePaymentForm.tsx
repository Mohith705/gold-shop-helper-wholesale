'use client'

import { addWholesalePayment } from '@/app/actions'
import { useTransition } from 'react'
import { Loader2, PlusCircle } from 'lucide-react'

export function WholesalePaymentForm({ transactionId }: { transactionId: string }) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addWholesalePayment(formData)
      if (res?.error) {
        alert(res.error)
      } else {
        const form = document.getElementById('wholesale-payment-form') as HTMLFormElement
        if (form) form.reset()
      }
    })
  }

  return (
    <form id="wholesale-payment-form" action={handleSubmit} className="space-y-3">
      <input type="hidden" name="transaction_id" value={transactionId} />

      <div>
        <label className="block text-xs font-medium text-amber-900/80 mb-1">Payment Amount (₹)</label>
        <input 
          required 
          name="amount_paid" 
          type="number" 
          step="0.01" 
          placeholder="e.g. 5000"
          className="w-full px-3 py-2 text-sm border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" 
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-amber-900/80 mb-1">Payment Method</label>
        <select 
          name="payment_method" 
          className="w-full px-3 py-2 text-sm border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
        >
          <option value="Cash">Cash</option>
          <option value="UPI">UPI / GPay / PhonePe</option>
          <option value="Bank Transfer">Bank Transfer / NEFT</option>
          <option value="Card">Card</option>
          <option value="Old Gold">Old Gold Settlement</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-amber-900/80 mb-1">Sub-Bill Notes (Optional)</label>
        <input 
          name="notes" 
          type="text" 
          placeholder="e.g. 2nd instalment, GPay ref #1234"
          className="w-full px-3 py-2 text-sm border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" 
        />
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm cursor-pointer disabled:opacity-50"
      >
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
        <span>{isPending ? 'Recording...' : 'Add Sub-Bill / Payment'}</span>
      </button>
    </form>
  )
}
