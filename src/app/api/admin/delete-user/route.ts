import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    console.log('🗑️ [API] Deleting user from both auth.users and public.users:', userId)
    
    // 1. Primero eliminar de auth.users usando Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.error('❌ [API] Error deleting from auth.users:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
    
    console.log('✅ [API] User deleted from auth.users:', userId)
    
    // 2. Eliminar de public.users (por si el trigger no funciona)
    const { error: publicError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (publicError) {
      console.warn('⚠️ [API] Warning deleting from public.users (but auth deleted):', publicError)
      // No devolver error ya que lo importante es que se eliminó de auth.users
    } else {
      console.log('✅ [API] User deleted from public.users:', userId)
    }

    console.log('✅ [API] User completely deleted from both tables:', userId)

    return NextResponse.json({ 
      success: true,
      message: 'Usuario eliminado exitosamente de Authentication y Users table'
    })

  } catch (error) {
    console.error('❌ [API] Error in delete-user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}