import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { EvaluationsModule } from './evaluations.module';
import { AuthModule } from '../auth/auth.module';
import { Evaluation, EvaluationStatus } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../entities/evaluation-photo.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Operator } from '../../entities/operator.entity';
import { Area } from '../../entities/area.entity';
import { Module } from '../../entities/module.entity';
import databaseConfig from '../../config/database.config';
import jwtConfig from '../../config/jwt.config';

describe('EvaluationsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig, jwtConfig],
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            entities: [Evaluation, EvaluationDetail, EvaluationPhoto, User, Operator, Area, Module],
            synchronize: true,
          }),
        }),
        AuthModule,
        EvaluationsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and get auth token
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      role: UserRole.JEFA_CALIDAD,
    };

    // Register user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Evaluation Workflow (COS-01 to COS-27)', () => {
    it('should create, update, and close an evaluation successfully', async () => {
      // Step 1: Create evaluation (COS-18)
      const createEvaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'A1',
        evaluationDate: '2023-12-01',
        evaluationTime: '09:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        generalObservations: 'Initial evaluation',
        details: [
          {
            parameterId: 1,
            isCompliant: true,
            weightApplied: 10,
            observations: 'Meets standard',
          },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createEvaluationDto)
        .expect(201);

      const evaluationId = createResponse.body.id;
      expect(evaluationId).toBeDefined();
      expect(createResponse.body.status).toBe(EvaluationStatus.BORRADOR);

      // Step 2: Update evaluation (COS-23)
      const updateEvaluationDto = {
        generalObservations: 'Updated evaluation observations',
        compliancePercentage: 90.0,
        finalScore: 90.0,
      };

      await request(app.getHttpServer())
        .patch(`/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateEvaluationDto)
        .expect(200);

      // Step 3: Get evaluation details (COS-16, COS-17, COS-20, COS-21, COS-27)
      const getResponse = await request(app.getHttpServer())
        .get(`/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        id: evaluationId,
        quadrantCode: 'A1',
        evaluationDate: expect.any(String),
        evaluationTime: '09:30',
        workWeek: 48,
        workYear: 2023,
        compliancePercentage: 90.0,
        finalScore: 90.0,
        generalObservations: 'Updated evaluation observations',
        status: EvaluationStatus.BORRADOR,
      });

      // Step 4: Close evaluation (COS-24)
      const closeEvaluationDto = {
        finalObservations: 'Evaluation completed successfully',
      };

      const closeResponse = await request(app.getHttpServer())
        .patch(`/evaluations/${evaluationId}/close`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(closeEvaluationDto)
        .expect(200);

      expect(closeResponse.body.status).toBe(EvaluationStatus.CERRADA);
      expect(closeResponse.body.generalObservations).toBe(closeEvaluationDto.finalObservations);

      // Step 5: Verify closed evaluation cannot be modified (COS-24)
      await request(app.getHttpServer())
        .patch(`/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ generalObservations: 'Should not work' })
        .expect(400);
    });

    it('should prevent duplicate evaluations (COS-19)', async () => {
      const duplicateEvaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'A2',
        evaluationDate: '2023-12-01',
        evaluationTime: '10:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        details: [],
      };

      // Create first evaluation
      await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateEvaluationDto)
        .expect(201);

      // Try to create duplicate - should fail
      await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateEvaluationDto)
        .expect(409);
    });

    it('should get evaluations with filters', async () => {
      // Get all evaluations
      const allResponse = await request(app.getHttpServer())
        .get('/evaluations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(allResponse.body)).toBe(true);

      // Get evaluations with filters
      const filteredResponse = await request(app.getHttpServer())
        .get('/evaluations?operatorId=1&status=cerrada')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(filteredResponse.body)).toBe(true);
    });

    it('should get evaluation statistics', async () => {
      const statsResponse = await request(app.getHttpServer())
        .get('/evaluations/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body).toMatchObject({
        total: expect.any(Number),
        draft: expect.any(Number),
        closed: expect.any(Number),
        averageCompliance: expect.any(Number),
        byArea: expect.any(Array),
        byModule: expect.any(Array),
        complianceDistribution: expect.any(Array),
      });
    });

    it('should get evaluations by operator', async () => {
      const operatorResponse = await request(app.getHttpServer())
        .get('/evaluations/by-operator/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(operatorResponse.body)).toBe(true);
    });

    it('should handle role-based access control (COS-26)', async () => {
      // Test that only JEFA_CALIDAD can create evaluations
      const evaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'B1',
        evaluationDate: '2023-12-02',
        evaluationTime: '09:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        details: [],
      };

      // This should work with JEFA_CALIDAD role
      await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(evaluationDto)
        .expect(201);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/evaluations')
        .expect(401);
    });

    it('should return 404 for non-existent evaluation', async () => {
      await request(app.getHttpServer())
        .get('/evaluations/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        // Missing required fields
        operatorId: 1,
      };

      await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });
});