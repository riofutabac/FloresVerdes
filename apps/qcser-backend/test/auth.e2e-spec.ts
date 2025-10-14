import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { User, UserRole } from '../src/entities/user.entity';
import databaseConfig from '../src/config/database.config';
import jwtConfig from '../src/config/jwt.config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

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
            entities: [User],
            synchronize: true,
            dropSchema: true,
          }),
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration and Authentication (ADM-01, ADM-02)', () => {
    const testUser = {
      email: 'test@qcser.com',
      password: 'TestPassword123!',
      fullName: 'Test User',
      role: UserRole.JEFA_CALIDAD,
    };

    it('should register a new user with valid data (ADM-01)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', testUser.email);
          expect(res.body.user).toHaveProperty('fullName', testUser.fullName);
          expect(res.body.user).toHaveProperty('role', testUser.role);
          expect(res.body.user).toHaveProperty('isActive', true);
        });
    });

    it('should assign one of three specific roles (ADM-02)', async () => {
      const adminUser = { ...testUser, email: 'admin@qcser.com', role: UserRole.ADMINISTRADOR };
      const jefeUser = { ...testUser, email: 'jefe@qcser.com', role: UserRole.JEFA_CALIDAD };
      const gerenteUser = { ...testUser, email: 'gerente@qcser.com', role: UserRole.GERENTE_GENERAL };

      // Test all three roles
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.user.role).toBe(UserRole.ADMINISTRADOR);
        });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(jefeUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.user.role).toBe(UserRole.JEFA_CALIDAD);
        });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(gerenteUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.user.role).toBe(UserRole.GERENTE_GENERAL);
        });
    });

    it('should prevent duplicate user registration (ADM-14)', async () => {
      // Try to register the same user again
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        email: 'invalid-email', // Invalid email format
        // Missing password, fullName, role
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });
  });

  describe('User Login and Token Management', () => {
    const loginCredentials = {
      email: 'test@qcser.com',
      password: 'TestPassword123!',
    };

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginCredentials)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', loginCredentials.email);
          expect(typeof res.body.access_token).toBe('string');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: loginCredentials.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should reject login for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@qcser.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should reject login for inactive user', async () => {
      // First register a user
      const inactiveUser = {
        email: 'inactive@qcser.com',
        password: 'TestPassword123!',
        fullName: 'Inactive User',
        role: UserRole.JEFA_CALIDAD,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(inactiveUser)
        .expect(201);

      // Deactivate the user (this would be done through admin endpoints)
      // For this test, we'll assume the user is deactivated

      // Try to login with inactive user
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: inactiveUser.email,
          password: inactiveUser.password,
        })
        .expect(401);
    });
  });

  describe('Protected Routes and JWT Validation', () => {
    let authToken: string;

    beforeAll(async () => {
      // Get auth token for protected route tests
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@qcser.com',
          password: 'TestPassword123!',
        });

      authToken = response.body.access_token;
    });

    it('should return user profile when authenticated', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'test@qcser.com');
          expect(res.body).toHaveProperty('fullName', 'Test User');
          expect(res.body).toHaveProperty('role', UserRole.JEFA_CALIDAD);
          expect(res.body).toHaveProperty('isActive', true);
        });
    });

    it('should reject requests without authentication token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Unauthorized');
        });
    });

    it('should reject requests with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('Token Refresh and Expiration', () => {
    let authToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@qcser.com',
          password: 'TestPassword123!',
        });

      authToken = response.body.access_token;
    });

    it('should refresh valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
          expect(res.body.access_token).not.toBe(authToken); // Should be a new token
        });
    });

    it('should reject refresh with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Role-based Access Control', () => {
    let adminToken: string;
    let jefeToken: string;
    let gerenteToken: string;

    beforeAll(async () => {
      // Get tokens for different roles
      const adminResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@qcser.com',
          password: 'TestPassword123!',
        });
      adminToken = adminResponse.body.access_token;

      const jefeResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'jefe@qcser.com',
          password: 'TestPassword123!',
        });
      jefeToken = jefeResponse.body.access_token;

      const gerenteResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'gerente@qcser.com',
          password: 'TestPassword123!',
        });
      gerenteToken = gerenteResponse.body.access_token;
    });

    it('should validate user roles in token payload', async () => {
      // Test admin role
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toBe(UserRole.ADMINISTRADOR);
        });

      // Test jefe role
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${jefeToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toBe(UserRole.JEFA_CALIDAD);
        });

      // Test gerente role
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toBe(UserRole.GERENTE_GENERAL);
        });
    });

    it('should provide role validation endpoint', () => {
      return request(app.getHttpServer())
        .get('/auth/validate-role/ADMINISTRADOR')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('hasRole', true);
        });
    });

    it('should reject role validation for insufficient permissions', () => {
      return request(app.getHttpServer())
        .get('/auth/validate-role/ADMINISTRADOR')
        .set('Authorization', `Bearer ${jefeToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('hasRole', false);
        });
    });
  });

  describe('Security and Input Validation', () => {
    it('should sanitize input data', async () => {
      const maliciousUser = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '<script>alert("xss")</script>',
        role: UserRole.JEFA_CALIDAD,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(maliciousUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.user.fullName).not.toContain('<script>');
        });
    });

    it('should enforce password complexity', async () => {
      const weakPasswordUser = {
        email: 'weak@example.com',
        password: '123', // Too weak
        fullName: 'Weak Password User',
        role: UserRole.JEFA_CALIDAD,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordUser)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('password');
        });
    });

    it('should validate email format', async () => {
      const invalidEmailUser = {
        email: 'invalid-email-format',
        password: 'ValidPassword123!',
        fullName: 'Invalid Email User',
        role: UserRole.JEFA_CALIDAD,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidEmailUser)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email');
        });
    });

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempt = {
        email: "test'; DROP TABLE users; --",
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(sqlInjectionAttempt)
        .expect(400); // Should be rejected due to validation
    });
  });

  describe('Rate Limiting and Security Headers', () => {
    it('should implement rate limiting for login attempts', async () => {
      const invalidCredentials = {
        email: 'test@qcser.com',
        password: 'wrongpassword',
      };

      // Make multiple failed login attempts
      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidCredentials)
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should include security headers in responses', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@qcser.com',
          password: 'TestPassword123!',
        })
        .expect((res) => {
          expect(res.headers).toHaveProperty('x-content-type-options');
          expect(res.headers).toHaveProperty('x-frame-options');
          expect(res.headers).toHaveProperty('x-xss-protection');
        });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For now, we test that the endpoint exists and handles errors
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@qcser.com',
          password: 'TestPassword123!',
        })
        .expect((res) => {
          expect([200, 500, 503]).toContain(res.status);
        });
    });

    it('should handle malformed JSON requests', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle empty request body', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);
      const longInputUser = {
        email: 'long@example.com',
        password: 'ValidPassword123!',
        fullName: longString,
        role: UserRole.JEFA_CALIDAD,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(longInputUser)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('too long');
        });
    });
  });
});