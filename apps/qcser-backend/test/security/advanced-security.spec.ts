import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDataFactory } from '../factories/test-data.factory';
import { UserRole } from '../../src/entities/user.entity';

describe('Advanced Security Testing', () => {
  let app: INestApplication;
  let adminToken: string;
  let jefeToken: string;
  let gerenteToken: string;

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

    // Create test users with different roles
    const adminUser = TestDataFactory.createAdminUser();
    const jefeUser = TestDataFactory.createJefeCalidadUser();
    const gerenteUser = TestDataFactory.createGerenteUser();

    // Register users
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminUser.email,
        password: 'TestPassword123!',
        fullName: adminUser.fullName,
        role: adminUser.role,
      });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: jefeUser.email,
        password: 'TestPassword123!',
        fullName: jefeUser.fullName,
        role: jefeUser.role,
      });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: gerenteUser.email,
        password: 'TestPassword123!',
        fullName: gerenteUser.fullName,
        role: gerenteUser.role,
      });

    // Get tokens
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: 'TestPassword123!' });
    adminToken = adminResponse.body.access_token;

    const jefeResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: jefeUser.email, password: 'TestPassword123!' });
    jefeToken = jefeResponse.body.access_token;

    const gerenteResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: gerenteUser.email, password: 'TestPassword123!' });
    gerenteToken = gerenteResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Advanced Authentication Security', () => {
    it('should prevent JWT token manipulation attacks', async () => {
      // Arrange - Get a valid token and manipulate it
      const validToken = adminToken;
      const tokenParts = validToken.split('.');
      
      // Manipulate different parts of the JWT
      const manipulatedTokens = [
        // Manipulated header
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.' + tokenParts[1] + '.' + tokenParts[2],
        // Manipulated payload (try to change role)
        tokenParts[0] + '.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6IkFETUlOSVNUUkFET1IiLCJpYXQiOjE1MTYyMzkwMjJ9.' + tokenParts[2],
        // Manipulated signature
        tokenParts[0] + '.' + tokenParts[1] + '.manipulated_signature',
        // Algorithm confusion attack (none algorithm)
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6IkFETUlOSVNUUkFET1IiLCJpYXQiOjE1MTYyMzkwMjJ9.',
      ];

      // Act & Assert
      for (const manipulatedToken of manipulatedTokens) {
        await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${manipulatedToken}`)
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('Unauthorized');
          });
      }
    });

    it('should prevent timing attacks on authentication', async () => {
      // Arrange
      const validEmail = 'admin@test.com';
      const invalidEmail = 'nonexistent@test.com';
      const wrongPassword = 'wrongpassword';
      const iterations = 10;

      // Act - Measure timing for valid vs invalid emails
      const validEmailTimes = [];
      const invalidEmailTimes = [];

      for (let i = 0; i < iterations; i++) {
        // Test with valid email, wrong password
        const validEmailStart = Date.now();
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: validEmail, password: wrongPassword });
        validEmailTimes.push(Date.now() - validEmailStart);

        // Test with invalid email
        const invalidEmailStart = Date.now();
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: invalidEmail, password: wrongPassword });
        invalidEmailTimes.push(Date.now() - invalidEmailStart);
      }

      // Calculate averages
      const avgValidEmailTime = validEmailTimes.reduce((a, b) => a + b, 0) / validEmailTimes.length;
      const avgInvalidEmailTime = invalidEmailTimes.reduce((a, b) => a + b, 0) / invalidEmailTimes.length;
      const timingDifference = Math.abs(avgValidEmailTime - avgInvalidEmailTime);

      // Assert - Timing difference should be minimal to prevent timing attacks
      expect(timingDifference).toBeLessThan(50); // Less than 50ms difference

      console.log(`Timing Attack Prevention:
        - Valid email avg time: ${avgValidEmailTime.toFixed(2)}ms
        - Invalid email avg time: ${avgInvalidEmailTime.toFixed(2)}ms
        - Timing difference: ${timingDifference.toFixed(2)}ms`);
    });

    it('should prevent session fixation attacks', async () => {
      // Arrange - Create a session and try to fix it
      const userCredentials = {
        email: 'admin@test.com',
        password: 'TestPassword123!',
      };

      // Act - Get initial token
      const firstLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials)
        .expect(200);

      const firstToken = firstLogin.body.access_token;

      // Login again to get a new token
      const secondLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials)
        .expect(200);

      const secondToken = secondLogin.body.access_token;

      // Assert - Tokens should be different (no session fixation)
      expect(firstToken).not.toBe(secondToken);

      // Both tokens should be valid
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${firstToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${secondToken}`)
        .expect(200);
    });
  });

  describe('Advanced Authorization Security', () => {
    it('should prevent horizontal privilege escalation', async () => {
      // Arrange - Create two users with same role
      const jefe1 = TestDataFactory.createJefeCalidadUser({
        email: 'jefe1@test.com',
        fullName: 'Jefe 1',
      });

      const jefe2 = TestDataFactory.createJefeCalidadUser({
        email: 'jefe2@test.com',
        fullName: 'Jefe 2',
      });

      // Register both users
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: jefe1.email,
          password: 'TestPassword123!',
          fullName: jefe1.fullName,
          role: jefe1.role,
        });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: jefe2.email,
          password: 'TestPassword123!',
          fullName: jefe2.fullName,
          role: jefe2.role,
        });

      // Get tokens
      const jefe1Response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: jefe1.email, password: 'TestPassword123!' });
      const jefe1Token = jefe1Response.body.access_token;

      const jefe2Response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: jefe2.email, password: 'TestPassword123!' });
      const jefe2Token = jefe2Response.body.access_token;

      // Create evaluation with jefe1
      const evaluationData = TestDataFactory.createEvaluationDto();
      const createResponse = await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${jefe1Token}`)
        .send(evaluationData)
        .expect(201);

      const evaluationId = createResponse.body.id;

      // Act & Assert - jefe2 should NOT be able to modify jefe1's evaluation
      await request(app.getHttpServer())
        .patch(`/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${jefe2Token}`)
        .send({ generalObservations: 'Unauthorized modification' })
        .expect(403);

      // jefe2 should NOT be able to delete jefe1's evaluation
      await request(app.getHttpServer())
        .delete(`/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${jefe2Token}`)
        .expect(403);
    });

    it('should prevent vertical privilege escalation', async () => {
      // Arrange - Try to escalate from Jefe to Admin privileges
      const privilegeEscalationAttempts = [
        // Try to create users (admin only)
        {
          method: 'post',
          path: '/admin/users',
          data: {
            email: 'hacker@test.com',
            fullName: 'Hacker User',
            role: UserRole.ADMINISTRADOR,
          },
        },
        // Try to modify system parameters (admin only)
        {
          method: 'post',
          path: '/admin/parameters',
          data: {
            name: 'Malicious Parameter',
            weight: 100,
            subprocessId: 1,
          },
        },
        // Try to delete operators (admin only)
        {
          method: 'delete',
          path: '/operators/1',
          data: {},
        },
        // Try to access admin-only reports
        {
          method: 'get',
          path: '/admin/system-logs',
          data: {},
        },
      ];

      // Act & Assert - All attempts should fail with 403
      for (const attempt of privilegeEscalationAttempts) {
        const requestBuilder = request(app.getHttpServer())[attempt.method](attempt.path)
          .set('Authorization', `Bearer ${jefeToken}`);

        if (Object.keys(attempt.data).length > 0) {
          requestBuilder.send(attempt.data);
        }

        await requestBuilder.expect(403);
      }
    });
  });

  describe('Advanced Input Validation Security', () => {
    it('should prevent advanced SQL injection techniques', async () => {
      const advancedSqlPayloads = [
        // Union-based injection
        "' UNION SELECT password FROM users WHERE '1'='1",
        // Boolean-based blind injection
        "' AND (SELECT COUNT(*) FROM users) > 0 --",
        // Time-based blind injection
        "'; WAITFOR DELAY '00:00:05' --",
        // Stacked queries
        "'; INSERT INTO users (email, role) VALUES ('hacker@test.com', 'ADMINISTRADOR'); --",
        // Second-order injection
        "admin'; UPDATE users SET role='ADMINISTRADOR' WHERE email='jefe@test.com'; --",
        // Error-based injection
        "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a) --",
      ];

      // Test in various input fields
      const testEndpoints = [
        { method: 'post', path: '/auth/login', field: 'email' },
        { method: 'get', path: '/operators/search', field: 'q' },
        { method: 'post', path: '/operators', field: 'fullName' },
        { method: 'post', path: '/evaluations', field: 'generalObservations' },
      ];

      for (const payload of advancedSqlPayloads) {
        for (const endpoint of testEndpoints) {
          let requestBuilder = request(app.getHttpServer())[endpoint.method](endpoint.path);

          if (endpoint.method === 'get') {
            requestBuilder = requestBuilder.query({ [endpoint.field]: payload });
          } else {
            const data = endpoint.path === '/auth/login' 
              ? { [endpoint.field]: payload, password: 'test' }
              : endpoint.path === '/operators'
              ? { ...TestDataFactory.createOperatorDto(), [endpoint.field]: payload }
              : endpoint.path === '/evaluations'
              ? { ...TestDataFactory.createEvaluationDto(), [endpoint.field]: payload }
              : { [endpoint.field]: payload };

            requestBuilder = requestBuilder.send(data);
          }

          if (endpoint.path !== '/auth/login') {
            requestBuilder = requestBuilder.set('Authorization', `Bearer ${adminToken}`);
          }

          const response = await requestBuilder;

          // Should not cause server errors or expose data
          expect([400, 401, 403, 422]).toContain(response.status);
          expect(response.body.message).not.toContain('SQL');
          expect(response.body.message).not.toContain('database');
          expect(response.body.message).not.toContain('table');
        }
      }
    });

    it('should prevent NoSQL injection in complex queries', async () => {
      const noSqlPayloads = [
        // MongoDB-style injections
        { $where: "this.password.length > 0" },
        { $ne: null },
        { $gt: "" },
        { $regex: ".*" },
        { $or: [{ role: "ADMINISTRADOR" }, { role: "GERENTE_GENERAL" }] },
        // JavaScript injection
        { $where: "function() { return true; }" },
        // Aggregation injection
        { $lookup: { from: "users", localField: "_id", foreignField: "userId", as: "userData" } },
      ];

      for (const payload of noSqlPayloads) {
        // Test in filter parameters
        await request(app.getHttpServer())
          .get('/operators')
          .query({ filter: JSON.stringify(payload) })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect((res) => {
            expect([200, 400]).toContain(res.status);
            if (res.status === 200) {
              // Should not return unauthorized data
              expect(Array.isArray(res.body)).toBe(true);
            }
          });

        // Test in search parameters
        await request(app.getHttpServer())
          .get('/evaluations')
          .query({ search: JSON.stringify(payload) })
          .set('Authorization', `Bearer ${jefeToken}`)
          .expect((res) => {
            expect([200, 400]).toContain(res.status);
          });
      }
    });
  });

  describe('Advanced File Upload Security', () => {
    it('should prevent malicious file upload attacks', async () => {
      const maliciousFiles = [
        // PHP web shell
        {
          filename: 'shell.php',
          content: '<?php system($_GET["cmd"]); ?>',
          mimetype: 'application/x-php',
        },
        // JSP web shell
        {
          filename: 'shell.jsp',
          content: '<%@ page import="java.io.*" %><% String cmd = request.getParameter("cmd"); Process p = Runtime.getRuntime().exec(cmd); %>',
          mimetype: 'application/x-jsp',
        },
        // Executable disguised as image
        {
          filename: 'image.jpg.exe',
          content: 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00',
          mimetype: 'image/jpeg',
        },
        // SVG with JavaScript
        {
          filename: 'malicious.svg',
          content: '<svg onload="alert(\'XSS\')" xmlns="http://www.w3.org/2000/svg"><text>test</text></svg>',
          mimetype: 'image/svg+xml',
        },
        // HTML file disguised as image
        {
          filename: 'fake.jpg',
          content: '<html><body><script>alert("XSS")</script></body></html>',
          mimetype: 'image/jpeg',
        },
      ];

      for (const file of maliciousFiles) {
        const mockFile = TestDataFactory.createMockFile({
          originalname: file.filename,
          mimetype: file.mimetype,
          buffer: Buffer.from(file.content),
          size: file.content.length,
        });

        await request(app.getHttpServer())
          .post('/storage/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', mockFile.buffer, mockFile.originalname)
          .expect((res) => {
            // Should reject malicious files
            expect([400, 413, 415, 422]).toContain(res.status);
            expect(res.body.message).not.toContain('uploaded successfully');
          });
      }
    });

    it('should prevent path traversal in file operations', async () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd',
        '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
        '/var/www/../../etc/passwd',
        'C:\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      ];

      for (const payload of pathTraversalPayloads) {
        // Test file upload with malicious filename
        const mockFile = TestDataFactory.createMockFile({
          originalname: payload,
          mimetype: 'image/jpeg',
          buffer: Buffer.from('fake image content'),
          size: 100,
        });

        await request(app.getHttpServer())
          .post('/storage/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', mockFile.buffer, mockFile.originalname)
          .expect((res) => {
            if ([200, 201].includes(res.status)) {
              // If upload succeeds, filename should be sanitized
              expect(res.body.fileName).not.toContain('..');
              expect(res.body.fileName).not.toContain('/');
              expect(res.body.fileName).not.toContain('\\');
              expect(res.body.fileName).not.toContain('etc');
              expect(res.body.fileName).not.toContain('passwd');
            } else {
              expect([400, 422]).toContain(res.status);
            }
          });

        // Test file download with malicious path
        await request(app.getHttpServer())
          .get(`/storage/download/${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect((res) => {
            expect([400, 404]).toContain(res.status);
            expect(res.body).not.toContain('root:');
            expect(res.body).not.toContain('admin:');
          });
      }
    });
  });

  describe('Business Logic Security', () => {
    it('should prevent evaluation manipulation attacks', async () => {
      // Arrange - Create evaluation
      const evaluationData = TestDataFactory.createEvaluationDto();
      const createResponse = await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${jefeToken}`)
        .send(evaluationData)
        .expect(201);

      const evaluationId = createResponse.body.id;

      // Act & Assert - Try to manipulate evaluation scores
      const manipulationAttempts = [
        // Try to set impossible compliance percentage
        { compliancePercentage: 150 },
        { compliancePercentage: -10 },
        // Try to manipulate final score
        { finalScore: 999 },
        { finalScore: -100 },
        // Try to change evaluation date to future
        { evaluationDate: new Date(Date.now() + 86400000).toISOString() },
        // Try to change evaluator
        { evaluatorId: 'different-evaluator' },
        // Try to manipulate work week/year
        { workWeek: 60 }, // Invalid week
        { workYear: 2030 }, // Future year
      ];

      for (const manipulation of manipulationAttempts) {
        await request(app.getHttpServer())
          .patch(`/evaluations/${evaluationId}`)
          .set('Authorization', `Bearer ${jefeToken}`)
          .send(manipulation)
          .expect((res) => {
            if (res.status === 200) {
              // If update succeeds, ensure values are within valid ranges
              if (manipulation.compliancePercentage !== undefined) {
                expect(res.body.compliancePercentage).toBeGreaterThanOrEqual(0);
                expect(res.body.compliancePercentage).toBeLessThanOrEqual(100);
              }
              if (manipulation.finalScore !== undefined) {
                expect(res.body.finalScore).toBeGreaterThanOrEqual(0);
                expect(res.body.finalScore).toBeLessThanOrEqual(100);
              }
            } else {
              expect([400, 422]).toContain(res.status);
            }
          });
      }
    });

    it('should prevent duplicate evaluation attacks', async () => {
      // Arrange - Create initial evaluation
      const evaluationData = TestDataFactory.createEvaluationDto({
        quadrantCode: 'DUPLICATE_TEST',
        workWeek: 25,
        workYear: 2023,
      });

      await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${jefeToken}`)
        .send(evaluationData)
        .expect(201);

      // Act & Assert - Try to create duplicate evaluations
      const duplicateAttempts = [
        // Exact duplicate
        evaluationData,
        // Same operator, quadrant, week, year but different time
        {
          ...evaluationData,
          evaluationTime: '15:00',
        },
        // Same operator, quadrant, week, year but different observations
        {
          ...evaluationData,
          generalObservations: 'Different observations',
        },
      ];

      for (const duplicate of duplicateAttempts) {
        await request(app.getHttpServer())
          .post('/evaluations')
          .set('Authorization', `Bearer ${jefeToken}`)
          .send(duplicate)
          .expect(409); // Should return conflict
      }

      // Should allow evaluation for different week
      await request(app.getHttpServer())
        .post('/evaluations')
        .set('Authorization', `Bearer ${jefeToken}`)
        .send({
          ...evaluationData,
          workWeek: 26, // Different week
          quadrantCode: 'DUPLICATE_TEST_2',
        })
        .expect(201);
    });
  });
});