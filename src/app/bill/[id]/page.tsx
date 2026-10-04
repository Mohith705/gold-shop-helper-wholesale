import { createClient } from '@/utils/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PrintButton } from './PrintButton'

// Helper function to convert numbers to words
function numberToWords(num: number): string {
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];

  if ((num = num || 0) === 0) return 'zero';
  
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
  
  return str.trim() + ' rupees only';
}

export default async function BillPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  // Wait for the route params to resolve
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const isAdmin = resolvedSearchParams?.mode === 'admin'

  if (!id) return notFound()

  const { data: transaction, error } = await supabase
    .from('gold_transactions')
    .select('*, customers(*), payments(*)')
    .eq('id', id)
    .single()

  if (error || !transaction) {
    return notFound()
  }

  const customer = transaction.customers
  const payments = transaction.payments || []
  const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0)
  const balanceDue = transaction.total_amount - totalPaid
  
  const totalAmountRounded = Math.round(transaction.total_amount)
  const amountInWords = numberToWords(totalAmountRounded)

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 p-8 print:p-0 print:bg-white flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        <header className="flex justify-between items-center print:hidden w-full">
          <div>
            {isAdmin && (
              <Link href="/" className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-2 text-sm font-medium">
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(isAdmin && customer?.phone) && (
              <a 
                href={`https://wa.me/91${customer.phone.replace(/\\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${customer.name},\n\nThank you for shopping with Vyshnavi Jewellers!\n\nHere are your bill details:\nInvoice No: INV-${transaction.invoice_number}\nItem: ${transaction.item_name}\nNet Weight: ${transaction.net_weight.toFixed(3)}g\n\nTotal Amount: ₹${transaction.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nAmount Paid: ₹${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nBalance Due: ₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nRegards,\nVyshnavi Jewellers`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp Bill
              </a>
            )}
            <PrintButton 
              customerName={customer?.name || 'Customer'}
              itemName={transaction.item_name}
              date={new Date(transaction.created_at).toLocaleDateString('en-IN')}
            />
          </div>
        </header>

        {/* Bill Container */}
        <div className="overflow-x-auto -mx-8 px-8 print:mx-0 print:px-0">
          <div className="min-w-[800px] bg-white rounded-xl shadow-sm print:shadow-none font-sans text-sm border-2 border-blue-800 p-1 print:border-none print:p-0">
            <div className="border border-blue-800">
              {/* Header section */}
            <div className="grid grid-cols-3 p-4 border-b border-blue-800 text-blue-900">
              <div className="text-xs font-semibold">
                GSTIN : 37AHZPB2125M1ZZ
              </div>
              <div className="text-center font-bold">
                <div className="text-sm">TAX INVOICE</div>
                <div className="text-xs">CASH / CREDIT</div>
              </div>
              <div className="text-right text-xs">
                <div>Original / Duplicate / Triplicate</div>
                <div>Ph. : 7981032009</div>
              </div>
            </div>
            
            {/* Shop Name */}
            <div className="text-center py-2 border-b border-blue-800 text-blue-900">
              <h1 className="text-3xl font-bold tracking-wide">LAKSHMI SUMA JEWELLERY</h1>
              <p className="text-xs font-semibold mt-1">Shop no 17, baburao complex, mandapala veedhi, nellore - 524 001</p>
            </div>

            {/* Customer & Invoice Details Grid */}
            <div className="grid grid-cols-2 text-blue-900 text-sm">
              {/* Left Col */}
              <div className="border-r border-blue-800">
                <div className="grid grid-cols-[80px_1fr] border-b border-blue-800">
                  <div className="p-1 px-2 border-r border-blue-800">Name</div>
                  <div className="p-1 px-2 font-medium text-black">{customer?.name}</div>
                </div>
                <div className="grid grid-cols-[80px_1fr] border-b border-blue-800 min-h-[40px]">
                  <div className="p-1 px-2 border-r border-blue-800">Address</div>
                  <div className="p-1 px-2 font-medium text-black">{customer?.address}</div>
                </div>
                <div className="grid grid-cols-[80px_1fr] border-b border-blue-800">
                  <div className="p-1 px-2 border-r border-blue-800">GSTIN</div>
                  <div className="p-1 px-2 font-medium text-black"></div>
                </div>
                <div className="grid grid-cols-[80px_1fr_60px_1fr]">
                  <div className="p-1 px-2 border-r border-blue-800">State</div>
                  <div className="p-1 px-2 border-r border-blue-800 font-medium text-black">AP</div>
                  <div className="p-1 px-2 border-r border-blue-800">Code</div>
                  <div className="p-1 px-2 font-medium text-black">37</div>
                </div>
              </div>

              {/* Right Col */}
              <div>
                <div className="grid grid-cols-[120px_1fr] border-b border-blue-800">
                  <div className="p-1 px-2 border-r border-blue-800">Invoice No.</div>
                  <div className="p-1 px-2 font-medium text-black">{transaction.invoice_number}</div>
                </div>
                <div className="grid grid-cols-[120px_1fr] border-b border-blue-800">
                  <div className="p-1 px-2 border-r border-blue-800">Invoice Date</div>
                  <div className="p-1 px-2 font-medium text-black">{new Date(transaction.created_at).toLocaleDateString('en-IN')}</div>
                </div>
                <div className="grid grid-cols-[120px_1fr] border-b border-blue-800">
                  <div className="p-1 px-2 border-r border-blue-800">Transport Mode</div>
                  <div className="p-1 px-2 font-medium text-black">By hand</div>
                </div>
                <div className="grid grid-cols-[120px_1fr]">
                  <div className="p-1 px-2 border-r border-blue-800">Vehicle No.</div>
                  <div className="p-1 px-2 font-medium text-black"></div>
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_60px_80px_80px_80px_120px] border-y border-blue-800 text-blue-900 text-xs font-semibold text-center divide-x divide-blue-800">
              <div className="p-2">Product Description</div>
              <div className="p-2">HSN Code</div>
              <div className="p-2">Gross WT<br/>(IN GRAM)</div>
              <div className="p-2">Net WT<br/>(IN GRAM)</div>
              <div className="p-2">Rate<br/>Per Gram</div>
              <div className="p-2">Taxable Value</div>
            </div>

            {/* Table Body (min-height for layout) */}
            <div className="grid grid-cols-[1fr_60px_80px_80px_80px_120px] min-h-[300px] text-black divide-x divide-blue-800 text-sm">
              <div className="p-2">{transaction.item_name}</div>
              <div className="p-2 text-center">{transaction.hsn_code || '7113'}</div>
              <div className="p-2 text-right">{transaction.weight_grams ? transaction.weight_grams.toFixed(3) : '-'}</div>
              <div className="p-2 text-right">{transaction.net_weight ? transaction.net_weight.toFixed(3) : '-'}</div>
              <div className="p-2 text-right">{transaction.gold_rate_per_gram || '-'}</div>
              <div className="p-2 text-right">{transaction.taxable_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            {/* Footer Calculation Section */}
            <div className="grid grid-cols-[1fr_360px] border-t border-blue-800 text-sm">
              {/* Left Side: Amount in Words, Adhaar, PAN */}
              <div className="border-r border-blue-800 text-blue-900 flex flex-col justify-between">
                <div className="p-3">
                  <div className="flex gap-2">
                    <span className="whitespace-nowrap">Total Invoice Amount in words :</span>
                    <span className="text-black capitalize border-b border-dotted border-black flex-1">{amountInWords}</span>
                  </div>
                </div>
                
                <div className="mt-auto space-y-0">
                  <div className="grid grid-cols-[80px_1fr] border-t border-blue-800">
                    <div className="p-2 border-r border-blue-800">Adhaar No. :</div>
                    <div className="p-2 font-medium text-black"></div>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] border-t border-blue-800">
                    <div className="p-2 border-r border-blue-800">PAN No. :</div>
                    <div className="p-2 font-medium text-black"></div>
                  </div>
                </div>
              </div>

              {/* Right Side: Tax Breakdown */}
              <div className="divide-y divide-blue-800 text-blue-900">
                <div className="grid grid-cols-[1fr_120px] divide-x divide-blue-800">
                  <div className="p-2">Total Amount Before Tax :</div>
                  <div className="p-2 text-right font-medium text-black">{transaction.taxable_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="grid grid-cols-[1fr_120px] divide-x divide-blue-800">
                  <div className="p-2">Add CGST (1.5%) :</div>
                  <div className="p-2 text-right font-medium text-black">{transaction.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="grid grid-cols-[1fr_120px] divide-x divide-blue-800">
                  <div className="p-2">Add SGST (1.5%) :</div>
                  <div className="p-2 text-right font-medium text-black">{transaction.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="grid grid-cols-[1fr_120px] divide-x divide-blue-800">
                  <div className="p-2">Add IGST :</div>
                  <div className="p-2 text-right font-medium text-black"></div>
                </div>
                <div className="grid grid-cols-[1fr_120px] divide-x divide-blue-800">
                  <div className="p-2 font-bold">Total Amount After Tax :</div>
                  <div className="p-2 text-right font-bold text-black">{transaction.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                {(() => {
                  const totalPaid = transaction.payments?.reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0) || 0;
                  const balanceDue = transaction.total_amount - totalPaid;
                  return (
                    <>
                      <div className="grid grid-cols-[1fr_120px] divide-x divide-blue-800 border-t border-blue-800">
                        <div className="p-2 font-medium text-green-700">Amount Paid :</div>
                        <div className="p-2 text-right font-medium text-green-700">{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="grid grid-cols-[1fr_120px] divide-x divide-blue-800 border-t border-blue-800">
                        <div className="p-2 font-bold text-red-600">Balance Due :</div>
                        <div className="p-2 text-right font-bold text-red-600">{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-2 border-t border-blue-800 text-blue-900 text-center text-sm h-24 relative">
              <div className="border-r border-blue-800 flex flex-col justify-end p-2">
                Customer Signature
              </div>
              <div className="flex flex-col justify-between p-2">
                <div className="font-bold">For LAKSHMI SUMA JEWELLERY</div>
                <div>Authorised Signatory</div>
              </div>
            </div>

          </div>
        </div>
        </div>
      </div>
    </main>
  )
}
