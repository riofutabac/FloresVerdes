import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { Operator, OperatorStatus } from '../../entities/operator.entity';
import { CreateOperatorDto, UpdateOperatorDto } from './dto/operator.dto';

describe('OperatorsService', () => {
  let service: OperatorsService;
  let repository: Repository<Operator>;

  const mockOperator: Operator = {
    id: 1,
    employeeId: 'EMP001',
    fullName: 'Juan Pérez',
    hireDate: new Date('2023-01-15'),
    hasDisability: false,
    disabilityDescription: null,
    moduleId: 1,
    areaId: 1,
    quadrantCode: 'A1',
    roseVarietyId: 1,
    status: OperatorStatus.ACTIVO,
    createdAt: new Date(),
    updatedAt: new Date(),
    module: null,
    area: null,
    roseVariety: null,
    evaluations: [],
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorsService,
        {
          provide: getRepositoryToken(Operator),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OperatorsService>(OperatorsService);
    repository = module.get<Repository<Operator>>(getRepositoryToken(Operator));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createOperatorDto: CreateOperatorDto = {
      employeeId: 'EMP002',
      fullName: 'María García',
      hireDate: '2023-02-01',
      hasDisability: false,
      moduleId: 1,
      areaId: 1,
      quadrantCode: 'A2',
      roseVarietyId: 1,
      status: OperatorStatus.ACTIVO,
    };

    it('should successfully create an operator', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null); // No existing operator
      mockRepository.create.mockReturnValue(mockOperator);
      mockRepository.save.mockResolvedValue(mockOperator);

      // Act
      const result = await service.create(createOperatorDto);

      // Assert
      expect(result).toEqual(mockOperator);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: createOperatorDto.employeeId },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createOperatorDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockOperator);
    });

    it('should throw ConflictException if operator with same employeeId exists', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockOperator);

      // Act & Assert
      await expect(service.create(createOperatorDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: createOperatorDto.employeeId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all operators without filters', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOperator]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([mockOperator]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('operator');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('operator.fullName', 'ASC');
    });

    it('should apply filters when provided', async () => {
      // Arrange
      const filters = {
        moduleId: 1,
        areaId: 1,
        status: OperatorStatus.ACTIVO,
        search: 'Juan',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOperator]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result).toEqual([mockOperator]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4); // One for each filter
    });
  });

  describe('findOne', () => {
    it('should return operator if found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockOperator);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockOperator);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['module', 'area', 'roseVariety', 'evaluations'],
      });
    });

    it('should throw NotFoundException if operator not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmployeeId', () => {
    it('should return operator if found by employeeId', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockOperator);

      // Act
      const result = await service.findByEmployeeId('EMP001');

      // Assert
      expect(result).toEqual(mockOperator);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 'EMP001' },
        relations: ['module', 'area', 'roseVariety'],
      });
    });

    it('should throw NotFoundException if operator not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByEmployeeId('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateOperatorDto: UpdateOperatorDto = {
      fullName: 'Juan Carlos Pérez',
      status: OperatorStatus.INACTIVO,
    };

    it('should successfully update an operator', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockOperator);
      const updatedOperator = { ...mockOperator, ...updateOperatorDto };
      mockRepository.save.mockResolvedValue(updatedOperator);

      // Act
      const result = await service.update(1, updateOperatorDto);

      // Assert
      expect(result).toEqual(updatedOperator);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockOperator,
        ...updateOperatorDto,
      });
    });

    it('should throw NotFoundException if operator not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, updateOperatorDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updating to existing employeeId', async () => {
      // Arrange
      const updateWithEmployeeId = { ...updateOperatorDto, employeeId: 'EMP003' };
      mockRepository.findOne
        .mockResolvedValueOnce(mockOperator) // First call for findOne
        .mockResolvedValueOnce({ ...mockOperator, id: 2 }); // Second call for existing employeeId check

      // Act & Assert
      await expect(service.update(1, updateWithEmployeeId)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should successfully soft delete an operator', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockOperator);
      const updatedOperator = { ...mockOperator, status: OperatorStatus.BAJA };
      mockRepository.save.mockResolvedValue(updatedOperator);

      // Act
      await service.remove(1);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockOperator,
        status: OperatorStatus.BAJA,
      });
    });

    it('should throw NotFoundException if operator not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('activate', () => {
    it('should successfully activate an operator', async () => {
      // Arrange
      const inactiveOperator = { ...mockOperator, status: OperatorStatus.INACTIVO };
      mockRepository.findOne.mockResolvedValue(inactiveOperator);
      const activatedOperator = { ...inactiveOperator, status: OperatorStatus.ACTIVO };
      mockRepository.save.mockResolvedValue(activatedOperator);

      // Act
      const result = await service.activate(1);

      // Assert
      expect(result).toEqual(activatedOperator);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...inactiveOperator,
        status: OperatorStatus.ACTIVO,
      });
    });
  });

  describe('deactivate', () => {
    it('should successfully deactivate an operator', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockOperator);
      const deactivatedOperator = { ...mockOperator, status: OperatorStatus.INACTIVO };
      mockRepository.save.mockResolvedValue(deactivatedOperator);

      // Act
      const result = await service.deactivate(1);

      // Assert
      expect(result).toEqual(deactivatedOperator);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockOperator,
        status: OperatorStatus.INACTIVO,
      });
    });
  });

  describe('getStatistics', () => {
    it('should return operator statistics', async () => {
      // Arrange
      mockRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // active
        .mockResolvedValueOnce(15)  // inactive
        .mockResolvedValueOnce(5);  // terminated

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { moduleId: '1', moduleName: 'Módulo A', count: '30' },
          { moduleId: '2', moduleName: 'Módulo B', count: '50' },
        ]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result).toEqual({
        total: 100,
        active: 80,
        inactive: 15,
        terminated: 5,
        byModule: [
          { moduleId: 1, moduleName: 'Módulo A', count: 30 },
          { moduleId: 2, moduleName: 'Módulo B', count: 50 },
        ],
        byArea: [
          { moduleId: 1, moduleName: 'Módulo A', count: 30 },
          { moduleId: 2, moduleName: 'Módulo B', count: 50 },
        ],
      });
    });
  });

  describe('search', () => {
    it('should return operators matching search term', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([mockOperator]);

      // Act
      const result = await service.search('Juan');

      // Assert
      expect(result).toEqual([mockOperator]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          { fullName: expect.any(Object) }, // Like operator
          { employeeId: expect.any(Object) }, // Like operator
        ],
        relations: ['module', 'area', 'roseVariety'],
        take: 20,
      });
    });
  });
});