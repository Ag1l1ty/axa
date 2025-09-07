const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://gekizwnlxdywcfebycao.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdla2l6d25seGR5d2NmZWJ5Y2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg3Nzk4OSwiZXhwIjoyMDcyNDUzOTg5fQ.ML5P0inh9ZBuGkvczg0083GHwe7Kzfn20ubHueQL19M'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function fixAdminRole() {
  try {
    console.log('🔍 Checking all users in auth.users...')
    
    // 1. Listar todos los usuarios de auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error getting auth users:', authError)
      return
    }
    
    console.log(`✅ Found ${authUsers.users.length} users in auth.users:`)
    authUsers.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`)
      console.log(`     Metadata:`, user.user_metadata)
    })
    
    // 2. Listar todos los usuarios de public.users
    console.log('\n🔍 Checking all users in public.users...')
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*')
    
    if (publicError) {
      console.error('❌ Error getting public users:', publicError)
    } else {
      console.log(`✅ Found ${publicUsers.length} users in public.users:`)
      publicUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - Role: ${user.role} (ID: ${user.id})`)
      })
    }
    
    // 3. Si hay usuarios, hacer admin al primero
    if (authUsers.users.length > 0) {
      const firstUser = authUsers.users[0]
      console.log(`\n🔧 Making ${firstUser.email} an Admin...`)
      
      // Actualizar metadata en auth.users
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        firstUser.id,
        {
          user_metadata: {
            ...firstUser.user_metadata,
            firstName: firstUser.user_metadata?.firstName || 'Admin',
            lastName: firstUser.user_metadata?.lastName || 'User',
            role: 'Admin'
          }
        }
      )
      
      if (updateAuthError) {
        console.error('❌ Error updating auth metadata:', updateAuthError)
      } else {
        console.log('✅ Updated auth.users metadata')
      }
      
      // Verificar si existe en public.users
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', firstUser.id)
        .single()
      
      if (existingUser) {
        // Actualizar usuario existente
        const { error: updatePublicError } = await supabaseAdmin
          .from('users')
          .update({
            first_name: firstUser.user_metadata?.firstName || 'Admin',
            last_name: firstUser.user_metadata?.lastName || 'User',
            role: 'Admin',
            email: firstUser.email
          })
          .eq('id', firstUser.id)
        
        if (updatePublicError) {
          console.error('❌ Error updating public.users:', updatePublicError)
        } else {
          console.log('✅ Updated public.users role to Admin')
        }
      } else {
        // Crear usuario en public.users
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: firstUser.id,
            first_name: firstUser.user_metadata?.firstName || 'Admin',
            last_name: firstUser.user_metadata?.lastName || 'User',
            email: firstUser.email,
            role: 'Admin',
            avatar: '/avatars/admin.png'
          })
        
        if (insertError) {
          console.error('❌ Error creating public.users record:', insertError)
        } else {
          console.log('✅ Created public.users record with Admin role')
        }
      }
    }
    
    console.log('\n🎉 Admin role setup complete!')
    console.log('💡 Please refresh the application to see admin features.')
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

// Ejecutar el script
fixAdminRole()