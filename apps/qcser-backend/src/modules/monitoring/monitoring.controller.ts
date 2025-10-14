import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MonitoringService, PerformanceAlert, MonitoringMetrics } from './monitoring.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Monitoring & Performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get monitoring dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(): Promise<any> {
    try {
      return this.monitoringService.getDashboardData();
    } catch (error) {
      throw new HttpException(
        `Error retrieving dashboard data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('metrics')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get system performance metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recent metrics to retrieve' })
  async getMetrics(@Query('limit') limit?: string): Promise<MonitoringMetrics[]> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 100;
      return this.monitoringService.getMetrics(limitNum);
    } catch (error) {
      throw new HttpException(
        `Error retrieving metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alerts')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get active performance alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by alert severity' })
  async getAlerts(@Query('severity') severity?: string): Promise<PerformanceAlert[]> {
    try {
      return this.monitoringService.getAlerts(severity);
    } catch (error) {
      throw new HttpException(
        `Error retrieving alerts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts/:alertId/resolve')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Resolve a performance alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async resolveAlert(@Param('alertId') alertId: string): Promise<{ success: boolean }> {
    try {
      const resolved = this.monitoringService.resolveAlert(alertId);
      
      if (!resolved) {
        throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error resolving alert: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('system-info')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Get detailed system information' })
  @ApiResponse({ status: 200, description: 'System information retrieved successfully' })
  async getSystemInfo(): Promise<any> {
    try {
      const metrics = this.monitoringService.getMetrics(1);
      const currentMetrics = metrics[0] || null;
      
      return {
        timestamp: new Date().toISOString(),
        application: {
          name: 'QCSER Backend',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          pid: process.pid,
        },
        system: {
          platform: process.platform,
          architecture: process.arch,
          nodeVersion: process.version,
          hostname: require('os').hostname(),
        },
        current: currentMetrics,
        alerts: this.monitoringService.getAlerts().length,
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving system info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('track-request')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Track a request for monitoring (internal use)' })
  @ApiResponse({ status: 200, description: 'Request tracked successfully' })
  async trackRequest(
    @Query('responseTime') responseTime: string,
    @Query('success') success: string,
  ): Promise<{ success: boolean }> {
    try {
      const responseTimeNum = parseInt(responseTime, 10);
      const successBool = success === 'true';
      
      this.monitoringService.trackRequest(responseTimeNum, successBool);
      
      return { success: true };
    } catch (error) {
      throw new HttpException(
        `Error tracking request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('performance-summary')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get performance summary for the last hour' })
  @ApiResponse({ status: 200, description: 'Performance summary retrieved successfully' })
  async getPerformanceSummary(): Promise<any> {
    try {
      const metrics = this.monitoringService.getMetrics(60); // Last hour
      
      if (metrics.length === 0) {
        return {
          message: 'No metrics available',
          timestamp: new Date().toISOString(),
        };
      }

      // Calculate summary statistics
      const memoryUsage = metrics.map(m => (m.memory.heapUsed / m.memory.heapTotal) * 100);
      const cpuUsage = metrics.map(m => m.cpu.usage);
      const responseTime = metrics.map(m => m.requests.averageResponseTime);
      const totalRequests = metrics.reduce((sum, m) => sum + m.requests.total, 0);
      const successfulRequests = metrics.reduce((sum, m) => sum + m.requests.successful, 0);
      const failedRequests = metrics.reduce((sum, m) => sum + m.requests.failed, 0);

      return {
        timestamp: new Date().toISOString(),
        period: 'last_hour',
        summary: {
          requests: {
            total: totalRequests,
            successful: successfulRequests,
            failed: failedRequests,
            successRate: totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) : 0,
          },
          performance: {
            averageMemoryUsage: this.calculateAverage(memoryUsage),
            peakMemoryUsage: Math.max(...memoryUsage, 0),
            averageCpuUsage: this.calculateAverage(cpuUsage),
            peakCpuUsage: Math.max(...cpuUsage, 0),
            averageResponseTime: this.calculateAverage(responseTime),
            peakResponseTime: Math.max(...responseTime, 0),
          },
          alerts: {
            active: this.monitoringService.getAlerts().length,
            critical: this.monitoringService.getAlerts('critical').length,
          },
        },
        trends: {
          memoryTrend: this.calculateTrend(memoryUsage),
          cpuTrend: this.calculateTrend(cpuUsage),
          responseTimeTrend: this.calculateTrend(responseTime),
        },
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving performance summary: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calculate average of array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100;
  }

  /**
   * Calculate trend (simple linear regression slope)
   */
  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'stable';
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squared indices
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  }
}
