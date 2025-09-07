const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://gekizwnlxdywcfebycao.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdla2l6d25seGR5d2NmZWJ5Y2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Nzc5ODksImV4cCI6MjA3MjQ1Mzk4OX0.5hqf9hFzwYgLtXKU7dS1EXrzrpAJSyx40VjKblN65KM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyData() {
  console.log('🔍 Verificando datos en Supabase...\n')
  
  try {
    // Verificar usuarios
    console.log('👤 USUARIOS:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (usersError) {
      console.log('❌ Error al consultar usuarios:', usersError.message)
    } else {
      console.log(`✅ Se encontraron ${users?.length || 0} usuarios`)
      users?.forEach(user => {
        console.log(`   - ${user.first_name} ${user.last_name} (${user.email}) - Rol: ${user.role}`)
      })
    }
    
    console.log('\n📋 PROYECTOS:')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (projectsError) {
      console.log('❌ Error al consultar proyectos:', projectsError.message)
    } else {
      console.log(`✅ Se encontraron ${projects?.length || 0} proyectos`)
      projects?.forEach(project => {
        console.log(`   - ${project.name} - Owner: ${project.owner_name} (${project.stage})`)
      })
    }
    
    console.log('\n🚚 ENTREGAS:')
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (deliveriesError) {
      console.log('❌ Error al consultar entregas:', deliveriesError.message)
    } else {
      console.log(`✅ Se encontraron ${deliveries?.length || 0} entregas`)
      deliveries?.forEach(delivery => {
        console.log(`   - ${delivery.project_name} - Entrega #${delivery.delivery_number}`)
      })
    }

    // Buscar específicamente el usuario Jose Sanchez
    console.log('\n🔎 BUSCAR USUARIO ESPECÍFICO (Jose Sanchez):')
    const { data: joseUser, error: joseError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', '%joseandressanchezmoreno@gmail.com%')
    
    if (joseError) {
      console.log('❌ Error al buscar usuario Jose:', joseError.message)
    } else {
      if (joseUser && joseUser.length > 0) {
        console.log('✅ ¡Usuario Jose Sanchez encontrado en Supabase!')
        joseUser.forEach(user => {
          console.log(`   - ID: ${user.id}`)
          console.log(`   - Nombre: ${user.first_name} ${user.last_name}`)
          console.log(`   - Email: ${user.email}`)
          console.log(`   - Rol: ${user.role}`)
          console.log(`   - Creado: ${user.created_at}`)
        })
      } else {
        console.log('❌ Usuario Jose Sanchez NO encontrado en Supabase')
      }
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message)
  }
}

verifyData()