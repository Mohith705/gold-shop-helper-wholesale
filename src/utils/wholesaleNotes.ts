import { WholesalePayment } from '@/types'

export interface WholesaleMetadata {
  stamp?: string | number | null
  less_weight?: number
  old_gold_weight?: number
  cash_paid?: number
  payments?: WholesalePayment[]
  user_notes?: string
}

export function parseWholesaleNotes(notesRaw?: string | null): WholesaleMetadata {
  if (!notesRaw || typeof notesRaw !== 'string') {
    return {
      stamp: '',
      less_weight: 0,
      old_gold_weight: 0,
      cash_paid: 0,
      payments: [],
      user_notes: ''
    }
  }

  const trimmed = notesRaw.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object') {
        const payments: WholesalePayment[] = Array.isArray(parsed.payments)
          ? parsed.payments.map((p: any) => ({
              id: p.id || Date.now().toString(),
              payment_type: p.payment_type || (Number(p.gold_weight) > 0 || String(p.payment_method || '').toLowerCase().includes('gold') ? 'GOLD' : 'MONEY'),
              amount_paid: Number(p.amount_paid) || 0,
              gold_weight: Number(p.gold_weight) || 0,
              gold_rate: Number(p.gold_rate) || 0,
              payment_method: p.payment_method || 'Cash',
              payment_date: p.payment_date || new Date().toISOString(),
              notes: p.notes || ''
            }))
          : []

        return {
          stamp: parsed.stamp !== undefined && parsed.stamp !== null ? String(parsed.stamp) : '',
          less_weight: Number(parsed.less_weight) || 0,
          old_gold_weight: Number(parsed.old_gold_weight) || 0,
          cash_paid: Number(parsed.cash_paid) || 0,
          payments,
          user_notes: parsed.user_notes || ''
        }
      }
    } catch (e) {
      // Fallback to plain text
    }
  }

  return {
    stamp: '',
    less_weight: 0,
    old_gold_weight: 0,
    cash_paid: 0,
    payments: [],
    user_notes: notesRaw
  }
}

export function serializeWholesaleNotes(data: WholesaleMetadata): string {
  return JSON.stringify({
    stamp: data.stamp ?? '',
    less_weight: Number(data.less_weight) || 0,
    old_gold_weight: Number(data.old_gold_weight) || 0,
    cash_paid: Number(data.cash_paid) || 0,
    payments: Array.isArray(data.payments) ? data.payments : [],
    user_notes: data.user_notes || ''
  })
}
