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
  Administracion: undefined;
  // Módulos de Administración:
  GestionUsuarios: undefined;
  GestionOperarios: undefined;
  GestionParametros: undefined;
  GestionVariedades: undefined;
  GestionSubprocesos: undefined;
  AsignacionSupervisores: undefined;
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
  variedad: string; // 🌹 Nueva propiedad para variedad de rosa
}

// 👨‍💼 SUPERVISOR
export interface Supervisor {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  area: string;
  fechaAsignacion: string;
}

export interface Calificaciones {
  [key: string]: 'Cumple' | 'No Cumple';
}

// ⚖️ PARÁMETRO CON PESO PARA MOTOR DE PUNTUACIÓN
export interface ParametroConPeso {
  id: string;
  nombre: string;
  peso: number;
}

// 📊 ESTADO DE EVALUACIÓN DE PARÁMETRO
export interface EstadoParametro {
  cumple: boolean;
  observacion?: string;
}

// 🎯 EVALUACIÓN CON PUNTUACIÓN
export interface EvaluacionConPuntuacion {
  [parametroId: string]: EstadoParametro;
}

// 📈 RESULTADOS DE PUNTUACIÓN
export interface ResultadoPuntuacion {
  puntajeMaximo: number;
  puntajeObtenido: number;
  porcentajeCumplimiento: number;
  parametrosNoCumplidos: string[];
  parametrosCumplidos: string[];
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