import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockDataSource: Partial<DataSource>;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
      isInitialized: true,
      driver: {
        master: {
          pool: {
            totalCount: 10,
            idleCount: 8,
            waitingCount: 0,
          },
        },
      } as any,
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'supabase.url':
            return 'https://test.supabase.co';
          case 'supabase.serviceKey':
            return 'test-service-key';
          default:
            return undefined;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBasicHealth', () => {
    it('should return healthy status when database is accessible', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([]);

      const result = await service.getBasicHealth();

      expect(result).toEqual({ status: 'healthy' });
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should throw error when database is not accessible', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      await expect(service.getBasicHealth()).rejects.toThrow('Service unhealthy');
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return healthy database status with metrics', async () => {
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([]) // SELECT 1
        .mockResolvedValueOnce([{ count: '12' }]); // table count

      const result = await service.checkDatabaseHealth();

      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details.tablesCount).toBe(12);
      expect(result.details.connectionPool).toEqual({
        totalConnections: 10,
        idleConnections: 8,
        waitingClients: 0,
      });
    });

    it('should return unhealthy status when database query fails', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('Query failed'));

      const result = await service.checkDatabaseHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Query failed');
    });
  });

  describe('checkMemoryHealth', () => {
    it('should return healthy memory status when usage is normal', async () => {
      const result = await service.checkMemoryHealth();

      expect(result.status).toBeOneOf(['healthy', 'degraded']);
      expect(result.details.system).toBeDefined();
      expect(result.details.process).toBeDefined();
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should include memory usage percentages', async () => {
      const result = await service.checkMemoryHealth();

      expect(result.details.system.percentage).toBeGreaterThanOrEqual(0);
      expect(result.details.system.percentage).toBeLessThanOrEqual(100);
      expect(result.details.process.heapPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return comprehensive system metrics', async () => {
      const result = await service.getPerformanceMetrics();

      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('disk');
      expect(result).toHaveProperty('process');

      expect(result.memory.total).toBeGreaterThan(0);
      expect(result.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.cpu.loadAverage).toHaveLength(3);
      expect(result.process.uptime).toBeGreaterThan(0);
    });
  });

  describe('checkReadiness', () => {
    it('should return ready when all checks pass', async () => {
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([]) // database check
        .mockResolvedValueOnce([{ count: '12' }]); // table count

      const result = await service.checkReadiness();

      expect(result.ready).toBe(true);
      expect(result.checks.database.status).toBe('healthy');
    });

    it('should return not ready when database check fails', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await service.checkReadiness();

      expect(result.ready).toBe(false);
      expect(result.checks.database.status).toBe('unhealthy');
    });
  });

  describe('checkLiveness', () => {
    it('should return alive when service is responsive', async () => {
      const result = await service.checkLiveness();

      expect(result.alive).toBe(true);
    });
  });

  describe('getApplicationInfo', () => {
    it('should return application information', () => {
      const result = service.getApplicationInfo();

      expect(result).toHaveProperty('name', 'QCSER Backend');
      expect(result).toHaveProperty('nodeVersion');
      expect(result).toHaveProperty('platform');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('pid');
    });
  });
});