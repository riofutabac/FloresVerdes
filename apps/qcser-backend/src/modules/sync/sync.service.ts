import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncLog, SyncOperation, SyncStatus } from '../../entities/sync-log.entity';
import { Evaluation } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../entities/evaluation-photo.entity';

export interface SyncData {
  evaluations: Evaluation[];
  evaluationDetails: EvaluationDetail[];
  evaluationPhotos: EvaluationPhoto[];
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errorCount: number;
  errors: string[];
}

export interface BatchSyncResult {
  totalBatches: number;
  processedBatches: number;
  totalRecords: number;
  syncedRecords: number;
  failedRecords: number;
  errors: string[];
}

export interface ConnectivityStatus {
  isOnline: boolean;
  lastCheckTime: Date;
  consecutiveFailures: number;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly BATCH_SIZE = 50;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay
  private connectivityStatus: ConnectivityStatus = {
    isOnline: true,
    lastCheckTime: new Date(),
    consecutiveFailures: 0,
  };

  constructor(
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(EvaluationDetail)
    private evaluationDetailRepository: Repository<EvaluationDetail>,
    @InjectRepository(EvaluationPhoto)
    private evaluationPhotoRepository: Repository<EvaluationPhoto>,
    private dataSource: DataSource,
  ) {}

  /**
   * Sincroniza datos offline con el servidor
   */
  async syncOfflineData(syncData: SyncData, userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      // Sincronizar evaluaciones
      for (const evaluation of syncData.evaluations) {
        try {
          await this.syncEvaluation(evaluation, userId);
          result.syncedCount++;
        } catch (error) {
          result.errorCount++;
          result.errors.push(`Error syncing evaluation ${evaluation.localId}: ${error.message}`);
          this.logger.error(`Error syncing evaluation ${evaluation.localId}`, error);
        }
      }

      // Sincronizar detalles de evaluación
      for (const detail of syncData.evaluationDetails) {
        try {
          await this.syncEvaluationDetail(detail, userId);
          result.syncedCount++;
        } catch (error) {
          result.errorCount++;
          result.errors.push(`Error syncing evaluation detail ${detail.id}: ${error.message}`);
          this.logger.error(`Error syncing evaluation detail ${detail.id}`, error);
        }
      }

      // Sincronizar fotos de evaluación
      for (const photo of syncData.evaluationPhotos) {
        try {
          await this.syncEvaluationPhoto(photo, userId);
          result.syncedCount++;
        } catch (error) {
          result.errorCount++;
          result.errors.push(`Error syncing evaluation photo ${photo.id}: ${error.message}`);
          this.logger.error(`Error syncing evaluation photo ${photo.id}`, error);
        }
      }

      result.success = result.errorCount === 0;
      return result;
    } catch (error) {
      this.logger.error('Error during sync process', error);
      result.success = false;
      result.errors.push(`General sync error: ${error.message}`);
      return result;
    }
  }

  /**
   * Sincroniza una evaluación individual
   */
  private async syncEvaluation(evaluation: Evaluation, userId: string): Promise<void> {
    const syncLog = this.createSyncLog('evaluations', evaluation.id, SyncOperation.INSERT, userId);

    try {
      // Verificar si ya existe una evaluación con el mismo localId
      const existingEvaluation = await this.evaluationRepository.findOne({
        where: { localId: evaluation.localId },
      });

      if (existingEvaluation) {
        // Actualizar evaluación existente
        await this.evaluationRepository.update(existingEvaluation.id, {
          ...evaluation,
          isSynced: true,
        });
        syncLog.operation = SyncOperation.UPDATE;
      } else {
        // Crear nueva evaluación
        const newEvaluation = this.evaluationRepository.create({
          ...evaluation,
          isSynced: true,
        });
        await this.evaluationRepository.save(newEvaluation);
      }

      syncLog.syncStatus = SyncStatus.SYNCED;
      syncLog.syncTimestamp = new Date();
    } catch (error) {
      syncLog.syncStatus = SyncStatus.ERROR;
      syncLog.errorMessage = error.message;
      throw error;
    } finally {
      await this.syncLogRepository.save(syncLog);
    }
  }

  /**
   * Sincroniza un detalle de evaluación individual
   */
  private async syncEvaluationDetail(detail: EvaluationDetail, userId: string): Promise<void> {
    const syncLog = this.createSyncLog('evaluation_details', detail.id, SyncOperation.INSERT, userId);

    try {
      // Verificar si el detalle ya existe
      const existingDetail = await this.evaluationDetailRepository.findOne({
        where: { id: detail.id },
      });

      if (existingDetail) {
        // Actualizar detalle existente
        await this.evaluationDetailRepository.update(detail.id, detail);
        syncLog.operation = SyncOperation.UPDATE;
      } else {
        // Crear nuevo detalle
        const newDetail = this.evaluationDetailRepository.create(detail);
        await this.evaluationDetailRepository.save(newDetail);
      }

      syncLog.syncStatus = SyncStatus.SYNCED;
      syncLog.syncTimestamp = new Date();
    } catch (error) {
      syncLog.syncStatus = SyncStatus.ERROR;
      syncLog.errorMessage = error.message;
      throw error;
    } finally {
      await this.syncLogRepository.save(syncLog);
    }
  }

  /**
   * Sincroniza una foto de evaluación individual
   */
  private async syncEvaluationPhoto(photo: EvaluationPhoto, userId: string): Promise<void> {
    const syncLog = this.createSyncLog('evaluation_photos', photo.id, SyncOperation.INSERT, userId);

    try {
      // Verificar si la foto ya existe
      const existingPhoto = await this.evaluationPhotoRepository.findOne({
        where: { id: photo.id },
      });

      if (existingPhoto) {
        // Actualizar foto existente
        await this.evaluationPhotoRepository.update(photo.id, photo);
        syncLog.operation = SyncOperation.UPDATE;
      } else {
        // Crear nueva foto
        const newPhoto = this.evaluationPhotoRepository.create(photo);
        await this.evaluationPhotoRepository.save(newPhoto);
      }

      syncLog.syncStatus = SyncStatus.SYNCED;
      syncLog.syncTimestamp = new Date();
    } catch (error) {
      syncLog.syncStatus = SyncStatus.ERROR;
      syncLog.errorMessage = error.message;
      throw error;
    } finally {
      await this.syncLogRepository.save(syncLog);
    }
  }

  /**
   * Obtiene datos pendientes de sincronización para un usuario
   */
  async getPendingSyncData(userId: string): Promise<SyncData> {
    const pendingEvaluations = await this.evaluationRepository.find({
      where: { evaluatorId: userId, isSynced: false },
      relations: ['details', 'photos'],
    });

    const evaluationDetails: EvaluationDetail[] = [];
    const evaluationPhotos: EvaluationPhoto[] = [];

    pendingEvaluations.forEach(evaluation => {
      if (evaluation.details) {
        evaluationDetails.push(...evaluation.details);
      }
      if (evaluation.photos) {
        evaluationPhotos.push(...evaluation.photos);
      }
    });

    return {
      evaluations: pendingEvaluations,
      evaluationDetails,
      evaluationPhotos,
    };
  }

  /**
   * Marca evaluaciones como sincronizadas
   */
  async markAsSynced(evaluationIds: number[]): Promise<void> {
    await this.evaluationRepository.update(
      { id: In(evaluationIds) },
      { isSynced: true }
    );
  }

  /**
   * Obtiene el estado de sincronización para un usuario
   */
  async getSyncStatus(userId: string): Promise<{
    pendingCount: number;
    lastSyncDate: Date | null;
    errorCount: number;
  }> {
    const pendingCount = await this.evaluationRepository.count({
      where: { evaluatorId: userId, isSynced: false },
    });

    const lastSyncLog = await this.syncLogRepository.findOne({
      where: { userId, syncStatus: SyncStatus.SYNCED },
      order: { syncTimestamp: 'DESC' },
    });

    const errorCount = await this.syncLogRepository.count({
      where: { userId, syncStatus: SyncStatus.ERROR },
    });

    return {
      pendingCount,
      lastSyncDate: lastSyncLog?.syncTimestamp || null,
      errorCount,
    };
  }

  /**
   * Resuelve conflictos de sincronización
   */
  async resolveConflicts(conflicts: any[], userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      errorCount: 0,
      errors: [],
    };

    for (const conflict of conflicts) {
      try {
        // Lógica para resolver conflictos basada en timestamp o prioridad
        if (conflict.resolution === 'server_wins') {
          // Mantener la versión del servidor
          continue;
        } else if (conflict.resolution === 'client_wins') {
          // Aplicar la versión del cliente
          await this.applyClientVersion(conflict, userId);
        } else {
          // Merge automático basado en reglas de negocio
          await this.mergeVersions(conflict, userId);
        }
        result.syncedCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push(`Error resolving conflict for ${conflict.type} ${conflict.id}: ${error.message}`);
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  /**
   * Crea un log de sincronización
   */
  private createSyncLog(
    tableName: string,
    recordId: number,
    operation: SyncOperation,
    userId: string,
  ): SyncLog {
    const syncLog = new SyncLog();
    syncLog.tableName = tableName;
    syncLog.recordId = recordId;
    syncLog.operation = operation;
    syncLog.userId = userId;
    syncLog.localTimestamp = new Date();
    syncLog.syncStatus = SyncStatus.PENDING;
    return syncLog;
  }

  /**
   * Aplica la versión del cliente en caso de conflicto
   */
  private async applyClientVersion(conflict: any, userId: string): Promise<void> {
    // Implementar lógica específica para aplicar versión del cliente
    this.logger.log(`Applying client version for conflict: ${conflict.id}`);
  }

  /**
   * Fusiona versiones en caso de conflicto
   */
  private async mergeVersions(conflict: any, userId: string): Promise<void> {
    // Implementar lógica específica para fusionar versiones
    this.logger.log(`Merging versions for conflict: ${conflict.id}`);
  }

  /**
   * Trigger automático de sincronización cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoSync(): Promise<void> {
    this.logger.log('Starting automatic sync check...');
    
    try {
      // Verificar conectividad
      const isConnected = await this.checkConnectivity();
      
      if (!isConnected) {
        this.logger.warn('No connectivity detected, skipping auto sync');
        return;
      }

      // Obtener usuarios con datos pendientes
      const usersWithPendingData = await this.getUsersWithPendingSync();
      
      for (const userId of usersWithPendingData) {
        try {
          await this.processPendingSyncForUser(userId);
        } catch (error) {
          this.logger.error(`Error in auto sync for user ${userId}:`, error);
        }
      }
      
      this.logger.log(`Auto sync completed for ${usersWithPendingData.length} users`);
    } catch (error) {
      this.logger.error('Error in automatic sync process:', error);
    }
  }

  /**
   * Procesa sincronización pendiente para un usuario específico
   */
  async processPendingSyncForUser(userId: string): Promise<BatchSyncResult> {
    this.logger.log(`Processing pending sync for user: ${userId}`);
    
    const pendingData = await this.getPendingSyncData(userId);
    
    if (pendingData.evaluations.length === 0) {
      return {
        totalBatches: 0,
        processedBatches: 0,
        totalRecords: 0,
        syncedRecords: 0,
        failedRecords: 0,
        errors: [],
      };
    }

    return await this.processBatchSync(pendingData, userId);
  }

  /**
   * Procesa sincronización en lotes con reintentos
   */
  async processBatchSync(syncData: SyncData, userId: string): Promise<BatchSyncResult> {
    const totalRecords = syncData.evaluations.length + 
                        syncData.evaluationDetails.length + 
                        syncData.evaluationPhotos.length;
    
    const totalBatches = Math.ceil(syncData.evaluations.length / this.BATCH_SIZE);
    
    const result: BatchSyncResult = {
      totalBatches,
      processedBatches: 0,
      totalRecords,
      syncedRecords: 0,
      failedRecords: 0,
      errors: [],
    };

    // Procesar evaluaciones en lotes
    for (let i = 0; i < syncData.evaluations.length; i += this.BATCH_SIZE) {
      const batch = syncData.evaluations.slice(i, i + this.BATCH_SIZE);
      
      try {
        const batchResult = await this.processBatchWithRetry({
          evaluations: batch,
          evaluationDetails: [],
          evaluationPhotos: [],
        }, userId);
        
        result.syncedRecords += batchResult.syncedCount;
        result.failedRecords += batchResult.errorCount;
        result.errors.push(...batchResult.errors);
        result.processedBatches++;
        
        this.logger.log(`Processed batch ${result.processedBatches}/${totalBatches} for user ${userId}`);
        
        // Pequeña pausa entre lotes para no sobrecargar el sistema
        await this.delay(100);
        
      } catch (error) {
        result.failedRecords += batch.length;
        result.errors.push(`Batch ${result.processedBatches + 1} failed: ${error.message}`);
        this.logger.error(`Batch processing failed for user ${userId}:`, error);
      }
    }

    return result;
  }

  /**
   * Procesa un lote con mecanismo de reintentos exponenciales
   */
  async processBatchWithRetry(batchData: SyncData, userId: string): Promise<SyncResult> {
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const result = await this.syncOfflineData(batchData, userId);
        
        if (result.success) {
          return result;
        }
        
        // Si hay errores pero no es un fallo completo, intentar de nuevo
        if (result.errorCount < batchData.evaluations.length) {
          return result;
        }
        
        lastError = new Error(`Sync failed with ${result.errorCount} errors`);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Sync attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS} failed for user ${userId}:`, error);
      }
      
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        const delay = this.calculateExponentialBackoff(attempt);
        this.logger.log(`Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Calcula el delay para backoff exponencial
   */
  private calculateExponentialBackoff(attempt: number): number {
    return this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * 1000;
  }

  /**
   * Verifica la conectividad del sistema
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Intentar una consulta simple a la base de datos
      await this.dataSource.query('SELECT 1');
      
      this.connectivityStatus = {
        isOnline: true,
        lastCheckTime: new Date(),
        consecutiveFailures: 0,
      };
      
      return true;
    } catch (error) {
      this.connectivityStatus = {
        isOnline: false,
        lastCheckTime: new Date(),
        consecutiveFailures: this.connectivityStatus.consecutiveFailures + 1,
      };
      
      this.logger.warn('Connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Obtiene usuarios con datos pendientes de sincronización
   */
  async getUsersWithPendingSync(): Promise<string[]> {
    const result = await this.evaluationRepository
      .createQueryBuilder('evaluation')
      .select('DISTINCT evaluation.evaluatorId', 'evaluatorId')
      .where('evaluation.isSynced = :isSynced', { isSynced: false })
      .getRawMany();
    
    return result.map(row => row.evaluatorId).filter(id => id);
  }

  /**
   * Valida la integridad de los datos después de la sincronización
   */
  async validateDataIntegrity(userId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Verificar evaluaciones huérfanas (sin operador)
      const orphanedEvaluations = await this.evaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoin('evaluation.operator', 'operator')
        .where('evaluation.evaluatorId = :userId', { userId })
        .andWhere('operator.id IS NULL')
        .getCount();
      
      if (orphanedEvaluations > 0) {
        issues.push(`Found ${orphanedEvaluations} evaluations without valid operator`);
      }
      
      // Verificar detalles huérfanos (sin evaluación)
      const orphanedDetails = await this.evaluationDetailRepository
        .createQueryBuilder('detail')
        .leftJoin('detail.evaluation', 'evaluation')
        .where('evaluation.evaluatorId = :userId', { userId })
        .andWhere('evaluation.id IS NULL')
        .getCount();
      
      if (orphanedDetails > 0) {
        issues.push(`Found ${orphanedDetails} evaluation details without valid evaluation`);
      }
      
      // Verificar consistencia de puntajes
      const inconsistentScores = await this.evaluationRepository
        .createQueryBuilder('evaluation')
        .where('evaluation.evaluatorId = :userId', { userId })
        .andWhere('evaluation.compliancePercentage < 0 OR evaluation.compliancePercentage > 100')
        .getCount();
      
      if (inconsistentScores > 0) {
        issues.push(`Found ${inconsistentScores} evaluations with invalid compliance percentage`);
      }
      
      return {
        isValid: issues.length === 0,
        issues,
      };
      
    } catch (error) {
      this.logger.error('Error validating data integrity:', error);
      return {
        isValid: false,
        issues: [`Data integrity validation failed: ${error.message}`],
      };
    }
  }

  /**
   * Notifica el estado de finalización de sincronización
   */
  async notifySyncCompletion(userId: string, result: BatchSyncResult): Promise<void> {
    this.logger.log(`Sync completed for user ${userId}:`, {
      totalRecords: result.totalRecords,
      syncedRecords: result.syncedRecords,
      failedRecords: result.failedRecords,
      successRate: ((result.syncedRecords / result.totalRecords) * 100).toFixed(2) + '%',
    });
    
    // Aquí se podría implementar notificaciones push, emails, etc.
    // Por ahora solo registramos en logs
    
    if (result.failedRecords > 0) {
      this.logger.warn(`Sync completed with ${result.failedRecords} failures for user ${userId}`);
    }
  }

  /**
   * Obtiene el estado de conectividad actual
   */
  getConnectivityStatus(): ConnectivityStatus {
    return { ...this.connectivityStatus };
  }

  /**
   * Fuerza una sincronización inmediata para un usuario
   */
  async forceSyncForUser(userId: string): Promise<BatchSyncResult> {
    this.logger.log(`Forcing sync for user: ${userId}`);
    
    const isConnected = await this.checkConnectivity();
    if (!isConnected) {
      throw new Error('Cannot force sync: no connectivity available');
    }
    
    const result = await this.processPendingSyncForUser(userId);
    await this.notifySyncCompletion(userId, result);
    
    // Validar integridad después de la sincronización
    const integrityCheck = await this.validateDataIntegrity(userId);
    if (!integrityCheck.isValid) {
      this.logger.warn(`Data integrity issues found for user ${userId}:`, integrityCheck.issues);
    }
    
    return result;
  }

  /**
   * Utilidad para crear delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}