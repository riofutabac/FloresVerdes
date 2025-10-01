// Tipos base del usuario
export type UserRole = "admin" | "jefe_calidad" | "gerente";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

// Tipos para evaluaciones de cosecha
export type EvaluationStatus = "draft" | "completed" | "synced";

export type Evaluation = {
  id: string;
  user_id: string;
  lote_id: string;
  fecha_evaluacion: string;
  status: EvaluationStatus;
  datos_json: Record<string, any>;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
};

// Tipos para lotes
export type Lote = {
  id: string;
  nombre: string;
  variedad_id: string;
  hectareas: number;
  ubicacion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

// Tipos para variedades
export type Variedad = {
  id: string;
  nombre: string;
  descripcion?: string;
  parametros_evaluacion: Record<string, any>;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

// Tipos para KPIs
export type KPIMetric = {
  id: string;
  nombre: string;
  valor: number;
  unidad: string;
  fecha: string;
  tipo: "cosecha" | "calidad" | "rendimiento";
};

// DTOs para APIs
export type CreateEvaluationDto = {
  lote_id: string;
  fecha_evaluacion: string;
  datos_json: Record<string, any>;
  observaciones?: string;
};

export type UpdateEvaluationDto = Partial<CreateEvaluationDto>;

export type LoginDto = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  token: string;
  expires_at: string;
};