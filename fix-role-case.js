const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://gekizwnlxdywcfebycao.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdla2l6d25seGR5d2NmZWJ5Y2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg3Nzk4OSwiZXhwIjoyMDcyNDUzOTg5fQ.ML5P0inh9ZBuGkvczg0083GHwe7Kzfn20ubHueQL19M'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function fixRoleCase() {
  try {
    console.log('🔧 Fixing role case sensitivity...')
    
    // Actualizar el rol en public.users de 'admin' a 'Admin'
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role: 'Admin' })
      .eq('email', 'admin@agilitychanges.com')
      .select()
    
    if (error) {
      console.error('❌ Error updating role:', error)
      return
    }
    
    console.log('✅ Role updated successfully:', data)
    console.log('💡 Please refresh the application to see admin features.')
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

// Ejecutar el script
fixRoleCase()