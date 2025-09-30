// Re-exportar tipos para uso local
export * from '@flores-verdes/shared-types';
import { User } from '@flores-verdes/shared-types';

// 🎯 TIPOS ESPECÍFICOS DEL FRONTEND MÓVIL

// Navegación
export type RootStackParamList = {
  Home: undefined;
  EvaluacionCosecha: undefined;
  Profile: undefined;
  Login: undefined;
  // Futuras pantallas:
  // PostcosechaScreen: undefined;
  // ReportesScreen: { evaluacionId?: string };
};

// Evaluaciones - Frontend específico
export interface Operario {
  id: string;
  nombre: string;
  correo: string;
  area: string;
  cuadrante: string;
  discapacidad: string;
  fechaIngreso: string;
}

export interface Calificaciones {
  [key: string]: 'Alto' | 'Medio' | 'Bajo';
}

export interface EvaluacionLocal {
  id?: string;
  area: string;
  cuadrante: string;
  operario: string;
  correo: string;
  observaciones: string;
  calificaciones: Calificaciones;
  fechaRegistro: string;
}

// Estado de la aplicación
export type AppState = {
  user: User | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
};