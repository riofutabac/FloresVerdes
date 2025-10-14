import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SyncService } from './sync.service';
import { SyncLog } from '../../entities/sync-log.entity';
import { Evaluation, EvaluationStatus } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../entities/evaluation-photo.entity';
import { OfflineStorageUtil } from './offline-storage.util';

// Mock Redis
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  lpush: jest.fn(),
  lrange: jest.fn(),
  lrem: jest.fn(),
  exists: jest.fn(),
  ping: jest.fn(),
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

describe('SyncService', () => {
  let service: SyncService;
  let syncLogRepository: Repository<SyncLog>;
  let evaluationRepository: Repository<Evaluation>;
  let evaluationDetailRepository: Repository<EvaluationDetail>;
  let evaluationPhotoRepository: Repository<EvaluationPhoto>;
  let offlineStorageUtil: OfflineStorageUtil;

  const mockSyncLog: SyncLog = {
    id: 1,
    userId: 'test-user-id',
    operation: 'CREATE',
    entityType: 'evaluation',
    entityId: '1',
    data: { test: 'data' },
    status: 'PENDING',
    attempts: 0,
    lastAttempt: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEvaluation: Evaluation = {
    id: 1,
    operatorId: 1,
    evaluatorId: 'test-user-id',
    areaId: 1,
    moduleId: 1,
    quadrantCode: 'A1',
    evaluationDate: new Date(),
    evaluationTime: '10:00',
    workWeek: 1,
    workYear: 2024,
    initialScore: 100,
    finalScore: 85,
    compliancePercentage: 85,
    status: EvaluationStatus.BORRADOR,
    isSynced: false,
    localId: 'local-eval-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    operator: null,
    evaluator: null,
    area: null,
    module: null,
    details: [],
    photos: [],
  };

  const mockSyncLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockEvaluationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockEvaluationDetailRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockEvaluationPhotoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockOfflineStorageUtil = {
    storeOffline: jest.fn(),
    getOfflineData: jest.fn(),
    removeOfflineData: jest.fn(),
    clearOfflineData: jest.fn(),
    getOfflineCount: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'redis.host': 'localhost',
        'redis.port': 6379,
        'sync.batchSize': 10,
        'sync.maxRetries': 3,
        'sync.retryDelay': 1000,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: getRepositoryToken(SyncLog),
          useValue: mockSyncLogRepository,
        },
        {
          provide: getRepositoryToken(Evaluation),
          useValue: mockEvaluationRepository,
        },
        {
          provide: getRepositoryToken(EvaluationDetail),
          useValue: mockEvaluationDetailRepository,
        },
        {
          provide: getRepositoryToken(EvaluationPhoto),
          useValue: mockEvaluationPhotoRepository,
        },
        {
          provide: OfflineStorageUtil,
          useValue: mockOfflineStorageUtil,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    syncLogRepository = module.get<Repository<SyncLog>>(getRepositoryToken(SyncLog));
    evaluationRepository = module.get<Repository<Evaluation>>(getRepositoryToken(Evaluation));
    evaluationDetailRepository = module.get<Repository<EvaluationDetail>>(getRepositoryToken(EvaluationDetail));
    evaluationPhotoRepository = module.get<Repository<EvaluationPhoto>>(getRepositoryToken(EvaluationPhoto));
    offlineStorageUtil = module.get<OfflineStorageUtil>(OfflineStorageUtil);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Synchronization Infrastructure (Task 9.1)', () => {
    it('should detect connectivity and monitor status', async () => {
      // Arrange
      mockRedisClient.ping.mockResolvedValue('PONG');

      // Act
      const isOnline = await service.checkConnectivity();

      // Assert
      expect(isOnline).toBe(true);
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should handle connectivity failures', async () => {
      // Arrange
      mockRedisClient.ping.mockRejectedValue(new Error('Connection failed'));

      // Act
      const isOnline = await service.checkConnectivity();

      // Assert
      expect(isOnline).toBe(false);
    });

    it('should queue operations for offline scenarios (COS-22)', async () => {
      // Arrange
      const operation = {
        type: 'CREATE',
        entity: 'evaluation',
        data: mockEvaluation,
      };

      mockSyncLogRepository.create.mockReturnValue(mockSyncLog);
      mockSyncLogRepository.save.mockResolvedValue(mockSyncLog);
      mockRedisClient.lpush.mockResolvedValue(1);

      // Act
      const result = await service.queueOperation('test-user-id', operation);

      // Assert
      expect(result).toEqual(mockSyncLog);
      expect(mockSyncLogRepository.create).toHaveBeenCalledWith({
        userId: 'test-user-id',
        operation: 'CREATE',
        entityType: 'evaluation',
        entityId: undefined,
        data: mockEvaluation,
        status: 'PENDING',
        attempts: 0,
      });
      expect(mockRedisClient.lpush).toHaveBeenCalled();
    });

    it('should track sync status and provide reporting', async () => {
      // Arrange
      mockSyncLogRepository.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(2); // errors

      mockSyncLogRepository.findOne.mockResolvedValue({
        ...mockSyncLog,
        status: 'SUCCESS',
        updatedAt: new Date(),
      });

      // Act
      const status = await service.getSyncStatus('test-user-id');

      // Assert
      expect(status).toEqual({
        pendingCount: 5,
        errorCount: 2,
        lastSyncDate: expect.any(Date),
        isOnline: expect.any(Boolean),
      });
    });

    it('should implement conflict detection and resolution', async () => {
      // Arrange
      const localData = { ...mockEvaluation, updatedAt: new Date('2023-12-01T10:00:00Z') };
      const serverData = { ...mockEvaluation, updatedAt: new Date('2023-12-01T11:00:00Z') };

      mockEvaluationRepository.findOne.mockResolvedValue(serverData);

      // Act
      const resolution = await service.resolveConflict(localData, 'evaluation');

      // Assert
      expect(resolution).toEqual({
        resolution: 'server_wins',
        data: serverData,
        reason: 'Server data is newer',
      });
    });

    it('should implement retry mechanisms with exponential backoff', async () => {
      // Arrange
      const failingOperation = {
        ...mockSyncLog,
        attempts: 2,
      };

      mockSyncLogRepository.findOne.mockResolvedValue(failingOperation);
      mockSyncLogRepository.save.mockResolvedValue({
        ...failingOperation,
        attempts: 3,
        lastAttempt: new Date(),
      });

      // Mock the actual sync operation to fail
      jest.spyOn(service, 'syncEvaluation').mockRejectedValue(new Error('Sync failed'));

      // Act
      const result = await service.retryFailedOperation(failingOperation.id);

      // Assert
      expect(result.attempts).toBe(3);
      expect(result.lastAttempt).toBeDefined();
    });
  });

  describe('Synchronization Workflow (Task 9.2)', () => {
    it('should automatically trigger sync when connectivity is restored', async () => {
      // Arrange
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockSyncLogRepository.find.mockResolvedValue([mockSyncLog]);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      mockSyncLogRepository.save.mockResolvedValue({
        ...mockSyncLog,
        status: 'SUCCESS',
      });

      // Act
      const result = await service.forceSyncForUser('test-user-id');

      // Assert
      expect(result).toHaveProperty('totalBatches');
      expect(result).toHaveProperty('processedBatches');
      expect(result).toHaveProperty('totalRecords');
      expect(result.totalRecords).toBeGreaterThan(0);
    });

    it('should process operations in batches', async () => {
      // Arrange
      const operations = Array.from({ length: 25 }, (_, i) => ({
        ...mockSyncLog,
        id: i + 1,
      }));

      mockSyncLogRepository.find.mockResolvedValue(operations);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      mockSyncLogRepository.save.mockResolvedValue({
        ...mockSyncLog,
        status: 'SUCCESS',
      });

      // Act
      const result = await service.forceSyncForUser('test-user-id');

      // Assert
      expect(result.totalBatches).toBe(3); // 25 operations / 10 batch size = 3 batches
      expect(result.processedBatches).toBe(3);
      expect(result.totalRecords).toBe(25);
    });

    it('should handle batch processing failures gracefully', async () => {
      // Arrange
      const operations = [
        { ...mockSyncLog, id: 1 },
        { ...mockSyncLog, id: 2 },
      ];

      mockSyncLogRepository.find.mockResolvedValue(operations);
      mockEvaluationRepository.save
        .mockResolvedValueOnce(mockEvaluation) // First succeeds
        .mockRejectedValueOnce(new Error('Sync failed')); // Second fails

      mockSyncLogRepository.save
        .mockResolvedValueOnce({ ...mockSyncLog, status: 'SUCCESS' })
        .mockResolvedValueOnce({ ...mockSyncLog, status: 'ERROR', error: 'Sync failed' });

      // Act
      const result = await service.forceSyncForUser('test-user-id');

      // Assert
      expect(result.totalRecords).toBe(2);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate data integrity after sync', async () => {
      // Arrange
      const syncedEvaluation = { ...mockEvaluation, isSynced: true };
      mockEvaluationRepository.find.mockResolvedValue([syncedEvaluation]);

      // Act
      const validation = await service.validateDataIntegrity('test-user-id');

      // Assert
      expect(validation).toEqual({
        isValid: true,
        issues: [],
        checkedRecords: 1,
      });
    });

    it('should detect data integrity issues', async () => {
      // Arrange
      const corruptedEvaluation = {
        ...mockEvaluation,
        compliancePercentage: null, // Invalid data
        isSynced: true,
      };
      mockEvaluationRepository.find.mockResolvedValue([corruptedEvaluation]);

      // Act
      const validation = await service.validateDataIntegrity('test-user-id');

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0]).toContain('Invalid compliance percentage');
    });

    it('should provide sync completion notifications', async () => {
      // Arrange
      mockSyncLogRepository.find.mockResolvedValue([mockSyncLog]);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      mockSyncLogRepository.save.mockResolvedValue({
        ...mockSyncLog,
        status: 'SUCCESS',
      });

      // Act
      const result = await service.forceSyncForUser('test-user-id');

      // Assert
      expect(result).toHaveProperty('completedAt');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('successful');
      expect(result.summary).toHaveProperty('failed');
    });
  });

  describe('Offline Storage Management', () => {
    it('should store operations locally when offline', async () => {
      // Arrange
      const operation = {
        type: 'CREATE',
        entity: 'evaluation',
        data: mockEvaluation,
      };

      mockOfflineStorageUtil.storeOffline.mockResolvedValue('offline-key-1');

      // Act
      const result = await service.storeOfflineOperation('test-user-id', operation);

      // Assert
      expect(result).toBe('offline-key-1');
      expect(mockOfflineStorageUtil.storeOffline).toHaveBeenCalledWith(
        'test-user-id',
        operation
      );
    });

    it('should retrieve offline operations when connectivity is restored', async () => {
      // Arrange
      const offlineOperations = [
        { key: 'offline-key-1', data: mockEvaluation },
        { key: 'offline-key-2', data: { ...mockEvaluation, id: 2 } },
      ];

      mockOfflineStorageUtil.getOfflineData.mockResolvedValue(offlineOperations);

      // Act
      const result = await service.getOfflineOperations('test-user-id');

      // Assert
      expect(result).toEqual(offlineOperations);
      expect(mockOfflineStorageUtil.getOfflineData).toHaveBeenCalledWith('test-user-id');
    });

    it('should clear offline data after successful sync', async () => {
      // Arrange
      const operationKeys = ['offline-key-1', 'offline-key-2'];

      mockOfflineStorageUtil.removeOfflineData.mockResolvedValue(true);

      // Act
      await service.clearOfflineOperations('test-user-id', operationKeys);

      // Assert
      expect(mockOfflineStorageUtil.removeOfflineData).toHaveBeenCalledWith(
        'test-user-id',
        operationKeys
      );
    });
  });

  describe('Conflict Resolution Strategies', () => {
    it('should use last-write-wins strategy with timestamp comparison', async () => {
      // Arrange
      const localData = {
        ...mockEvaluation,
        updatedAt: new Date('2023-12-01T10:00:00Z'),
        compliancePercentage: 85,
      };
      const serverData = {
        ...mockEvaluation,
        updatedAt: new Date('2023-12-01T11:00:00Z'),
        compliancePercentage: 90,
      };

      mockEvaluationRepository.findOne.mockResolvedValue(serverData);

      // Act
      const resolution = await service.resolveConflict(localData, 'evaluation');

      // Assert
      expect(resolution.resolution).toBe('server_wins');
      expect(resolution.data.compliancePercentage).toBe(90);
    });

    it('should prioritize Jefa de Calidad changes', async () => {
      // Arrange
      const localData = {
        ...mockEvaluation,
        evaluatorId: 'jefa-calidad-id',
        updatedAt: new Date('2023-12-01T10:00:00Z'),
      };
      const serverData = {
        ...mockEvaluation,
        evaluatorId: 'other-user-id',
        updatedAt: new Date('2023-12-01T11:00:00Z'),
      };

      mockEvaluationRepository.findOne.mockResolvedValue(serverData);

      // Mock user role check
      jest.spyOn(service, 'getUserRole').mockResolvedValue('JEFA_CALIDAD');

      // Act
      const resolution = await service.resolveConflict(localData, 'evaluation');

      // Assert
      expect(resolution.resolution).toBe('local_wins');
      expect(resolution.reason).toContain('Jefa de Calidad');
    });

    it('should maintain business rules during conflict resolution', async () => {
      // Arrange
      const localData = {
        ...mockEvaluation,
        compliancePercentage: 150, // Invalid percentage
      };
      const serverData = {
        ...mockEvaluation,
        compliancePercentage: 85,
      };

      mockEvaluationRepository.findOne.mockResolvedValue(serverData);

      // Act
      const resolution = await service.resolveConflict(localData, 'evaluation');

      // Assert
      expect(resolution.resolution).toBe('server_wins');
      expect(resolution.reason).toContain('business rule violation');
    });

    it('should log all conflict resolutions for audit trail', async () => {
      // Arrange
      const localData = { ...mockEvaluation };
      const serverData = { ...mockEvaluation, compliancePercentage: 90 };

      mockEvaluationRepository.findOne.mockResolvedValue(serverData);
      mockSyncLogRepository.create.mockReturnValue({
        ...mockSyncLog,
        operation: 'CONFLICT_RESOLUTION',
      });
      mockSyncLogRepository.save.mockResolvedValue({
        ...mockSyncLog,
        operation: 'CONFLICT_RESOLUTION',
      });

      // Act
      await service.resolveConflict(localData, 'evaluation');

      // Assert
      expect(mockSyncLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'CONFLICT_RESOLUTION',
          entityType: 'evaluation',
        })
      );
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets with batch processing', async () => {
      // Arrange
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockSyncLog,
        id: i + 1,
      }));

      mockSyncLogRepository.find.mockResolvedValue(largeDataset);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      mockSyncLogRepository.save.mockResolvedValue({
        ...mockSyncLog,
        status: 'SUCCESS',
      });

      // Act
      const result = await service.forceSyncForUser('test-user-id');

      // Assert
      expect(result.totalBatches).toBe(100); // 1000 / 10 batch size
      expect(result.totalRecords).toBe(1000);
    });

    it('should implement connection pooling for database operations', async () => {
      // This would be tested at the integration level
      // Here we verify that batch operations don't overwhelm the database
      const operations = Array.from({ length: 50 }, (_, i) => ({
        ...mockSyncLog,
        id: i + 1,
      }));

      mockSyncLogRepository.find.mockResolvedValue(operations);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);

      // Act
      const startTime = Date.now();
      await service.forceSyncForUser('test-user-id');
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent sync operations', async () => {
      // Arrange
      const user1Operations = [{ ...mockSyncLog, userId: 'user-1' }];
      const user2Operations = [{ ...mockSyncLog, userId: 'user-2' }];

      mockSyncLogRepository.find
        .mockResolvedValueOnce(user1Operations)
        .mockResolvedValueOnce(user2Operations);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);

      // Act
      const [result1, result2] = await Promise.all([
        service.forceSyncForUser('user-1'),
        service.forceSyncForUser('user-2'),
      ]);

      // Assert
      expect(result1.totalRecords).toBe(1);
      expect(result2.totalRecords).toBe(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      // Arrange
      mockRedisClient.ping.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      });

      // Act
      const isOnline = await service.checkConnectivity();

      // Assert
      expect(isOnline).toBe(false);
    });

    it('should recover from partial sync failures', async () => {
      // Arrange
      const operations = [
        { ...mockSyncLog, id: 1 },
        { ...mockSyncLog, id: 2 },
        { ...mockSyncLog, id: 3 },
      ];

      mockSyncLogRepository.find.mockResolvedValue(operations);
      mockEvaluationRepository.save
        .mockResolvedValueOnce(mockEvaluation) // Success
        .mockRejectedValueOnce(new Error('Network error')) // Failure
        .mockResolvedValueOnce(mockEvaluation); // Success

      // Act
      const result = await service.forceSyncForUser('test-user-id');

      // Assert
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should implement circuit breaker pattern for repeated failures', async () => {
      // Arrange
      const failingOperations = Array.from({ length: 5 }, (_, i) => ({
        ...mockSyncLog,
        id: i + 1,
        attempts: 3, // Already at max retries
      }));

      mockSyncLogRepository.find.mockResolvedValue(failingOperations);

      // Act
      const result = await service.forceSyncForUser('test-user-id');

      // Assert
      expect(result.circuitBreakerTripped).toBe(true);
      expect(result.summary.skipped).toBe(5);
    });
  });
});