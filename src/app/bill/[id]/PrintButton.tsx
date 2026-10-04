'use client'

import { Printer } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PrintButtonProps {
  customerName: string;
  itemName: string;
  date: string;
}

export function PrintButton({ customerName, itemName, date }: PrintButtonProps) {
  const [originalTitle, setOriginalTitle] = useState('')

  useEffect(() => {
    setOriginalTitle(document.title)
  }, [])

  const handlePrint = () => {
    // Sanitize filename components
    const safeCustomer = customerName.replace(/[^a-zA-Z0-9]/g, '_')
    const safeItem = itemName.replace(/[^a-zA-Z0-9]/g, '_')
    const safeDate = date.replace(/\//g, '-')
    
    // Changing document title changes the default save filename for PDFs
    document.title = `Receipt_${safeCustomer}_${safeItem}_${safeDate}`
    window.print()
    
    // Restore original title
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  return (
    <button 
      onClick={handlePrint}
      className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
    >
      <Printer size={18} /> Save as PDF / Print
    </button>
  )
}
