import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    admin: {
      createUser: jest.fn(),
      updateUserById: jest.fn(),
    },
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authService: AuthService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    fullName: 'Test User',
    role: UserRole.JEFA_CALIDAD,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    evaluations: [],
  };

  const mockAdminUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: UserRole.ADMINISTRADOR,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    evaluations: [],
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              jwt: {
                secret: 'test-secret',
                expiresIn: '1h',
              },
              supabase: {
                url: 'https://test.supabase.co',
                serviceRoleKey: 'test-service-role-key',
              },
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtAuthGuard, RolesGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    authService = moduleFixture.get<AuthService>(AuthService);

    // Setup test data
    await userRepository.save(mockUser);
    await userRepository.save(mockAdminUser);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: mockUser.email,
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        isActive: mockUser.isActive,
      });
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      await userRepository.save(inactiveUser);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: inactiveUser.email,
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user when called by admin', async () => {
      // Arrange
      const adminToken = await authService.login({
        email: mockAdminUser.email,
        password: 'password123',
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockAdminUser.id } },
        error: null,
      });

      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      });

      const newUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        role: UserRole.JEFA_CALIDAD,
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken.access_token}`)
        .send(newUserData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe(newUserData.email);
      expect(response.body.user.role).toBe(newUserData.role);
    });

    it('should return 403 when called by non-admin user', async () => {
      // Arrange
      const userToken = await authService.login({
        email: mockUser.email,
        password: 'password123',
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });

      const newUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        role: UserRole.JEFA_CALIDAD,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${userToken.access_token}`)
        .send(newUserData)
        .expect(403);
    });

    it('should return 409 for duplicate email', async () => {
      // Arrange
      const adminToken = await authService.login({
        email: mockAdminUser.email,
        password: 'password123',
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockAdminUser.id } },
        error: null,
      });

      const duplicateUserData = {
        email: mockUser.email, // Existing email
        password: 'password123',
        fullName: 'Duplicate User',
        role: UserRole.JEFA_CALIDAD,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken.access_token}`)
        .send(duplicateUserData)
        .expect(409);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      // Arrange
      const userToken = await authService.login({
        email: mockUser.email,
        password: 'password123',
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${userToken.access_token}`)
        .expect(200);

      expect(response.body).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
        evaluations: [],
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });

  describe('PUT /auth/profile', () => {
    it('should update user profile when authenticated', async () => {
      // Arrange
      const userToken = await authService.login({
        email: mockUser.email,
        password: 'password123',
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });

      const updateData = {
        fullName: 'Updated Name',
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${userToken.access_token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.fullName).toBe(updateData.fullName);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token when authenticated', async () => {
      // Arrange
      const userToken = await authService.login({
        email: mockUser.email,
        password: 'password123',
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${userToken.access_token}`)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });
  });

  describe('GET /auth/validate', () => {
    it('should validate token and return user info', async () => {
      // Arrange
      const userToken = await authService.login({
        email: mockUser.email,
        password: 'password123',
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${userToken.access_token}`)
        .expect(200);

      expect(response.body).toEqual({
        valid: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      // Arrange
      const userToken = await authService.login({
        email: mockUser.email,
        password: 'password123',
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${userToken.access_token}`)
        .expect(201);

      expect(response.body).toEqual({ success: true });
    });
  });
});