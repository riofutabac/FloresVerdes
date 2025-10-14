# QCSER Backend - Sistema de Control de Calidad Florícola

Backend API para el Sistema de Control de Calidad para empresas florícolas, desarrollado con NestJS, TypeScript, PostgreSQL y Redis.

## Descripción

Este sistema permite gestionar el control de calidad de productos florícolas mediante:
- Autenticación y autorización de usuarios
- Gestión de operadores y evaluaciones
- Sincronización de datos con Supabase
- Generación de reportes
- Almacenamiento de archivos e imágenes

## Tecnologías

- **Framework**: NestJS 11.x
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL
- **Cache**: Redis
- **ORM**: TypeORM
- **Documentación**: Swagger/OpenAPI
- **Autenticación**: JWT + Passport
- **Storage**: Supabase
- **Containerización**: Docker & Docker Compose

## Estructura del Proyecto

```
src/
├── config/           # Configuraciones (database, jwt, supabase)
├── entities/         # Entidades de TypeORM
├── modules/          # Módulos de la aplicación
│   ├── auth/         # Autenticación y autorización
│   ├── operators/    # Gestión de operadores
│   ├── evaluations/  # Evaluaciones de calidad
│   ├── reports/      # Generación de reportes
│   ├── storage/      # Gestión de archivos
│   └── sync/         # Sincronización de datos
├── app.module.ts     # Módulo principal
└── main.ts           # Punto de entrada
```

## Configuración del Entorno

### Variables de Entorno

Copia `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

### Configuración de Base de Datos

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=qcser_db
```

### Configuración de Supabase

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Instalación y Ejecución

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run start:dev

# La aplicación estará disponible en http://localhost:3000
# Documentación Swagger en http://localhost:3000/api/docs
```

### Con Docker Compose

```bash
# Levantar todos los servicios (PostgreSQL, Redis, App)
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener servicios
docker-compose down
```

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Modo desarrollo con hot reload
npm run start:debug        # Modo debug

# Producción
npm run build              # Compilar aplicación
npm run start:prod         # Ejecutar en producción

# Testing
npm run test               # Tests unitarios
npm run test:unit          # Tests unitarios (excluyendo e2e)
npm run test:e2e           # Tests end-to-end
npm run test:cov           # Coverage de tests
npm run test:watch         # Tests en modo watch

# Calidad de código
npm run lint               # Linter
npm run format             # Formatear código
```

## API Documentation

Una vez que la aplicación esté ejecutándose, puedes acceder a la documentación interactiva de la API en:

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

## Base de Datos

### Migraciones

TypeORM está configurado para sincronizar automáticamente en desarrollo. Para producción, se recomienda usar migraciones:

```bash
# Generar migración
npm run typeorm:migration:generate -- -n MigrationName

# Ejecutar migraciones
npm run typeorm:migration:run

# Revertir migración
npm run typeorm:migration:revert
```

### Servicios de Docker

- **PostgreSQL**: Puerto 5432 (desarrollo) / 5433 (testing)
- **Redis**: Puerto 6379 (desarrollo) / 6380 (testing)
- **Aplicación**: Puerto 3000

## Testing

```bash
# Tests unitarios
npm run test:unit

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.