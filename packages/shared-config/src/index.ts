// Constantes de la aplicación
export const APP_CONFIG = {
  API_VERSION: 'v1',
  SYNC_INTERVAL_MS: 30000,
  OFFLINE_CACHE_TTL: 86400000, // 24 horas
  MAX_RETRY_ATTEMPTS: 3,
  PAGINATION_DEFAULT_LIMIT: 10,
  PAGINATION_MAX_LIMIT: 100,
} as const;

// Configuraciones de validación
export const VALIDATION_RULES = {
  CALIDAD_MIN: 1,
  CALIDAD_MAX: 10,
  CANTIDAD_MIN: 0,
  CANTIDAD_MAX: 10000,
  OPERARIO_MIN_LENGTH: 2,
  OPERARIO_MAX_LENGTH: 100,
  VARIEDAD_MIN_LENGTH: 2,
  VARIEDAD_MAX_LENGTH: 50,
  LOTE_MIN_LENGTH: 1,
  LOTE_MAX_LENGTH: 20,
  OBSERVACIONES_MAX_LENGTH: 500,
} as const;

// Configuraciones de UI
export const UI_CONFIG = {
  COLORS: {
    PRIMARY: '#2e7d32',
    SECONDARY: '#4caf50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
    INFO: '#2196f3',
    SUCCESS: '#4caf50',
    BACKGROUND: '#f5f5f5',
    SURFACE: '#ffffff',
    TEXT_PRIMARY: '#333333',
    TEXT_SECONDARY: '#666666',
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
  },
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
  },
} as const;

// Configuraciones de tiempo
export const TIME_CONFIG = {
  FORMATS: {
    DATE: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    TIME: 'HH:mm',
    DISPLAY_DATE: 'DD/MM/YYYY',
    DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
  },
  TIMEZONE: 'America/Santiago', // Ajustar según la zona horaria
} as const;

// Configuraciones de archivos
export const FILE_CONFIG = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
} as const;

// Configuraciones de red
export const NETWORK_CONFIG = {
  TIMEOUT_MS: 30000,
  RETRY_DELAY_MS: 1000,
  MAX_CONCURRENT_REQUESTS: 5,
} as const;

// Mensajes de error estándar
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  VALIDATION_ERROR: 'Los datos ingresados no son válidos.',
  SERVER_ERROR: 'Error del servidor. Intenta nuevamente.',
  NOT_FOUND: 'Recurso no encontrado.',
  UNAUTHORIZED: 'No tienes permisos para esta acción.',
  FORBIDDEN: 'Acceso denegado.',
  SYNC_ERROR: 'Error al sincronizar datos.',
  OFFLINE_MODE: 'Modo offline activo. Los datos se sincronizarán cuando tengas conexión.',
} as const;

// Configuraciones de roles y permisos
export const PERMISSIONS = {
  ADMIN: {
    CAN_MANAGE_USERS: true,
    CAN_MANAGE_SYSTEM: true,
    CAN_VIEW_ALL_DATA: true,
    CAN_EXPORT_DATA: true,
    CAN_MANAGE_EVALUACIONES: true,
  },
  SUPERVISOR: {
    CAN_MANAGE_USERS: false,
    CAN_MANAGE_SYSTEM: false,
    CAN_VIEW_ALL_DATA: true,
    CAN_EXPORT_DATA: true,
    CAN_MANAGE_EVALUACIONES: true,
  },
  OPERARIO: {
    CAN_MANAGE_USERS: false,
    CAN_MANAGE_SYSTEM: false,
    CAN_VIEW_ALL_DATA: false,
    CAN_EXPORT_DATA: false,
    CAN_MANAGE_EVALUACIONES: true,
  },
} as const;