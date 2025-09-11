import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    console.log('🔍 [API] Checking if user exists:', email)
    
    // Verificar en auth.users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ [API] Error checking users:', error)
      return NextResponse.json({ exists: false, error: error.message }, { status: 400 })
    }
    
    const userExists = data.users.some(user => user.email === email)
    
    console.log(`${userExists ? '⚠️' : '✅'} [API] User ${email} ${userExists ? 'exists' : 'does not exist'}`)
    
    return NextResponse.json({ exists: userExists })
    
  } catch (error) {
    console.error('❌ [API] Error in check-user:', error)
    return NextResponse.json({ exists: false, error: 'Internal server error' }, { status: 500 })
  }
}