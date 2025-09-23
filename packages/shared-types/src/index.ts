// Tipos de evaluación
export interface Evaluacion {
  id?: string;
  uuid?: string;
  operario: string;
  variedad: string;
  lote: string;
  calidad: number;
  cantidad: number;
  observaciones?: string;
  tieneDefectos: boolean;
  fechaCreacion?: string;
  synced?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipos de usuario y roles
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERARIO = 'OPERARIO',
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de KPI
export interface KPIData {
  produccionTotal: number;
  calidadPromedio: number;
  evaluacionesTotales: number;
  tendencias: TendenciaData[];
}

export interface TendenciaData {
  fecha: string;
  valor: number;
  tipo: 'produccion' | 'calidad' | 'cantidad';
}

export interface MetricasPorVariedad {
  variedad: string;
  cantidadTotal: number;
  calidadPromedio: number;
  evaluaciones: number;
}

export interface MetricasPorOperario {
  operario: string;
  cantidadTotal: number;
  calidadPromedio: number;
  evaluaciones: number;
}

// Tipos de sync
export interface SyncItem {
  id: number;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: string; // JSON stringified
  createdAt: Date;
  retryCount: number;
}

// Tipos de respuesta API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos de parámetros del sistema
export interface ParametroSistema {
  clave: string;
  valor: string;
  descripcion?: string;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  categoria: string;
}

// Tipos de variedades
export interface Variedad {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  parametrosCalidad?: ParametroCalidad[];
}

export interface ParametroCalidad {
  nombre: string;
  valorMinimo: number;
  valorMaximo: number;
  unidad?: string;
}