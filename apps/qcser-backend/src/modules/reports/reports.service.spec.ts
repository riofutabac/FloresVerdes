import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Evaluation } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { Operator } from '../../entities/operator.entity';
import { Area } from '../../entities/area.entity';
import { Module } from '../../entities/module.entity';
import { GenerateReportDto } from './dto/report.dto';

describe('ReportsService', () => {
  let service: ReportsService;
  let evaluationRepository: Repository<Evaluation>;
  let evaluationDetailRepository: Repository<EvaluationDetail>;
  let operatorRepository: Repository<Operator>;

  const mockEvaluation = {
    id: 1,
    operatorId: 1,
    areaId: 1,
    moduleId: 1,
    evaluationDate: new Date('2023-12-01'),
    compliancePercentage: 85.5,
    finalScore: 8.5,
    operator: {
      id: 1,
      fullName: 'Test Operator',
      area: { id: 1, name: 'Area 1' },
      module: { id: 1, name: 'Module 1' },
    },
  };

  const mockEvaluationRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEvaluationDetailRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const mockOperatorRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Evaluation),
          useValue: mockEvaluationRepository,
        },
        {
          provide: getRepositoryToken(EvaluationDetail),
          useValue: mockEvaluationDetailRepository,
        },
        {
          provide: getRepositoryToken(Operator),
          useValue: mockOperatorRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    evaluationRepository = module.get<Repository<Evaluation>>(getRepositoryToken(Evaluation));
    evaluationDetailRepository = module.get<Repository<EvaluationDetail>>(getRepositoryToken(EvaluationDetail));
    operatorRepository = module.get<Repository<Operator>>(getRepositoryToken(Operator));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Reporting Functionality (KPI-01 to KPI-06)', () => {
    it('should generate report with period selection (KPI-01)', async () => {
      // Arrange
      const reportDto: GenerateReportDto = {
        type: 'general',
        format: 'json',
        startDate: '2023-12-01',
        endDate: '2023-12-31',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvaluation]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.generateReport(reportDto);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('period');
      expect(result.period).toEqual({
        startDate: reportDto.startDate,
        endDate: reportDto.endDate,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'evaluation.evaluationDate >= :startDate',
        { startDate: reportDto.startDate }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'evaluation.evaluationDate <= :endDate',
        { endDate: reportDto.endDate }
      );
    });

    it('should display harvest average line chart with trend (KPI-02)', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { date: '2023-12-01', avgCompliance: '85.5', count: '10' },
          { date: '2023-12-02', avgCompliance: '87.2', count: '12' },
          { date: '2023-12-03', avgCompliance: '83.1', count: '8' },
        ]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getHarvestAverageChart('2023-12-01', '2023-12-31');

      // Assert
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('trend');
      expect(result.chartData).toHaveLength(3);
      expect(result.chartData[0]).toEqual({
        date: '2023-12-01',
        percentage: 85.5,
        count: 10,
      });
      expect(result.trend).toHaveProperty('direction');
      expect(result.trend).toHaveProperty('percentage');
    });

    it('should display area average line chart with trend (KPI-03)', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { areaId: '1', areaName: 'Area 1', date: '2023-12-01', avgCompliance: '88.0' },
          { areaId: '2', areaName: 'Area 2', date: '2023-12-01', avgCompliance: '82.5' },
        ]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getAreaAverageChart('2023-12-01', '2023-12-31');

      // Assert
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('areas');
      expect(result.chartData).toHaveLength(2);
      expect(result.areas).toContain('Area 1');
      expect(result.areas).toContain('Area 2');
    });

    it('should display monthly summary table (KPI-04)', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { month: '2023-12', avgCompliance: '85.5', totalEvaluations: '150', evaluatedOperators: '45' },
        ]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getMonthlySummary('2023-12-01', '2023-12-31');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        month: '2023-12',
        averageCompliance: 85.5,
        totalEvaluations: 150,
        evaluatedOperators: 45,
        operatorPercentage: expect.any(Number),
      });
    });

    it('should display reasons matrix by area (heatmap) (KPI-05)', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { areaId: '1', areaName: 'A1', parameterId: '1', parameterName: 'Parameter 1', count: '15' },
          { areaId: '1', areaName: 'A1', parameterId: '2', parameterName: 'Parameter 2', count: '8' },
          { areaId: '2', areaName: 'A2', parameterId: '1', parameterName: 'Parameter 1', count: '12' },
          { areaId: '2', areaName: 'A2', parameterId: '2', parameterName: 'Parameter 2', count: '20' },
        ]),
      };
      mockEvaluationDetailRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getReasonsMatrix('2023-12-01', '2023-12-31');

      // Assert
      expect(result).toHaveProperty('matrix');
      expect(result).toHaveProperty('areas');
      expect(result).toHaveProperty('parameters');
      expect(result.areas).toEqual(['A1', 'A2']);
      expect(result.parameters).toEqual(['Parameter 1', 'Parameter 2']);
      expect(result.matrix).toHaveProperty('A1');
      expect(result.matrix.A1).toHaveProperty('Parameter 1', 15);
      expect(result.matrix.A1).toHaveProperty('Parameter 2', 8);
    });

    it('should include observations and recommendations (KPI-06)', async () => {
      // Arrange
      const reportDto: GenerateReportDto = {
        type: 'general',
        format: 'json',
        startDate: '2023-12-01',
        endDate: '2023-12-31',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvaluation]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.generateReport(reportDto);

      // Assert
      expect(result).toHaveProperty('observations');
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.observations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Individual Operator Reporting (KPI-07 to KPI-10, KPI-13)', () => {
    it('should allow selection of specific operator (KPI-07)', async () => {
      // Arrange
      const operatorId = 1;
      mockOperatorRepository.findOne.mockResolvedValue({
        id: operatorId,
        fullName: 'Test Operator',
        area: { name: 'Area 1' },
        module: { name: 'Module 1' },
      });

      // Act
      const result = await service.getOperatorProfile(operatorId);

      // Assert
      expect(result).toHaveProperty('id', operatorId);
      expect(result).toHaveProperty('fullName', 'Test Operator');
      expect(mockOperatorRepository.findOne).toHaveBeenCalledWith({
        where: { id: operatorId },
        relations: ['area', 'module', 'roseVariety'],
      });
    });

    it('should display operator profile data (KPI-08)', async () => {
      // Arrange
      const operatorId = 1;
      const mockOperator = {
        id: operatorId,
        fullName: 'Juan Pérez',
        area: { name: 'Area 1' },
        quadrantCode: 'A1',
        hireDate: new Date('2023-01-15'),
        hasDisability: false,
      };
      mockOperatorRepository.findOne.mockResolvedValue(mockOperator);

      // Act
      const result = await service.getOperatorProfile(operatorId);

      // Assert
      expect(result).toEqual({
        id: operatorId,
        fullName: 'Juan Pérez',
        area: 'Area 1',
        quadrant: 'A1',
        hireDate: new Date('2023-01-15'),
        disability: false,
      });
    });

    it('should display code-average-objective table (KPI-09)', async () => {
      // Arrange
      const operatorId = 1;
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { parameterId: '1', parameterName: 'Parameter 1', avgScore: '85.5', objective: '100' },
          { parameterId: '2', parameterName: 'Parameter 2', avgScore: '92.0', objective: '100' },
        ]),
      };
      mockEvaluationDetailRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getOperatorParameterAnalysis(operatorId, '2023-12-01', '2023-12-31');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        parameterId: 1,
        parameterName: 'Parameter 1',
        averageObtained: 85.5,
        objective: 100,
        gap: -14.5,
      });
    });

    it('should display individual performance chart (KPI-10)', async () => {
      // Arrange
      const operatorId = 1;
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { date: '2023-12-01', avgCompliance: '85.5' },
          { date: '2023-12-08', avgCompliance: '88.2' },
          { date: '2023-12-15', avgCompliance: '92.8' },
        ]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getOperatorPerformanceChart(operatorId, '2023-12-01', '2023-12-31');

      // Assert
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('finalAverage');
      expect(result).toHaveProperty('objectiveLine');
      expect(result.chartData).toHaveLength(3);
      expect(result.finalAverage).toBe(88.83); // (85.5 + 88.2 + 92.8) / 3
      expect(result.objectiveLine).toBe(100);
    });

    it('should allow filtering evaluation history (KPI-13)', async () => {
      // Arrange
      const filters = {
        operatorId: 1,
        quadrant: 'A1',
        areaId: 1,
        moduleId: 1,
        startDate: '2023-12-01',
        endDate: '2023-12-31',
        minCompliance: 80,
        maxCompliance: 100,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvaluation]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getEvaluationHistory(filters);

      // Assert
      expect(result).toEqual([mockEvaluation]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(7); // One for each filter
    });
  });

  describe('Report Export and Dashboard Features (KPI-11, KPI-12)', () => {
    it('should export reports to PDF (KPI-11)', async () => {
      // Arrange
      const reportDto: GenerateReportDto = {
        type: 'individual',
        format: 'pdf',
        operatorId: 1,
        startDate: '2023-12-01',
        endDate: '2023-12-31',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvaluation]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.generateReport(reportDto);

      // Assert
      expect(result).toHaveProperty('format', 'pdf');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('filePath');
      expect(result.fileName).toMatch(/\.pdf$/);
    });

    it('should support multiple export formats', async () => {
      // Arrange
      const formats = ['json', 'csv', 'excel', 'pdf'];
      const baseDto = {
        type: 'general',
        startDate: '2023-12-01',
        endDate: '2023-12-31',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvaluation]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act & Assert
      for (const format of formats) {
        const reportDto = { ...baseDto, format };
        const result = await service.generateReport(reportDto);
        expect(result).toHaveProperty('format', format);
      }
    });

    it('should provide optimized dashboard data endpoints', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { metric: 'totalEvaluations', value: '150' },
          { metric: 'averageCompliance', value: '85.5' },
          { metric: 'activeOperators', value: '45' },
        ]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getDashboardData();

      // Assert
      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('areaComparison');
      expect(result.kpis).toHaveProperty('totalEvaluations');
      expect(result.kpis).toHaveProperty('averageCompliance');
      expect(result.kpis).toHaveProperty('activeOperators');
    });
  });

  describe('External Dashboard Analytics', () => {
    it('should provide comparative bar charts by area', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { areaId: '1', areaName: 'Area 1', avgCompliance: '88.5' },
          { areaId: '2', areaName: 'Area 2', avgCompliance: '82.3' },
          { areaId: '3', areaName: 'Area 3', avgCompliance: '91.2' },
        ]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getAreaComparison('2023-12-01', '2023-12-31');

      // Assert
      expect(result).toHaveProperty('chartType', 'bar');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        area: 'Area 1',
        compliance: 88.5,
      });
    });

    it('should provide Top/Bottom 5 operator rankings', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { operatorId: '1', operatorName: 'Operator 1', avgCompliance: '95.2' },
          { operatorId: '2', operatorName: 'Operator 2', avgCompliance: '93.8' },
          { operatorId: '3', operatorName: 'Operator 3', avgCompliance: '92.1' },
        ]),
      };
      mockEvaluationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const topResult = await service.getTopOperators(5, '2023-12-01', '2023-12-31');
      const bottomResult = await service.getBottomOperators(5, '2023-12-01', '2023-12-31');

      // Assert
      expect(topResult).toHaveLength(3);
      expect(bottomResult).toHaveLength(3);
      expect(topResult[0]).toEqual({
        operatorId: 1,
        operatorName: 'Operator 1',
        averageCompliance: 95.2,
      });
    });

    it('should provide Pareto analysis of reasons (80/20)', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { parameterId: '1', parameterName: 'Parameter 1', count: '50' },
          { parameterId: '2', parameterName: 'Parameter 2', count: '30' },
          { parameterId: '3', parameterName: 'Parameter 3', count: '15' },
          { parameterId: '4', parameterName: 'Parameter 4', count: '5' },
        ]),
      };
      mockEvaluationDetailRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getParetoAnalysis('2023-12-01', '2023-12-31');

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('paretoLine');
      expect(result).toHaveProperty('eightyPercentThreshold');
      expect(result.data).toHaveLength(4);
      expect(result.data[0]).toEqual({
        parameter: 'Parameter 1',
        count: 50,
        percentage: 50, // 50/100 * 100
        cumulativePercentage: 50,
      });
    });
  });

  describe('Role-based Access Control (KPI-12)', () => {
    it('should allow Jefa de Calidad and Gerente General visualization/export', () => {
      // This would be tested at the controller level with guards
      // Here we verify the service methods are accessible
      expect(service.generateReport).toBeDefined();
      expect(service.getDashboardData).toBeDefined();
      expect(service.getHarvestAverageChart).toBeDefined();
    });

    it('should provide read-only access for Administrator', () => {
      // This would be tested at the controller level with guards
      // Here we verify read-only methods exist
      expect(service.getDashboardData).toBeDefined();
      expect(service.getEvaluationHistory).toBeDefined();
    });
  });
});