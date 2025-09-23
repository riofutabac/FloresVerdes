-- Configuración inicial de Supabase para FloresVerdes

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de usuarios (complementa auth.users de Supabase)
CREATE TABLE public.usuarios (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'OPERARIO' 
    CHECK (rol IN ('ADMIN', 'SUPERVISOR', 'OPERARIO')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de variedades
CREATE TABLE public.variedades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de parámetros de calidad por variedad
CREATE TABLE public.parametros_calidad (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variedad_id UUID REFERENCES variedades(id) ON DELETE CASCADE,
  nombre VARCHAR(50) NOT NULL,
  valor_minimo DECIMAL(10,2),
  valor_maximo DECIMAL(10,2),
  unidad VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de evaluaciones
CREATE TABLE public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uuid VARCHAR(100) UNIQUE, -- Para sync con mobile
  operario VARCHAR(100) NOT NULL,
  variedad VARCHAR(50) NOT NULL,
  lote VARCHAR(20) NOT NULL,
  calidad INTEGER NOT NULL CHECK (calidad >= 1 AND calidad <= 10),
  cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
  observaciones TEXT,
  tiene_defectos BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced BOOLEAN DEFAULT true,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de parámetros del sistema
CREATE TABLE public.parametros_sistema (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) DEFAULT 'string' 
    CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
  categoria VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_evaluaciones_operario ON evaluaciones(operario);
CREATE INDEX idx_evaluaciones_variedad ON evaluaciones(variedad);
CREATE INDEX idx_evaluaciones_lote ON evaluaciones(lote);
CREATE INDEX idx_evaluaciones_fecha ON evaluaciones(fecha_creacion);
CREATE INDEX idx_evaluaciones_uuid ON evaluaciones(uuid);
CREATE INDEX idx_evaluaciones_synced ON evaluaciones(synced);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at 
  BEFORE UPDATE ON usuarios 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variedades_updated_at 
  BEFORE UPDATE ON variedades 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluaciones_updated_at 
  BEFORE UPDATE ON evaluaciones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametros_sistema_updated_at 
  BEFORE UPDATE ON parametros_sistema 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar variedades de ejemplo
INSERT INTO variedades (nombre, descripcion) VALUES
  ('Rosa Roja', 'Rosa roja estándar para exportación'),
  ('Rosa Blanca', 'Rosa blanca premium'),
  ('Clavel Rojo', 'Clavel rojo tradicional'),
  ('Clavel Blanco', 'Clavel blanco para eventos'),
  ('Gerbera Amarilla', 'Gerbera amarilla decorativa'),
  ('Gerbera Rosa', 'Gerbera rosa para arreglos');

-- Insertar parámetros del sistema básicos
INSERT INTO parametros_sistema (clave, valor, descripcion, categoria) VALUES
  ('sync_interval_ms', '30000', 'Intervalo de sincronización en milisegundos', 'sync'),
  ('offline_cache_ttl', '86400000', 'Tiempo de vida del cache offline en ms', 'cache'),
  ('max_retry_attempts', '3', 'Máximo número de reintentos de sync', 'sync'),
  ('calidad_minima_exportacion', '7', 'Calidad mínima para exportación', 'calidad'),
  ('empresa_nombre', 'FloresVerdes S.A.', 'Nombre de la empresa', 'general'),
  ('empresa_direccion', 'Dirección de la empresa', 'Dirección principal', 'general');