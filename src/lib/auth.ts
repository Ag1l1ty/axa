import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase'
import { User, AuthUser } from './types'

export async function signUp(email: string, password: string, userData: {
  firstName: string
  lastName: string
  role: string
  avatar?: string
}) {
  try {
    console.log('🚀 Creating user in auth.users:', email)
    
    // 1. Crear usuario en auth.users
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase client not available')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          avatar: userData.avatar || '/avatars/01.png'
        }
      }
    })

    if (error) {
      console.error('❌ Error in auth.signUp:', error)
      throw error
    }

    if (!data.user) {
      console.error('❌ No user returned from auth.signUp')
      throw new Error('No user returned from signup')
    }

    console.log('✅ User created in auth.users:', data.user.email)
    console.log('👤 User ID:', data.user.id)
    console.log('📧 Email confirmed at:', data.user.email_confirmed_at)
    console.log('✔️ Confirmed at:', data.user.confirmed_at)

    // 3. El trigger automático de Supabase creará el registro en public.users
    console.log('⚙️ Trigger automático sincronizará usuario en public.users...')
    
    // Esperar un poco para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('✅ Usuario creado - sync automática por trigger')

    return { data, error: null }
  } catch (error) {
    console.error('❌ Error in signUp function:', error)
    return { data: null, error }
  }
}

// Nueva función para que admins creen usuarios sin auto-login
export async function createUserAsAdmin(email: string, password: string, userData: {
  firstName: string
  lastName: string
  role: string
  avatar?: string
}) {
  try {
    console.log('👑 [ADMIN] Creating user without auto-login:', email)
    
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    
    // Usar supabaseAdmin para crear usuario sin auto-login
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        avatar: userData.avatar || '/avatars/01.png'
      },
      email_confirm: true // Usuario automáticamente confirmado
    })

    if (error) {
      console.error('❌ [ADMIN] Error creating user:', error)
      throw error
    }

    if (!data.user) {
      console.error('❌ [ADMIN] No user returned')
      throw new Error('No user returned from admin createUser')
    }

    console.log('✅ [ADMIN] User created successfully:', data.user.email)
    console.log('👤 [ADMIN] User ID:', data.user.id)
    console.log('🔑 [ADMIN] Session preserved - no auto-login')

    // El trigger automático sincronizará en public.users
    console.log('⚙️ [ADMIN] Trigger will sync to public.users...')
    
    return { data, error: null }
  } catch (error) {
    console.error('❌ [ADMIN] Error in createUserAsAdmin:', error)
    return { data: null, error }
  }
}

export async function signIn(email: string, password: string) {
  console.log('🚀 Attempting login for:', email)
  
  try {
    // En modo desarrollo sin Supabase, simular login exitoso
    if (!isSupabaseConfigured || !supabase) {
      console.log('🔧 Using mock auth mode')
      
      // Lista de emails válidos para desarrollo
      const validEmails = [
        'admin@demo.com',
        'maria@axa.com', 
        'juan@axa.com',
        'ana@axa.com',
        'carlos@axa.com'
      ]
      
      if (!validEmails.includes(email)) {
        throw new Error('Usuario no encontrado')
      }
      
      // Simular respuesta exitosa
      const mockUser = {
        id: 'dev-user-' + email.split('@')[0],
        email: email,
        user_metadata: {
          firstName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          lastName: 'Demo',
          role: email.includes('admin') ? 'Admin' : email.includes('juan') ? 'Portfolio Manager' : 'PM/SM'
        }
      }
      
      console.log('✅ Mock login successful for:', email)
      return { data: { user: mockUser }, error: null }
    }

    console.log('🔐 Using real Supabase auth for:', email)
    console.log('🌍 Supabase configured:', isSupabaseConfigured)
    
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase client not available')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ Login error from Supabase:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      throw error
    }

    if (data?.user) {
      console.log('✅ Login successful for:', data.user.email)
      console.log('👤 User data:', {
        id: data.user.id,
        email: data.user.email,
        confirmed_at: data.user.confirmed_at,
        email_confirmed_at: data.user.email_confirmed_at,
        metadata: data.user.user_metadata
      })
    } else {
      console.warn('⚠️ No user data returned from Supabase')
    }

    return { data, error: null }
  } catch (error) {
    console.error('💥 Error in signIn function:', error)
    return { data: null, error }
  }
}

export async function signOut() {
  try {
    const supabase = getSupabaseClient()
    if (!isSupabaseConfigured || !supabase) {
      // En modo desarrollo, simular logout exitoso
      return { error: null }
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function resetPassword(email: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase client not available')
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase client not available')
    
    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient()
  if (!isSupabaseConfigured || !supabase) {
    return null
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user as AuthUser | null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient()
  if (!isSupabaseConfigured || !supabase) {
    return null
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      role: data.role as any,
      avatar: data.avatar,
      assignedProjectIds: data.assigned_project_ids
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}