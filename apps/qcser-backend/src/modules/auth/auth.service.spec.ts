import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../../entities/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

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

// Mock createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

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

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'supabase.url':
          return 'https://test.supabase.co';
        case 'supabase.serviceRoleKey':
          return 'test-service-role-key';
        default:
          return null;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: mockUser.role,
          isActive: mockUser.isActive,
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email, isActive: true },
      });
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email, isActive: true },
      });
    });

    it('should throw UnauthorizedException if Supabase auth fails', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
      role: UserRole.JEFA_CALIDAD,
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null); // User doesn't exist
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      });
      mockUserRepository.create.mockReturnValue({
        ...registerDto,
        id: 'new-user-id',
        isActive: true,
      });
      mockUserRepository.save.mockResolvedValue({
        ...registerDto,
        id: 'new-user-id',
        isActive: true,
      });
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 'new-user-id',
          email: registerDto.email,
          fullName: registerDto.fullName,
          role: registerDto.role,
          isActive: true,
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        email_confirm: true,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw ConflictException if Supabase user creation fails', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User creation failed' },
      });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserById(mockUser.id);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id, isActive: true },
      });
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getUserById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the specified role', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.hasRole(mockUser.id, UserRole.JEFA_CALIDAD);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user does not have the specified role', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.hasRole(mockUser.id, UserRole.ADMINISTRADOR);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.hasRole('non-existent-id', UserRole.JEFA_CALIDAD);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for administrator with any permission', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: UserRole.ADMINISTRADOR };
      mockUserRepository.findOne.mockResolvedValue(adminUser);

      // Act
      const result = await service.hasPermission(adminUser.id, 'create', 'evaluations');

      // Assert
      expect(result).toBe(true);
    });

    it('should return true if user has specific permission', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.hasPermission(mockUser.id, 'read', 'evaluations');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      // Arrange
      const gerenteUser = { ...mockUser, role: UserRole.GERENTE_GENERAL };
      mockUserRepository.findOne.mockResolvedValue(gerenteUser);

      // Act
      const result = await service.hasPermission(gerenteUser.id, 'delete', 'evaluations');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validateToken', () => {
    it('should return payload for valid token', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      // Act
      const result = await service.validateToken('valid-token');

      // Assert
      expect(result).toEqual(payload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});