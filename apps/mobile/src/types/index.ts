// Re-exportar tipos para uso local
export * from '@flores-verdes/shared-types';
import { User } from '@flores-verdes/shared-types';

// 🎯 TIPOS ESPECÍFICOS DEL FRONTEND MÓVIL

// Navegación
export type RootStackParamList = {
  Home: undefined;
  EvaluacionCosecha: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  Login: undefined;
  Administracion: undefined;
  // Módulos de Administración:
  GestionUsuarios: undefined;
  GestionOperarios: undefined;
  GestionParametros: undefined;
  GestionVariedades: undefined;
  AsignacionSupervisores: undefined;
  // Módulo de Reportes:
  Reportes: undefined;
  ReportesIndividuales: undefined;
  ReportesGenerales: undefined;
  ExportarReportes: undefined;
  DashboardReportes: undefined;
  // Futuras pantallas:
  // PostcosechaScreen: undefined;
};

// Evaluaciones - Frontend específico
export interface Operario {
  id: string;
  nombre: string;
  correo: string;
  discapacidad: string;
  fechaIngreso: string;
  variedad: string; // 🌹 Nueva propiedad para variedad de rosa
  proceso: 'Cosecha' | 'Postcosecha'; // 🏭 Proceso al que pertenece el operario
  
  // 🌾 CAMPOS ESPECÍFICOS DE COSECHA
  area?: string; // Solo para cosecha
  cuadrante?: string; // Solo para cosecha
  
  // 📦 CAMPOS ESPECÍFICOS DE POSTCOSECHA  
  mesa?: string; // Solo para postcosecha (Ej: Mesa 1, Mesa 2, etc.)
  rol?: 'Clasificador' | 'Bonchador'; // Solo para postcosecha
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

// 📊 EVALUACIÓN COMPLETA GUARDADA
export interface EvaluacionGuardada {
  id: string;
  operarioId: string;
  operarioNombre: string;
  area: string;
  cuadrante?: string; // Cosecha
  mesa?: string; // Postcosecha
  variedad: string;
  proceso: 'Cosecha' | 'Postcosecha';
  subproceso: string; // Ej: "Enmallado", "Clasificación", etc.
  evaluacion: EvaluacionConPuntuacion;
  resultado: ResultadoPuntuacion;
  observaciones: string;
  fechaRegistro: string;
  evaluadorId: string;
  evaluadorNombre: string;
}

// 📈 REPORTE INDIVIDUAL POR OPERARIO
export interface ReporteIndividual {
  operarioId: string;
  operarioNombre: string;
  cuadrante: string;
  variedad: string;
  area: string;
  evaluaciones: EvaluacionGuardada[];
  promedioOperario: number; // Promedio de todas sus evaluaciones
  objetivo: number; // Siempre 100
  promedioGeneral: number; // Promedio de todos los operarios
  totalEvaluaciones: number;
  fechaInicio: string;
  fechaFin: string;
}

// 📊 REPORTE GENERAL
export interface ReporteGeneral {
  fechaGeneracion: string;
  fechaInicio: string;
  fechaFin: string;
  totalOperarios: number;
  totalEvaluaciones: number;
  promedioGeneral: number;
  objetivo: number; // 100
  operariosPorArea: {
    [area: string]: {
      cantidad: number;
      promedio: number;
    };
  };
  tendenciaMensual: {
    mes: string;
    promedio: number;
  }[];
  mejoresOperarios: {
    operarioId: string;
    nombre: string;
    promedio: number;
  }[];
  areasDeRiesgo: {
    area: string;
    promedio: number;
  }[];
}

// 📄 CONFIGURACIÓN DE EXPORTACIÓN
export interface ConfiguracionExportacion {
  tipo: 'PDF' | 'Word';
  incluirGraficos: boolean;
  incluirDetalles: boolean;
  logoEmpresa?: string;
  nombreEmpresa: string;
  fechaGeneracion: string;
}

// Estado de la aplicación
export type AppState = {
  user: User | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
};