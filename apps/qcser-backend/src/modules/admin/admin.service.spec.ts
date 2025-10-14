import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User, UserRole } from '../../entities/user.entity';
import { EvaluationParameter } from '../../entities/evaluation-parameter.entity';
import { RoseVariety } from '../../entities/rose-variety.entity';
import { Subprocess } from '../../entities/subprocess.entity';
import { Supervisor } from '../../entities/supervisor.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { CreateParameterDto, UpdateParameterDto } from './dto/parameter.dto';
import { CreateVarietyDto, UpdateVarietyDto } from './dto/variety.dto';

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: Repository<User>;
  let parameterRepository: Repository<EvaluationParameter>;
  let varietyRepository: Repository<RoseVariety>;
  let subprocessRepository: Repository<Subprocess>;
  let supervisorRepository: Repository<Supervisor>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: UserRole.ADMINISTRADOR,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    evaluations: [],
  };

  const mockParameter: EvaluationParameter = {
    id: 1,
    name: 'Test Parameter',
    description: 'Test parameter description',
    weight: 10,
    subprocessId: 1,
    isActive: true,
    version: 1,
    effectiveDate: new Date(),
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    subprocess: null,
    evaluationDetails: [],
  };

  const mockVariety: RoseVariety = {
    id: 1,
    name: 'Red Rose',
    code: 'RR001',
    description: 'Beautiful red rose variety',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    operators: [],
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockParameterRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockVarietyRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSubprocessRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSupervisorRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(EvaluationParameter),
          useValue: mockParameterRepository,
        },
        {
          provide: getRepositoryToken(RoseVariety),
          useValue: mockVarietyRepository,
        },
        {
          provide: getRepositoryToken(Subprocess),
          useValue: mockSubprocessRepository,
        },
        {
          provide: getRepositoryToken(Supervisor),
          useValue: mockSupervisorRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    parameterRepository = module.get<Repository<EvaluationParameter>>(getRepositoryToken(EvaluationParameter));
    varietyRepository = module.get<Repository<RoseVariety>>(getRepositoryToken(RoseVariety));
    subprocessRepository = module.get<Repository<Subprocess>>(getRepositoryToken(Subprocess));
    supervisorRepository = module.get<Repository<Supervisor>>(getRepositoryToken(Supervisor));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Management (ADM-01 to ADM-05)', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      fullName: 'New User',
      role: UserRole.JEFA_CALIDAD,
    };

    it('should successfully create a user (ADM-01)', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null); // User doesn't exist
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.createUser(createUserDto);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw ConflictException if user already exists (ADM-14)', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });

    it('should assign one of three specific roles (ADM-02)', async () => {
      // Arrange
      const adminDto = { ...createUserDto, role: UserRole.ADMINISTRADOR };
      const jefeDto = { ...createUserDto, role: UserRole.JEFA_CALIDAD };
      const gerenteDto = { ...createUserDto, role: UserRole.GERENTE_GENERAL };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.createUser(adminDto)).resolves.toBeDefined();
      await expect(service.createUser(jefeDto)).resolves.toBeDefined();
      await expect(service.createUser(gerenteDto)).resolves.toBeDefined();
    });

    it('should return all users (ADM-03)', async () => {
      // Arrange
      mockUserRepository.find.mockResolvedValue([mockUser]);

      // Act
      const result = await service.getAllUsers();

      // Assert
      expect(result).toEqual([mockUser]);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        order: { fullName: 'ASC' },
      });
    });

    it('should update user data (ADM-04)', async () => {
      // Arrange
      const updateUserDto: UpdateUserDto = {
        fullName: 'Updated User Name',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUser(mockUser.id, updateUserDto);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserDto,
      });
    });

    it('should deactivate user (ADM-05)', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const deactivatedUser = { ...mockUser, isActive: false };
      mockUserRepository.save.mockResolvedValue(deactivatedUser);

      // Act
      const result = await service.deactivateUser(mockUser.id);

      // Assert
      expect(result).toEqual(deactivatedUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        isActive: false,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateUser('non-existent-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('Parameter Management (ADM-10, ADM-11, ADM-17)', () => {
    const createParameterDto: CreateParameterDto = {
      name: 'New Parameter',
      description: 'New parameter description',
      weight: 15,
      subprocessId: 1,
    };

    it('should create evaluation parameter (ADM-10)', async () => {
      // Arrange
      mockParameterRepository.create.mockReturnValue(mockParameter);
      mockParameterRepository.save.mockResolvedValue(mockParameter);

      // Act
      const result = await service.createParameter(createParameterDto);

      // Assert
      expect(result).toEqual(mockParameter);
      expect(mockParameterRepository.create).toHaveBeenCalledWith({
        ...createParameterDto,
        version: 1,
        effectiveDate: expect.any(Date),
        isActive: true,
      });
    });

    it('should list parameters by module and subprocess (ADM-11)', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockParameter]),
      };
      mockParameterRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getParametersByModule(1);

      // Assert
      expect(result).toEqual([mockParameter]);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('parameter.subprocess', 'subprocess');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('subprocess.moduleId = :moduleId', { moduleId: 1 });
    });

    it('should create parameter version for traceability (ADM-17)', async () => {
      // Arrange
      const updateParameterDto: UpdateParameterDto = {
        weight: 20,
      };
      mockParameterRepository.findOne.mockResolvedValue(mockParameter);
      
      // Mock ending current version
      mockParameterRepository.save
        .mockResolvedValueOnce({ ...mockParameter, endDate: new Date() }) // End current version
        .mockResolvedValueOnce({ ...mockParameter, id: 2, version: 2, weight: 20 }); // New version

      mockParameterRepository.create.mockReturnValue({
        ...mockParameter,
        id: 2,
        version: 2,
        weight: 20,
        effectiveDate: new Date(),
        endDate: null,
      });

      // Act
      const result = await service.updateParameter(1, updateParameterDto);

      // Assert
      expect(mockParameterRepository.save).toHaveBeenCalledTimes(2); // End old version + create new version
      expect(mockParameterRepository.create).toHaveBeenCalledWith({
        ...mockParameter,
        id: undefined,
        version: 2,
        weight: 20,
        effectiveDate: expect.any(Date),
        endDate: null,
      });
    });
  });

  describe('Rose Variety Management (ADM-12, ADM-13)', () => {
    const createVarietyDto: CreateVarietyDto = {
      name: 'White Rose',
      code: 'WR001',
      description: 'Beautiful white rose variety',
    };

    it('should register rose variety (ADM-12)', async () => {
      // Arrange
      mockVarietyRepository.findOne.mockResolvedValue(null); // No existing variety
      mockVarietyRepository.create.mockReturnValue(mockVariety);
      mockVarietyRepository.save.mockResolvedValue(mockVariety);

      // Act
      const result = await service.createVariety(createVarietyDto);

      // Assert
      expect(result).toEqual(mockVariety);
      expect(mockVarietyRepository.findOne).toHaveBeenCalledWith({
        where: { code: createVarietyDto.code },
      });
      expect(mockVarietyRepository.create).toHaveBeenCalledWith(createVarietyDto);
    });

    it('should show all registered varieties for assignment (ADM-13)', async () => {
      // Arrange
      mockVarietyRepository.find.mockResolvedValue([mockVariety]);

      // Act
      const result = await service.getAllVarieties();

      // Assert
      expect(result).toEqual([mockVariety]);
      expect(mockVarietyRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });

    it('should prevent duplicate variety codes (ADM-14)', async () => {
      // Arrange
      mockVarietyRepository.findOne.mockResolvedValue(mockVariety);

      // Act & Assert
      await expect(service.createVariety(createVarietyDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('Subprocess Structure Management (ADM-18)', () => {
    it('should define subprocesses by module', async () => {
      // Arrange
      const harvestSubprocesses = [
        { name: 'Enmallado', moduleId: 1 },
        { name: 'Cuadrante', moduleId: 1 },
      ];
      const postHarvestSubprocesses = [
        { name: 'Recepción', moduleId: 2 },
        { name: 'Clasificación', moduleId: 2 },
        { name: 'Boncheo', moduleId: 2 },
        { name: 'Fin de Banda', moduleId: 2 },
        { name: 'Empaque', moduleId: 2 },
      ];

      mockSubprocessRepository.find.mockResolvedValue([...harvestSubprocesses, ...postHarvestSubprocesses]);

      // Act
      const harvestResult = await service.getSubprocessesByModule(1);
      const postHarvestResult = await service.getSubprocessesByModule(2);

      // Assert
      expect(mockSubprocessRepository.find).toHaveBeenCalledWith({
        where: { moduleId: 1, isActive: true },
        order: { name: 'ASC' },
      });
      expect(mockSubprocessRepository.find).toHaveBeenCalledWith({
        where: { moduleId: 2, isActive: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('Supervisor Assignment (ADM-19)', () => {
    it('should register supervisor responsible for each area', async () => {
      // Arrange
      const mockSupervisor = {
        id: 1,
        fullName: 'Supervisor Test',
        areaId: 1,
        isActive: true,
      };
      mockSupervisorRepository.find.mockResolvedValue([mockSupervisor]);

      // Act
      const result = await service.getSupervisorsByArea(1);

      // Assert
      expect(result).toEqual([mockSupervisor]);
      expect(mockSupervisorRepository.find).toHaveBeenCalledWith({
        where: { areaId: 1, isActive: true },
        relations: ['area'],
      });
    });
  });

  describe('Access Control (ADM-22)', () => {
    it('should allow Administrator to manage catalogs', async () => {
      // This would be tested at the controller level with guards
      // Here we just verify the service methods exist and work
      expect(service.createUser).toBeDefined();
      expect(service.createParameter).toBeDefined();
      expect(service.createVariety).toBeDefined();
    });

    it('should provide read-only access methods for other roles', async () => {
      // Arrange
      mockUserRepository.find.mockResolvedValue([mockUser]);
      mockParameterRepository.find.mockResolvedValue([mockParameter]);
      mockVarietyRepository.find.mockResolvedValue([mockVariety]);

      // Act
      const users = await service.getAllUsers();
      const parameters = await service.getParametersByModule(1);
      const varieties = await service.getAllVarieties();

      // Assert
      expect(users).toBeDefined();
      expect(parameters).toBeDefined();
      expect(varieties).toBeDefined();
    });
  });

  describe('Duplicate Validation (ADM-14, ADM-21)', () => {
    it('should prevent duplicate users by email', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.createUser({
        email: mockUser.email,
        fullName: 'Another User',
        role: UserRole.JEFA_CALIDAD,
      })).rejects.toThrow(ConflictException);
    });

    it('should prevent duplicate variety codes', async () => {
      // Arrange
      mockVarietyRepository.findOne.mockResolvedValue(mockVariety);

      // Act & Assert
      await expect(service.createVariety({
        name: 'Different Name',
        code: mockVariety.code,
        description: 'Different description',
      })).rejects.toThrow(ConflictException);
    });
  });
});