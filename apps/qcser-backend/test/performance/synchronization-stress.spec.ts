import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDataFactory } from '../factories/test-data.factory';
import { SyncService } from '../../src/modules/sync/sync.service';

describe('Synchronization Stress Testing', () => {
  let app: INestApplication;
  let syncService: SyncService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            autoLoadEntities: true,
            synchronize: true,
            dropSchema: true,
          }),
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    syncService = moduleFixture.get<SyncService>(SyncService);
    await app.init();

    // Setup authentication
    const testUser = TestDataFactory.createJefeCalidadUser();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testUser.email,
        password: 'TestPassword123!',
        fullName: testUser.fullName,
        role: testUser.role,
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Offline Operation Queue Performance', () => {
    it('should handle large number of offline operations efficiently', async () => {
      // Arrange
      const operationCount = 1000;
      const batchSize = 50;

      // Act - Create offline operations in batches
      const startTime = Date.now();
      let totalOperations = 0;

      for (let i = 0; i < operationCount; i += batchSize) {
        const currentBatchSize = Math.min(batchSize, operationCount - i);
        const operations = Array.from({ length: currentBatchSize }, (_, index) => ({
          type: 'CREATE',
          entity: 'evaluation',
          entityId: `offline-eval-${i + index}`,
          data: TestDataFactory.createEvaluationDto({
            quadrantCode: `OFFLINE${i + index}`,
          }),
          timestamp: new Date(),
        }));

        // Simulate adding operations to sync queue
        for (const operation of operations) {
          await syncService.queueOperation(operation.type, operation.entity, operation.entityId, operation.data);
          totalOperations++;
        }
      }

      const queueTime = Date.now() - startTime;

      // Assert
      expect(totalOperations).toBe(operationCount);
      expect(queueTime).toBeLessThan(30000); // Queue operations within 30 seconds

      const operationsPerSecond = totalOperations / (queueTime / 1000);
      expect(operationsPerSecond).toBeGreaterThan(10); // At least 10 operations per second

      console.log(`Offline Operation Queue Performance:
        - Operations queued: ${totalOperations}
        - Queue time: ${queueTime}ms
        - Operations per second: ${operationsPerSecond.toFixed(2)}
        - Average time per operation: ${(queueTime / totalOperations).toFixed(2)}ms`);
    });

    it('should handle mixed operation types efficiently', async () => {
      // Arrange
      const operationTypes = ['CREATE', 'UPDATE', 'DELETE'];
      const operationsPerType = 100;
      const totalOperations = operationTypes.length * operationsPerType;

      // Act
      const startTime = Date.now();
      let processedOperations = 0;

      for (const operationType of operationTypes) {
        for (let i = 0; i < operationsPerType; i++) {
          const entityId = `mixed-${operationType.toLowerCase()}-${i}`;
          let data;

          switch (operationType) {
            case 'CREATE':
              data = TestDataFactory.createEvaluationDto({
                quadrantCode: `CREATE${i}`,
              });
              break;
            case 'UPDATE':
              data = { generalObservations: `Updated observation ${i}` };
              break;
            case 'DELETE':
              data = { reason: `Deletion reason ${i}` };
              break;
          }

          await syncService.queueOperation(operationType, 'evaluation', entityId, data);
          processedOperations++;
        }
      }

      const processingTime = Date.now() - startTime;

      // Assert
      expect(processedOperations).toBe(totalOperations);
      expect(processingTime).toBeLessThan(20000); // Process within 20 seconds

      console.log(`Mixed Operation Types Performance:
        - Total operations: ${totalOperations}
        - Processing time: ${processingTime}ms
        - Operations per second: ${(totalOperations / (processingTime / 1000)).toFixed(2)}
        - Operations per type: ${operationsPerType}`);
    });

    it('should handle priority queue operations efficiently', async () => {
      // Arrange
      const highPriorityOps = 50;
      const normalPriorityOps = 200;
      const lowPriorityOps = 100;

      // Act
      const startTime = Date.now();

      // Add operations with different priorities
      const promises = [];

      // High priority operations (evaluations)
      for (let i = 0; i < highPriorityOps; i++) {
        promises.push(
          syncService.queueOperation('CREATE', 'evaluation', `high-${i}`, 
            TestDataFactory.createEvaluationDto({ quadrantCode: `HIGH${i}` }), 'high')
        );
      }

      // Normal priority operations (operators)
      for (let i = 0; i < normalPriorityOps; i++) {
        promises.push(
          syncService.queueOperation('CREATE', 'operator', `normal-${i}`, 
            TestDataFactory.createOperatorDto({ employeeId: `NORM${i}` }), 'normal')
        );
      }

      // Low priority operations (reports)
      for (let i = 0; i < lowPriorityOps; i++) {
        promises.push(
          syncService.queueOperation('CREATE', 'report', `low-${i}`, 
            { reportType: 'general', data: `report-${i}` }, 'low')
        );
      }

      await Promise.all(promises);
      const queueTime = Date.now() - startTime;

      const totalOperations = highPriorityOps + normalPriorityOps + lowPriorityOps;

      // Assert
      expect(queueTime).toBeLessThan(25000); // Queue all operations within 25 seconds

      console.log(`Priority Queue Performance:
        - High priority operations: ${highPriorityOps}
        - Normal priority operations: ${normalPriorityOps}
        - Low priority operations: ${lowPriorityOps}
        - Total operations: ${totalOperations}
        - Queue time: ${queueTime}ms
        - Operations per second: ${(totalOperations / (queueTime / 1000)).toFixed(2)}`);
    });
  });

  describe('Synchronization Processing Performance', () => {
    it('should handle batch synchronization efficiently', async () => {
      // Arrange - Create pending sync operations
      const batchSize = 100;
      const totalBatches = 5;
      const totalOperations = batchSize * totalBatches;

      // Queue operations first
      for (let batch = 0; batch < totalBatches; batch++) {
        for (let i = 0; i < batchSize; i++) {
          const operationId = batch * batchSize + i;
          await syncService.queueOperation('CREATE', 'evaluation', `batch-${operationId}`, 
            TestDataFactory.createEvaluationDto({ quadrantCode: `BATCH${operationId}` }));
        }
      }

      // Act - Process synchronization in batches
      const startTime = Date.now();
      let processedBatches = 0;
      let totalProcessed = 0;

      for (let batch = 0; batch < totalBatches; batch++) {
        const batchStartTime = Date.now();
        const result = await syncService.processPendingOperations(batchSize);
        const batchTime = Date.now() - batchStartTime;

        processedBatches++;
        totalProcessed += result.processed;

        expect(batchTime).toBeLessThan(5000); // Each batch within 5 seconds
        expect(result.processed).toBeGreaterThan(0);
      }

      const totalSyncTime = Date.now() - startTime;

      // Assert
      expect(processedBatches).toBe(totalBatches);
      expect(totalProcessed).toBeGreaterThan(totalOperations * 0.8); // At least 80% processed
      expect(totalSyncTime).toBeLessThan(30000); // Total sync within 30 seconds

      console.log(`Batch Synchronization Performance:
        - Total operations: ${totalOperations}
        - Processed operations: ${totalProcessed}
        - Processing batches: ${processedBatches}
        - Total sync time: ${totalSyncTime}ms
        - Operations per second: ${(totalProcessed / (totalSyncTime / 1000)).toFixed(2)}
        - Average batch time: ${(totalSyncTime / processedBatches).toFixed(2)}ms`);
    });

    it('should handle conflict resolution efficiently', async () => {
      // Arrange - Create conflicting operations
      const conflictCount = 50;
      const entityId = 'conflict-test-entity';

      // Create multiple updates to the same entity (simulating conflicts)
      const conflictOperations = Array.from({ length: conflictCount }, (_, index) => ({
        type: 'UPDATE',
        entity: 'evaluation',
        entityId,
        data: {
          generalObservations: `Conflict update ${index}`,
          timestamp: new Date(Date.now() + index * 1000), // Different timestamps
        },
      }));

      // Queue all conflicting operations
      for (const operation of conflictOperations) {
        await syncService.queueOperation(operation.type, operation.entity, operation.entityId, operation.data);
      }

      // Act - Process conflicts
      const startTime = Date.now();
      const result = await syncService.resolveConflicts(entityId);
      const conflictResolutionTime = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(result.resolved).toBeGreaterThan(0);
      expect(conflictResolutionTime).toBeLessThan(3000); // Conflict resolution within 3 seconds

      console.log(`Conflict Resolution Performance:
        - Conflicting operations: ${conflictCount}
        - Resolved conflicts: ${result.resolved}
        - Resolution time: ${conflictResolutionTime}ms
        - Conflicts per second: ${(result.resolved / (conflictResolutionTime / 1000)).toFixed(2)}
        - Resolution strategy: ${result.strategy || 'last-write-wins'}`);
    });

    it('should handle retry mechanism performance', async () => {
      // Arrange - Create operations that will fail initially
      const retryOperations = 30;
      const maxRetries = 3;

      // Queue operations that simulate network failures
      for (let i = 0; i < retryOperations; i++) {
        await syncService.queueOperation('CREATE', 'evaluation', `retry-${i}`, 
          TestDataFactory.createEvaluationDto({ 
            quadrantCode: `RETRY${i}`,
            // Add flag to simulate failure
            _simulateFailure: i < retryOperations / 2, // Half will fail initially
          }));
      }

      // Act - Process with retry mechanism
      const startTime = Date.now();
      let totalRetries = 0;
      let successfulOperations = 0;

      // Process operations with retry logic
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const attemptStartTime = Date.now();
        const result = await syncService.processPendingOperations(retryOperations);
        const attemptTime = Date.now() - attemptStartTime;

        totalRetries += result.retries || 0;
        successfulOperations += result.processed || 0;

        console.log(`Retry attempt ${attempt + 1}: ${result.processed} processed, ${result.retries || 0} retries, ${attemptTime}ms`);

        if (result.processed === 0 && (result.retries || 0) === 0) {
          break; // No more operations to process
        }
      }

      const totalRetryTime = Date.now() - startTime;

      // Assert
      expect(successfulOperations).toBeGreaterThan(retryOperations * 0.7); // At least 70% success
      expect(totalRetryTime).toBeLessThan(20000); // Total retry process within 20 seconds

      console.log(`Retry Mechanism Performance:
        - Operations with retries: ${retryOperations}
        - Successful operations: ${successfulOperations}
        - Total retries: ${totalRetries}
        - Total retry time: ${totalRetryTime}ms
        - Success rate: ${(successfulOperations / retryOperations * 100).toFixed(2)}%
        - Average retries per operation: ${(totalRetries / retryOperations).toFixed(2)}`);
    });
  });

  describe('Real-time Synchronization Performance', () => {
    it('should handle real-time sync status updates efficiently', async () => {
      // Arrange
      const statusUpdates = 200;
      const updateInterval = 10; // ms

      // Act
      const startTime = Date.now();
      const statusPromises = [];

      for (let i = 0; i < statusUpdates; i++) {
        statusPromises.push(
          new Promise(resolve => {
            setTimeout(async () => {
              const response = await request(app.getHttpServer())
                .get('/sync/status')
                .set('Authorization', `Bearer ${authToken}`);
              resolve({ status: response.status, time: Date.now() });
            }, i * updateInterval);
          })
        );
      }

      const results = await Promise.all(statusPromises);
      const totalTime = Date.now() - startTime;

      // Assert
      const successfulUpdates = results.filter(r => r.status === 200).length;
      expect(successfulUpdates).toBeGreaterThan(statusUpdates * 0.95); // At least 95% success
      expect(totalTime).toBeLessThan(15000); // All updates within 15 seconds

      console.log(`Real-time Sync Status Performance:
        - Status updates: ${statusUpdates}
        - Successful updates: ${successfulUpdates}
        - Total time: ${totalTime}ms
        - Updates per second: ${(successfulUpdates / (totalTime / 1000)).toFixed(2)}
        - Average response time: ${(totalTime / successfulUpdates).toFixed(2)}ms`);
    });

    it('should handle concurrent sync operations efficiently', async () => {
      // Arrange
      const concurrentSyncs = 10;
      const operationsPerSync = 20;

      // Act
      const startTime = Date.now();
      const syncPromises = Array.from({ length: concurrentSyncs }, async (_, syncIndex) => {
        // Queue operations for this sync
        for (let i = 0; i < operationsPerSync; i++) {
          await syncService.queueOperation('CREATE', 'evaluation', `concurrent-${syncIndex}-${i}`, 
            TestDataFactory.createEvaluationDto({ quadrantCode: `CONC${syncIndex}${i}` }));
        }

        // Process sync
        const syncStartTime = Date.now();
        const result = await syncService.processPendingOperations(operationsPerSync);
        const syncTime = Date.now() - syncStartTime;

        return {
          syncIndex,
          processed: result.processed,
          syncTime,
          success: result.processed > 0,
        };
      });

      const syncResults = await Promise.all(syncPromises);
      const totalTime = Date.now() - startTime;

      // Assert
      const successfulSyncs = syncResults.filter(r => r.success).length;
      const totalProcessed = syncResults.reduce((sum, r) => sum + r.processed, 0);

      expect(successfulSyncs).toBeGreaterThan(concurrentSyncs * 0.8); // At least 80% successful
      expect(totalTime).toBeLessThan(25000); // All syncs within 25 seconds

      console.log(`Concurrent Sync Operations Performance:
        - Concurrent syncs: ${concurrentSyncs}
        - Successful syncs: ${successfulSyncs}
        - Total operations processed: ${totalProcessed}
        - Total time: ${totalTime}ms
        - Operations per second: ${(totalProcessed / (totalTime / 1000)).toFixed(2)}
        - Average sync time: ${(syncResults.reduce((sum, r) => sum + r.syncTime, 0) / syncResults.length).toFixed(2)}ms`);
    });

    it('should handle network connectivity simulation efficiently', async () => {
      // Arrange
      const connectivityCycles = 5;
      const operationsPerCycle = 30;
      const offlineDuration = 1000; // 1 second offline
      const onlineDuration = 2000; // 2 seconds online

      let totalOperations = 0;
      let totalSyncTime = 0;

      // Act
      const overallStartTime = Date.now();

      for (let cycle = 0; cycle < connectivityCycles; cycle++) {
        // Simulate offline period - queue operations
        const offlineStartTime = Date.now();
        for (let i = 0; i < operationsPerCycle; i++) {
          await syncService.queueOperation('CREATE', 'evaluation', `connectivity-${cycle}-${i}`, 
            TestDataFactory.createEvaluationDto({ quadrantCode: `CONN${cycle}${i}` }));
          totalOperations++;
        }

        // Simulate offline delay
        await new Promise(resolve => setTimeout(resolve, offlineDuration));
        const offlineTime = Date.now() - offlineStartTime;

        // Simulate online period - process sync
        const onlineStartTime = Date.now();
        const syncResult = await syncService.processPendingOperations(operationsPerCycle);
        
        // Simulate online delay
        await new Promise(resolve => setTimeout(resolve, onlineDuration));
        const onlineTime = Date.now() - onlineStartTime;

        totalSyncTime += onlineTime;

        console.log(`Connectivity cycle ${cycle + 1}:
          - Offline time: ${offlineTime}ms (${operationsPerCycle} operations queued)
          - Online time: ${onlineTime}ms (${syncResult.processed} operations synced)`);
      }

      const overallTime = Date.now() - overallStartTime;

      // Assert
      expect(totalOperations).toBe(connectivityCycles * operationsPerCycle);
      expect(overallTime).toBeLessThan(30000); // All cycles within 30 seconds

      console.log(`Network Connectivity Simulation Performance:
        - Connectivity cycles: ${connectivityCycles}
        - Total operations: ${totalOperations}
        - Total sync time: ${totalSyncTime}ms
        - Overall time: ${overallTime}ms
        - Sync efficiency: ${(totalSyncTime / overallTime * 100).toFixed(2)}%`);
    });
  });

  describe('Synchronization Memory and Resource Usage', () => {
    it('should handle large sync queues without memory leaks', async () => {
      // Arrange
      const largeQueueSize = 2000;
      const batchSize = 100;

      // Monitor memory usage
      const initialMemory = process.memoryUsage();

      // Act - Build large queue
      const queueStartTime = Date.now();
      for (let i = 0; i < largeQueueSize; i++) {
        await syncService.queueOperation('CREATE', 'evaluation', `memory-${i}`, 
          TestDataFactory.createEvaluationDto({ quadrantCode: `MEM${i}` }));
      }
      const queueTime = Date.now() - queueStartTime;

      const afterQueueMemory = process.memoryUsage();

      // Process queue in batches
      const processStartTime = Date.now();
      let totalProcessed = 0;

      for (let i = 0; i < largeQueueSize; i += batchSize) {
        const result = await syncService.processPendingOperations(batchSize);
        totalProcessed += result.processed;

        // Force garbage collection periodically
        if (i % (batchSize * 5) === 0 && global.gc) {
          global.gc();
        }
      }

      const processTime = Date.now() - processStartTime;
      const finalMemory = process.memoryUsage();

      // Calculate memory usage
      const queueMemoryIncrease = afterQueueMemory.heapUsed - initialMemory.heapUsed;
      const finalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Assert
      expect(totalProcessed).toBeGreaterThan(largeQueueSize * 0.9); // At least 90% processed
      expect(queueTime).toBeLessThan(20000); // Queue building within 20 seconds
      expect(processTime).toBeLessThan(30000); // Processing within 30 seconds
      expect(finalMemoryIncrease).toBeLessThan(queueMemoryIncrease * 1.5); // Memory should not grow significantly after processing

      console.log(`Large Sync Queue Memory Performance:
        - Queue size: ${largeQueueSize}
        - Processed operations: ${totalProcessed}
        - Queue time: ${queueTime}ms
        - Process time: ${processTime}ms
        - Queue memory increase: ${(queueMemoryIncrease / 1024 / 1024).toFixed(2)} MB
        - Final memory increase: ${(finalMemoryIncrease / 1024 / 1024).toFixed(2)} MB
        - Memory efficiency: ${((largeQueueSize * 1024) / queueMemoryIncrease).toFixed(2)} operations/KB`);
    });

    it('should handle sync operation cleanup efficiently', async () => {
      // Arrange
      const operationsToCleanup = 500;
      const cleanupBatchSize = 50;

      // Create completed operations that need cleanup
      for (let i = 0; i < operationsToCleanup; i++) {
        await syncService.queueOperation('CREATE', 'evaluation', `cleanup-${i}`, 
          TestDataFactory.createEvaluationDto({ quadrantCode: `CLEAN${i}` }));
      }

      // Process all operations first
      await syncService.processPendingOperations(operationsToCleanup);

      // Act - Test cleanup performance
      const cleanupStartTime = Date.now();
      let cleanedOperations = 0;

      for (let i = 0; i < operationsToCleanup; i += cleanupBatchSize) {
        const cleanupResult = await syncService.cleanupCompletedOperations(cleanupBatchSize);
        cleanedOperations += cleanupResult.cleaned || 0;
      }

      const cleanupTime = Date.now() - cleanupStartTime;

      // Assert
      expect(cleanedOperations).toBeGreaterThan(operationsToCleanup * 0.8); // At least 80% cleaned
      expect(cleanupTime).toBeLessThan(10000); // Cleanup within 10 seconds

      console.log(`Sync Operation Cleanup Performance:
        - Operations to cleanup: ${operationsToCleanup}
        - Cleaned operations: ${cleanedOperations}
        - Cleanup time: ${cleanupTime}ms
        - Cleanup rate: ${(cleanedOperations / (cleanupTime / 1000)).toFixed(2)} operations/second`);
    });

    it('should handle sync statistics calculation efficiently', async () => {
      // Arrange - Create diverse sync operations
      const operationTypes = ['CREATE', 'UPDATE', 'DELETE'];
      const operationsPerType = 100;
      const totalOperations = operationTypes.length * operationsPerType;

      // Queue operations
      for (const type of operationTypes) {
        for (let i = 0; i < operationsPerType; i++) {
          await syncService.queueOperation(type, 'evaluation', `stats-${type}-${i}`, 
            TestDataFactory.createEvaluationDto({ quadrantCode: `STAT${type}${i}` }));
        }
      }

      // Process some operations
      await syncService.processPendingOperations(totalOperations / 2);

      // Act - Calculate statistics
      const statsStartTime = Date.now();
      const stats = await syncService.getSyncStatistics();
      const statsTime = Date.now() - statsStartTime;

      // Assert
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(statsTime).toBeLessThan(2000); // Statistics calculation within 2 seconds

      console.log(`Sync Statistics Calculation Performance:
        - Total operations: ${stats.total}
        - Pending: ${stats.pending}
        - Completed: ${stats.completed}
        - Failed: ${stats.failed}
        - Calculation time: ${statsTime}ms
        - Operations analyzed per second: ${(stats.total / (statsTime / 1000)).toFixed(2)}`);
    });
  });
});