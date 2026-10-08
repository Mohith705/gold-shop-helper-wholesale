import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Printer } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PrintButton from '@/app/wholesale-receipt/[id]/PrintButton'
import { numberToWords } from '@/utils/numberToWords'

export default async function DeliveryChallanPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  if (!id) return notFound()

  const { data: challan, error } = await supabase
    .from('delivery_challans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !challan) {
    return notFound()
  }

  const amountInWords = numberToWords(Math.round(challan.total_amount))

  let whatsappText = `*DELIVERY CHALLAN*\n\n`
  whatsappText += `*VYSHNAVI JEWELLERS*\n`
  whatsappText += `NELLORE - 524 001\n`
  whatsappText += `Cell : 9849643134\n\n`
  
  whatsappText += `*To:* ${challan.customer_name}\n`
  if (challan.customer_address) whatsappText += `*Address:* ${challan.customer_address}\n`
  whatsappText += `*D.C. No:* ${challan.dc_number}\n`
  whatsappText += `*Date:* ${new Date(challan.dc_date).toLocaleDateString('en-IN')}\n\n`
  
  whatsappText += `*Items:*\n`
  challan.items?.forEach((item: any, i: number) => {
    whatsappText += `${i + 1}. ${item.desc} (Qty: ${item.qty} ${item.uom} @ ₹${item.rate})\n`
  })
  
  whatsappText += `\n*Taxable Value:* ₹${(Number(challan.total_amount) - Number(challan.cgst_amount || 0) - Number(challan.sgst_amount || 0) - Number(challan.igst_amount || 0)).toFixed(2)}\n`
  if (challan.cgst_amount) whatsappText += `*CGST:* ₹${Number(challan.cgst_amount).toFixed(2)}\n`
  if (challan.sgst_amount) whatsappText += `*SGST:* ₹${Number(challan.sgst_amount).toFixed(2)}\n`
  if (challan.igst_amount) whatsappText += `*IGST:* ₹${Number(challan.igst_amount).toFixed(2)}\n`
  whatsappText += `*Grand Total:* ₹${Number(challan.total_amount).toFixed(2)}\n`
  
  if (Number(challan.amount_paid) > 0) {
    whatsappText += `*Amount Paid:* ₹${Number(challan.amount_paid).toFixed(2)}\n`
    whatsappText += `*Balance Due:* ₹${Number(challan.balance_amount).toFixed(2)}`
  }
  
  const encodedWhatsappText = encodeURIComponent(whatsappText.trim())

  return (
    <main className="min-h-screen bg-gray-100 text-slate-900 p-4 md:p-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex justify-between items-center print:hidden">
          <Link href="/challans" className="text-amber-700/70 hover:text-amber-900 inline-flex items-center gap-2 text-sm font-semibold transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Challans
          </Link>
          <div className="flex gap-3">
            <a 
              href={`https://wa.me/?text=${encodedWhatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-md"
            >
              WhatsApp
            </a>
            <PrintButton />
          </div>
        </header>

        <div className="bg-white p-4 md:p-12 shadow-xl print:shadow-none print:p-0 mx-auto w-full max-w-[210mm]">
          <div className="mx-auto text-xs sm:text-sm print:text-sm">
            {/* Header */}
          <div className="border border-blue-800 p-3 sm:p-4 relative mb-4">
            <div className="flex justify-between items-start text-blue-900 font-semibold text-[10px] sm:text-sm mb-4">
              <div>GSTIN : 37ANKPG3859N1ZB</div>
              <div className="text-[10px] sm:text-xs">Original / Duplicate / Triplicate</div>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-sm sm:text-xl font-bold tracking-widest text-blue-900 mb-2 border-b-2 border-blue-900 inline-block px-2 sm:px-4">DELIVERY CHALLAN</h2>
              <h1 className="text-xl sm:text-4xl font-black text-blue-900 tracking-wider mb-2">VYSHNAVI JEWELLERS</h1>
              <p className="text-blue-900 text-[10px] sm:text-sm font-medium">D.No. 13/48, NSC Complex, Shop No. 10, Mandapala Street, NELLORE - 524 001</p>
              <div className="flex justify-center gap-4 sm:gap-8 mt-1 text-blue-900 text-[10px] sm:text-sm font-medium">
                <span>Ph. : 0861-2313134</span>
                <span>Cell : 9849643134</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 border-t-2 border-blue-800 -mx-3 -mb-3 sm:-mx-4 sm:-mb-4">
              {/* Left */}
              <div className="border-b-2 sm:border-b-0 sm:border-r-2 print:border-b-0 print:border-r-2 border-blue-800 p-3 sm:p-4 space-y-1 sm:space-y-2">
                <div className="grid grid-cols-[60px_10px_1fr] sm:grid-cols-[80px_10px_1fr]">
                  <span className="font-semibold text-blue-900">Name</span>
                  <span>:</span>
                  <span className="font-bold">{challan.customer_name}</span>
                </div>
                <div className="grid grid-cols-[60px_10px_1fr] sm:grid-cols-[80px_10px_1fr]">
                  <span className="font-semibold text-blue-900">Address</span>
                  <span>:</span>
                  <span>{challan.customer_address}</span>
                </div>
                <div className="grid grid-cols-[60px_10px_1fr] sm:grid-cols-[80px_10px_1fr]">
                  <span className="font-semibold text-blue-900">GSTIN</span>
                  <span>:</span>
                  <span>{challan.customer_gstin}</span>
                </div>
                <div className="grid grid-cols-[60px_10px_1fr] sm:grid-cols-[80px_10px_1fr]">
                  <span className="font-semibold text-blue-900">State</span>
                  <span>:</span>
                  <span>{challan.customer_state}</span>
                </div>
              </div>

              {/* Right */}
              <div className="p-3 sm:p-4 space-y-1 sm:space-y-2">
                <div className="grid grid-cols-[100px_10px_1fr] sm:grid-cols-[140px_10px_1fr]">
                  <span className="font-semibold text-blue-900">D.C. No.</span>
                  <span>:</span>
                  <span className="font-bold">{challan.dc_number}</span>
                </div>
                <div className="grid grid-cols-[100px_10px_1fr] sm:grid-cols-[140px_10px_1fr]">
                  <span className="font-semibold text-blue-900">D.C. Date</span>
                  <span>:</span>
                  <span className="font-bold">{new Date(challan.dc_date).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="grid grid-cols-[100px_10px_1fr] sm:grid-cols-[140px_10px_1fr]">
                  <span className="font-semibold text-blue-900 text-[10px] sm:text-sm">Transport Mode</span>
                  <span>:</span>
                  <span>{challan.transport_mode}</span>
                </div>
                <div className="grid grid-cols-[100px_10px_1fr] sm:grid-cols-[140px_10px_1fr]">
                  <span className="font-semibold text-blue-900 text-[10px] sm:text-sm">Vehicle No.</span>
                  <span>:</span>
                  <span>{challan.vehicle_number}</span>
                </div>
                <div className="grid grid-cols-[100px_10px_1fr] sm:grid-cols-[140px_10px_1fr]">
                  <span className="font-semibold text-blue-900 text-[10px] sm:text-sm">Place of Supply</span>
                  <span>:</span>
                  <span>{challan.place_of_supply}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-blue-800">
            <table className="w-full min-w-[600px] sm:min-w-full text-center text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-blue-800 text-blue-900 font-semibold bg-blue-50/50">
                  <th className="p-1 sm:p-2 border-r border-blue-800 text-left w-1/3">Description of Goods</th>
                  <th className="p-1 sm:p-2 border-r border-blue-800">HSN Code</th>
                  <th className="p-1 sm:p-2 border-r border-blue-800">UOM</th>
                  <th className="p-1 sm:p-2 border-r border-blue-800">QTY.</th>
                  <th className="p-1 sm:p-2 border-r border-blue-800">Rate/Unit</th>
                  <th className="p-1 sm:p-2">Taxable Value</th>
                </tr>
              </thead>
              <tbody>
                {/* Min 10 rows for padding to look like actual receipt */}
                {Array.from({ length: Math.max(10, challan.items?.length || 0) }).map((_, i) => {
                  const item = challan.items?.[i]
                  return (
                    <tr key={i} className="border-b border-blue-800/30 h-8">
                      <td className="px-2 border-r border-blue-800 text-left font-medium">{item?.desc || ''}</td>
                      <td className="px-2 border-r border-blue-800">{item?.hsn || ''}</td>
                      <td className="px-2 border-r border-blue-800">{item?.uom || ''}</td>
                      <td className="px-2 border-r border-blue-800">{item?.qty || ''}</td>
                      <td className="px-2 border-r border-blue-800">{item?.rate ? Number(item.rate).toFixed(2) : ''}</td>
                      <td className="px-2 text-right">{item?.taxable ? Number(item.taxable).toFixed(2) : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Bottom Section inside table */}
            <div className="flex border-t border-blue-800">
              <div className="w-2/3 border-r border-blue-800 p-3 flex flex-col justify-between">
                <div>
                  <span className="text-blue-900 font-semibold block mb-1">Total Delivery Challan Amount in Words :</span>
                  <span className="font-bold text-sm uppercase">{amountInWords} Rupees Only</span>
                </div>
                
                <div className="mt-20">
                  <span className="text-blue-900 font-semibold text-sm">Customer Signature</span>
                </div>
              </div>
              <div className="w-1/3">
                <div className="flex justify-between items-center p-1 sm:p-2 border-b border-blue-800 text-[10px] sm:text-sm gap-2">
                  <span className="text-blue-900 font-semibold whitespace-nowrap">CGST (1.5%)</span>
                  <span className="text-right">{challan.cgst_amount ? Number(challan.cgst_amount).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-1 sm:p-2 border-b border-blue-800 text-[10px] sm:text-sm gap-2">
                  <span className="text-blue-900 font-semibold whitespace-nowrap">SGST (1.5%)</span>
                  <span className="text-right">{challan.sgst_amount ? Number(challan.sgst_amount).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-1 sm:p-2 border-b border-blue-800 text-[10px] sm:text-sm gap-2">
                  <span className="text-blue-900 font-semibold whitespace-nowrap">IGST</span>
                  <span className="text-right">{challan.igst_amount ? Number(challan.igst_amount).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center p-1 sm:p-2 border-b border-blue-800 text-[10px] sm:text-sm font-bold bg-blue-50/30 gap-1 sm:gap-2">
                  <span className="text-blue-900 text-left w-full sm:w-auto">Grand Total</span>
                  <span className="text-right w-full sm:w-auto">{Number(challan.total_amount).toFixed(2)}</span>
                </div>
                
                {Number(challan.amount_paid) > 0 && (
                  <>
                    <div className="flex justify-between items-center p-1 sm:p-2 border-b border-blue-800 text-[10px] sm:text-sm gap-2">
                      <span className="text-blue-900 font-semibold whitespace-nowrap">Amount Paid</span>
                      <span className="text-right text-green-700 font-bold">{Number(challan.amount_paid).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center p-1 sm:p-2 border-b border-blue-800 text-[10px] sm:text-sm font-bold bg-blue-50/30 gap-1 sm:gap-2">
                      <span className="text-blue-900 text-left w-full sm:w-auto">Balance Due</span>
                      <span className="text-right w-full sm:w-auto text-red-600">{Number(challan.balance_amount).toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                <div className="p-3 text-center mt-12 flex flex-col items-center">
                  <span className="text-blue-900 font-bold text-xs uppercase mb-8 block">For VYSHNAVI JEWELLERS</span>
                  <span className="text-blue-900 font-semibold text-xs mt-4">Authorised Signatory</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </main>
  )
}
