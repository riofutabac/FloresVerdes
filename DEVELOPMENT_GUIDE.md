# 🚀 Flores Verdes - Guía de Desarrollo

## 🏗️ CONFIGURACIÓN COMPLETA DEL MONOREPO

### 📁 **Estructura del proyecto:**
```
FloresVerdes/
├── apps/
│   ├── mobile/          📱 React Native (Frontend)
│   └── api/            🚀 NestJS (Backend)
├── packages/
│   ├── shared-types/   🔧 Tipos compartidos
│   └── shared-config/  ⚙️ Configuración compartida
└── infra/
    └── supabase/       🗄️ Base de datos
```

---

## 🛠️ INSTALACIÓN Y CONFIGURACIÓN

### **1. Instalación inicial:**
```bash
# Instalar todas las dependencias
pnpm install

# Configurar el proyecto completo
pnpm setup
```

### **2. Variables de entorno:**

#### **🚀 Backend (apps/api/.env.local):**
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=flores_verdes_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development
```

#### **📱 Frontend (apps/mobile/.env.local):**
```env
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.100.107:3000/api
EXPO_PUBLIC_OFFLINE_MODE=false
EXPO_PUBLIC_AUTO_SYNC=true
```

---

## 🚀 COMANDOS DE DESARROLLO

### **🎯 Comandos principales:**

```bash
# 🔥 Desarrollo completo (API + Mobile)
pnpm dev

# 🏢 Solo backend
pnpm dev:api

# 📱 Solo frontend/mobile  
pnpm dev:mobile

# 🌐 Desarrollo full stack (API + Mobile + DB)
pnpm dev:full
```

### **🏗️ Build y producción:**

```bash
# Construir todo
pnpm build

# Solo API
pnpm build:api

# Solo Mobile
pnpm build:mobile
```

### **🧪 Testing:**

```bash
# Tests en todo el monorepo
pnpm test

# Solo API
pnpm test:api

# Solo Mobile
pnpm test:mobile
```

### **🔍 Linting y type checking:**

```bash
# Lint todo el proyecto
pnpm lint

# Type check
pnpm type-check

# Limpiar builds
pnpm clean
```

---

## 📱 DESARROLLO MÓVIL

### **Iniciar la app móvil:**

1. **Instalar Expo CLI:**
   ```bash
   npm install -g @expo/cli
   ```

2. **Iniciar desarrollo:**
   ```bash
   cd apps/mobile
   pnpm start
   ```

3. **Opciones de visualización:**
   - 📱 **Android:** Escanear QR con Expo Go
   - 🍎 **iOS:** Escanear QR con cámara
   - 🌐 **Web:** Presionar `w` en la terminal

### **Configuración de red:**

⚠️ **Importante:** Actualiza `EXPO_PUBLIC_API_URL` en `.env.local` con tu IP local:

```bash
# Encontrar tu IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Ejemplo:
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

---

## 🚀 DESARROLLO BACKEND

### **Características del backend:**

- ✅ **NestJS** - Framework modular
- ✅ **TypeORM** - ORM para base de datos
- ✅ **JWT Auth** - Autenticación segura
- ✅ **Swagger** - Documentación automática
- ✅ **Tests** - Unitarios e integración
- ✅ **Docker** - Contenedorización

### **Endpoints principales:**

```
🔐 Autenticación:
POST /api/auth/login
GET  /api/auth/profile
POST /api/auth/logout

🌾 Evaluaciones:
GET    /api/evaluations
POST   /api/evaluations
GET    /api/evaluations/:id
PUT    /api/evaluations/:id
DELETE /api/evaluations/:id

👥 Administración:
GET  /api/admin/users
POST /api/admin/users
GET  /api/operators
POST /api/operators

📊 Reportes:
POST /api/reports/evaluations
GET  /api/reports/export
```

### **Documentación Swagger:**
```
http://localhost:3000/api/docs
```

---

## 🗄️ BASE DE DATOS

### **PostgreSQL local:**

```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql

# Crear base de datos
createdb flores_verdes_dev

# O usar Docker
docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres123 -d -p 5432:5432 postgres
```

### **Migrations:**

```bash
cd apps/api

# Generar migration
npm run migration:generate -- -n MigrationName

# Ejecutar migrations
npm run migration:run

# Revertir migration
npm run migration:revert
```

---

## 🔧 TIPOS COMPARTIDOS

### **Uso de shared-types:**

```typescript
// En el frontend (React Native)
import { User, Evaluation, ApiResponse } from '@flores-verdes/shared-types';

// En el backend (NestJS)
import { CreateEvaluationDto, User } from '@flores-verdes/shared-types';
```

### **Agregar nuevos tipos:**

1. Editar `packages/shared-types/src/index.ts`
2. Exportar el nuevo tipo
3. Usar en frontend y backend

---

## 🚨 TROUBLESHOOTING

### **Errores comunes:**

#### **🔥 Metro bundler error:**
```bash
cd apps/mobile
npx expo start --clear
```

#### **🗄️ Database connection error:**
```bash
# Verificar PostgreSQL
pg_isready -d flores_verdes_dev -h localhost -p 5432

# Recrear base de datos
dropdb flores_verdes_dev
createdb flores_verdes_dev
```

#### **📦 Dependency issues:**
```bash
# Limpiar node_modules
pnpm clean
rm -rf node_modules
pnpm install
```

#### **🔧 TypeScript errors:**
```bash
# Regenerar tipos
pnpm type-check
```

#### **🌐 Network issues (Mobile):**
- Verificar que la IP en `.env.local` sea correcta
- Asegurar que el dispositivo móvil esté en la misma red WiFi
- Desactivar firewall temporalmente si es necesario

---

## 📊 TESTING

### **Estructura de tests:**

```
apps/api/test/
├── unit/           # Tests unitarios
├── integration/    # Tests de integración
├── e2e/           # Tests end-to-end
├── performance/   # Tests de rendimiento
└── security/      # Tests de seguridad
```

### **Comandos de test:**

```bash
# API - Todos los tests
pnpm --filter @flores-verdes/api test:all

# API - Solo unitarios
pnpm --filter @flores-verdes/api test:unit

# API - Coverage
pnpm --filter @flores-verdes/api test:cov

# Mobile - Tests
pnpm --filter @flores-verdes/mobile test
```

---

## 🚀 DEPLOYMENT

### **Desarrollo:**
```bash
pnpm dev:full
```

### **Staging:**
```bash
pnpm build
docker-compose -f apps/api/docker-compose.yml up -d
```

### **Producción:**
```bash
pnpm build
docker-compose -f apps/api/docker-compose.prod.yml up -d
```

---

## 🎯 FLUJO DE DESARROLLO

### **1. Feature development:**

```bash
# 1. Crear nueva rama
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar (API primero, luego Frontend)
pnpm dev:api      # Desarrollar backend
pnpm dev:mobile   # Desarrollar frontend

# 3. Testing
pnpm test

# 4. Build y verificación
pnpm build

# 5. Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### **2. Orden recomendado:**

1. 🔧 **Actualizar tipos** en `shared-types`
2. 🚀 **Desarrollar API** endpoints
3. 🧪 **Escribir tests** para API
4. 📱 **Integrar en frontend**
5. ✅ **Tests end-to-end**

---

## 📞 SOPORTE

### **Logs importantes:**

```bash
# API logs
tail -f apps/api/logs/app.log

# Mobile logs (Metro)
# Ver en terminal donde corre expo start

# Database logs
tail -f /usr/local/var/log/postgres.log
```

### **Health checks:**

```bash
# API health
curl http://localhost:3000/api/health

# Database health
pg_isready -d flores_verdes_dev

# Mobile build health
cd apps/mobile && npx expo doctor
```

---

**🌹 ¡Desarrollo exitoso en Flores Verdes!** 🚀