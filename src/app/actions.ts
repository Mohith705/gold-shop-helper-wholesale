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
  const oldGoldWeight = parseFloat(formData.get('old_gold_weight') as string || '0')
  const oldGoldValue = parseFloat(formData.get('old_gold_value') as string || '0')
  const notes = formData.get('notes') as string || ''

  let imageUrl = null;
  const imageFile = formData.get('image') as File | null;
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile);
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }
  }

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
      total_amount: totalAmount,
      image_url: imageUrl,
      notes: notes
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

  // Insert Old Gold as Payment if value > 0
  if (oldGoldValue > 0) {
    const oldGoldTouch = parseFloat(formData.get('old_gold_touch') as string || '0')
    const oldGoldRate = parseFloat(formData.get('old_gold_rate') as string || '0')
    
    let methodString = `Old Gold (${oldGoldWeight}g)`
    if (oldGoldTouch > 0 && oldGoldRate > 0) {
      methodString = `Old Gold (${oldGoldWeight}g @ ${oldGoldTouch}%, ₹${oldGoldRate}/g)`
    }

    const { error: oldGoldError } = await supabase
      .from('payments')
      .insert({
        transaction_id: transaction.id,
        amount_paid: oldGoldValue,
        payment_method: methodString
      })

    if (oldGoldError) {
      return { error: oldGoldError.message }
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

export async function deleteWholesaleTransaction(id: string) {
  const supabase = await createClient()
  
  const { data: tx } = await supabase.from('wholesale_transactions').select('*').eq('id', id).single()

  if (tx && tx.transaction_type === 'SALE' && tx.stock_item_id) {
    const { data: stockItem } = await supabase.from('stock_items').select('*').eq('id', tx.stock_item_id).single()
    if (stockItem) {
      await supabase.from('stock_items').update({ 
        gross_weight: stockItem.gross_weight + tx.gross_weight,
        net_weight: stockItem.net_weight + tx.net_weight
      }).eq('id', tx.stock_item_id)
    }
  }

  const { error } = await supabase
    .from('wholesale_transactions')
    .delete()
    .eq('id', id)

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
  const notes = formData.get('notes') as string || ''

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
      total_amount: totalAmount,
      notes: notes
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
  const stonesWeight = parseFloat(formData.get('stones_weight') as string) || 0
  const stonesPrice = parseFloat(formData.get('stones_price') as string) || 0
  const beadsWeight = parseFloat(formData.get('beads_weight') as string) || 0
  const extraBeads = parseFloat(formData.get('extra_beads') as string) || 0
  const transactionType = formData.get('transaction_type') as string || 'SALE'
  const stockItemId = formData.get('stock_item_id') as string
  const stockDeductionsRaw = formData.get('stock_deductions') as string
  let stockDeductions: { stock_id: string, gross: number, net: number }[] = []
  try {
    if (stockDeductionsRaw) stockDeductions = JSON.parse(stockDeductionsRaw)
  } catch(e) {}
  
  const notes = formData.get('notes') as string || ''

  let imageUrl = null;
  const imageFile = formData.get('image') as File | null;
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile);
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }
  }

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
      stones_weight: stonesWeight,
      stones_price: stonesPrice,
      beads_weight: beadsWeight,
      extra_beads: extraBeads,
      rate_amount: rateAmount,
      total_amount: totalAmount,
      transaction_type: transactionType,
      image_url: imageUrl,
      stock_item_id: stockItemId || null,
      stock_deductions: stockDeductions.length > 0 ? stockDeductions : null,
      notes: notes
    })
    .select('id')
    .single()

  if (transactionError || !transaction) {
    return { error: transactionError?.message || 'Failed to create transaction' }
  }

  // Deduct Stock Weight if multiple stock items were selected
  if (stockDeductions.length > 0 && transactionType === 'SALE') {
    for (const deduction of stockDeductions) {
      const { data: stockItem } = await supabase.from('stock_items').select('*').eq('id', deduction.stock_id).single()
      if (stockItem) {
        await supabase.from('stock_items').update({ 
          gross_weight: Math.max(0, stockItem.gross_weight - deduction.gross),
          net_weight: Math.max(0, stockItem.net_weight - deduction.net)
        }).eq('id', deduction.stock_id)
      }
    }
  } else if (stockItemId && transactionType === 'SALE') {
    // Fallback for old single stock selection logic just in case
    const { data: stockItem } = await supabase.from('stock_items').select('*').eq('id', stockItemId).single()
    if (stockItem) {
      await supabase.from('stock_items').update({ 
        gross_weight: Math.max(0, stockItem.gross_weight - grossWeight),
        net_weight: Math.max(0, stockItem.net_weight - netWeight)
      }).eq('id', stockItemId)
    }
  }

  revalidatePath('/')
  revalidatePath('/stock')
  return { success: true, transactionId: transaction.id }
}

export async function createDeliveryChallan(formData: FormData) {
  const supabase = await createClient()

  const customerName = formData.get('customer_name') as string
  const customerAddress = formData.get('customer_address') as string
  const customerGstin = formData.get('customer_gstin') as string
  const customerState = formData.get('customer_state') as string
  const transportMode = formData.get('transport_mode') as string
  const vehicleNumber = formData.get('vehicle_number') as string
  const placeOfSupply = formData.get('place_of_supply') as string
  const dcDate = formData.get('dc_date') as string || new Date().toISOString()
  
  const itemsRaw = formData.get('items') as string
  let items: any[] = []
  try {
    if (itemsRaw) items = JSON.parse(itemsRaw)
  } catch(e) {}

  const cgstAmount = parseFloat(formData.get('cgst_amount') as string) || 0
  const sgstAmount = parseFloat(formData.get('sgst_amount') as string) || 0
  const igstAmount = parseFloat(formData.get('igst_amount') as string) || 0
  const totalTaxableValue = parseFloat(formData.get('total_taxable_value') as string) || 0
  const totalAmount = parseFloat(formData.get('total_amount') as string) || 0

  const amountPaid = parseFloat(formData.get('amount_paid') as string) || 0
  const balanceAmount = parseFloat(formData.get('balance_amount') as string) || 0

  // Generate DC Number
  const { count } = await supabase.from('delivery_challans').select('*', { count: 'exact', head: true })
  const nextNumber = (count || 0) + 1
  const dcNumber = `DC-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`

  const { data: challan, error } = await supabase
    .from('delivery_challans')
    .insert({
      dc_number: dcNumber,
      dc_date: dcDate,
      customer_name: customerName,
      customer_address: customerAddress,
      customer_gstin: customerGstin,
      customer_state: customerState,
      transport_mode: transportMode,
      vehicle_number: vehicleNumber,
      place_of_supply: placeOfSupply,
      items: items,
      total_taxable_value: totalTaxableValue,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance_amount: balanceAmount
    })
    .select('id')
    .single()

  if (error || !challan) {
    return { error: error?.message || 'Failed to create Delivery Challan' }
  }

  revalidatePath('/challans')
  return { success: true, challanId: challan.id }
}
