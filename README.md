# FloresVerdes - Sistema de Gestión Agrícola

## Arquitectura del Proyecto

Este proyecto implementa un sistema de gestión agrícola con las siguientes características:

### 🏗️ Estructura del Workspace

```
flores-verdes/
├─ package.json                 # Workspace root (pnpm workspaces)
├─ pnpm-workspace.yaml          # Configuración de workspaces
├─ tsconfig.base.json           # Configuración TypeScript compartida
├─ .editorconfig / .eslint* / .prettier* / .gitignore
├─ .env.example                 # Variables de entorno (template)
│
├─ apps/
│  ├─ mobile/                   # FRONTEND (React Native / Expo)
│  │  ├─ App.tsx               # Punto de entrada principal
│  │  ├─ app.json              # Configuración de Expo
│  │  ├─ package.json          # Dependencias del móvil
│  │  └─ src/
│  │     ├─ features/          # Módulos por funcionalidad
│  │     │  ├─ cosecha/        # Gestión de evaluaciones
│  │     │  ├─ admin/          # Administración
│  │     │  └─ kpi/            # Indicadores y reportes
│  │     ├─ core/              # Funcionalidades transversales
│  │     │  ├─ data/           # Clientes HTTP/Supabase
│  │     │  └─ sync/           # Sincronización offline
│  │     ├─ store/             # Estado global (Zustand)
│  │     └─ ui/                # Componentes compartidos
│  │
│  └─ api/                     # BACKEND (NestJS)
│     ├─ src/
│     │  ├─ main.ts            # Punto de entrada
│     │  ├─ app.module.ts      # Módulo principal
│     │  ├─ modules/           # Módulos de negocio
│     │  │  ├─ admin/          # Gestión de usuarios y parámetros
│     │  │  ├─ cosecha/        # Evaluaciones (CRUD + lógica)
│     │  │  ├─ kpi/            # Endpoints para reportes
│     │  │  └─ files/          # Gestión de archivos
│     │  └─ infra/             # Infraestructura
│     │     ├─ prisma/         # ORM y base de datos
│     │     └─ supabase/       # Cliente Supabase
│     └─ package.json
│
├─ packages/                   # Librerías compartidas
│  ├─ shared-types/            # Tipos TypeScript comunes
│  └─ shared-config/           # Configuraciones y constantes
│
└─ infra/
   └─ supabase/
      ├─ migrations/           # Migraciones SQL
      └─ policies/             # Políticas RLS
```

### 🚀 Tecnologías Principales

**Frontend Mobile:**
- React Native + Expo
- TypeScript
- React Navigation
- Zustand (estado global)
- SQLite (cache offline)
- Supabase Cliente

**Backend API:**
- NestJS + TypeScript
- Prisma ORM
- Supabase
- Swagger/OpenAPI
- CQRS Pattern

**Base de Datos:**
- PostgreSQL (Supabase)
- Row Level Security (RLS)
- Vistas materializadas para KPIs

**Herramientas:**
- pnpm Workspaces
- ESLint + Prettier

### 📱 Funcionalidades Principales

1. **Gestión de Cosecha**
   - Registro de evaluaciones de calidad
   - Captura de datos por operario, variedad, lote
   - Sincronización offline/online
   - Validaciones de negocio

2. **Panel de Administración**
   - Gestión de usuarios y roles
   - Configuración de parámetros del sistema
   - Gestión de variedades

3. **Indicadores KPI**
   - Reportes de producción
   - Métricas por variedad y operario
   - Tendencias y análisis de calidad
   - Dashboards interactivos

### 🔧 Comandos de desarrollo

```bash
# Desarrollo móvil
pnpm dev:mobile

# Desarrollo API
pnpm dev:api

# Build completo
pnpm build

# Linting
pnpm lint

# Tests
pnpm test
```

### 📝 Estado Actual

✅ **Completado:**
- Estructura base del workspace
- Configuración de herramientas (TypeScript, ESLint, Prettier)
- App móvil básica con navegación
- Backend NestJS con módulos básicos
- Tipos compartidos
- Esquema de base de datos Supabase
- Políticas de seguridad RLS

🚧 **Pendiente:**
- Instalación de dependencias
- Implementación completa de lógica de negocio
- Autenticación
- Sincronización offline
- Tests
- Optimizaciones de rendimiento