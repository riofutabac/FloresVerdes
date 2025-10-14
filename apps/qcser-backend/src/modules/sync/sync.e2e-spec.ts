import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { SyncModule } from './sync.module';
import { SyncService } from './sync.service';
import { SyncLog } from '../../entities/sync-log.entity';
import { Evaluation } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../entities/evaluation-photo.entity';
import { User } from '../../entities/user.entity';
import { Operator } from '../../entities/operator.entity';
import { Area } from '../../entities/area.entity';
import { Module as ModuleEntity } from '../../entities/module.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('SyncController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let syncService: SyncService;

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            SyncLog,
            Evaluation,
            EvaluationDetail,
            EvaluationPhoto,
            User,
            Operator,
            Area,
            ModuleEntity,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        ScheduleModule.forRoot(),
        SyncModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    syncService = moduleFixture.get<SyncService>(SyncService);
    
    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dataSource.synchronize(true);
    
    // Mock user in request
    jest.spyOn(mockJwtAuthGuard, 'canActivate').mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { sub: 'test-user-id' };
      return true;
    });
  });

  describe('/sync/status (GET)', () => {
    it('should return sync status for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/sync/status')
        .expect(200);

      expect(response.body).toHaveProperty('pendingCount');
      expect(response.body).toHaveProperty('lastSyncDate');
      expect(response.body).toHaveProperty('errorCount');
      expect(response.body.pendingCount).toBe(0);
      expect(response.body.lastSyncDate).toBeNull();
      expect(response.body.errorCount).toBe(0);
    });
  });

  describe('/sync/pending (GET)', () => {
    it('should return empty pending data when no evaluations exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/sync/pending')
        .expect(200);

      expect(response.body).toHaveProperty('evaluations');
      expect(response.body).toHaveProperty('evaluationDetails');
      expect(response.body).toHaveProperty('evaluationPhotos');
      expect(response.body.evaluations).toHaveLength(0);
      expect(response.body.evaluationDetails).toHaveLength(0);
      expect(response.body.evaluationPhotos).toHaveLength(0);
    });

    it('should return pending evaluations for user', async () => {
      // Create test data
      const area = await dataSource.getRepository(Area).save({
        name: 'Test Area',
        code: 'A1',
        isActive: true,
      });

      const module = await dataSource.getRepository(ModuleEntity).save({
        name: 'Test Module',
        code: 'M1',
        area,
        isActive: true,
      });

      const operator = await dataSource.getRepository(Operator).save({
        employeeId: 'EMP001',
        fullName: 'Test Operator',
        hireDate: new Date(),
        hasDisability: false,
        quadrantCode: 'Q1',
        status: 'ACTIVO',
        area,
        module,
      });

      const evaluation = await dataSource.getRepository(Evaluation).save({
        operator,
        evaluatorId: 'test-user-id',
        area,
        module,
        quadrantCode: 'Q1',
        evaluationDate: new Date(),
        evaluationTime: '10:00',
        workWeek: 1,
        workYear: 2024,
        initialScore: 100,
        finalScore: 85,
        compliancePercentage: 85,
        status: 'cerrada',
        isSynced: false,
      });

      const response = await request(app.getHttpServer())
        .get('/sync/pending')
        .expect(200);

      expect(response.body.evaluations).toHaveLength(1);
      expect(response.body.evaluations[0].id).toBe(evaluation.id);
    });
  });

  describe('/sync/upload (POST)', () => {
    it('should sync offline data successfully', async () => {
      const syncData = {
        evaluations: [],
        evaluationDetails: [],
        evaluationPhotos: [],
      };

      const response = await request(app.getHttpServer())
        .post('/sync/upload')
        .send(syncData)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('syncedCount');
      expect(response.body).toHaveProperty('errorCount');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.success).toBe(true);
      expect(response.body.syncedCount).toBe(0);
      expect(response.body.errorCount).toBe(0);
    });

    it('should handle invalid sync data', async () => {
      const invalidSyncData = {
        evaluations: [
          {
            // Missing required fields
            localId: 'invalid-eval',
          },
        ],
        evaluationDetails: [],
        evaluationPhotos: [],
      };

      const response = await request(app.getHttpServer())
        .post('/sync/upload')
        .send(invalidSyncData)
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCount).toBeGreaterThan(0);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('/sync/force-sync (POST)', () => {
    it('should force sync for user', async () => {
      const response = await request(app.getHttpServer())
        .post('/sync/force-sync')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('result');
      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveProperty('totalBatches');
      expect(response.body.result).toHaveProperty('processedBatches');
      expect(response.body.result).toHaveProperty('totalRecords');
    });
  });

  describe('/sync/connectivity (GET)', () => {
    it('should return connectivity status', async () => {
      const response = await request(app.getHttpServer())
        .get('/sync/connectivity')
        .expect(200);

      expect(response.body).toHaveProperty('isOnline');
      expect(response.body).toHaveProperty('lastCheckTime');
      expect(response.body).toHaveProperty('consecutiveFailures');
      expect(response.body).toHaveProperty('currentStatus');
    });
  });

  describe('/sync/validate-integrity (POST)', () => {
    it('should validate data integrity', async () => {
      const response = await request(app.getHttpServer())
        .post('/sync/validate-integrity')
        .expect(200);

      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('issues');
      expect(response.body.isValid).toBe(true);
      expect(response.body.issues).toHaveLength(0);
    });
  });

  describe('/sync/resolve-conflicts (POST)', () => {
    it('should resolve conflicts successfully', async () => {
      const conflictData = {
        conflicts: [
          {
            id: 1,
            type: 'evaluation',
            resolution: 'server_wins',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/sync/resolve-conflicts')
        .send(conflictData)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('syncedCount');
      expect(response.body).toHaveProperty('errorCount');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('/sync/mark-synced (POST)', () => {
    it('should mark evaluations as synced', async () => {
      const data = {
        evaluationIds: [1, 2, 3],
      };

      const response = await request(app.getHttpServer())
        .post('/sync/mark-synced')
        .send(data)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });
  });

  describe('Offline/Online Scenarios', () => {
    it('should handle offline to online transition', async () => {
      // Simulate offline state
      jest.spyOn(syncService, 'checkConnectivity').mockResolvedValue(false);

      let connectivityResponse = await request(app.getHttpServer())
        .get('/sync/connectivity')
        .expect(200);

      expect(connectivityResponse.body.currentStatus).toBe('offline');

      // Simulate online state
      jest.spyOn(syncService, 'checkConnectivity').mockResolvedValue(true);

      connectivityResponse = await request(app.getHttpServer())
        .get('/sync/connectivity')
        .expect(200);

      expect(connectivityResponse.body.currentStatus).toBe('online');

      // Should be able to force sync when online
      const syncResponse = await request(app.getHttpServer())
        .post('/sync/force-sync')
        .expect(200);

      expect(syncResponse.body.success).toBe(true);
    });

    it('should reject force sync when offline', async () => {
      // Mock connectivity check to return false
      jest.spyOn(syncService, 'checkConnectivity').mockResolvedValue(false);
      jest.spyOn(syncService, 'forceSyncForUser').mockRejectedValue(
        new Error('Cannot force sync: no connectivity available')
      );

      await request(app.getHttpServer())
        .post('/sync/force-sync')
        .expect(503);
    });
  });

  describe('Batch Processing', () => {
    it('should handle large datasets with batch processing', async () => {
      // Create test data
      const area = await dataSource.getRepository(Area).save({
        name: 'Test Area',
        code: 'A1',
        isActive: true,
      });

      const module = await dataSource.getRepository(ModuleEntity).save({
        name: 'Test Module',
        code: 'M1',
        area,
        isActive: true,
      });

      const operator = await dataSource.getRepository(Operator).save({
        employeeId: 'EMP001',
        fullName: 'Test Operator',
        hireDate: new Date(),
        hasDisability: false,
        quadrantCode: 'Q1',
        status: 'ACTIVO',
        area,
        module,
      });

      // Create multiple evaluations to test batch processing
      const evaluations = [];
      for (let i = 0; i < 100; i++) {
        evaluations.push({
          operator,
          evaluatorId: 'test-user-id',
          area,
          module,
          quadrantCode: `Q${i}`,
          evaluationDate: new Date(),
          evaluationTime: '10:00',
          workWeek: 1,
          workYear: 2024,
          initialScore: 100,
          finalScore: 85 + (i % 15),
          compliancePercentage: 85 + (i % 15),
          status: 'cerrada',
          isSynced: false,
          localId: `local-eval-${i}`,
        });
      }

      await dataSource.getRepository(Evaluation).save(evaluations);

      // Test batch sync
      const response = await request(app.getHttpServer())
        .post('/sync/force-sync')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalRecords).toBe(100);
      expect(response.body.result.totalBatches).toBeGreaterThan(1);
    });
  });
});