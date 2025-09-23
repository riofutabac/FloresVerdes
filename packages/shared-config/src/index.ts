// Configuraciones compartidas
export const API_CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

export const SUPABASE_CONFIG = {
  URL: process.env.SUPABASE_URL || '',
  ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
};

export const APP_CONFIG = {
  NAME: 'Flores Verdes',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
};

// Constantes para evaluaciones
export const EVALUATION_CONSTANTS = {
  MAX_OBSERVATIONS_LENGTH: 500,
  SYNC_RETRY_ATTEMPTS: 3,
  OFFLINE_STORAGE_KEY: 'flores_verdes_offline_data',
};

// Roles y permisos
export const PERMISSIONS = {
  admin: ['create_user', 'edit_user', 'delete_user', 'view_all_evaluations', 'export_data'],
  gerente: ['view_all_evaluations', 'export_data', 'manage_lotes'],
  operario: ['create_evaluation', 'edit_own_evaluation', 'view_own_evaluations'],
};

// Configuración de validaciones
export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
  },
  lote: {
    nameMinLength: 3,
    nameMaxLength: 50,
    hectareasMin: 0.1,
    hectareasMax: 1000,
  },
};