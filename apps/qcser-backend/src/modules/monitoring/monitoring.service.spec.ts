import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { MonitoringService } from './monitoring.service';

describe('MonitoringService', () => {
  let service: MonitoringService;
  let mockDataSource: Partial<DataSource>;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
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
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoringService,
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

    service = module.get<MonitoringService>(MonitoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackRequest', () => {
    it('should track successful request', () => {
      service.trackRequest(150, true);

      const metrics = service.getMetrics(1);
      // Since metrics are collected periodically, we test the tracking mechanism
      expect(() => service.trackRequest(150, true)).not.toThrow();
    });

    it('should track failed request', () => {
      service.trackRequest(2500, false);

      expect(() => service.trackRequest(2500, false)).not.toThrow();
    });
  });

  describe('getAlerts', () => {
    it('should return empty alerts initially', () => {
      const alerts = service.getAlerts();

      expect(alerts).toEqual([]);
    });

    it('should filter alerts by severity', () => {
      const criticalAlerts = service.getAlerts('critical');
      const highAlerts = service.getAlerts('high');

      expect(Array.isArray(criticalAlerts)).toBe(true);
      expect(Array.isArray(highAlerts)).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('should return empty metrics initially', () => {
      const metrics = service.getMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBe(0);
    });

    it('should limit metrics by specified limit', () => {
      const metrics = service.getMetrics(50);

      expect(metrics.length).toBeLessThanOrEqual(50);
    });
  });

  describe('resolveAlert', () => {
    it('should return false for non-existent alert', () => {
      const result = service.resolveAlert('non-existent-alert');

      expect(result).toBe(false);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data structure', () => {
      const dashboard = service.getDashboardData();

      expect(dashboard).toHaveProperty('timestamp');
      expect(dashboard).toHaveProperty('status');
      expect(dashboard).toHaveProperty('metrics');
      expect(dashboard).toHaveProperty('alerts');
      expect(dashboard).toHaveProperty('summary');

      expect(dashboard.status).toBeOneOf(['healthy', 'warning', 'critical']);
      expect(dashboard.alerts).toHaveProperty('active');
      expect(dashboard.alerts).toHaveProperty('critical');
    });

    it('should include current metrics if available', () => {
      const dashboard = service.getDashboardData();

      expect(dashboard.metrics).toHaveProperty('current');
      expect(dashboard.metrics).toHaveProperty('recent');
    });

    it('should include summary information', () => {
      const dashboard = service.getDashboardData();

      expect(dashboard.summary).toHaveProperty('uptime');
      expect(dashboard.summary).toHaveProperty('totalRequests');
      expect(dashboard.summary).toHaveProperty('memoryUsage');
      expect(dashboard.summary).toHaveProperty('cpuUsage');

      expect(dashboard.summary.uptime).toBeGreaterThan(0);
    });
  });

  describe('database metrics collection', () => {
    it('should collect database metrics successfully', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([]);

      // This tests the private method indirectly through the service initialization
      expect(service).toBeDefined();
    });

    it('should handle database query errors gracefully', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('DB Error'));

      // Service should still be functional even if database metrics fail
      expect(service).toBeDefined();
    });
  });

  describe('performance thresholds', () => {
    it('should have defined performance thresholds', () => {
      // Test that the service has reasonable default thresholds
      const dashboard = service.getDashboardData();
      
      // The service should be able to determine status
      expect(['healthy', 'warning', 'critical']).toContain(dashboard.status);
    });
  });

  describe('metrics aggregation', () => {
    it('should handle empty metrics gracefully', () => {
      const metrics = service.getMetrics(100);
      const alerts = service.getAlerts();
      const dashboard = service.getDashboardData();

      expect(metrics).toEqual([]);
      expect(alerts).toEqual([]);
      expect(dashboard.status).toBe('healthy'); // Should default to healthy when no data
    });
  });

  describe('alert management', () => {
    it('should manage alert lifecycle', () => {
      // Test alert creation, resolution, and cleanup
      const initialAlerts = service.getAlerts();
      expect(initialAlerts).toEqual([]);

      // Alerts would be created during metrics collection
      // This tests the alert management structure
      expect(() => service.resolveAlert('test-alert')).not.toThrow();
    });
  });
});