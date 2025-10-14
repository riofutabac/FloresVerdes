import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LoggingService, LogEntry, LogAnalysis } from './logging.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import type { LogLevel } from '@nestjs/common';

export class LogSearchDto {
  level?: LogLevel;
  context?: string;
  message?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

@ApiTags('Logging & Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('logging')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get('recent')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Get recent log entries' })
  @ApiResponse({ status: 200, description: 'Recent logs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of logs to retrieve' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by log level' })
  async getRecentLogs(
    @Query('limit') limit?: string,
    @Query('level') level?: LogLevel,
  ): Promise<LogEntry[]> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 100;
      return this.loggingService.getRecentLogs(limitNum, level);
    } catch (error) {
      throw new HttpException(
        `Error retrieving recent logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('search')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Search logs by criteria' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  async searchLogs(@Body() searchCriteria: LogSearchDto): Promise<LogEntry[]> {
    try {
      const criteria = {
        ...searchCriteria,
        startDate: searchCriteria.startDate ? new Date(searchCriteria.startDate) : undefined,
        endDate: searchCriteria.endDate ? new Date(searchCriteria.endDate) : undefined,
      };

      return this.loggingService.searchLogs(criteria);
    } catch (error) {
      throw new HttpException(
        `Error searching logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get log statistics and metrics' })
  @ApiResponse({ status: 200, description: 'Log statistics retrieved successfully' })
  async getLogStatistics(): Promise<any> {
    try {
      return this.loggingService.getLogStatistics();
    } catch (error) {
      throw new HttpException(
        `Error retrieving log statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analysis')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get log analysis for a specific date' })
  @ApiResponse({ status: 200, description: 'Log analysis retrieved successfully' })
  @ApiQuery({ name: 'date', required: false, description: 'Date to analyze (YYYY-MM-DD)' })
  async getLogAnalysis(@Query('date') date?: string): Promise<LogAnalysis> {
    try {
      const analysisDate = date ? new Date(date) : new Date();
      return await this.loggingService.analyzeLogsForDate(analysisDate);
    } catch (error) {
      throw new HttpException(
        `Error retrieving log analysis: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('errors')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get recent error logs' })
  @ApiResponse({ status: 200, description: 'Error logs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of error logs to retrieve' })
  async getErrorLogs(@Query('limit') limit?: string): Promise<LogEntry[]> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const errorLogs = this.loggingService.getRecentLogs(limitNum * 2, 'error');
      const fatalLogs = this.loggingService.getRecentLogs(limitNum * 2, 'fatal');
      
      const allErrors = [...errorLogs, ...fatalLogs]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limitNum);

      return allErrors;
    } catch (error) {
      throw new HttpException(
        `Error retrieving error logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('warnings')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get recent warning logs' })
  @ApiResponse({ status: 200, description: 'Warning logs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of warning logs to retrieve' })
  async getWarningLogs(@Query('limit') limit?: string): Promise<LogEntry[]> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      return this.loggingService.getRecentLogs(limitNum, 'warn');
    } catch (error) {
      throw new HttpException(
        `Error retrieving warning logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('export')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Export logs for external analysis' })
  @ApiResponse({ status: 200, description: 'Logs exported successfully' })
  async exportLogs(
    @Body() exportRequest: {
      startDate: string;
      endDate: string;
      format?: 'json' | 'csv';
    },
  ): Promise<{ filePath: string; message: string }> {
    try {
      const startDate = new Date(exportRequest.startDate);
      const endDate = new Date(exportRequest.endDate);
      const format = exportRequest.format || 'json';

      const filePath = await this.loggingService.exportLogs(startDate, endDate, format);

      return {
        filePath,
        message: `Logs exported successfully to ${filePath}`,
      };
    } catch (error) {
      throw new HttpException(
        `Error exporting logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get logging dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getLoggingDashboard(): Promise<any> {
    try {
      const statistics = this.loggingService.getLogStatistics();
      const recentErrors = this.loggingService.getRecentLogs(10, 'error');
      const recentWarnings = this.loggingService.getRecentLogs(10, 'warn');
      
      // Get today's analysis
      const todayAnalysis = await this.loggingService.analyzeLogsForDate(new Date());

      return {
        timestamp: new Date().toISOString(),
        statistics,
        recentErrors: recentErrors.slice(0, 5),
        recentWarnings: recentWarnings.slice(0, 5),
        todayAnalysis: {
          totalLogs: todayAnalysis.totalLogs,
          errorCount: todayAnalysis.logsByLevel.error + todayAnalysis.logsByLevel.fatal,
          warningCount: todayAnalysis.logsByLevel.warn,
          topErrorPatterns: todayAnalysis.errorPatterns.slice(0, 3),
          performanceIssues: todayAnalysis.performanceIssues.slice(0, 3),
          securityEvents: todayAnalysis.securityEvents.slice(0, 3),
        },
        recommendations: todayAnalysis.recommendations.slice(0, 5),
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving logging dashboard: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('contexts')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Get list of log contexts' })
  @ApiResponse({ status: 200, description: 'Log contexts retrieved successfully' })
  async getLogContexts(): Promise<{ contexts: string[] }> {
    try {
      const recentLogs = this.loggingService.getRecentLogs(1000);
      const contexts = [...new Set(recentLogs.map(log => log.context))].sort();
      
      return { contexts };
    } catch (error) {
      throw new HttpException(
        `Error retrieving log contexts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Get logging system health' })
  @ApiResponse({ status: 200, description: 'Logging system health retrieved successfully' })
  async getLoggingHealth(): Promise<any> {
    try {
      const statistics = this.loggingService.getLogStatistics();
      const recentErrors = this.loggingService.getRecentLogs(100, 'error');
      const recentFatals = this.loggingService.getRecentLogs(100, 'fatal');
      
      const criticalErrors = recentErrors.length + recentFatals.length;
      const errorRate = statistics.recent.errorRate;
      
      let status = 'healthy';
      if (criticalErrors > 10 || errorRate > 10) {
        status = 'degraded';
      }
      if (criticalErrors > 50 || errorRate > 25) {
        status = 'unhealthy';
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        metrics: {
          errorRate: errorRate.toFixed(2),
          criticalErrors,
          memoryUtilization: statistics.memory.utilizationPercent.toFixed(2),
          recentLogVolume: statistics.recent.total,
        },
        issues: criticalErrors > 0 ? [
          `${criticalErrors} critical errors in the last hour`,
          errorRate > 5 ? `High error rate: ${errorRate.toFixed(2)}%` : null,
        ].filter(Boolean) : [],
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving logging health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
