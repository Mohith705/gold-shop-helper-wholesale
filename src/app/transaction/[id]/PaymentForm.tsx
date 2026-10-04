'use client'

import { addPayment } from '@/app/actions'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

export function PaymentForm({ transactionId }: { transactionId: string }) {
  const [isPending, startTransition] = useTransition()
  
  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addPayment(formData)
      if (res?.error) {
        alert(res.error)
      } else {
        // Reset form
        const form = document.getElementById('payment-form') as HTMLFormElement
        if (form) form.reset()
      }
    })
  }

  return (
    <form id="payment-form" action={handleSubmit} className="space-y-3">
      <input type="hidden" name="transaction_id" value={transactionId} />
      
      <div>
        <label className="block text-xs font-medium text-amber-900/70 mb-1">Amount (₹)</label>
        <input 
          required 
          name="amount_paid" 
          type="number" 
          step="0.01" 
          className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" 
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-amber-900/70 mb-1">Method</label>
        <select 
          name="payment_method" 
          className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
        >
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
      >
        {isPending ? <Loader2 className="animate-spin" size={16} /> : 'Record Payment'}
      </button>
    </form>
  )
}
