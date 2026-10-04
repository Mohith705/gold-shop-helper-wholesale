'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteWholesaleTransaction } from '@/app/actions'
import { useRouter } from 'next/navigation'

export function DeleteWholesaleButton({ transactionId }: { transactionId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    const password = window.prompt("Enter admin password to delete this transaction:")
    
    if (password === null) return // user cancelled
    
    if (password !== 'delete123') {
      alert("Incorrect password!")
      return
    }

    if (window.confirm('Are you SURE you want to delete this wholesale transaction? This will revert any stock deductions made by this entry. This cannot be undone.')) {
      setIsDeleting(true)
      const res = await deleteWholesaleTransaction(transactionId)
      if (res.error) {
        alert(res.error)
        setIsDeleting(false)
      } else {
        router.push('/')
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
    >
      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
      <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Delete Transaction'}</span>
    </button>
  )
}
