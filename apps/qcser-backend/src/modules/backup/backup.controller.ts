import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BackupService, BackupJob, BackupConfig } from './backup.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';

export class CreateBackupDto {
  type: 'database' | 'files' | 'full';
}

export class RestoreBackupDto {
  backupJobId: string;
}

export class UpdateConfigDto {
  database?: {
    enabled?: boolean;
    schedule?: string;
    retention?: number;
    compression?: boolean;
  };
  files?: {
    enabled?: boolean;
    schedule?: string;
    retention?: number;
    directories?: string[];
  };
  storage?: {
    local?: {
      enabled?: boolean;
      path?: string;
    };
    cloud?: {
      enabled?: boolean;
      bucket?: string;
    };
  };
}

@ApiTags('Backup & Recovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Create a new backup' })
  @ApiResponse({ status: 200, description: 'Backup created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid backup type' })
  async createBackup(@Body() createBackupDto: CreateBackupDto): Promise<BackupJob | BackupJob[]> {
    try {
      switch (createBackupDto.type) {
        case 'database':
          return await this.backupService.createDatabaseBackup();
        case 'files':
          return await this.backupService.createFileBackup();
        case 'full':
          return await this.backupService.createFullBackup();
        default:
          throw new HttpException('Invalid backup type', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(
        `Error creating backup: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('list')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'List all available backups' })
  @ApiResponse({ status: 200, description: 'Backups retrieved successfully' })
  async listBackups(): Promise<BackupJob[]> {
    try {
      return this.backupService.getAvailableBackups();
    } catch (error) {
      throw new HttpException(
        `Error retrieving backups: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('job/:jobId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get backup job details' })
  @ApiResponse({ status: 200, description: 'Backup job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Backup job not found' })
  async getBackupJob(@Param('jobId') jobId: string): Promise<BackupJob> {
    try {
      const job = this.backupService.getBackupJob(jobId);
      
      if (!job) {
        throw new HttpException('Backup job not found', HttpStatus.NOT_FOUND);
      }

      return job;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error retrieving backup job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('restore')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Restore database from backup' })
  @ApiResponse({ status: 200, description: 'Database restored successfully' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  async restoreBackup(@Body() restoreBackupDto: RestoreBackupDto): Promise<{ success: boolean; message: string }> {
    try {
      const job = this.backupService.getBackupJob(restoreBackupDto.backupJobId);
      
      if (!job || job.type !== 'database') {
        throw new HttpException('Database backup not found', HttpStatus.NOT_FOUND);
      }

      if (!job.filePath) {
        throw new HttpException('Backup file path not available', HttpStatus.BAD_REQUEST);
      }

      await this.backupService.restoreDatabase(job.filePath);

      return {
        success: true,
        message: 'Database restored successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error restoring backup: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get backup statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(): Promise<any> {
    try {
      return this.backupService.getBackupStatistics();
    } catch (error) {
      throw new HttpException(
        `Error retrieving statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cleanup')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Clean up old backups' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async cleanupBackups(): Promise<{ success: boolean; message: string }> {
    try {
      await this.backupService.cleanupOldBackups();
      
      return {
        success: true,
        message: 'Old backups cleaned up successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Error cleaning up backups: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('config')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Get backup configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getConfig(): Promise<any> {
    try {
      const statistics = this.backupService.getBackupStatistics();
      return statistics.configuration;
    } catch (error) {
      throw new HttpException(
        `Error retrieving configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('config')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Update backup configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(@Body() updateConfigDto: UpdateConfigDto): Promise<{ success: boolean; message: string }> {
    try {
      this.backupService.updateConfig(updateConfigDto as Partial<BackupConfig>);
      
      return {
        success: true,
        message: 'Backup configuration updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Error updating configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Test backup system components' })
  @ApiResponse({ status: 200, description: 'Test completed successfully' })
  async testBackupSystem(): Promise<any> {
    try {
      return await this.backupService.testBackupSystem();
    } catch (error) {
      throw new HttpException(
        `Error testing backup system: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Get backup dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getBackupDashboard(): Promise<any> {
    try {
      const statistics = this.backupService.getBackupStatistics();
      const recentBackups = this.backupService.getAvailableBackups().slice(0, 10);
      const testResults = await this.backupService.testBackupSystem();

      return {
        timestamp: new Date().toISOString(),
        statistics,
        recentBackups: recentBackups.map(backup => ({
          id: backup.id,
          type: backup.type,
          status: backup.status,
          startTime: backup.startTime,
          endTime: backup.endTime,
          size: backup.size,
          duration: backup.endTime ? 
            backup.endTime.getTime() - backup.startTime.getTime() : null,
        })),
        systemHealth: {
          allTestsPassed: Object.values(testResults.tests).every(test => test === true),
          tests: testResults.tests,
          errors: testResults.errors,
        },
        recommendations: this.generateRecommendations(statistics, testResults),
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving dashboard data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Get backup system health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getBackupHealth(): Promise<any> {
    try {
      const statistics = this.backupService.getBackupStatistics();
      const testResults = await this.backupService.testBackupSystem();
      const recentBackups = this.backupService.getAvailableBackups().slice(0, 5);

      // Determine health status
      const allTestsPassed = Object.values(testResults.tests).every(test => test === true);
      const hasRecentBackups = recentBackups.length > 0;
      const recentFailures = recentBackups.filter(backup => backup.status === 'failed').length;
      
      let status = 'healthy';
      const issues: string[] = [];

      if (!allTestsPassed) {
        status = 'degraded';
        issues.push('Some backup system tests failed');
      }

      if (!hasRecentBackups) {
        status = 'degraded';
        issues.push('No recent backups found');
      }

      if (recentFailures > 0) {
        status = recentFailures > 2 ? 'unhealthy' : 'degraded';
        issues.push(`${recentFailures} recent backup failures`);
      }

      // Check if backups are too old
      const lastDbBackup = statistics.lastBackups.database;
      const lastFileBackup = statistics.lastBackups.files;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (lastDbBackup && new Date(lastDbBackup.date) < oneDayAgo) {
        status = 'degraded';
        issues.push('Database backup is more than 24 hours old');
      }

      if (lastFileBackup && new Date(lastFileBackup.date) < oneDayAgo) {
        status = 'degraded';
        issues.push('File backup is more than 24 hours old');
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        summary: {
          systemTests: allTestsPassed ? 'passed' : 'failed',
          recentBackups: hasRecentBackups ? recentBackups.length : 0,
          recentFailures,
          successRate: statistics.summary.successRate,
        },
        issues,
        lastBackups: statistics.lastBackups,
      };
    } catch (error) {
      throw new HttpException(
        `Error retrieving backup health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate recommendations based on backup statistics and test results
   */
  private generateRecommendations(statistics: any, testResults: any): string[] {
    const recommendations: string[] = [];

    // Test failures
    if (testResults.errors.length > 0) {
      recommendations.push('Fix backup system test failures before relying on automated backups');
    }

    // Success rate
    const successRate = parseFloat(statistics.summary.successRate);
    if (successRate < 95) {
      recommendations.push('Backup success rate is below 95% - investigate and fix recurring issues');
    }

    // Recent backups
    if (!statistics.lastBackups.database) {
      recommendations.push('No database backups found - ensure database backup is configured and running');
    }

    if (!statistics.lastBackups.files) {
      recommendations.push('No file backups found - ensure file backup is configured and running');
    }

    // Backup age
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (statistics.lastBackups.database && new Date(statistics.lastBackups.database.date) < oneDayAgo) {
      recommendations.push('Database backup is more than 24 hours old - check backup schedule');
    }

    // Storage space
    if (!testResults.tests.backupDirectory) {
      recommendations.push('Backup directory is not accessible - check storage configuration');
    }

    // Cloud storage
    if (statistics.configuration.storage.cloud.enabled && !testResults.tests.cloudStorage) {
      recommendations.push('Cloud storage is enabled but not accessible - check configuration');
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push('Backup system is healthy - continue monitoring regularly');
      recommendations.push('Consider testing restore procedures periodically');
    }

    return recommendations;
  }
}
