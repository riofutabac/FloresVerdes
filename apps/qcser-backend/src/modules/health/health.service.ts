import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: any;
}

export interface SystemMetrics {
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    loadAverage: number[];
    usage: number;
  };
  disk: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  process: {
    uptime: number;
    pid: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private supabaseClient: SupabaseClient;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    // Initialize Supabase client for storage health checks
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.serviceKey');
    
    if (supabaseUrl && supabaseKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Basic health check - minimal overhead
   */
  async getBasicHealth(): Promise<{ status: string }> {
    try {
      // Simple database ping
      await this.dataSource.query('SELECT 1');
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error('Basic health check failed', error);
      throw new Error('Service unhealthy');
    }
  }

  /**
   * Detailed health check with all services
   */
  async getDetailedHealth(): Promise<{
    services: {
      database: HealthCheck;
      storage: HealthCheck;
      filesystem: HealthCheck;
      memory: HealthCheck;
    };
    metrics: SystemMetrics;
  }> {
    const services = {
      database: await this.checkDatabaseHealth(),
      storage: await this.checkStorageHealth(),
      filesystem: await this.checkFilesystemHealth(),
      memory: await this.checkMemoryHealth(),
    };

    const metrics = await this.getPerformanceMetrics();

    return { services, metrics };
  }

  /**
   * Database health check with connection pool status
   */
  async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await this.dataSource.query('SELECT 1');
      
      // Test a more complex query to ensure database is responsive
      const result = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = $1',
        ['public']
      );
      
      // Check connection pool status using pg_stat_activity
      const poolResult = await this.dataSource.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE state = 'idle') AS idle,
          COUNT(*) FILTER (WHERE wait_event IS NOT NULL) AS waiting
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      const poolRow = poolResult[0] || {};
      const poolStatus = {
        totalConnections: Number(poolRow.total || 0),
        idleConnections: Number(poolRow.idle || 0),
        waitingClients: Number(poolRow.waiting || 0),
      };

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: {
          tablesCount: parseInt(result[0].count),
          connectionPool: poolStatus,
          isConnected: this.dataSource.isInitialized,
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Storage service health check (Supabase Storage)
   */
  async checkStorageHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      if (!this.supabaseClient) {
        return {
          status: 'degraded',
          responseTime: Date.now() - startTime,
          error: 'Supabase client not configured',
        };
      }

      // Test storage connectivity by listing buckets
      const { data: buckets, error } = await this.supabaseClient.storage.listBuckets();
      
      if (error) {
        throw new Error(error.message);
      }

      // Test local storage directory
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const localStorageExists = fs.existsSync(uploadsDir);
      
      if (!localStorageExists) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: {
          supabaseBuckets: buckets?.length || 0,
          localStorageAvailable: true,
          uploadsDirectory: uploadsDir,
        },
      };
    } catch (error) {
      this.logger.error('Storage health check failed', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Filesystem health check
   */
  async checkFilesystemHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const tempDir = path.join(process.cwd(), 'temp');
      
      // Check if directories exist and are writable
      const checks = {
        uploadsDir: {
          exists: fs.existsSync(uploadsDir),
          writable: false,
        },
        tempDir: {
          exists: fs.existsSync(tempDir),
          writable: false,
        },
      };

      // Test write permissions
      try {
        if (!checks.uploadsDir.exists) {
          fs.mkdirSync(uploadsDir, { recursive: true });
          checks.uploadsDir.exists = true;
        }
        
        const testFile = path.join(uploadsDir, '.health-check');
        fs.writeFileSync(testFile, 'health check');
        fs.unlinkSync(testFile);
        checks.uploadsDir.writable = true;
      } catch (error) {
        this.logger.warn('Uploads directory not writable', error);
      }

      try {
        if (!checks.tempDir.exists) {
          fs.mkdirSync(tempDir, { recursive: true });
          checks.tempDir.exists = true;
        }
        
        const testFile = path.join(tempDir, '.health-check');
        fs.writeFileSync(testFile, 'health check');
        fs.unlinkSync(testFile);
        checks.tempDir.writable = true;
      } catch (error) {
        this.logger.warn('Temp directory not writable', error);
      }

      const responseTime = Date.now() - startTime;
      const allHealthy = Object.values(checks).every(check => check.exists && check.writable);

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        responseTime,
        details: checks,
      };
    } catch (error) {
      this.logger.error('Filesystem health check failed', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Memory health check
   */
  async checkMemoryHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const systemMemory = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      };

      const memoryPercentage = (systemMemory.used / systemMemory.total) * 100;
      const heapPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // Consider memory unhealthy if system memory > 90% or heap > 85%
      const status = memoryPercentage > 90 || heapPercentage > 85 ? 'degraded' : 'healthy';

      const responseTime = Date.now() - startTime;

      return {
        status,
        responseTime,
        details: {
          system: {
            total: systemMemory.total,
            free: systemMemory.free,
            used: systemMemory.used,
            percentage: Math.round(memoryPercentage * 100) / 100,
          },
          process: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
            heapPercentage: Math.round(heapPercentage * 100) / 100,
          },
        },
      };
    } catch (error) {
      this.logger.error('Memory health check failed', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    };

    // Get disk usage for current directory
    let diskUsage = { used: 0, free: 0, total: 0, percentage: 0 };
    try {
      const stats = fs.statSync(process.cwd());
      // Note: Getting actual disk usage requires platform-specific code
      // This is a simplified version
      diskUsage = {
        used: 0,
        free: systemMemory.free, // Approximation
        total: systemMemory.total, // Approximation
        percentage: 0,
      };
    } catch (error) {
      this.logger.warn('Could not get disk usage', error);
    }

    return {
      memory: {
        used: systemMemory.used,
        free: systemMemory.free,
        total: systemMemory.total,
        percentage: Math.round((systemMemory.used / systemMemory.total) * 10000) / 100,
      },
      cpu: {
        loadAverage: os.loadavg(),
        usage: Math.round((1 - (os.freemem() / os.totalmem())) * 10000) / 100, // Approximation
      },
      disk: diskUsage,
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memoryUsage,
      },
    };
  }

  /**
   * Readiness probe - checks if service is ready to accept traffic
   */
  async checkReadiness(): Promise<{ ready: boolean; checks: any }> {
    const checks = {
      database: await this.checkDatabaseHealth(),
      storage: await this.checkStorageHealth(),
      filesystem: await this.checkFilesystemHealth(),
    };

    const ready = Object.values(checks).every(
      check => check.status === 'healthy' || check.status === 'degraded'
    );

    return { ready, checks };
  }

  /**
   * Liveness probe - checks if service is alive and should not be restarted
   */
  async checkLiveness(): Promise<{ alive: boolean }> {
    try {
      // Simple check to ensure the service is responsive
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 1));
      const responseTime = Date.now() - startTime;
      
      // If response time is reasonable, service is alive
      const alive = responseTime < 1000; // 1 second threshold
      
      return { alive };
    } catch (error) {
      this.logger.error('Liveness check failed', error);
      return { alive: false };
    }
  }

  /**
   * Get application information
   */
  getApplicationInfo(): any {
    return {
      name: 'QCSER Backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      uptime: process.uptime(),
      pid: process.pid,
    };
  }
}