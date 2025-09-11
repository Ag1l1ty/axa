import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch budget history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deliveryId = searchParams.get('delivery_id')
    
    if (!deliveryId) {
      return NextResponse.json({ error: 'delivery_id is required' }, { status: 400 })
    }
    
    console.log('📊 [API] Fetching budget history for delivery:', deliveryId)
    
    const { data, error } = await supabaseAdmin
      .from('budget_history')
      .select('*')
      .eq('delivery_id', deliveryId)
      .order('update_date', { ascending: false })
    
    if (error) {
      console.error('❌ [API] Error fetching budget history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [API] Budget history fetched successfully:', data?.length, 'entries')
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('❌ [API] Error in budget-history GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save budget history
export async function POST(request: NextRequest) {
  try {
    const { delivery_id, amount, update_date } = await request.json()
    
    if (!delivery_id || !amount || !update_date) {
      return NextResponse.json({ 
        error: 'delivery_id, amount, and update_date are required' 
      }, { status: 400 })
    }
    
    console.log('💾 [API] Saving budget history:', { delivery_id, amount, update_date })
    
    const { error } = await supabaseAdmin
      .from('budget_history')
      .insert({
        delivery_id,
        amount,
        update_date,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('❌ [API] Error saving budget history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [API] Budget history saved successfully')
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('❌ [API] Error in budget-history POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}