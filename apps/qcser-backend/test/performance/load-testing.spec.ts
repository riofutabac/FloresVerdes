import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDataFactory } from '../factories/test-data.factory';

describe('Load Testing - Critical Endpoints', () => {
  let app: INestApplication;
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
    await app.init();

    // Setup authentication
    const testUser = TestDataFactory.createAdminUser();
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

  describe('Authentication Endpoint Load Testing', () => {
    it('should handle concurrent login requests', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'TestPassword123!',
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All requests should succeed
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status); // 200 or rate limited
      });

      // Calculate average response time
      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(100); // Average < 100ms per request

      console.log(`Authentication Load Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms
        - Successful requests: ${responses.filter(r => r.status === 200).length}
        - Rate limited: ${responses.filter(r => r.status === 429).length}`);
    });

    it('should handle token validation under load', async () => {
      const concurrentRequests = 100;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(30); // Average < 30ms per request

      console.log(`Token Validation Load Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });
  });

  describe('Operators Endpoint Load Testing', () => {
    beforeAll(async () => {
      // Create test operators for load testing
      const operators = TestDataFactory.createBatch(
        () => TestDataFactory.createOperatorDto(),
        20
      );

      for (const operator of operators) {
        await request(app.getHttpServer())
          .post('/operators')
          .set('Authorization', `Bearer ${authToken}`)
          .send(operator);
      }
    });

    it('should handle concurrent operator list requests', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/operators')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(4000); // Should complete within 4 seconds
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(80); // Average < 80ms per request

      console.log(`Operators List Load Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms
        - Records per response: ${responses[0].body.length}`);
    });

    it('should handle concurrent operator search requests', async () => {
      const concurrentRequests = 30;
      const searchTerms = ['Test', 'Operator', 'EMP', '001', '002'];
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, index) =>
        request(app.getHttpServer())
          .get(`/operators/search?q=${searchTerms[index % searchTerms.length]}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(100); // Average < 100ms per request

      console.log(`Operators Search Load Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });
  });

  describe('Evaluations Endpoint Load Testing', () => {
    beforeAll(async () => {
      // Create test evaluations for load testing
      const evaluations = TestDataFactory.createBatch(
        () => TestDataFactory.createEvaluationDto(),
        15
      );

      for (const evaluation of evaluations) {
        await request(app.getHttpServer())
          .post('/evaluations')
          .set('Authorization', `Bearer ${authToken}`)
          .send(evaluation);
      }
    });

    it('should handle concurrent evaluation creation', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, index) => {
        const evaluation = TestDataFactory.createEvaluationDto({
          quadrantCode: `LOAD${index}`,
          operatorId: (index % 5) + 1, // Distribute across operators
        });

        return request(app.getHttpServer())
          .post('/evaluations')
          .set('Authorization', `Bearer ${authToken}`)
          .send(evaluation);
      });

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(6000); // Should complete within 6 seconds
      
      const successfulRequests = responses.filter(r => r.status === 201);
      expect(successfulRequests.length).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success

      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(300); // Average < 300ms per request

      console.log(`Evaluations Creation Load Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms
        - Successful requests: ${successfulRequests.length}
        - Failed requests: ${responses.filter(r => r.status !== 201).length}`);
    });

    it('should handle concurrent evaluation list requests with filters', async () => {
      const concurrentRequests = 40;
      const filters = [
        '',
        '?status=borrador',
        '?operatorId=1',
        '?areaId=1',
        '?moduleId=1',
        '?startDate=2023-01-01&endDate=2023-12-31',
      ];
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, index) =>
        request(app.getHttpServer())
          .get(`/evaluations${filters[index % filters.length]}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(125); // Average < 125ms per request

      console.log(`Evaluations List Load Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });
  });

  describe('Reports Endpoint Load Testing', () => {
    it('should handle concurrent dashboard data requests', async () => {
      const concurrentRequests = 25;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/reports/dashboard-data')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds (complex queries)
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('kpis');
        expect(response.body).toHaveProperty('trends');
      });

      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(320); // Average < 320ms per request

      console.log(`Dashboard Data Load Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });

    it('should handle concurrent KPI calculation requests', async () => {
      const concurrentRequests = 15;
      const dateRanges = [
        { startDate: '2023-01-01', endDate: '2023-01-31' },
        { startDate: '2023-02-01', endDate: '2023-02-28' },
        { startDate: '2023-03-01', endDate: '2023-03-31' },
      ];
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, index) => {
        const range = dateRanges[index % dateRanges.length];
        return request(app.getHttpServer())
          .get(`/reports/kpis?startDate=${range.startDate}&endDate=${range.endDate}`)
          .set('Authorization', `Bearer ${authToken}`);
      });

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('kpis');
      });

      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(667); // Average < 667ms per request

      console.log(`KPI Calculation Load Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });
  });

  describe('Database Performance Testing', () => {
    it('should handle large dataset queries efficiently', async () => {
      // Create a larger dataset for performance testing
      const largeDataset = TestDataFactory.createBatch(
        () => TestDataFactory.createOperatorDto(),
        100
      );

      const startTime = Date.now();

      // Create operators in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < largeDataset.length; i += batchSize) {
        const batch = largeDataset.slice(i, i + batchSize);
        const promises = batch.map(operator =>
          request(app.getHttpServer())
            .post('/operators')
            .set('Authorization', `Bearer ${authToken}`)
            .send(operator)
        );
        await Promise.all(promises);
      }

      const creationTime = Date.now() - startTime;

      // Test query performance with large dataset
      const queryStartTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/operators')
        .set('Authorization', `Bearer ${authToken}`);
      const queryTime = Date.now() - queryStartTime;

      // Performance assertions
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(100);
      expect(queryTime).toBeLessThan(1000); // Query should complete within 1 second
      expect(creationTime).toBeLessThan(30000); // Creation should complete within 30 seconds

      console.log(`Large Dataset Performance Results:
        - Records created: ${largeDataset.length}
        - Creation time: ${creationTime}ms
        - Query time: ${queryTime}ms
        - Records returned: ${response.body.length}`);
    });

    it('should handle complex filtering queries efficiently', async () => {
      const complexFilters = [
        '?moduleId=1&status=activo&search=Test',
        '?areaId=1&hasDisability=false',
        '?status=activo&search=Operator',
        '?moduleId=1&areaId=1&status=activo',
      ];

      const startTime = Date.now();

      const promises = complexFilters.map(filter =>
        request(app.getHttpServer())
          .get(`/operators${filter}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      const avgResponseTime = duration / complexFilters.length;
      expect(avgResponseTime).toBeLessThan(500); // Average < 500ms per complex query

      console.log(`Complex Filtering Performance Results:
        - Complex queries: ${complexFilters.length}
        - Total duration: ${duration}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });
  });

  describe('Memory and Resource Usage Testing', () => {
    it('should not have memory leaks during sustained load', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 50;

      // Simulate sustained load
      for (let i = 0; i < iterations; i++) {
        await request(app.getHttpServer())
          .get('/operators')
          .set('Authorization', `Bearer ${authToken}`);

        // Force garbage collection periodically
        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      // Memory usage should not increase significantly
      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase

      console.log(`Memory Usage Test Results:
        - Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        - Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)
        - Iterations: ${iterations}`);
    });

    it('should handle file upload performance', async () => {
      const fileSize = 5 * 1024 * 1024; // 5MB
      const mockFile = TestDataFactory.createMockFile({
        size: fileSize,
        buffer: Buffer.alloc(fileSize),
        originalname: 'large-test-image.jpg',
      });

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/storage/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', mockFile.buffer, mockFile.originalname);

      const uploadTime = Date.now() - startTime;

      // Performance assertions
      expect([200, 201]).toContain(response.status);
      expect(uploadTime).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`File Upload Performance Results:
        - File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
        - Upload time: ${uploadTime}ms
        - Upload speed: ${((fileSize / 1024 / 1024) / (uploadTime / 1000)).toFixed(2)} MB/s`);
    });
  });
});