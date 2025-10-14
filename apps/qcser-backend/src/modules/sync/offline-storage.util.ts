/**
 * Utilidades para manejo de almacenamiento offline
 * Estas funciones están diseñadas para ser utilizadas en el frontend
 * pero se documentan aquí para referencia de la API
 */

export interface OfflineStorageConfig {
  dbName: string;
  version: number;
  stores: string[];
}

export interface OfflineEvaluation {
  localId: string;
  operatorId: number;
  evaluatorId: string;
  areaId: number;
  quadrantCode: string;
  moduleId: number;
  evaluationDate: string;
  evaluationTime: string;
  workWeek: number;
  workYear: number;
  initialScore: number;
  finalScore: number;
  compliancePercentage: number;
  generalObservations?: string;
  status: 'borrador' | 'cerrada';
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
  details: OfflineEvaluationDetail[];
  photos: OfflineEvaluationPhoto[];
}

export interface OfflineEvaluationDetail {
  localId: string;
  evaluationLocalId: string;
  parameterId: number;
  isCompliant: boolean;
  weightApplied: number;
  observations?: string;
  createdAt: string;
}

export interface OfflineEvaluationPhoto {
  localId: string;
  evaluationLocalId: string;
  subprocessId: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadOrder: number;
  createdAt: string;
}

/**
 * Configuración por defecto para IndexedDB
 */
export const DEFAULT_OFFLINE_CONFIG: OfflineStorageConfig = {
  dbName: 'QCSEROfflineDB',
  version: 1,
  stores: [
    'evaluations',
    'evaluationDetails',
    'evaluationPhotos',
    'operators',
    'parameters',
    'areas',
    'modules',
    'subprocesses',
    'roseVarieties',
    'supervisors',
  ],
};

/**
 * Estructura de datos para sincronización
 */
export interface SyncPayload {
  evaluations: OfflineEvaluation[];
  timestamp: string;
  userId: string;
  deviceId: string;
}

/**
 * Respuesta de sincronización
 */
export interface SyncResponse {
  success: boolean;
  syncedCount: number;
  errorCount: number;
  errors: string[];
  conflicts?: ConflictData[];
}

/**
 * Datos de conflicto para resolución
 */
export interface ConflictData {
  type: 'evaluation' | 'detail' | 'photo';
  localId: string;
  serverId?: number;
  localVersion: any;
  serverVersion: any;
  conflictReason: string;
}

/**
 * Utilidades para generar IDs únicos offline
 */
export class OfflineIdGenerator {
  /**
   * Genera un UUID v4 para uso offline
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Genera un ID único basado en timestamp y random
   */
  static generateTimestampId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}-${random}`;
  }
}

/**
 * Utilidades para validación de datos offline
 */
export class OfflineDataValidator {
  /**
   * Valida una evaluación offline antes de sincronizar
   */
  static validateEvaluation(evaluation: OfflineEvaluation): string[] {
    const errors: string[] = [];

    if (!evaluation.localId) {
      errors.push('LocalId es requerido');
    }

    if (!evaluation.operatorId) {
      errors.push('OperatorId es requerido');
    }

    if (!evaluation.evaluatorId) {
      errors.push('EvaluatorId es requerido');
    }

    if (!evaluation.evaluationDate) {
      errors.push('Fecha de evaluación es requerida');
    }

    if (evaluation.workWeek < 1 || evaluation.workWeek > 53) {
      errors.push('Semana de trabajo debe estar entre 1 y 53');
    }

    if (evaluation.compliancePercentage < 0 || evaluation.compliancePercentage > 100) {
      errors.push('Porcentaje de cumplimiento debe estar entre 0 y 100');
    }

    return errors;
  }

  /**
   * Valida un detalle de evaluación offline
   */
  static validateEvaluationDetail(detail: OfflineEvaluationDetail): string[] {
    const errors: string[] = [];

    if (!detail.localId) {
      errors.push('LocalId es requerido');
    }

    if (!detail.evaluationLocalId) {
      errors.push('EvaluationLocalId es requerido');
    }

    if (!detail.parameterId) {
      errors.push('ParameterId es requerido');
    }

    if (typeof detail.isCompliant !== 'boolean') {
      errors.push('IsCompliant debe ser un valor booleano');
    }

    if (detail.weightApplied < 0 || detail.weightApplied > 100) {
      errors.push('Peso aplicado debe estar entre 0 y 100');
    }

    return errors;
  }
}

/**
 * Utilidades para compresión de datos offline
 */
export class OfflineDataCompressor {
  /**
   * Comprime datos de evaluación para reducir el tamaño de transferencia
   */
  static compressEvaluationData(evaluations: OfflineEvaluation[]): string {
    // Implementar compresión LZ-string o similar
    return JSON.stringify(evaluations);
  }

  /**
   * Descomprime datos de evaluación
   */
  static decompressEvaluationData(compressedData: string): OfflineEvaluation[] {
    // Implementar descompresión correspondiente
    return JSON.parse(compressedData);
  }
}

/**
 * Utilidades para manejo de archivos offline
 */
export class OfflineFileManager {
  /**
   * Convierte un archivo a base64 para almacenamiento offline
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Convierte base64 de vuelta a archivo
   */
  static base64ToFile(base64: string, fileName: string, mimeType: string): File {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], fileName, { type: mimeType });
  }

  /**
   * Calcula el hash de un archivo para detectar duplicados
   */
  static async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}