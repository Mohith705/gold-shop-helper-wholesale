'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCustomerAndTransaction(formData: FormData) {
  const supabase = await createClient()

  const customerName = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  const itemName = formData.get('item_name') as string
  const hsnCode = formData.get('hsn_code') as string || '7113'
  const weightGrams = parseFloat(formData.get('weight_grams') as string) || 0
  const wastagePercentage = parseFloat(formData.get('wastage_percentage') as string) || 0
  const ratePerGram = parseFloat(formData.get('gold_rate_per_gram') as string) || 0
  const makingCharges = parseFloat(formData.get('making_charges') as string) || 0
  const amountPaid = parseFloat(formData.get('amount_paid') as string || '0')
  const paymentMethod = formData.get('payment_method') as string || 'Cash'

  // Insert Customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({ name: customerName, phone, address })
    .select('id')
    .single()

  if (customerError || !customer) {
    return { error: customerError?.message || 'Failed to create customer' }
  }

  const isLumpSum = formData.get('is_lump_sum') === 'true'
  const gstIncluded = formData.get('gst_included') === 'true'
  const lumpSumAmount = parseFloat(formData.get('lump_sum_amount') as string || '0')

  // Calculate fields
  let netWeight = weightGrams + (weightGrams * (wastagePercentage / 100))
  let taxableAmount = 0, cgstAmount = 0, sgstAmount = 0, totalAmount = 0

  if (isLumpSum) {
    if (gstIncluded) {
      taxableAmount = lumpSumAmount / 1.03
      totalAmount = lumpSumAmount
    } else {
      taxableAmount = lumpSumAmount
      totalAmount = lumpSumAmount * 1.03
    }
    cgstAmount = taxableAmount * 0.015
    sgstAmount = taxableAmount * 0.015
  } else {
    taxableAmount = (netWeight * ratePerGram) + makingCharges
    cgstAmount = taxableAmount * 0.015 // 1.5%
    sgstAmount = taxableAmount * 0.015 // 1.5%
    totalAmount = taxableAmount + cgstAmount + sgstAmount
  }

  // Insert Transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('gold_transactions')
    .insert({
      customer_id: customer.id,
      item_name: itemName,
      hsn_code: hsnCode,
      is_lump_sum: isLumpSum,
      gst_included: gstIncluded,
      weight_grams: weightGrams,
      wastage_percentage: wastagePercentage,
      gold_rate_per_gram: ratePerGram,
      making_charges: makingCharges,
      net_weight: netWeight,
      taxable_amount: taxableAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      total_amount: totalAmount
    })
    .select('id')
    .single()

  if (transactionError || !transaction) {
    return { error: transactionError?.message || 'Failed to create transaction' }
  }

  // Insert Payment if amount > 0
  if (amountPaid > 0) {
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        transaction_id: transaction.id,
        amount_paid: amountPaid,
        payment_method: paymentMethod
      })

    if (paymentError) {
      return { error: paymentError.message }
    }
  }

  revalidatePath('/')
  return { success: true, transactionId: transaction.id }
}

export async function addPayment(formData: FormData) {
  const supabase = await createClient()
  
  const transactionId = formData.get('transaction_id') as string
  const amountPaid = parseFloat(formData.get('amount_paid') as string)
  const paymentMethod = formData.get('payment_method') as string
  
  if (!transactionId || amountPaid <= 0) {
    return { error: 'Invalid payment details' }
  }

  const { error } = await supabase
    .from('payments')
    .insert({
      transaction_id: transactionId,
      amount_paid: amountPaid,
      payment_method: paymentMethod
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/transaction/${transactionId}`)
  revalidatePath(`/bill/${transactionId}`)
  return { success: true }
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('gold_transactions')
    .delete()
    .eq('id', transactionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function handleLogin(formData: FormData) {
  const username = formData.get('username')
  const password = formData.get('password')

  if (username === 'raja' && password === 'gold1987') {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'authenticated', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    const { redirect } = await import('next/navigation')
    redirect('/')
  } else {
    const { redirect } = await import('next/navigation')
    redirect('/login?error=invalid')
  }
}

export async function updateCustomerAndTransaction(formData: FormData) {
  const supabase = await createClient()

  const transactionId = formData.get('transaction_id') as string
  const customerId = formData.get('customer_id') as string

  const customerName = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  const itemName = formData.get('item_name') as string
  const hsnCode = formData.get('hsn_code') as string || '7113'
  const weightGrams = parseFloat(formData.get('weight_grams') as string) || 0
  const wastagePercentage = parseFloat(formData.get('wastage_percentage') as string) || 0
  const ratePerGram = parseFloat(formData.get('gold_rate_per_gram') as string) || 0
  const makingCharges = parseFloat(formData.get('making_charges') as string) || 0

  const isLumpSum = formData.get('is_lump_sum') === 'true'
  const gstIncluded = formData.get('gst_included') === 'true'
  const lumpSumAmount = parseFloat(formData.get('lump_sum_amount') as string || '0')

  // Update Customer
  const { error: customerError } = await supabase
    .from('customers')
    .update({ name: customerName, phone, address })
    .eq('id', customerId)

  if (customerError) {
    return { error: customerError.message || 'Failed to update customer' }
  }

  // Calculate fields
  let netWeight = weightGrams + (weightGrams * (wastagePercentage / 100))
  let taxableAmount = 0, cgstAmount = 0, sgstAmount = 0, totalAmount = 0

  if (isLumpSum) {
    if (gstIncluded) {
      taxableAmount = lumpSumAmount / 1.03
      totalAmount = lumpSumAmount
    } else {
      taxableAmount = lumpSumAmount
      totalAmount = lumpSumAmount * 1.03
    }
    cgstAmount = taxableAmount * 0.015
    sgstAmount = taxableAmount * 0.015
  } else {
    taxableAmount = (netWeight * ratePerGram) + makingCharges
    cgstAmount = taxableAmount * 0.015 // 1.5%
    sgstAmount = taxableAmount * 0.015 // 1.5%
    totalAmount = taxableAmount + cgstAmount + sgstAmount
  }

  // Update Transaction
  const { error: transactionError } = await supabase
    .from('gold_transactions')
    .update({
      item_name: itemName,
      hsn_code: hsnCode,
      is_lump_sum: isLumpSum,
      gst_included: gstIncluded,
      weight_grams: weightGrams,
      wastage_percentage: wastagePercentage,
      gold_rate_per_gram: ratePerGram,
      making_charges: makingCharges,
      net_weight: netWeight,
      taxable_amount: taxableAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      total_amount: totalAmount
    })
    .eq('id', transactionId)

  if (transactionError) {
    return { error: transactionError.message || 'Failed to update transaction' }
  }

  revalidatePath('/')
  revalidatePath(`/transaction/${transactionId}`)
  revalidatePath(`/bill/${transactionId}`)
  
  return { success: true, transactionId }
}

export async function addWholesaleTransaction(formData: FormData) {
  const supabase = await createClient()

  const customerName = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  const itemName = formData.get('item_name') as string
  const grossWeight = parseFloat(formData.get('gross_weight') as string) || 0
  const netWeight = parseFloat(formData.get('net_weight') as string) || 0
  const touchPercentage = parseFloat(formData.get('touch_percentage') as string) || 0
  const rateAmount = parseFloat(formData.get('rate_amount') as string) || 0
  const totalAmount = parseFloat(formData.get('total_amount') as string) || 0
  const transactionType = formData.get('transaction_type') as string || 'SALE'
  const stockItemId = formData.get('stock_item_id') as string

  // Insert or Update Customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({ name: customerName, phone, address })
    .select('id')
    .single()

  if (customerError || !customer) {
    return { error: customerError?.message || 'Failed to create customer' }
  }

  const fineGold = (netWeight * touchPercentage) / 100

  // Insert Wholesale Transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('wholesale_transactions')
    .insert({
      customer_id: customer.id,
      item_name: itemName,
      gross_weight: grossWeight,
      net_weight: netWeight,
      touch_percentage: touchPercentage,
      fine_gold: fineGold,
      rate_amount: rateAmount,
      total_amount: totalAmount,
      transaction_type: transactionType
    })
    .select('id')
    .single()

  if (transactionError || !transaction) {
    return { error: transactionError?.message || 'Failed to create transaction' }
  }

  // Deduct Stock if stock item was selected
  if (stockItemId && transactionType === 'SALE') {
    const { data: stockItem } = await supabase.from('stock_items').select('quantity').eq('id', stockItemId).single()
    if (stockItem && stockItem.quantity > 0) {
      await supabase.from('stock_items').update({ quantity: stockItem.quantity - 1 }).eq('id', stockItemId)
    }
  }

  revalidatePath('/')
  revalidatePath('/stock')
  return { success: true, transactionId: transaction.id }
}
