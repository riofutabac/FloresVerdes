import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService, MaintenanceWindow, MaintenanceTask } from './maintenance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';

export class StartMaintenanceDto {
  type: string;
  tasks?: string[];
}

@ApiTags('Maintenance & Updates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('start')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Start a maintenance window' })
  @ApiResponse({ status: 200, description: 'Maintenance window started successfully' })
  async startMaintenance(@Body() startMaintenanceDto: StartMaintenanceDto): Promise<MaintenanceWindow> {
    try {
      return await this.maintenanceService.startMaintenanceWindow(startMaintenanceDto.type);
    } catch (error) {
      throw new HttpException(
        `Error starting maintenance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get maintenance history' })
  @ApiResponse({ status: 200, description: 'Maintenance history retrieved successfully' })
  async getMaintenanceHistory(): Promise<MaintenanceWindow[]> {
    try {
      return this.maintenanceService.getMaintenanceHistory();
    } catch (error) {
      throw new HttpException(
        `Error retrieving maintenance history: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('window/:windowId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get maintenance window details' })
  @ApiResponse({ status: 200, description: 'Maintenance window retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Maintenance window not found' })
  async getMaintenanceWindow(@Param('windowId') windowId: string): Promise<MaintenanceWindow> {
    try {
      const window = this.maintenanceService.getMaintenanceWindow(windowId);
      
      if (!window) {
        throw new HttpException('Maintenance window not found', HttpStatus.NOT_FOUND);
      }

      return window;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error retrieving maintenance window: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth(): Promise<any> {
    try {
      return await this.maintenanceService.getSystemHealth();
    } catch (error) {
      throw new HttpException(
        `Error retrieving system health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get maintenance dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getMaintenanceDashboard(): Promise<any> {
    try {
      const history = this.maintenanceService.getMaintenanceHistory();
      const systemHealth = await this.maintenanceService.getSystemHealth();
      
      const recentWindows = history.slice(0, 5);
      const lastWindow = history[0];
      
      // Calculate success rate
      const completedWindows = history.filter(w => w.status === 'completed');
      const successRate = history.length > 0 ? 
        (completedWindows.length / history.length) * 100 : 0;

      // Get recent failed tasks
      const recentFailedTasks = history
        .flatMap(w => w.tasks)
        .filter(t => t.status === 'failed')
        .slice(0, 5);

      return {
        timestamp: new Date().toISOString(),
        summary: {
          systemHealth: systemHealth.status,
          lastMaintenance: lastWindow ? lastWindow.startTime : null,
          successRate: successRate.toFixed(2),
          totalMaintenanceWindows: history.length,
          recentIssues: systemHealth.issues.length,
        },
        recentWindows: recentWindows.map(w => ({
          id: w.id,
          startTime: w.startTime,
          endTime: w.endTime,
          status: w.status,
          tasksCompleted: w.summary?.completedTasks || 0,
          tasksFailed: w.summary?.failedTasks || 0,
          duration: w.summary?.duration || 0,
        })),
        systemHealth: {
          status: systemHealth.status,
          issues: systemHealth.issues,
          lastChecked: systemHealth.timestamp,
        },
        recentFailures: recentFailedTasks.map(t => ({
          name: t.name,
          type: t.type,
          startTime: t.startTime,
          error: t.error,
        })),
        recommendations: this.generateMaintenanceRecommendations(history, systemHealth),
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving maintenance dashboard: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get current maintenance status' })
  @ApiResponse({ status: 200, description: 'Maintenance status retrieved successfully' })
  async getMaintenanceStatus(): Promise<any> {
    try {
      const history = this.maintenanceService.getMaintenanceHistory();
      const activeWindow = history.find(w => w.status === 'active');
      const systemHealth = await this.maintenanceService.getSystemHealth();

      return {
        timestamp: new Date().toISOString(),
        maintenanceActive: !!activeWindow,
        activeWindow: activeWindow ? {
          id: activeWindow.id,
          startTime: activeWindow.startTime,
          runningTasks: activeWindow.tasks.filter(t => t.status === 'running').length,
          completedTasks: activeWindow.tasks.filter(t => t.status === 'completed').length,
          totalTasks: activeWindow.tasks.length,
        } : null,
        systemHealth: systemHealth.status,
        criticalIssues: systemHealth.issues.filter(issue => 
          issue.includes('critical') || issue.includes('failed')
        ).length,
        nextScheduledMaintenance: this.getNextScheduledMaintenance(),
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving maintenance status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('health-check')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Run immediate health check' })
  @ApiResponse({ status: 200, description: 'Health check completed successfully' })
  async runHealthCheck(): Promise<any> {
    try {
      const healthResult = await this.maintenanceService.getSystemHealth();
      
      return {
        timestamp: new Date().toISOString(),
        result: healthResult,
        summary: {
          status: healthResult.status,
          issuesFound: healthResult.issues.length,
          checksPerformed: Object.keys(healthResult.checks).length,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Error running health check: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recommendations')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get maintenance recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getMaintenanceRecommendations(): Promise<any> {
    try {
      const history = this.maintenanceService.getMaintenanceHistory();
      const systemHealth = await this.maintenanceService.getSystemHealth();
      
      const recommendations = this.generateMaintenanceRecommendations(history, systemHealth);
      
      return {
        timestamp: new Date().toISOString(),
        recommendations,
        priority: this.prioritizeRecommendations(recommendations),
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving recommendations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('schedule')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get maintenance schedule' })
  @ApiResponse({ status: 200, description: 'Maintenance schedule retrieved successfully' })
  async getMaintenanceSchedule(): Promise<any> {
    try {
      return {
        timestamp: new Date().toISOString(),
        schedule: {
          daily: {
            time: '06:00',
            tasks: ['Health Checks', 'Log Rotation'],
            enabled: true,
          },
          weekly: {
            day: 'Sunday',
            time: '01:00',
            tasks: ['Database Statistics', 'Index Maintenance', 'Security Scan'],
            enabled: true,
          },
          monthly: {
            day: 1,
            time: '02:00',
            tasks: ['Database Vacuum', 'System Updates Check', 'Performance Analysis', 'Backup Verification'],
            enabled: true,
          },
        },
        nextScheduled: this.getNextScheduledMaintenance(),
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving maintenance schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate maintenance recommendations
   */
  private generateMaintenanceRecommendations(history: MaintenanceWindow[], systemHealth: any): string[] {
    const recommendations: string[] = [];

    // System health recommendations
    if (systemHealth.status === 'critical') {
      recommendations.push('CRITICAL: Address system health issues immediately');
    } else if (systemHealth.status === 'warning') {
      recommendations.push('WARNING: System health issues detected - schedule maintenance soon');
    }

    // Maintenance frequency recommendations
    const lastMaintenance = history[0];
    if (!lastMaintenance) {
      recommendations.push('No maintenance history found - run initial system maintenance');
    } else {
      const daysSinceLastMaintenance = (Date.now() - lastMaintenance.startTime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastMaintenance > 7) {
        recommendations.push('Last maintenance was more than 7 days ago - consider running weekly maintenance');
      }
    }

    // Failed task recommendations
    const recentFailures = history
      .flatMap(w => w.tasks)
      .filter(t => t.status === 'failed')
      .slice(0, 10);

    if (recentFailures.length > 0) {
      const failureTypes = [...new Set(recentFailures.map(t => t.type))];
      recommendations.push(`Recent maintenance failures in: ${failureTypes.join(', ')}`);
    }

    // Success rate recommendations
    const completedWindows = history.filter(w => w.status === 'completed');
    const successRate = history.length > 0 ? (completedWindows.length / history.length) * 100 : 0;
    
    if (successRate < 80) {
      recommendations.push('Maintenance success rate is below 80% - investigate recurring issues');
    }

    // Database recommendations
    if (systemHealth.checks?.database?.indexHealth === 'has_unused_indexes') {
      recommendations.push('Unused database indexes detected - consider removing to improve performance');
    }

    // Disk space recommendations
    if (systemHealth.checks?.diskSpace?.warnings?.length > 0) {
      recommendations.push('Disk space warnings detected - clean up old files or increase storage');
    }

    // Security recommendations
    if (systemHealth.checks?.security?.vulnerabilities?.length > 0) {
      recommendations.push('Security vulnerabilities detected - address security issues');
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push('System is healthy - continue regular maintenance schedule');
      recommendations.push('Consider running performance analysis monthly');
    }

    return recommendations;
  }

  /**
   * Prioritize recommendations
   */
  private prioritizeRecommendations(recommendations: string[]): any {
    const critical = recommendations.filter(r => r.includes('CRITICAL'));
    const warning = recommendations.filter(r => r.includes('WARNING') && !r.includes('CRITICAL'));
    const info = recommendations.filter(r => !r.includes('CRITICAL') && !r.includes('WARNING'));

    return {
      critical,
      warning,
      info,
    };
  }

  /**
   * Get next scheduled maintenance
   */
  private getNextScheduledMaintenance(): any {
    const now = new Date();
    
    // Next Sunday at 1 AM (weekly maintenance)
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(1, 0, 0, 0);
    
    // First day of next month at 2 AM (monthly maintenance)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0, 0);
    
    // Tomorrow at 6 AM (daily health checks)
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);

    return {
      daily: tomorrow,
      weekly: nextSunday,
      monthly: nextMonth,
    };
  }
}
