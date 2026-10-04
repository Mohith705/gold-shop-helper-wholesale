import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { startOfDay, endOfDay, format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from '@/app/statement/[id]/PrintButton'

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

export default async function BatchBillsPage({ searchParams }: { searchParams: Promise<{ from?: string, to?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  
  const fromDate = params.from || format(new Date(), 'yyyy-MM-dd')
  const toDate = params.to || format(new Date(), 'yyyy-MM-dd')

  const { data: transactions } = await supabase
    .from('gold_transactions')
    .select('*, customers(*), payments(*)')
    .gte('created_at', startOfDay(new Date(fromDate)).toISOString())
    .lte('created_at', endOfDay(new Date(toDate)).toISOString())
    .order('created_at', { ascending: false })

  if (!transactions || transactions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <h2 className="text-xl text-gray-700 mb-4">No transactions found for these dates.</h2>
        <Link href={`/reports?from=${fromDate}&to=${toDate}`} className="text-amber-600 hover:underline">
          Go back to reports
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 p-4 md:p-8">
      {/* Header hidden in print */}
      <div className="max-w-[800px] mx-auto mb-8 print:hidden flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold">Print / Download All Bills</h1>
          <p className="text-sm text-gray-500">Dates: {format(new Date(fromDate), 'dd MMM yyyy')} to {format(new Date(toDate), 'dd MMM yyyy')} ({transactions.length} receipts)</p>
        </div>
        <div className="flex gap-4">
          <Link href={`/reports?from=${fromDate}&to=${toDate}`} className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft size={16} /> Back
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-[800px] mx-auto">
        {transactions.map((transaction, index) => {
          const customer = transaction.customers
          const totalAmountRounded = Math.round(transaction.total_amount)
          const amountInWords = numberToWords(totalAmountRounded)
          const isLumpSum = transaction.is_lump_sum

          return (
            <div key={transaction.id} className="mb-12 print:mb-0 print:break-after-page">
              <div className="bg-white p-4 border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0">
                <div className="border-[3px] border-blue-900 p-[2px]">
                  <div className="border border-blue-900 bg-white">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-blue-800 p-2 text-blue-900 text-[10px] sm:text-xs font-semibold">
                      <div>GSTIN : </div>
                      <div className="text-center font-bold text-sm sm:text-base tracking-widest text-red-600 uppercase underline decoration-2 underline-offset-4">TAX INVOICE</div>
                      <div className="text-right">
                        <div>Cell : </div>
                        <div></div>
                      </div>
                    </div>
                    
                    {/* Shop Name */}
                    <div className="text-center py-2 border-b border-blue-800 text-blue-900">
                      <h1 className="text-3xl font-bold tracking-wide">LAKSHMI SUMA JEWELLERY</h1>
                      <p className="text-xs font-semibold mt-1">Shop no 17, baburao complex, mandapala veedhi, nellore - 524 001</p>
                    </div>

                    {/* Customer & Invoice Details Grid */}
                    <div className="grid grid-cols-2 text-blue-900 text-sm">
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

                    {/* Table Body */}
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
          )
        })}
      </div>
    </main>
  )
}
