import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should return false when user is not present in request', () => {
      // Arrange
      const requiredRoles = [UserRole.ADMINISTRADOR];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      
      const mockRequest = {}; // No user property
      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when user has required role', () => {
      // Arrange
      const requiredRoles = [UserRole.ADMINISTRADOR];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      
      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'admin@example.com',
          role: UserRole.ADMINISTRADOR,
        },
      };
      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      // Arrange
      const requiredRoles = [UserRole.ADMINISTRADOR];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      
      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.JEFA_CALIDAD,
        },
      };
      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when user has one of multiple required roles', () => {
      // Arrange
      const requiredRoles = [UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      
      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'jefa@example.com',
          role: UserRole.JEFA_CALIDAD,
        },
      };
      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user has none of the required roles', () => {
      // Arrange
      const requiredRoles = [UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      
      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'gerente@example.com',
          role: UserRole.GERENTE_GENERAL,
        },
      };
      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(false);
    });
  });
});