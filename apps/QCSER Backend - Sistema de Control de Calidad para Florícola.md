# QCSER Backend - Sistema de Control de Calidad para Florícola

## Descripción General

QCSER (Quality Control System for Rose Export) es un sistema backend robusto desarrollado en NestJS para la gestión integral de evaluaciones de calidad en procesos de cosecha y postcosecha de flores. El sistema está diseñado para operar tanto en modo online como offline, garantizando la continuidad operativa en entornos con conectividad limitada.

## Características Principales

### 🌐 Arquitectura Híbrida Online/Offline
- Sincronización automática de datos cuando hay conectividad
- Almacenamiento local para operación offline
- Resolución inteligente de conflictos de datos

### 🔐 Autenticación y Autorización Robusta
- Integración con Supabase para gestión de usuarios
- Sistema de roles y permisos granular
- Autenticación JWT con tokens seguros

### 📊 Sistema de Evaluaciones Completo
- Gestión de operarios y sus evaluaciones
- Parámetros de calidad configurables
- Cálculo automático de compliance y scoring

### 📈 Reportes y Analytics
- Múltiples tipos de reportes (resumen, tendencias, comparaciones)
- Exportación en formatos JSON, CSV, PDF, Excel
- KPIs y datos para dashboards ejecutivos

### 🗄️ Almacenamiento Híbrido
- Integración con Supabase Storage
- Fallback a almacenamiento local
- Gestión automática de archivos y fotos

## Tecnologías Utilizadas

- **Framework**: NestJS 11.x
- **Base de Datos**: PostgreSQL con TypeORM
- **Autenticación**: JWT + Supabase Auth
- **Almacenamiento**: Supabase Storage + Local Storage
- **Testing**: Jest + Supertest
- **Documentación**: Swagger/OpenAPI
- **Validación**: Class-validator + Class-transformer

## Estructura del Proyecto

```
src/
├── config/                 # Configuraciones del sistema
│   ├── database.config.ts   # Configuración de base de datos
│   ├── supabase.config.ts   # Configuración de Supabase
│   └── jwt.config.ts        # Configuración JWT
├── entities/               # Entidades de base de datos
│   ├── user.entity.ts      # Usuarios del sistema
│   ├── operator.entity.ts  # Operarios
│   ├── evaluation.entity.ts # Evaluaciones
│   └── ...                 # Otras entidades
├── modules/                # Módulos funcionales
│   ├── auth/               # Autenticación y autorización
│   ├── operators/          # Gestión de operarios
│   ├── evaluations/        # Sistema de evaluaciones
│   ├── reports/            # Generación de reportes
│   ├── storage/            # Almacenamiento de archivos
│   └── sync/               # Sincronización offline/online
├── common/                 # Componentes compartidos
│   ├── guards/             # Guards de autenticación
│   ├── decorators/         # Decoradores personalizados
│   └── filters/            # Filtros de excepción
└── utils/                  # Utilidades del sistema
    └── offline-storage.util.ts
```

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL 13+
- npm o yarn

### Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd qcser-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con las configuraciones necesarias
```

4. Ejecutar migraciones de base de datos:
```bash
npm run migration:run
```

5. Iniciar el servidor de desarrollo:
```bash
npm run start:dev
```

## Variables de Entorno

```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=qcser_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=qcser_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Aplicación
NODE_ENV=development
PORT=3000
```

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Servidor de desarrollo con hot-reload
npm run start:debug        # Servidor con debugging habilitado

# Producción
npm run build              # Compilar para producción
npm run start:prod         # Ejecutar en modo producción

# Testing
npm run test               # Ejecutar todas las pruebas
npm run test:unit          # Solo pruebas unitarias
npm run test:e2e           # Solo pruebas end-to-end
npm run test:cov           # Pruebas con cobertura

# Calidad de código
npm run lint               # Linter ESLint
npm run format             # Formatear código con Prettier
```

## API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario
- `GET /auth/profile` - Obtener perfil del usuario
- `POST /auth/refresh` - Renovar token

### Operarios
- `GET /operators` - Listar operarios
- `POST /operators` - Crear operario
- `GET /operators/:id` - Obtener operario específico
- `PATCH /operators/:id` - Actualizar operario
- `DELETE /operators/:id` - Eliminar operario
- `GET /operators/search` - Buscar operarios
- `GET /operators/statistics` - Estadísticas de operarios

### Evaluaciones
- `GET /evaluations` - Listar evaluaciones
- `POST /evaluations` - Crear evaluación
- `GET /evaluations/:id` - Obtener evaluación específica
- `PATCH /evaluations/:id` - Actualizar evaluación
- `PATCH /evaluations/:id/close` - Cerrar evaluación
- `DELETE /evaluations/:id` - Eliminar evaluación
- `GET /evaluations/statistics` - Estadísticas de evaluaciones

### Reportes
- `GET /reports/kpis` - Obtener KPIs
- `POST /reports/generate` - Generar reporte
- `GET /reports/templates` - Plantillas de reportes
- `GET /reports/dashboard-data` - Datos para dashboard

### Almacenamiento
- `POST /storage/upload` - Subir archivo
- `GET /storage/download/:id` - Descargar archivo
- `GET /storage/info` - Información de almacenamiento
- `GET /storage/validate` - Validar configuración

### Sincronización
- `GET /sync/status` - Estado de sincronización
- `POST /sync/force` - Forzar sincronización
- `GET /sync/pending` - Operaciones pendientes

## Documentación de la API

La documentación completa de la API está disponible a través de Swagger UI:

- **Desarrollo**: http://localhost:3000/api/docs
- **Producción**: https://your-domain.com/api/docs

## Testing

El proyecto incluye una suite completa de pruebas:

### Pruebas Unitarias
- Servicios de autenticación
- Servicios de operarios
- Servicios de evaluaciones
- Utilidades y helpers

### Pruebas de Integración
- Endpoints de API
- Flujos completos de usuario
- Manejo de errores
- Validaciones de datos

### Ejecutar Pruebas

```bash
# Todas las pruebas
npm run test

# Solo unitarias
npm run test:unit

# Solo integración
npm run test:e2e

# Con cobertura
npm run test:cov
```

## Despliegue

### Desarrollo Local

1. Configurar base de datos PostgreSQL
2. Configurar variables de entorno
3. Ejecutar migraciones
4. Iniciar servidor de desarrollo

### Producción

1. **Preparación**:
   ```bash
   npm run build
   ```

2. **Variables de entorno de producción**:
   - Configurar todas las variables necesarias
   - Usar secretos seguros para JWT y Supabase

3. **Base de datos**:
   - Configurar PostgreSQL en producción
   - Ejecutar migraciones: `npm run migration:run`

4. **Iniciar aplicación**:
   ```bash
   npm run start:prod
   ```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## Arquitectura del Sistema

### Patrón de Arquitectura

El sistema sigue una arquitectura modular basada en NestJS con los siguientes principios:

- **Separación de responsabilidades**: Cada módulo tiene una responsabilidad específica
- **Inyección de dependencias**: Gestión automática de dependencias
- **Decoradores**: Uso extensivo de decoradores para metadatos
- **Guards y Interceptors**: Manejo transversal de autenticación y logging

### Base de Datos

El diseño de la base de datos incluye las siguientes entidades principales:

- **Users**: Usuarios del sistema con roles
- **Operators**: Operarios de la florícola
- **Areas**: Áreas de trabajo (cosecha, postcosecha)
- **Modules**: Módulos dentro de cada área
- **Evaluations**: Evaluaciones realizadas a operarios
- **EvaluationDetails**: Detalles específicos de cada evaluación
- **EvaluationPhotos**: Fotos asociadas a evaluaciones

### Sincronización Offline/Online

El sistema implementa un mecanismo robusto de sincronización:

1. **Detección de conectividad**: Monitoreo automático del estado de la red
2. **Cola de operaciones**: Almacenamiento local de operaciones offline
3. **Sincronización automática**: Envío de datos cuando se restaura la conectividad
4. **Resolución de conflictos**: Estrategias para manejar conflictos de datos

## Seguridad

### Medidas Implementadas

- **Autenticación JWT**: Tokens seguros con expiración
- **Autorización basada en roles**: Control granular de permisos
- **Validación de entrada**: Validación estricta de todos los datos
- **Sanitización**: Limpieza de datos para prevenir inyecciones
- **CORS configurado**: Control de acceso desde diferentes orígenes
- **Rate limiting**: Protección contra ataques de fuerza bruta

### Roles y Permisos

- **ADMINISTRADOR**: Acceso completo al sistema
- **GERENTE_GENERAL**: Acceso a reportes y estadísticas
- **JEFA_CALIDAD**: Gestión de evaluaciones y operarios
- **SUPERVISOR**: Supervisión de operarios asignados

## Monitoreo y Logging

### Logging
- Logs estructurados con niveles apropiados
- Registro de operaciones críticas
- Tracking de errores y excepciones

### Métricas
- Tiempo de respuesta de APIs
- Uso de recursos del sistema
- Estadísticas de sincronización

## Contribución

### Estándares de Código

- **ESLint**: Linting automático
- **Prettier**: Formateo consistente
- **Conventional Commits**: Mensajes de commit estandarizados
- **TypeScript**: Tipado estricto

### Proceso de Desarrollo

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Soporte y Mantenimiento

### Versionado
El proyecto sigue [Semantic Versioning](https://semver.org/):
- **MAJOR**: Cambios incompatibles
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correcciones de bugs

### Roadmap
- [ ] Implementación de notificaciones push
- [ ] Dashboard en tiempo real
- [ ] Integración con sistemas ERP
- [ ] Análisis predictivo de calidad
- [ ] App móvil nativa

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

Para soporte técnico o consultas:
- **Email**: support@qcser.com
- **Documentación**: https://docs.qcser.com
- **Issues**: https://github.com/your-org/qcser-backend/issues

---

**Desarrollado por**: Manus AI  
**Versión**: 1.0.0  
**Última actualización**: Diciembre 2023
