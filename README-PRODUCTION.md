# AXA Portfolio Management - Production Deployment Guide

## 📋 Descripción
Sistema de gestión de portafolio AXA desarrollado con Next.js 15, TypeScript y Supabase.

## 🚀 Despliegue en Producción

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase configurada
- Plataforma de hosting (Vercel, Netlify, etc.)

### Variables de Entorno
Copia `.env.example` a `.env.local` en producción y configura:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Configuración de Supabase
1. Crear proyecto en Supabase
2. Ejecutar el schema SQL desde `supabase-schema.sql`
3. Configurar las políticas RLS según los archivos SQL incluidos
4. Obtener las keys desde Settings > API

### Despliegue en Vercel
1. Conectar repositorio GitHub
2. Configurar variables de entorno en Vercel dashboard
3. Deploy automático desde main branch

### Scripts Disponibles
- `npm run dev` - Desarrollo (puerto 9002)
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linting
- `npm run typecheck` - Verificación de tipos

### Usuario Administrador por Defecto
- Email: `admin@agilitychanges.com`
- Password: `Admin2024!`
- Rol: `admin`

## 🏗️ Arquitectura
- **Frontend**: Next.js 15 con App Router
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **UI**: Tailwind CSS + Radix UI
- **Estado**: React hooks + Context API

## 🔒 Seguridad
- Row Level Security (RLS) habilitado
- Variables sensibles en .env (excluido de git)
- API routes protegidas con Service Role Key
- Autenticación JWT con Supabase

## 📊 Funcionalidades
- ✅ Gestión de proyectos y entregas
- ✅ Control de presupuestos con historial
- ✅ Evaluación y monitoreo de riesgos
- ✅ Dashboard con métricas
- ✅ Sistema de roles (Admin, Portfolio Manager, etc.)
- ✅ Kanban board para seguimiento
- ✅ Administración de usuarios

## 🔧 Desarrollo Local
```bash
git clone https://github.com/Ag1l1ty/axa.git
cd axa
npm install
cp .env.example .env.local
# Configurar variables de entorno
npm run dev
```

## 📝 Notas Importantes
- La aplicación usa el puerto 9002 por defecto
- Los archivos `.env*` están excluidos del repositorio por seguridad
- Se requiere configuración completa de Supabase para funcionar
- El sistema maneja datos reales (no mock) en producción