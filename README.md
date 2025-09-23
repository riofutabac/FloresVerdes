# 🌺 Flores Verdes - Monorepo

Sistema de evaluación de cosecha para floricultores con arquitectura modular, sincronización offline y dashboards KPI.

## 🏗️ Arquitectura del Monorepo

```
/flores-verdes
├─ package.json                 # workspace root (pnpm workspaces)
├─ pnpm-workspace.yaml          # configuración de workspaces
├─ tsconfig.base.json           # config TS compartida
├─ .editorconfig / .eslint* / .prettier* / .gitignore
├─ .env.example                 # variables comunes
│
├─ apps/
│  ├─ mobile/                   # FRONTEND (React Native / Expo)
│  │  ├─ App.tsx
│  │  ├─ app.json / package.json / tsconfig.json
│  │  └─ src/
│  │     ├─ features/           # cosecha, admin, kpi (organización modular)
│  │     │  └─ cosecha/
│  │     │     ├─ screens/      # Vistas (C1..C5)
│  │     │     ├─ controllers/  # Controladores (MVC)
│  │     │     ├─ models/       # DTOs/entidades del módulo
│  │     │     ├─ services/     # Repos del módulo (llaman a core)
│  │     │     └─ hooks/
│  │     ├─ core/               # transversal del cliente
│  │     │  ├─ data/            # supabaseClient, http client
│  │     │  ├─ sync/            # sqlite, colas, SyncOrchestrator
│  │     │  ├─ security/        # roleGuard, auth helpers
│  │     │  └─ events/          # EvaluacionGuardada, etc.
│  │     ├─ store/              # Zustand (slices por módulo)
│  │     ├─ ui/                 # componentes compartidos, charts, theme
│  │     ├─ hooks/ utils/ types/
│  │     └─ tests/              # unit/integration RN
│  │
│  └─ api/                      # BACKEND (NestJS)
│     ├─ src/
│     │  ├─ main.ts / app.module.ts
│     │  ├─ modules/
│     │  │  ├─ admin/           # usuarios, operarios, parámetros, variedades
│     │  │  ├─ cosecha/         # evaluaciones (commands/queries)
│     │  │  ├─ kpi/             # endpoints read-only
│     │  │  └─ files/           # presigned URLs, uploads
│     │  ├─ infra/              # orm, supabase adapters, email
│     │  ├─ jobs/               # outbox worker, refresh vistas
│     │  └─ common/             # dto, guards, interceptors
│     ├─ prisma/                # schema y migraciones
│     ├─ package.json / tsconfig.json
│     └─ .env.example
│
├─ packages/                    # librerías compartidas
│  ├─ shared-types/             # DTOs, tipos TS comunes (eval, KPI, roles)
│  ├─ shared-config/            # eslint/tsconfig presets, constants
│  └─ ui-kit/                   # (futuro) UI compartida RN
│
└─ infra/
   ├─ supabase/
   │  ├─ migrations/            # SQL versionado (tablas, vistas materializadas)
   │  ├─ functions/             # Edge Functions (PDF, cierres)
   │  └─ policies/              # RLS, roles, docs
   └─ docker/                   # (futuro) contenedorización
```

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js >= 18
- pnpm >= 8
- Expo CLI
- Supabase CLI

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores de Supabase
```

### 3. Levantar Supabase local

```bash
pnpm dev:supabase
```

### 4. Levantar backend NestJS

```bash
pnpm dev:api
```

### 5. Levantar app Expo

```bash
pnpm dev:mobile
```

### 6. Levantar todo junto

```bash
pnpm dev
```

## 📱 Scripts Disponibles

```bash
# Desarrollo
pnpm dev                    # Levantar API + Mobile
pnpm dev:mobile            # Solo mobile (Expo)
pnpm dev:api               # Solo backend (NestJS)
pnpm dev:supabase          # Solo Supabase local

# Build
pnpm build                 # Build completo
pnpm --filter mobile build # Build solo mobile
pnpm --filter api build    # Build solo API

# Testing
pnpm test                  # Correr todos los tests
pnpm lint                  # Linting en todo el monorepo
pnpm type-check           # TypeScript check

# Limpieza
pnpm clean                # Limpiar builds y caches
```

## 🔧 Tecnologías

### Frontend (Mobile)
- **React Native** con **Expo**
- **TypeScript** estricto
- **Zustand** para state management
- **React Navigation** para navegación
- **Supabase** para autenticación y datos

### Backend (API)
- **NestJS** con TypeScript
- **Prisma** como ORM
- **Supabase** como base de datos
- **JWT** para autenticación
- **Class Validator** para validaciones

### Infraestructura
- **Supabase** (PostgreSQL + Auth + Storage)
- **pnpm workspaces** para monorepo
- **ESLint + Prettier** para código consistente

## 🗄️ Base de Datos

### Entidades principales:
- **users**: Usuarios del sistema (admin, gerente, operario)
- **lotes**: Lotes de cultivo
- **variedades**: Variedades de flores
- **evaluaciones**: Evaluaciones de cosecha
- **kpi_metrics**: Métricas agregadas

## 🔐 Autenticación y Roles

### Roles disponibles:
- **admin**: Acceso completo
- **gerente**: Lectura de evaluaciones, gestión de lotes
- **operario**: Crear/editar sus propias evaluaciones

### Permisos implementados:
```typescript
const PERMISSIONS = {
  admin: ['create_user', 'edit_user', 'delete_user', 'view_all_evaluations', 'export_data'],
  gerente: ['view_all_evaluations', 'export_data', 'manage_lotes'],
  operario: ['create_evaluation', 'edit_own_evaluation', 'view_own_evaluations'],
};
```

## 📦 Paquetes Compartidos

### @flores-verdes/shared-types
Tipos TypeScript compartidos entre frontend y backend.

### @flores-verdes/shared-config
Configuraciones, constantes y validaciones compartidas.

## 🔄 Sincronización Offline

El sistema está preparado para:
- **Almacenamiento local** con SQLite
- **Cola de sincronización** para conexión intermitente
- **Resolución de conflictos** automática
- **Estado de sync** visible al usuario

## 📊 Módulos Implementados

### ✅ Infraestructura Base
- [x] Monorepo con pnpm workspaces
- [x] Apps mobile (Expo) y API (NestJS)
- [x] Paquetes compartidos
- [x] Configuración de desarrollo

### 🚧 Próximos Pasos
- [ ] Esquema de base de datos completo
- [ ] Autenticación con Supabase
- [ ] Pantallas de evaluación
- [ ] Sistema de sincronización offline
- [ ] Dashboard de KPIs
- [ ] Exportación de reportes

## 🛠️ Desarrollo

### Estructura de commits
```bash
git commit -m "feat(mobile): add evaluation form"
git commit -m "fix(api): resolve user permissions"
git commit -m "docs: update README"
```

### Agregar nuevas dependencias
```bash
# Solo para mobile
pnpm --filter mobile add nueva-dependencia

# Solo para API
pnpm --filter api add nueva-dependencia

# Para workspace raíz
pnpm add -W nueva-dependencia
```

---

## 📞 Soporte

Para preguntas sobre la arquitectura o implementación, consultar:
- Documentación en `/docs`
- Issues en GitHub
- Code reviews en PRs

**¡Happy coding! 🌺**

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