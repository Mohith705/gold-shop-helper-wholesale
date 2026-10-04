import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { EditEntryForm } from './EditEntryForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  if (!id) return notFound()

  const { data: transaction, error } = await supabase
    .from('gold_transactions')
    .select('*, customers(*)')
    .eq('id', id)
    .single()

  if (error || !transaction) {
    return notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Transaction</h1>
            <p className="text-sm text-gray-500 mt-1">Update customer or item details</p>
          </div>
          <Link href={`/transaction/${id}`} className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft size={16} /> Cancel
          </Link>
        </header>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <EditEntryForm transaction={transaction} />
        </div>
      </div>
    </main>
  )
}
