import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { Evaluation, EvaluationStatus } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../entities/evaluation-photo.entity';
import { CreateEvaluationDto, UpdateEvaluationDto, CloseEvaluationDto } from './dto/evaluation.dto';

describe('EvaluationsService', () => {
  let service: EvaluationsService;
  let evaluationRepository: Repository<Evaluation>;
  let evaluationDetailRepository: Repository<EvaluationDetail>;
  let evaluationPhotoRepository: Repository<EvaluationPhoto>;

  const mockEvaluation: Evaluation = {
    id: 1,
    operatorId: 1,
    evaluatorId: 'test-evaluator-id',
    areaId: 1,
    moduleId: 1,
    quadrantCode: 'A1',
    evaluationDate: new Date('2023-12-01'),
    evaluationTime: '09:30',
    workWeek: 48,
    workYear: 2023,
    initialScore: 100.00,
    finalScore: 85.50,
    compliancePercentage: 85.5,
    generalObservations: 'Buen desempeño general',
    status: EvaluationStatus.BORRADOR,
    isSynced: false,
    localId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    operator: null,
    evaluator: null,
    area: null,
    module: null,
    details: [],
    photos: [],
  };

  const mockEvaluationDetail: EvaluationDetail = {
    id: 1,
    evaluationId: 1,
    parameterId: 1,
    isCompliant: true,
    weightApplied: 10,
    observations: 'Cumple con el estándar',
    createdAt: new Date(),
    evaluation: null,
    parameter: null,
  };

  const mockEvaluationRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEvaluationDetailRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  const mockEvaluationPhotoRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: getRepositoryToken(Evaluation),
          useValue: mockEvaluationRepository,
        },
        {
          provide: getRepositoryToken(EvaluationDetail),
          useValue: mockEvaluationDetailRepository,
        },
        {
          provide: getRepositoryToken(EvaluationPhoto),
          useValue: mockEvaluationPhotoRepository,
        },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
    evaluationRepository = module.get<Repository<Evaluation>>(getRepositoryToken(Evaluation));
    evaluationDetailRepository = module.get<Repository<EvaluationDetail>>(getRepositoryToken(EvaluationDetail));
    evaluationPhotoRepository = module.get<Repository<EvaluationPhoto>>(getRepositoryToken(EvaluationPhoto));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createEvaluationDto: CreateEvaluationDto = {
      operatorId: 1,
      areaId: 1,
      moduleId: 1,
      quadrantCode: 'A1',
      evaluationDate: '2023-12-01',
      evaluationTime: '09:30',
      workWeek: 48,
      workYear: 2023,
      finalScore: 85.5,
      compliancePercentage: 85.5,
      generalObservations: 'Evaluación inicial',
      details: [
        {
          parameterId: 1,
          isCompliant: true,
          weightApplied: 10,
          observations: 'Cumple estándar',
        },
      ],
    };

    it('should successfully create an evaluation', async () => {
      // Arrange
      mockEvaluationRepository.findOne.mockResolvedValue(null); // No existing evaluation
      const savedEvaluation = { ...mockEvaluation, id: 1 };
      mockEvaluationRepository.create.mockReturnValue(mockEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(savedEvaluation);
      mockEvaluationDetailRepository.create.mockReturnValue(mockEvaluationDetail);
      mockEvaluationDetailRepository.save.mockResolvedValue([mockEvaluationDetail]);
      
      // Mock findOne for the return call
      jest.spyOn(service, 'findOne').mockResolvedValue(savedEvaluation);

      // Act
      const result = await service.create(createEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(result).toEqual(savedEvaluation);
      expect(mockEvaluationRepository.create).toHaveBeenCalledWith({
        ...createEvaluationDto,
        evaluatorId: 'test-evaluator-id',
        initialScore: 100.00,
      });
      expect(mockEvaluationRepository.save).toHaveBeenCalled();
      expect(mockEvaluationDetailRepository.create).toHaveBeenCalledTimes(1);
      expect(mockEvaluationDetailRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if evaluation already exists for same operator, quadrant, week and year', async () => {
      // Arrange
      mockEvaluationRepository.findOne.mockResolvedValue(mockEvaluation);

      // Act & Assert
      await expect(service.create(createEvaluationDto, 'test-evaluator-id'))
        .rejects.toThrow(ConflictException);
      expect(mockEvaluationRepository.findOne).toHaveBeenCalledWith({
        where: {
          operatorId: createEvaluationDto.operatorId,
          quadrantCode: createEvaluationDto.quadrantCode,
          workWeek: createEvaluationDto.workWeek,
          workYear: createEvaluationDto.workYear,
        },
      });
    });

    it('should set initial score to 100 if not provided', async () => {
      // Arrange
      const createDtoWithoutInitialScore = { ...createEvaluationDto };
      delete createDtoWithoutInitialScore.initialScore;
      
      mockEvaluationRepository.findOne.mockResolvedValue(null);
      mockEvaluationRepository.create.mockReturnValue(mockEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      mockEvaluationDetailRepository.create.mockReturnValue(mockEvaluationDetail);
      mockEvaluationDetailRepository.save.mockResolvedValue([mockEvaluationDetail]);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act
      await service.create(createDtoWithoutInitialScore, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationRepository.create).toHaveBeenCalledWith({
        ...createDtoWithoutInitialScore,
        evaluatorId: 'test-evaluator-id',
        initialScore: 100.00,
      });
    });
  });

  describe('findAll', () => {
    it('should return all evaluations without filters', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvaluation]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([mockEvaluation]);
      expect(mockEvaluationRepository.createQueryBuilder).toHaveBeenCalledWith('evaluation');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(7);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('evaluation.evaluationDate', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('evaluation.evaluationTime', 'DESC');
    });

    it('should apply filters when provided', async () => {
      // Arrange
      const filters = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        status: EvaluationStatus.BORRADOR,
        startDate: '2023-12-01',
        endDate: '2023-12-31',
        minCompliance: 80,
        maxCompliance: 100,
        notSynced: true,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvaluation]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result).toEqual([mockEvaluation]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(8); // One for each filter
    });
  });

  describe('findOne', () => {
    it('should return evaluation if found', async () => {
      // Arrange
      mockEvaluationRepository.findOne.mockResolvedValue(mockEvaluation);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockEvaluation);
      expect(mockEvaluationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'operator',
          'operator.module',
          'operator.area',
          'operator.roseVariety',
          'evaluator',
          'area',
          'module',
          'details',
          'details.parameter',
          'details.parameter.subprocess',
          'photos',
          'photos.subprocess',
        ],
      });
    });

    it('should throw NotFoundException if evaluation not found', async () => {
      // Arrange
      mockEvaluationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateEvaluationDto: UpdateEvaluationDto = {
      generalObservations: 'Observaciones actualizadas',
      details: [
        {
          parameterId: 1,
          isCompliant: false,
          weightApplied: 10,
          observations: 'Necesita mejora',
        },
      ],
    };

    it('should successfully update an evaluation', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);
      const updatedEvaluation = { ...mockEvaluation, ...updateEvaluationDto };
      mockEvaluationRepository.save.mockResolvedValue(updatedEvaluation);
      mockEvaluationDetailRepository.delete.mockResolvedValue(undefined);
      mockEvaluationDetailRepository.create.mockReturnValue(mockEvaluationDetail);
      mockEvaluationDetailRepository.save.mockResolvedValue([mockEvaluationDetail]);

      // Act
      const result = await service.update(1, updateEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(result).toEqual(updatedEvaluation);
      expect(mockEvaluationRepository.save).toHaveBeenCalled();
      expect(mockEvaluationDetailRepository.delete).toHaveBeenCalledWith({ evaluationId: 1 });
    });

    it('should throw NotFoundException if evaluation not found', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.update(999, updateEvaluationDto, 'test-evaluator-id'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to update closed evaluation', async () => {
      // Arrange
      const closedEvaluation = { ...mockEvaluation, status: EvaluationStatus.CERRADA };
      jest.spyOn(service, 'findOne').mockResolvedValue(closedEvaluation);

      // Act & Assert
      await expect(service.update(1, updateEvaluationDto, 'test-evaluator-id'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if evaluator is not the same who created the evaluation', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act & Assert
      await expect(service.update(1, updateEvaluationDto, 'different-evaluator-id'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('close', () => {
    const closeEvaluationDto: CloseEvaluationDto = {
      finalObservations: 'Evaluación completada satisfactoriamente',
    };

    it('should successfully close an evaluation', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);
      const closedEvaluation = { 
        ...mockEvaluation, 
        status: EvaluationStatus.CERRADA,
        generalObservations: closeEvaluationDto.finalObservations,
      };
      mockEvaluationRepository.save.mockResolvedValue(closedEvaluation);

      // Act
      const result = await service.close(1, closeEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(result).toEqual(closedEvaluation);
      expect(mockEvaluationRepository.save).toHaveBeenCalledWith({
        ...mockEvaluation,
        status: EvaluationStatus.CERRADA,
        generalObservations: closeEvaluationDto.finalObservations,
      });
    });

    it('should throw NotFoundException if evaluation not found', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.close(999, closeEvaluationDto, 'test-evaluator-id'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if evaluation is already closed', async () => {
      // Arrange
      const closedEvaluation = { ...mockEvaluation, status: EvaluationStatus.CERRADA };
      jest.spyOn(service, 'findOne').mockResolvedValue(closedEvaluation);

      // Act & Assert
      await expect(service.close(1, closeEvaluationDto, 'test-evaluator-id'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if evaluator is not the same who created the evaluation', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act & Assert
      await expect(service.close(1, closeEvaluationDto, 'different-evaluator-id'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should successfully remove an evaluation', async () => {
      // Arrange
      const draftEvaluation = { ...mockEvaluation, status: EvaluationStatus.BORRADOR };
      jest.spyOn(service, 'findOne').mockResolvedValue(draftEvaluation);
      mockEvaluationRepository.remove.mockResolvedValue(draftEvaluation);

      // Act
      await service.remove(1, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationRepository.remove).toHaveBeenCalledWith(draftEvaluation);
    });

    it('should throw NotFoundException if evaluation not found', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.remove(999, 'test-evaluator-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to remove closed evaluation', async () => {
      // Arrange
      const closedEvaluation = { ...mockEvaluation, status: EvaluationStatus.CERRADA };
      jest.spyOn(service, 'findOne').mockResolvedValue(closedEvaluation);

      // Act & Assert
      await expect(service.remove(1, 'test-evaluator-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if evaluator is not the same who created the evaluation', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act & Assert
      await expect(service.remove(1, 'different-evaluator-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateCompliancePercentage', () => {
    it('should calculate compliance percentage correctly (COS-07, COS-08)', () => {
      // Arrange
      const details = [
        { isCompliant: true, weightApplied: 30 },
        { isCompliant: false, weightApplied: 20 },
        { isCompliant: true, weightApplied: 50 },
      ];

      // Act
      const result = service.calculateCompliancePercentage(details);

      // Assert
      expect(result).toBe(80); // 100 - 20 = 80%
    });

    it('should return 0 if total deduction exceeds 100 (COS-07)', () => {
      // Arrange
      const details = [
        { isCompliant: false, weightApplied: 60 },
        { isCompliant: false, weightApplied: 50 },
      ];

      // Act
      const result = service.calculateCompliancePercentage(details);

      // Assert
      expect(result).toBe(0); // Math.max(0, 100 - 110) = 0
    });

    it('should return 100 if all parameters are compliant (COS-08)', () => {
      // Arrange
      const details = [
        { isCompliant: true, weightApplied: 30 },
        { isCompliant: true, weightApplied: 20 },
        { isCompliant: true, weightApplied: 50 },
      ];

      // Act
      const result = service.calculateCompliancePercentage(details);

      // Assert
      expect(result).toBe(100); // 100 - 0 = 100%
    });

    it('should handle decimal weights and round to 2 decimal places (COS-07, COS-08)', () => {
      // Arrange
      const details = [
        { isCompliant: true, weightApplied: 15.5 },
        { isCompliant: false, weightApplied: 12.33 },
        { isCompliant: false, weightApplied: 7.89 },
      ];

      // Act
      const result = service.calculateCompliancePercentage(details);

      // Assert
      expect(result).toBe(79.78); // 100 - (12.33 + 7.89) = 79.78%
    });

    it('should handle empty details array (COS-08)', () => {
      // Arrange
      const details = [];

      // Act
      const result = service.calculateCompliancePercentage(details);

      // Assert
      expect(result).toBe(100); // No deductions = 100%
    });

    it('should handle single non-compliant parameter (COS-07)', () => {
      // Arrange
      const details = [
        { isCompliant: false, weightApplied: 25.5 },
      ];

      // Act
      const result = service.calculateCompliancePercentage(details);

      // Assert
      expect(result).toBe(74.5); // 100 - 25.5 = 74.5%
    });
  });

  describe('getStatistics', () => {
    it('should return evaluation statistics', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        getCount: jest.fn()
          .mockResolvedValueOnce(100) // total
          .mockResolvedValueOnce(80)  // draft
          .mockResolvedValueOnce(20), // closed
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '82.5' }),
        getRawMany: jest.fn()
          .mockResolvedValueOnce([
            { areaId: '1', areaName: 'Area 1', count: '50', avgCompliance: '85.0' },
            { areaId: '2', areaName: 'Area 2', count: '50', avgCompliance: '80.0' },
          ])
          .mockResolvedValueOnce([
            { moduleId: '1', moduleName: 'Module 1', count: '60', avgCompliance: '83.0' },
            { moduleId: '2', moduleName: 'Module 2', count: '40', avgCompliance: '82.0' },
          ]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result).toEqual({
        total: 100,
        draft: 80,
        closed: 20,
        averageCompliance: 82.5,
        byArea: [
          { areaId: 1, areaName: 'Area 1', count: 50, avgCompliance: 85.0 },
          { areaId: 2, areaName: 'Area 2', count: 50, avgCompliance: 80.0 },
        ],
        byModule: [
          { moduleId: 1, moduleName: 'Module 1', count: 60, avgCompliance: 83.0 },
          { moduleId: 2, moduleName: 'Module 2', count: 40, avgCompliance: 82.0 },
        ],
        complianceDistribution: expect.any(Array),
      });
    });
  });

  describe('findByOperator', () => {
    it('should return evaluations for specific operator', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvaluation]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findByOperator(1);

      // Assert
      expect(result).toEqual([mockEvaluation]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('evaluation.operatorId = :operatorId', { operatorId: 1 });
    });
  });

  describe('findPendingSync', () => {
    it('should return evaluations pending synchronization', async () => {
      // Arrange
      const pendingEvaluations = [{ ...mockEvaluation, isSynced: false }];
      mockEvaluationRepository.find.mockResolvedValue(pendingEvaluations);

      // Act
      const result = await service.findPendingSync('test-evaluator-id');

      // Assert
      expect(result).toEqual(pendingEvaluations);
      expect(mockEvaluationRepository.find).toHaveBeenCalledWith({
        where: { 
          evaluatorId: 'test-evaluator-id', 
          isSynced: false 
        },
        relations: ['details', 'photos'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('markAsSynced', () => {
    it('should mark evaluations as synced', async () => {
      // Arrange
      const evaluationIds = [1, 2, 3];
      mockEvaluationRepository.update.mockResolvedValue(undefined);

      // Act
      await service.markAsSynced(evaluationIds);

      // Assert
      expect(mockEvaluationRepository.update).toHaveBeenCalledWith(
        evaluationIds,
        { isSynced: true }
      );
    });
  });

  describe('Evaluation Workflow Management (COS-16, COS-17, COS-18, COS-19, COS-20, COS-21, COS-23, COS-24, COS-25, COS-27)', () => {
    it('should display flower variety and supervisor information in findOne (COS-16, COS-17)', async () => {
      // Arrange
      mockEvaluationRepository.findOne.mockResolvedValue(mockEvaluation);

      // Act
      await service.findOne(1);

      // Assert
      expect(mockEvaluationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: expect.arrayContaining([
          'operator.roseVariety', // COS-16: Flower variety
          'area', // COS-17: Supervisor responsible for area
        ]),
      });
    });

    it('should prevent duplicate evaluations for same operator-quadrant-week (COS-19)', async () => {
      // Arrange
      const createEvaluationDto: CreateEvaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'A1',
        evaluationDate: '2023-12-01',
        evaluationTime: '09:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        details: [],
      };

      // Mock existing evaluation
      mockEvaluationRepository.findOne.mockResolvedValue(mockEvaluation);

      // Act & Assert
      await expect(service.create(createEvaluationDto, 'test-evaluator-id'))
        .rejects.toThrow(ConflictException);
      
      expect(mockEvaluationRepository.findOne).toHaveBeenCalledWith({
        where: {
          operatorId: createEvaluationDto.operatorId,
          quadrantCode: createEvaluationDto.quadrantCode,
          workWeek: createEvaluationDto.workWeek,
          workYear: createEvaluationDto.workYear,
        },
      });
    });

    it('should handle date and time management (COS-20, COS-21)', async () => {
      // Arrange
      const createEvaluationDto: CreateEvaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'A1',
        evaluationDate: '2023-12-01',
        evaluationTime: '14:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        details: [],
      };

      mockEvaluationRepository.findOne.mockResolvedValue(null);
      mockEvaluationRepository.create.mockReturnValue(mockEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act
      await service.create(createEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          evaluationDate: '2023-12-01',
          evaluationTime: '14:30',
        })
      );
    });

    it('should display work week information (COS-27)', async () => {
      // Arrange
      const createEvaluationDto: CreateEvaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'A1',
        evaluationDate: '2023-12-01',
        evaluationTime: '09:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        details: [],
      };

      mockEvaluationRepository.findOne.mockResolvedValue(null);
      mockEvaluationRepository.create.mockReturnValue(mockEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act
      await service.create(createEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workWeek: 48,
          workYear: 2023,
        })
      );
    });

    it('should allow draft editing but prevent closed evaluation modification (COS-23, COS-24)', async () => {
      // Arrange - Draft evaluation
      const draftEvaluation = { ...mockEvaluation, status: EvaluationStatus.BORRADOR };
      const updateDto: UpdateEvaluationDto = { generalObservations: 'Updated observations' };

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(draftEvaluation)
        .mockResolvedValueOnce(draftEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(draftEvaluation);

      // Act - Should allow update of draft
      await expect(service.update(1, updateDto, 'test-evaluator-id')).resolves.toBeDefined();

      // Arrange - Closed evaluation
      const closedEvaluation = { ...mockEvaluation, status: EvaluationStatus.CERRADA };
      jest.spyOn(service, 'findOne').mockResolvedValue(closedEvaluation);

      // Act & Assert - Should prevent update of closed evaluation
      await expect(service.update(1, updateDto, 'test-evaluator-id'))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle evaluation closure with final observations (COS-24)', async () => {
      // Arrange
      const draftEvaluation = { ...mockEvaluation, status: EvaluationStatus.BORRADOR };
      const closeDto: CloseEvaluationDto = { finalObservations: 'Evaluation completed successfully' };

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(draftEvaluation)
        .mockResolvedValueOnce({ ...draftEvaluation, status: EvaluationStatus.CERRADA });
      mockEvaluationRepository.save.mockResolvedValue({
        ...draftEvaluation,
        status: EvaluationStatus.CERRADA,
        generalObservations: closeDto.finalObservations,
      });

      // Act
      const result = await service.close(1, closeDto, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationRepository.save).toHaveBeenCalledWith({
        ...draftEvaluation,
        status: EvaluationStatus.CERRADA,
        generalObservations: closeDto.finalObservations,
      });
    });

    it('should save evaluation with all required data (COS-18)', async () => {
      // Arrange
      const createEvaluationDto: CreateEvaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'A1',
        evaluationDate: '2023-12-01',
        evaluationTime: '09:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        generalObservations: 'Good performance overall',
        details: [
          {
            parameterId: 1,
            isCompliant: true,
            weightApplied: 10,
            observations: 'Meets standard',
          },
        ],
        photos: [
          {
            subprocessId: 1,
            filePath: 'storage/photos/test.jpg',
            fileName: 'test.jpg',
            fileSize: 1024,
            mimeType: 'image/jpeg',
          },
        ],
      };

      mockEvaluationRepository.findOne.mockResolvedValue(null);
      mockEvaluationRepository.create.mockReturnValue(mockEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      mockEvaluationDetailRepository.create.mockReturnValue(mockEvaluationDetail);
      mockEvaluationDetailRepository.save.mockResolvedValue([mockEvaluationDetail]);
      mockEvaluationPhotoRepository.create.mockReturnValue({} as any);
      mockEvaluationPhotoRepository.save.mockResolvedValue([{} as any]);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act
      const result = await service.create(createEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationRepository.save).toHaveBeenCalled();
      expect(mockEvaluationDetailRepository.save).toHaveBeenCalled();
      expect(mockEvaluationPhotoRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('Parameter and Observation Management (COS-10, COS-11, COS-12)', () => {
    it('should handle parameter observations in evaluation details (COS-10)', async () => {
      // Arrange
      const createEvaluationDto: CreateEvaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'A1',
        evaluationDate: '2023-12-01',
        evaluationTime: '09:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        details: [
          {
            parameterId: 1,
            isCompliant: false,
            weightApplied: 10,
            observations: 'Necesita mejorar la técnica de corte',
          },
          {
            parameterId: 2,
            isCompliant: true,
            weightApplied: 15,
            observations: 'Excelente manejo de herramientas',
          },
        ],
      };

      mockEvaluationRepository.findOne.mockResolvedValue(null);
      mockEvaluationRepository.create.mockReturnValue(mockEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      
      // Mock create to return different objects for each call
      mockEvaluationDetailRepository.create
        .mockReturnValueOnce({ ...mockEvaluationDetail, parameterId: 1, observations: 'Necesita mejorar la técnica de corte' })
        .mockReturnValueOnce({ ...mockEvaluationDetail, parameterId: 2, observations: 'Excelente manejo de herramientas' });
      
      mockEvaluationDetailRepository.save.mockResolvedValue([mockEvaluationDetail]);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act
      await service.create(createEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationDetailRepository.create).toHaveBeenCalledTimes(2);
      expect(mockEvaluationDetailRepository.create).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({
          parameterId: 1,
          observations: 'Necesita mejorar la técnica de corte',
          evaluationId: 1,
        })
      );
      expect(mockEvaluationDetailRepository.create).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          parameterId: 2,
          observations: 'Excelente manejo de herramientas',
          evaluationId: 1,
        })
      );
    });

    it('should handle general observations in evaluation (COS-11)', async () => {
      // Arrange
      const createEvaluationDto: CreateEvaluationDto = {
        operatorId: 1,
        areaId: 1,
        moduleId: 1,
        quadrantCode: 'A1',
        evaluationDate: '2023-12-01',
        evaluationTime: '09:30',
        workWeek: 48,
        workYear: 2023,
        finalScore: 85.5,
        compliancePercentage: 85.5,
        generalObservations: 'Operario muestra buen desempeño general, pero necesita refuerzo en técnicas específicas',
        details: [],
      };

      mockEvaluationRepository.findOne.mockResolvedValue(null);
      mockEvaluationRepository.create.mockReturnValue(mockEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvaluation);

      // Act
      await service.create(createEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          generalObservations: 'Operario muestra buen desempeño general, pero necesita refuerzo en técnicas específicas',
        })
      );
    });

    it('should organize parameters by subprocess in findOne relations (COS-12)', async () => {
      // Arrange
      mockEvaluationRepository.findOne.mockResolvedValue(mockEvaluation);

      // Act
      await service.findOne(1);

      // Assert
      expect(mockEvaluationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: expect.arrayContaining([
          'details.parameter.subprocess',
        ]),
      });
    });

    it('should update parameter observations when updating evaluation (COS-10)', async () => {
      // Arrange
      const updateEvaluationDto: UpdateEvaluationDto = {
        details: [
          {
            parameterId: 1,
            isCompliant: false,
            weightApplied: 10,
            observations: 'Observación actualizada para el parámetro',
          },
        ],
      };

      // Use a draft evaluation for update
      const draftEvaluation = { ...mockEvaluation, status: EvaluationStatus.BORRADOR };
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(draftEvaluation)  // First call in update method
        .mockResolvedValueOnce(draftEvaluation); // Second call at the end
      
      mockEvaluationRepository.save.mockResolvedValue(draftEvaluation);
      mockEvaluationDetailRepository.delete.mockResolvedValue(undefined);
      mockEvaluationDetailRepository.create.mockReturnValue(mockEvaluationDetail);
      mockEvaluationDetailRepository.save.mockResolvedValue([mockEvaluationDetail]);

      // Act
      await service.update(1, updateEvaluationDto, 'test-evaluator-id');

      // Assert
      expect(mockEvaluationDetailRepository.delete).toHaveBeenCalledWith({ evaluationId: 1 });
      expect(mockEvaluationDetailRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          observations: 'Observación actualizada para el parámetro',
          evaluationId: 1,
        })
      );
    });

    it('should display final result with compliance percentage (COS-09)', async () => {
      // Arrange
      const evaluationWithCompliance = {
        ...mockEvaluation,
        compliancePercentage: 87.5,
        finalScore: 87.5,
      };
      mockEvaluationRepository.findOne.mockResolvedValue(evaluationWithCompliance);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result.compliancePercentage).toBe(87.5);
      expect(result.finalScore).toBe(87.5);
    });
  });
});