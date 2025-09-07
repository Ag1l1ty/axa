import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente admin para el servidor
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [API] Service Key check:', supabaseServiceKey?.substring(0, 20) + '...')
    console.log('🔧 [API] Service Key length:', supabaseServiceKey?.length)
    
    const { email, password, userData } = await request.json()
    
    console.log('👑 [API] Creating user without auto-login:', email)
    
    // Usar supabaseAdmin en el servidor
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        avatar: userData.avatar || '/avatars/01.png'
      },
      email_confirm: true
    })

    // Si el usuario se creó exitosamente, ignorar ciertos errores de warning
    if (error && !data.user) {
      console.error('❌ [API] Error creating user:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error && data.user) {
      console.warn('⚠️ [API] Warning during user creation (but user created):', error.message)
    }

    if (!data.user) {
      console.error('❌ [API] No user returned')
      return NextResponse.json({ error: 'No user returned' }, { status: 400 })
    }

    console.log('✅ [API] User created successfully:', data.user.email)
    console.log('👤 [API] User ID:', data.user.id)

    return NextResponse.json({ 
      data, 
      error: null,
      message: 'Usuario creado exitosamente sin auto-login'
    })

  } catch (error) {
    console.error('❌ [API] Error in create-user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}