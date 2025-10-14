import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
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

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for valid token', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };
      const mockPayload = {
        sub: 'user-id',
        email: 'user@example.com',
        role: 'jefa_calidad',
      };

      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      // Arrange
      const mockRequest = {
        headers: {},
      };

      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Token de acceso requerido')
      );
    });

    it('should throw UnauthorizedException when authorization header is malformed', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Token de acceso requerido')
      );
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Token de acceso inválido')
      );
    });

    it('should extract token correctly from Bearer authorization header', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer test-token-123',
        },
      };
      const mockPayload = {
        sub: 'user-id',
        email: 'user@example.com',
        role: 'administrador',
      };

      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      // Act
      await guard.canActivate(mockExecutionContext);

      // Assert
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('test-token-123', {
        secret: 'test-secret',
      });
    });
  });
});