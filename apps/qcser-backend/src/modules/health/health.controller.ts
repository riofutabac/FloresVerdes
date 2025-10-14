import {
  Controller,
  Get,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
  }> {
    try {
      const health = await this.healthService.getBasicHealth();
      return {
        ...health,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with all services' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  @ApiResponse({ status: 503, description: 'One or more services are unhealthy' })
  async detailedHealthCheck(): Promise<any> {
    try {
      const health = await this.healthService.getDetailedHealth();
      
      const overallStatus = Object.values(health.services).every(
        (service: any) => service.status === 'healthy'
      ) ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        ...health,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  async databaseHealth(): Promise<any> {
    try {
      const dbHealth = await this.healthService.checkDatabaseHealth();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: { status: 'unhealthy', error: error.message },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('storage')
  @ApiOperation({ summary: 'Storage service health check' })
  @ApiResponse({ status: 200, description: 'Storage is healthy' })
  @ApiResponse({ status: 503, description: 'Storage is unhealthy' })
  async storageHealth(): Promise<any> {
    try {
      const storageHealth = await this.healthService.checkStorageHealth();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        storage: storageHealth,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          storage: { status: 'unhealthy', error: error.message },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'System performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved' })
  async getMetrics(): Promise<any> {
    try {
      const metrics = await this.healthService.getPerformanceMetrics();
      return {
        timestamp: new Date().toISOString(),
        metrics,
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes/Docker' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readinessProbe(): Promise<any> {
    try {
      const readiness = await this.healthService.checkReadiness();
      
      if (readiness.ready) {
        return {
          status: 'ready',
          timestamp: new Date().toISOString(),
          checks: readiness.checks,
        };
      } else {
        throw new HttpException(
          {
            status: 'not ready',
            timestamp: new Date().toISOString(),
            checks: readiness.checks,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    } catch (error) {
      throw new HttpException(
        {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes/Docker' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  async livenessProbe(): Promise<any> {
    try {
      const liveness = await this.healthService.checkLiveness();
      
      if (liveness.alive) {
        return {
          status: 'alive',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        };
      } else {
        throw new HttpException(
          {
            status: 'not alive',
            timestamp: new Date().toISOString(),
            error: 'Service is not responding properly',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    } catch (error) {
      throw new HttpException(
        {
          status: 'not alive',
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}