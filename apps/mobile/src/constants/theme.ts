// 🎨 TEMA Y COLORES CENTRALIZADOS
export const COLORS = {
  // Colores principales
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  
  // Colores secundarios
  secondary: '#4A90E2',
  secondaryLight: '#64B5F6',
  secondaryDark: '#1976D2',
  
  // Estados
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Grises
  background: '#F8F9FA',
  surface: '#FFFFFF',
  border: '#E1E8ED',
  divider: '#E0E0E0',
  
  // Textos
  textPrimary: '#14171A',
  textSecondary: '#657786',
  textDisabled: '#999',
  textOnPrimary: '#FFFFFF',
  
  // Transparencias
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
} as const;

// 📏 ESPACIADOS CONSISTENTES
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// 📱 TAMAÑOS DE FUENTE
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
} as const;

// ⚡ CONFIGURACIÓN DE SOMBRAS
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
} as const;

// 🔄 DURACIONES DE ANIMACIÓN
export const ANIMATIONS = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// 📐 BORDER RADIUS
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
} as const;

// 📊 CONFIGURACIONES DE GRÁFICOS
export const CHART_COLORS = {
  excellent: '#4CAF50',  // >= 90%
  good: '#8BC34A',       // >= 80%
  average: '#FF9800',    // >= 70%
  poor: '#FF5722',       // >= 60%
  critical: '#F44336',   // < 60%
} as const;

// 🎯 CONFIGURACIONES DE LA APP
export const APP_CONFIG = {
  name: 'Flores Verdes',
  version: '1.0.0',
  defaultTimeout: 10000,
  maxRetries: 3,
  pageSize: 20,
} as const;

// 📱 BREAKPOINTS RESPONSIVE
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
} as const;

// 🌍 CONFIGURACIONES REGIONALES
export const LOCALE_CONFIG = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  currency: 'COP',
  language: 'es',
} as const;