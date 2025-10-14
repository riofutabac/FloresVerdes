import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDataFactory } from '../factories/test-data.factory';

describe('File Upload Performance Testing', () => {
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

  describe('Single File Upload Performance', () => {
    it('should handle small image uploads efficiently', async () => {
      // Arrange
      const fileSize = 100 * 1024; // 100KB
      const mockFile = TestDataFactory.createMockFile({
        size: fileSize,
        buffer: Buffer.alloc(fileSize),
        originalname: 'small-test-image.jpg',
        mimetype: 'image/jpeg',
      });

      // Act
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/storage/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', mockFile.buffer, mockFile.originalname);
      const uploadTime = Date.now() - startTime;

      // Assert
      expect([200, 201]).toContain(response.status);
      expect(uploadTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(response.body).toHaveProperty('fileName');
      expect(response.body).toHaveProperty('fileSize', fileSize);

      console.log(`Small File Upload Performance:
        - File size: ${(fileSize / 1024).toFixed(2)} KB
        - Upload time: ${uploadTime}ms
        - Upload speed: ${((fileSize / 1024) / (uploadTime / 1000)).toFixed(2)} KB/s`);
    });

    it('should handle medium image uploads efficiently', async () => {
      // Arrange
      const fileSize = 2 * 1024 * 1024; // 2MB
      const mockFile = TestDataFactory.createMockFile({
        size: fileSize,
        buffer: Buffer.alloc(fileSize),
        originalname: 'medium-test-image.jpg',
        mimetype: 'image/jpeg',
      });

      // Act
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/storage/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', mockFile.buffer, mockFile.originalname);
      const uploadTime = Date.now() - startTime;

      // Assert
      expect([200, 201]).toContain(response.status);
      expect(uploadTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.body).toHaveProperty('fileName');
      expect(response.body).toHaveProperty('fileSize', fileSize);

      console.log(`Medium File Upload Performance:
        - File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
        - Upload time: ${uploadTime}ms
        - Upload speed: ${((fileSize / 1024 / 1024) / (uploadTime / 1000)).toFixed(2)} MB/s`);
    });

    it('should handle large image uploads efficiently', async () => {
      // Arrange
      const fileSize = 8 * 1024 * 1024; // 8MB
      const mockFile = TestDataFactory.createMockFile({
        size: fileSize,
        buffer: Buffer.alloc(fileSize),
        originalname: 'large-test-image.jpg',
        mimetype: 'image/jpeg',
      });

      // Act
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/storage/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', mockFile.buffer, mockFile.originalname);
      const uploadTime = Date.now() - startTime;

      // Assert
      expect([200, 201]).toContain(response.status);
      expect(uploadTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(response.body).toHaveProperty('fileName');
      expect(response.body).toHaveProperty('fileSize', fileSize);

      console.log(`Large File Upload Performance:
        - File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
        - Upload time: ${uploadTime}ms
        - Upload speed: ${((fileSize / 1024 / 1024) / (uploadTime / 1000)).toFixed(2)} MB/s`);
    });

    it('should handle PNG format uploads efficiently', async () => {
      // Arrange
      const fileSize = 1.5 * 1024 * 1024; // 1.5MB
      const mockFile = TestDataFactory.createMockFile({
        size: fileSize,
        buffer: Buffer.alloc(fileSize),
        originalname: 'test-image.png',
        mimetype: 'image/png',
      });

      // Act
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/storage/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', mockFile.buffer, mockFile.originalname);
      const uploadTime = Date.now() - startTime;

      // Assert
      expect([200, 201]).toContain(response.status);
      expect(uploadTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.body).toHaveProperty('fileName');
      expect(response.body.fileName).toMatch(/\.png$/);

      console.log(`PNG File Upload Performance:
        - File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
        - Upload time: ${uploadTime}ms
        - Upload speed: ${((fileSize / 1024 / 1024) / (uploadTime / 1000)).toFixed(2)} MB/s`);
    });
  });

  describe('Multiple File Upload Performance', () => {
    it('should handle concurrent multiple file uploads', async () => {
      // Arrange
      const fileCount = 5;
      const fileSize = 500 * 1024; // 500KB each
      const files = Array.from({ length: fileCount }, (_, index) =>
        TestDataFactory.createMockFile({
          size: fileSize,
          buffer: Buffer.alloc(fileSize),
          originalname: `concurrent-test-${index}.jpg`,
          mimetype: 'image/jpeg',
        })
      );

      // Act
      const startTime = Date.now();
      const promises = files.map(file =>
        request(app.getHttpServer())
          .post('/storage/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', file.buffer, file.originalname)
      );

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Assert
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('fileName');
      });

      const totalSize = fileCount * fileSize;
      const avgTimePerFile = totalTime / fileCount;

      expect(totalTime).toBeLessThan(10000); // All uploads within 10 seconds
      expect(avgTimePerFile).toBeLessThan(3000); // Average per file within 3 seconds

      console.log(`Concurrent Multiple File Upload Performance:
        - Files uploaded: ${fileCount}
        - Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB
        - Total time: ${totalTime}ms
        - Average time per file: ${avgTimePerFile.toFixed(2)}ms
        - Overall throughput: ${((totalSize / 1024 / 1024) / (totalTime / 1000)).toFixed(2)} MB/s`);
    });

    it('should handle sequential multiple file uploads', async () => {
      // Arrange
      const fileCount = 3;
      const fileSize = 1 * 1024 * 1024; // 1MB each
      const files = Array.from({ length: fileCount }, (_, index) =>
        TestDataFactory.createMockFile({
          size: fileSize,
          buffer: Buffer.alloc(fileSize),
          originalname: `sequential-test-${index}.jpg`,
          mimetype: 'image/jpeg',
        })
      );

      // Act
      const startTime = Date.now();
      const responses = [];
      for (const file of files) {
        const response = await request(app.getHttpServer())
          .post('/storage/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', file.buffer, file.originalname);
        responses.push(response);
      }
      const totalTime = Date.now() - startTime;

      // Assert
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('fileName');
      });

      const totalSize = fileCount * fileSize;
      const avgTimePerFile = totalTime / fileCount;

      expect(totalTime).toBeLessThan(15000); // All uploads within 15 seconds
      expect(avgTimePerFile).toBeLessThan(6000); // Average per file within 6 seconds

      console.log(`Sequential Multiple File Upload Performance:
        - Files uploaded: ${fileCount}
        - Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB
        - Total time: ${totalTime}ms
        - Average time per file: ${avgTimePerFile.toFixed(2)}ms
        - Overall throughput: ${((totalSize / 1024 / 1024) / (totalTime / 1000)).toFixed(2)} MB/s`);
    });

    it('should handle mixed file sizes in batch upload', async () => {
      // Arrange
      const files = [
        TestDataFactory.createMockFile({
          size: 100 * 1024, // 100KB
          buffer: Buffer.alloc(100 * 1024),
          originalname: 'small-mixed.jpg',
          mimetype: 'image/jpeg',
        }),
        TestDataFactory.createMockFile({
          size: 1 * 1024 * 1024, // 1MB
          buffer: Buffer.alloc(1 * 1024 * 1024),
          originalname: 'medium-mixed.jpg',
          mimetype: 'image/jpeg',
        }),
        TestDataFactory.createMockFile({
          size: 3 * 1024 * 1024, // 3MB
          buffer: Buffer.alloc(3 * 1024 * 1024),
          originalname: 'large-mixed.png',
          mimetype: 'image/png',
        }),
      ];

      // Act
      const startTime = Date.now();
      const promises = files.map((file, index) =>
        request(app.getHttpServer())
          .post('/storage/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', file.buffer, file.originalname)
          .then(response => ({ response, index, size: file.size }))
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Assert
      results.forEach(({ response, index, size }) => {
        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('fileName');
        expect(response.body).toHaveProperty('fileSize', size);
      });

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      expect(totalTime).toBeLessThan(12000); // All uploads within 12 seconds

      console.log(`Mixed Size Batch Upload Performance:
        - Files uploaded: ${files.length}
        - Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB
        - Total time: ${totalTime}ms
        - Overall throughput: ${((totalSize / 1024 / 1024) / (totalTime / 1000)).toFixed(2)} MB/s`);

      results.forEach(({ response, index, size }) => {
        console.log(`  File ${index + 1}: ${(size / 1024 / 1024).toFixed(2)} MB - ${response.body.fileName}`);
      });
    });
  });

  describe('File Upload Stress Testing', () => {
    it('should handle sustained upload load', async () => {
      // Arrange
      const uploadRounds = 10;
      const filesPerRound = 3;
      const fileSize = 500 * 1024; // 500KB
      const delayBetweenRounds = 100; // 100ms

      let totalUploads = 0;
      let totalTime = 0;
      let failedUploads = 0;

      // Act
      const overallStartTime = Date.now();

      for (let round = 0; round < uploadRounds; round++) {
        const roundFiles = Array.from({ length: filesPerRound }, (_, index) =>
          TestDataFactory.createMockFile({
            size: fileSize,
            buffer: Buffer.alloc(fileSize),
            originalname: `stress-r${round}-f${index}.jpg`,
            mimetype: 'image/jpeg',
          })
        );

        const roundStartTime = Date.now();
        const promises = roundFiles.map(file =>
          request(app.getHttpServer())
            .post('/storage/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', file.buffer, file.originalname)
            .catch(error => ({ error }))
        );

        const responses = await Promise.all(promises);
        const roundTime = Date.now() - roundStartTime;

        // Count results
        responses.forEach(response => {
          if (response.error || ![200, 201].includes(response.status)) {
            failedUploads++;
          } else {
            totalUploads++;
          }
        });

        totalTime += roundTime;

        // Small delay between rounds
        if (round < uploadRounds - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRounds));
        }
      }

      const overallTime = Date.now() - overallStartTime;
      const totalSize = totalUploads * fileSize;
      const successRate = (totalUploads / (uploadRounds * filesPerRound)) * 100;

      // Assert
      expect(successRate).toBeGreaterThan(90); // At least 90% success rate
      expect(overallTime).toBeLessThan(30000); // Complete within 30 seconds

      console.log(`Sustained Upload Load Performance:
        - Upload rounds: ${uploadRounds}
        - Files per round: ${filesPerRound}
        - Total successful uploads: ${totalUploads}
        - Failed uploads: ${failedUploads}
        - Success rate: ${successRate.toFixed(2)}%
        - Total size uploaded: ${(totalSize / 1024 / 1024).toFixed(2)} MB
        - Overall time: ${overallTime}ms
        - Average throughput: ${((totalSize / 1024 / 1024) / (overallTime / 1000)).toFixed(2)} MB/s`);
    });

    it('should handle memory pressure during large uploads', async () => {
      // Arrange
      const largeFileSize = 10 * 1024 * 1024; // 10MB
      const fileCount = 3;

      // Monitor memory usage
      const initialMemory = process.memoryUsage();

      // Act
      const startTime = Date.now();
      const promises = Array.from({ length: fileCount }, (_, index) => {
        const mockFile = TestDataFactory.createMockFile({
          size: largeFileSize,
          buffer: Buffer.alloc(largeFileSize),
          originalname: `memory-pressure-${index}.jpg`,
          mimetype: 'image/jpeg',
        });

        return request(app.getHttpServer())
          .post('/storage/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', mockFile.buffer, mockFile.originalname);
      });

      const responses = await Promise.all(promises);
      const uploadTime = Date.now() - startTime;

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Assert
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
      });

      const totalSize = fileCount * largeFileSize;
      const memoryEfficiency = totalSize / memoryIncrease;

      expect(uploadTime).toBeLessThan(45000); // Complete within 45 seconds
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB memory increase
      expect(memoryEfficiency).toBeGreaterThan(0.5); // At least 0.5x efficiency (uploaded size vs memory used)

      console.log(`Memory Pressure Test Results:
        - Files uploaded: ${fileCount}
        - File size each: ${(largeFileSize / 1024 / 1024).toFixed(2)} MB
        - Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB
        - Upload time: ${uploadTime}ms
        - Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
        - Memory efficiency: ${memoryEfficiency.toFixed(2)}x
        - Upload speed: ${((totalSize / 1024 / 1024) / (uploadTime / 1000)).toFixed(2)} MB/s`);
    });

    it('should handle rapid successive uploads without errors', async () => {
      // Arrange
      const rapidUploads = 20;
      const fileSize = 200 * 1024; // 200KB
      const maxConcurrency = 5;

      // Act
      const startTime = Date.now();
      let completedUploads = 0;
      let failedUploads = 0;

      // Process uploads in batches to control concurrency
      for (let i = 0; i < rapidUploads; i += maxConcurrency) {
        const batchSize = Math.min(maxConcurrency, rapidUploads - i);
        const batchPromises = Array.from({ length: batchSize }, (_, batchIndex) => {
          const fileIndex = i + batchIndex;
          const mockFile = TestDataFactory.createMockFile({
            size: fileSize,
            buffer: Buffer.alloc(fileSize),
            originalname: `rapid-${fileIndex}.jpg`,
            mimetype: 'image/jpeg',
          });

          return request(app.getHttpServer())
            .post('/storage/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', mockFile.buffer, mockFile.originalname)
            .then(response => ({ success: true, response }))
            .catch(error => ({ success: false, error }));
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          if (result.success && [200, 201].includes(result.response.status)) {
            completedUploads++;
          } else {
            failedUploads++;
          }
        });
      }

      const totalTime = Date.now() - startTime;
      const successRate = (completedUploads / rapidUploads) * 100;
      const uploadsPerSecond = completedUploads / (totalTime / 1000);

      // Assert
      expect(successRate).toBeGreaterThan(95); // At least 95% success rate
      expect(totalTime).toBeLessThan(20000); // Complete within 20 seconds
      expect(uploadsPerSecond).toBeGreaterThan(1); // At least 1 upload per second

      console.log(`Rapid Successive Upload Performance:
        - Total uploads attempted: ${rapidUploads}
        - Successful uploads: ${completedUploads}
        - Failed uploads: ${failedUploads}
        - Success rate: ${successRate.toFixed(2)}%
        - Total time: ${totalTime}ms
        - Uploads per second: ${uploadsPerSecond.toFixed(2)}
        - Average time per upload: ${(totalTime / completedUploads).toFixed(2)}ms`);
    });
  });

  describe('File Download Performance', () => {
    it('should handle file download performance efficiently', async () => {
      // Arrange - First upload a file
      const fileSize = 2 * 1024 * 1024; // 2MB
      const mockFile = TestDataFactory.createMockFile({
        size: fileSize,
        buffer: Buffer.alloc(fileSize),
        originalname: 'download-test.jpg',
        mimetype: 'image/jpeg',
      });

      const uploadResponse = await request(app.getHttpServer())
        .post('/storage/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', mockFile.buffer, mockFile.originalname);

      expect([200, 201]).toContain(uploadResponse.status);
      const fileName = uploadResponse.body.fileName;

      // Act - Test download performance
      const downloadStartTime = Date.now();
      const downloadResponse = await request(app.getHttpServer())
        .get(`/storage/download/${fileName}`)
        .set('Authorization', `Bearer ${authToken}`);
      const downloadTime = Date.now() - downloadStartTime;

      // Assert
      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.body.length).toBeGreaterThan(0);
      expect(downloadTime).toBeLessThan(3000); // Download within 3 seconds

      console.log(`File Download Performance:
        - File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
        - Download time: ${downloadTime}ms
        - Download speed: ${((fileSize / 1024 / 1024) / (downloadTime / 1000)).toFixed(2)} MB/s`);
    });

    it('should handle concurrent file downloads', async () => {
      // Arrange - Upload multiple files first
      const fileCount = 5;
      const fileSize = 1 * 1024 * 1024; // 1MB each
      const uploadedFiles = [];

      for (let i = 0; i < fileCount; i++) {
        const mockFile = TestDataFactory.createMockFile({
          size: fileSize,
          buffer: Buffer.alloc(fileSize),
          originalname: `concurrent-download-${i}.jpg`,
          mimetype: 'image/jpeg',
        });

        const uploadResponse = await request(app.getHttpServer())
          .post('/storage/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', mockFile.buffer, mockFile.originalname);

        expect([200, 201]).toContain(uploadResponse.status);
        uploadedFiles.push(uploadResponse.body.fileName);
      }

      // Act - Test concurrent downloads
      const downloadStartTime = Date.now();
      const downloadPromises = uploadedFiles.map(fileName =>
        request(app.getHttpServer())
          .get(`/storage/download/${fileName}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const downloadResponses = await Promise.all(downloadPromises);
      const totalDownloadTime = Date.now() - downloadStartTime;

      // Assert
      downloadResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
      });

      const totalSize = fileCount * fileSize;
      const avgDownloadTime = totalDownloadTime / fileCount;

      expect(totalDownloadTime).toBeLessThan(8000); // All downloads within 8 seconds
      expect(avgDownloadTime).toBeLessThan(2000); // Average download within 2 seconds

      console.log(`Concurrent Download Performance:
        - Files downloaded: ${fileCount}
        - Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB
        - Total time: ${totalDownloadTime}ms
        - Average time per file: ${avgDownloadTime.toFixed(2)}ms
        - Overall throughput: ${((totalSize / 1024 / 1024) / (totalDownloadTime / 1000)).toFixed(2)} MB/s`);
    });
  });

  describe('Storage System Performance', () => {
    it('should handle storage information requests efficiently', async () => {
      // Act
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/storage/info')
        .set('Authorization', `Bearer ${authToken}`);
      const requestTime = Date.now() - startTime;

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('local');
      expect(response.body).toHaveProperty('supabase');
      expect(requestTime).toBeLessThan(1000); // Info request within 1 second

      console.log(`Storage Info Performance:
        - Request time: ${requestTime}ms
        - Response size: ${JSON.stringify(response.body).length} bytes`);
    });

    it('should handle storage health checks efficiently', async () => {
      // Act
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/storage/health')
        .set('Authorization', `Bearer ${authToken}`);
      const requestTime = Date.now() - startTime;

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('overall');
      expect(requestTime).toBeLessThan(2000); // Health check within 2 seconds

      console.log(`Storage Health Check Performance:
        - Request time: ${requestTime}ms
        - Overall status: ${response.body.overall}`);
    });

    it('should handle file validation performance', async () => {
      // Arrange
      const testFiles = [
        { name: 'valid.jpg', mimetype: 'image/jpeg', size: 1024 },
        { name: 'valid.png', mimetype: 'image/png', size: 2048 },
        { name: 'invalid.txt', mimetype: 'text/plain', size: 512 },
        { name: 'large.jpg', mimetype: 'image/jpeg', size: 15 * 1024 * 1024 },
      ];

      // Act & Assert
      for (const fileInfo of testFiles) {
        const mockFile = TestDataFactory.createMockFile({
          originalname: fileInfo.name,
          mimetype: fileInfo.mimetype,
          size: fileInfo.size,
          buffer: Buffer.alloc(Math.min(fileInfo.size, 1024)), // Small buffer for testing
        });

        const startTime = Date.now();
        const response = await request(app.getHttpServer())
          .post('/storage/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', mockFile.buffer, mockFile.originalname);
        const validationTime = Date.now() - startTime;

        // Validation should be fast regardless of outcome
        expect(validationTime).toBeLessThan(1000);

        console.log(`File Validation Performance - ${fileInfo.name}:
          - Validation time: ${validationTime}ms
          - Status: ${response.status}
          - Valid: ${[200, 201].includes(response.status)}`);
      }
    });
  });
});