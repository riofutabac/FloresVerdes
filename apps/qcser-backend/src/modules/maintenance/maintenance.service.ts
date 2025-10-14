import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MaintenanceTask {
  id: string;
  name: string;
  type: 'database' | 'filesystem' | 'application' | 'security';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
  metadata?: any;
}

export interface MaintenanceWindow {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'failed';
  tasks: MaintenanceTask[];
  summary?: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    skippedTasks: number;
    duration: number;
  };
}

export interface SystemUpdate {
  id: string;
  version: string;
  type: 'patch' | 'minor' | 'major';
  status: 'available' | 'downloading' | 'installing' | 'completed' | 'failed';
  releaseDate: Date;
  description: string;
  changelog: string[];
  requiresRestart: boolean;
  backupRequired: boolean;
}

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);
  private maintenanceWindows: MaintenanceWindow[] = [];
  private systemUpdates: SystemUpdate[] = [];
  private readonly maxHistoryRecords = 50;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.logger.log('Maintenance service initialized');
  }

  /**
   * Weekly maintenance routine
   */
  @Cron('0 1 * * 0') // Sunday at 1 AM
  async weeklyMaintenance(): Promise<void> {
    try {
      await this.startMaintenanceWindow('weekly-maintenance');
      this.logger.log('Weekly maintenance completed');
    } catch (error) {
      this.logger.error('Weekly maintenance failed', error);
    }
  }

  /**
   * Monthly maintenance routine
   */
  @Cron('0 2 1 * *') // First day of month at 2 AM
  async monthlyMaintenance(): Promise<void> {
    try {
      await this.startMaintenanceWindow('monthly-maintenance');
      this.logger.log('Monthly maintenance completed');
    } catch (error) {
      this.logger.error('Monthly maintenance failed', error);
    }
  }

  /**
   * Daily health checks
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async dailyHealthChecks(): Promise<void> {
    try {
      await this.performHealthChecks();
      this.logger.log('Daily health checks completed');
    } catch (error) {
      this.logger.error('Daily health checks failed', error);
    }
  }

  /**
   * Start a maintenance window
   */
  async startMaintenanceWindow(type: string): Promise<MaintenanceWindow> {
    const maintenanceWindow: MaintenanceWindow = {
      id: `maintenance-${type}-${Date.now()}`,
      startTime: new Date(),
      status: 'active',
      tasks: [],
    };

    this.maintenanceWindows.push(maintenanceWindow);
    this.logger.log(`Starting maintenance window: ${type}`);

    try {
      // Define tasks based on maintenance type
      const tasks = this.getMaintenanceTasks(type);
      
      // Execute tasks sequentially
      for (const taskConfig of tasks) {
        const task = await this.executeMaintenanceTask(taskConfig);
        maintenanceWindow.tasks.push(task);
      }

      // Complete maintenance window
      maintenanceWindow.endTime = new Date();
      maintenanceWindow.status = 'completed';
      maintenanceWindow.summary = this.calculateMaintenanceSummary(maintenanceWindow);

      this.logger.log(`Maintenance window completed: ${type}`);
      return maintenanceWindow;

    } catch (error) {
      maintenanceWindow.endTime = new Date();
      maintenanceWindow.status = 'failed';
      maintenanceWindow.summary = this.calculateMaintenanceSummary(maintenanceWindow);
      
      this.logger.error(`Maintenance window failed: ${type}`, error);
      throw error;
    }
  }

  /**
   * Get maintenance tasks based on type
   */
  private getMaintenanceTasks(type: string): any[] {
    const baseTasks = [
      {
        name: 'Database Health Check',
        type: 'database',
        action: 'checkDatabaseHealth',
      },
      {
        name: 'Disk Space Check',
        type: 'filesystem',
        action: 'checkDiskSpace',
      },
      {
        name: 'Log Rotation',
        type: 'filesystem',
        action: 'rotateLogs',
      },
      {
        name: 'Temporary Files Cleanup',
        type: 'filesystem',
        action: 'cleanupTempFiles',
      },
    ];

    const weeklyTasks = [
      ...baseTasks,
      {
        name: 'Database Statistics Update',
        type: 'database',
        action: 'updateDatabaseStatistics',
      },
      {
        name: 'Index Maintenance',
        type: 'database',
        action: 'maintainIndexes',
      },
      {
        name: 'Security Scan',
        type: 'security',
        action: 'performSecurityScan',
      },
    ];

    const monthlyTasks = [
      ...weeklyTasks,
      {
        name: 'Database Vacuum',
        type: 'database',
        action: 'vacuumDatabase',
      },
      {
        name: 'System Updates Check',
        type: 'application',
        action: 'checkSystemUpdates',
      },
      {
        name: 'Performance Analysis',
        type: 'application',
        action: 'performanceAnalysis',
      },
      {
        name: 'Backup Verification',
        type: 'filesystem',
        action: 'verifyBackups',
      },
    ];

    switch (type) {
      case 'weekly-maintenance':
        return weeklyTasks;
      case 'monthly-maintenance':
        return monthlyTasks;
      case 'daily-health':
        return baseTasks;
      default:
        return baseTasks;
    }
  }

  /**
   * Execute a maintenance task
   */
  private async executeMaintenanceTask(taskConfig: any): Promise<MaintenanceTask> {
    const task: MaintenanceTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: taskConfig.name,
      type: taskConfig.type,
      status: 'pending',
      startTime: new Date(),
    };

    this.logger.log(`Starting maintenance task: ${task.name}`);
    task.status = 'running';

    try {
      // Execute the specific maintenance action
      const result = await this.executeMaintenanceAction(taskConfig.action);
      
      task.status = 'completed';
      task.endTime = new Date();
      task.duration = task.endTime.getTime() - task.startTime.getTime();
      task.result = result;

      this.logger.log(`Completed maintenance task: ${task.name} (${task.duration}ms)`);
      return task;

    } catch (error) {
      task.status = 'failed';
      task.endTime = new Date();
      task.duration = task.endTime.getTime() - task.startTime.getTime();
      task.error = error.message;

      this.logger.error(`Failed maintenance task: ${task.name}`, error);
      return task;
    }
  }

  /**
   * Execute specific maintenance actions
   */
  private async executeMaintenanceAction(action: string): Promise<any> {
    switch (action) {
      case 'checkDatabaseHealth':
        return await this.checkDatabaseHealth();
      
      case 'checkDiskSpace':
        return await this.checkDiskSpace();
      
      case 'rotateLogs':
        return await this.rotateLogs();
      
      case 'cleanupTempFiles':
        return await this.cleanupTempFiles();
      
      case 'updateDatabaseStatistics':
        return await this.updateDatabaseStatistics();
      
      case 'maintainIndexes':
        return await this.maintainIndexes();
      
      case 'performSecurityScan':
        return await this.performSecurityScan();
      
      case 'vacuumDatabase':
        return await this.vacuumDatabase();
      
      case 'checkSystemUpdates':
        return await this.checkSystemUpdates();
      
      case 'performanceAnalysis':
        return await this.performanceAnalysis();
      
      case 'verifyBackups':
        return await this.verifyBackups();
      
      default:
        throw new Error(`Unknown maintenance action: ${action}`);
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<any> {
    const results = {
      connectionTest: false,
      tableCount: 0,
      indexHealth: 'unknown',
      connectionPoolStatus: {},
    };

    // Test database connection
    await this.dataSource.query('SELECT 1');
    results.connectionTest = true;

    // Get table count
    const tableResult = await this.dataSource.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
    );
    results.tableCount = parseInt(tableResult[0].count);

    // Check connection pool using pg_stat_activity
    try {
      const poolResult = await this.dataSource.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE state = 'idle') AS idle,
          COUNT(*) FILTER (WHERE wait_event IS NOT NULL) AS waiting
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      const poolRow = poolResult[0] || {};
      results.connectionPoolStatus = {
        totalConnections: Number(poolRow.total || 0),
        idleConnections: Number(poolRow.idle || 0),
        waitingClients: Number(poolRow.waiting || 0),
      };
    } catch (error) {
      results.connectionPoolStatus = {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
      };
    }

    // Check for unused indexes
    const unusedIndexes = await this.dataSource.query(`
      SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
      LIMIT 10
    `);

    results.indexHealth = unusedIndexes.length > 0 ? 'has_unused_indexes' : 'healthy';

    return results;
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<any> {
    const results = {
      rootPartition: {},
      uploadsDirectory: {},
      logsDirectory: {},
      warnings: [] as string[],
    };

    try {
      // Check root partition (simplified - would need platform-specific implementation)
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        results.rootPartition = {
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parts[4],
        };

        const usePercent = parseInt(parts[4].replace('%', ''));
        if (usePercent > 80) {
          results.warnings.push(`Root partition is ${usePercent}% full`);
        }
      }
    } catch (error) {
      results.warnings.push('Could not check root partition disk space');
    }

    // Check uploads directory size
    const uploadsPath = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsPath)) {
      const size = await this.getDirectorySize(uploadsPath);
      results.uploadsDirectory = {
        path: uploadsPath,
        size: this.formatFileSize(size),
        sizeBytes: size,
      };

      if (size > 5 * 1024 * 1024 * 1024) { // 5GB
        results.warnings.push('Uploads directory is larger than 5GB');
      }
    }

    // Check logs directory size
    const logsPath = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsPath)) {
      const size = await this.getDirectorySize(logsPath);
      results.logsDirectory = {
        path: logsPath,
        size: this.formatFileSize(size),
        sizeBytes: size,
      };

      if (size > 1024 * 1024 * 1024) { // 1GB
        results.warnings.push('Logs directory is larger than 1GB');
      }
    }

    return results;
  }

  /**
   * Rotate log files
   */
  private async rotateLogs(): Promise<any> {
    const results = {
      rotatedFiles: [] as string[],
      errors: [] as string[],
    };

    const logsPath = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsPath)) {
      return results;
    }

    const files = fs.readdirSync(logsPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Rotate files older than 7 days

    for (const file of files) {
      if (!file.endsWith('.log')) continue;

      const filePath = path.join(logsPath, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate || stats.size > 100 * 1024 * 1024) { // 100MB
        try {
          const rotatedName = `${file}.${new Date().toISOString().split('T')[0]}`;
          const rotatedPath = path.join(logsPath, rotatedName);
          
          fs.renameSync(filePath, rotatedPath);
          
          // Compress the rotated file
          await execAsync(`gzip "${rotatedPath}"`);
          
          results.rotatedFiles.push(rotatedName);
        } catch (error) {
          results.errors.push(`Failed to rotate ${file}: ${error.message}`);
        }
      }
    }

    return results;
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(): Promise<any> {
    const results = {
      deletedFiles: [] as string[],
      freedSpace: 0,
      errors: [] as string[],
    };

    const tempPaths = [
      path.join(process.cwd(), 'temp'),
      path.join(process.cwd(), 'uploads', 'temp'),
      '/tmp/qcser-*', // System temp files
    ];

    for (const tempPath of tempPaths) {
      try {
        if (tempPath.includes('*')) {
          // Handle glob patterns
          const { stdout } = await execAsync(`find ${tempPath.replace('*', '')} -name "${tempPath.split('/').pop()}" -type f -mtime +1`);
          const files = stdout.split('\n').filter(f => f.trim());
          
          for (const file of files) {
            if (fs.existsSync(file)) {
              const stats = fs.statSync(file);
              fs.unlinkSync(file);
              results.deletedFiles.push(file);
              results.freedSpace += stats.size;
            }
          }
        } else if (fs.existsSync(tempPath)) {
          const files = fs.readdirSync(tempPath);
          const cutoffDate = new Date();
          cutoffDate.setHours(cutoffDate.getHours() - 24); // Delete files older than 24 hours

          for (const file of files) {
            const filePath = path.join(tempPath, file);
            const stats = fs.statSync(filePath);

            if (stats.mtime < cutoffDate) {
              if (stats.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
              } else {
                fs.unlinkSync(filePath);
              }
              results.deletedFiles.push(filePath);
              results.freedSpace += stats.size;
            }
          }
        }
      } catch (error) {
        results.errors.push(`Failed to cleanup ${tempPath}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Update database statistics
   */
  private async updateDatabaseStatistics(): Promise<any> {
    const results = {
      tablesAnalyzed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Run ANALYZE on all tables to update statistics
    await this.dataSource.query('ANALYZE');

    // Get count of user tables
    const tableResult = await this.dataSource.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
    );
    results.tablesAnalyzed = parseInt(tableResult[0].count);
    results.duration = Date.now() - startTime;

    return results;
  }

  /**
   * Maintain database indexes
   */
  private async maintainIndexes(): Promise<any> {
    const results = {
      indexesRebuilt: 0,
      unusedIndexes: [] as string[],
      recommendations: [] as string[],
    };

    // Find unused indexes
    const unusedIndexes = await this.dataSource.query(`
      SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
      AND indexname NOT LIKE '%_pkey'
    `);

    results.unusedIndexes = unusedIndexes.map(idx => `${idx.schemaname}.${idx.tablename}.${idx.indexname}`);

    // Find duplicate indexes
    const duplicateIndexes = await this.dataSource.query(`
      SELECT tablename, array_agg(indexname) as indexes
      FROM pg_indexes 
      WHERE schemaname = 'public'
      GROUP BY tablename, indexdef
      HAVING COUNT(*) > 1
    `);

    if (duplicateIndexes.length > 0) {
      results.recommendations.push('Found duplicate indexes that could be removed');
    }

    if (results.unusedIndexes.length > 0) {
      results.recommendations.push(`Found ${results.unusedIndexes.length} unused indexes`);
    }

    return results;
  }

  /**
   * Perform security scan
   */
  private async performSecurityScan(): Promise<any> {
    const results = {
      vulnerabilities: [] as string[],
      recommendations: [] as string[],
      score: 100,
    };

    // Check for common security issues
    
    // 1. Check for default passwords (simplified check)
    const defaultPasswords = ['admin', 'password', '123456'];
    // This would be implemented based on your user management system
    
    // 2. Check file permissions
    const sensitiveFiles = [
      '.env',
      'config/database.config.ts',
      'config/jwt.config.ts',
    ];

    for (const file of sensitiveFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = (stats.mode & parseInt('777', 8)).toString(8);
          if (mode !== '600' && mode !== '644') {
            results.vulnerabilities.push(`File ${file} has insecure permissions: ${mode}`);
            results.score -= 10;
          }
        } catch (error) {
          // Ignore permission check errors
        }
      }
    }

    // 3. Check for outdated dependencies (simplified)
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // This is a simplified check - in reality, you'd use npm audit or similar
      const outdatedPackages = Object.keys(dependencies).filter(pkg => 
        dependencies[pkg].includes('^') && !dependencies[pkg].includes('11.')
      );

      if (outdatedPackages.length > 0) {
        results.recommendations.push('Consider updating outdated packages');
      }
    } catch (error) {
      // Ignore package.json read errors
    }

    // 4. Check database security
    try {
      const dbUsers = await this.dataSource.query(`
        SELECT usename, usesuper, usecreatedb, usebypassrls 
        FROM pg_user 
        WHERE usesuper = true
      `);

      if (dbUsers.length > 1) {
        results.recommendations.push('Multiple superuser accounts found - consider limiting privileges');
      }
    } catch (error) {
      // Ignore database security check errors
    }

    return results;
  }

  /**
   * Vacuum database
   */
  private async vacuumDatabase(): Promise<any> {
    const results = {
      tablesVacuumed: 0,
      spaceReclaimed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Get table sizes before vacuum
    const tablesBefore = await this.dataSource.query(`
      SELECT tablename, pg_total_relation_size(schemaname||'.'||tablename) as size
      FROM pg_tables WHERE schemaname = 'public'
    `);

    const sizeBefore = tablesBefore.reduce((sum, table) => sum + parseInt(table.size), 0);

    // Run VACUUM ANALYZE
    await this.dataSource.query('VACUUM ANALYZE');

    // Get table sizes after vacuum
    const tablesAfter = await this.dataSource.query(`
      SELECT tablename, pg_total_relation_size(schemaname||'.'||tablename) as size
      FROM pg_tables WHERE schemaname = 'public'
    `);

    const sizeAfter = tablesAfter.reduce((sum, table) => sum + parseInt(table.size), 0);

    results.tablesVacuumed = tablesBefore.length;
    results.spaceReclaimed = sizeBefore - sizeAfter;
    results.duration = Date.now() - startTime;

    return results;
  }

  /**
   * Check for system updates
   */
  private async checkSystemUpdates(): Promise<any> {
    const results = {
      updatesAvailable: 0,
      securityUpdates: 0,
      recommendations: [] as string[],
    };

    try {
      // Check Node.js version
      const currentNodeVersion = process.version;
      results.recommendations.push(`Current Node.js version: ${currentNodeVersion}`);

      // Check npm packages (simplified)
      const { stdout } = await execAsync('npm outdated --json', { cwd: process.cwd() });
      const outdated = JSON.parse(stdout || '{}');
      
      results.updatesAvailable = Object.keys(outdated).length;
      
      if (results.updatesAvailable > 0) {
        results.recommendations.push(`${results.updatesAvailable} npm packages have updates available`);
      }

    } catch (error) {
      results.recommendations.push('Could not check for updates - ensure npm is available');
    }

    return results;
  }

  /**
   * Perform performance analysis
   */
  private async performanceAnalysis(): Promise<any> {
    const results = {
      slowQueries: [] as any[],
      indexUsage: {} as any,
      recommendations: [] as string[],
    };

    try {
      // Find slow queries
      const slowQueries = await this.dataSource.query(`
        SELECT query, calls, total_time, mean_time, rows
        FROM pg_stat_statements 
        WHERE mean_time > 1000
        ORDER BY mean_time DESC 
        LIMIT 10
      `);

      results.slowQueries = slowQueries;

      if (slowQueries.length > 0) {
        results.recommendations.push(`Found ${slowQueries.length} slow queries that could be optimized`);
      }

      // Check index usage
      const indexUsage = await this.dataSource.query(`
        SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
        FROM pg_stat_user_indexes 
        ORDER BY idx_tup_read DESC 
        LIMIT 10
      `);

      results.indexUsage = indexUsage;

    } catch (error) {
      results.recommendations.push('Could not perform complete performance analysis');
    }

    return results;
  }

  /**
   * Verify backups
   */
  private async verifyBackups(): Promise<any> {
    const results = {
      backupsFound: 0,
      latestBackup: null as any,
      backupHealth: 'unknown',
      recommendations: [] as string[],
    };

    const backupPath = path.join(process.cwd(), 'backups');
    
    if (fs.existsSync(backupPath)) {
      const files = fs.readdirSync(backupPath);
      const backupFiles = files.filter(f => f.includes('backup') && (f.endsWith('.sql') || f.endsWith('.gz')));
      
      results.backupsFound = backupFiles.length;

      if (backupFiles.length > 0) {
        // Find latest backup
        const latestFile = backupFiles
          .map(f => ({ name: f, path: path.join(backupPath, f), stats: fs.statSync(path.join(backupPath, f)) }))
          .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())[0];

        results.latestBackup = {
          name: latestFile.name,
          date: latestFile.stats.mtime,
          size: this.formatFileSize(latestFile.stats.size),
        };

        // Check backup age
        const ageInHours = (Date.now() - latestFile.stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageInHours < 24) {
          results.backupHealth = 'healthy';
        } else if (ageInHours < 48) {
          results.backupHealth = 'warning';
          results.recommendations.push('Latest backup is more than 24 hours old');
        } else {
          results.backupHealth = 'critical';
          results.recommendations.push('Latest backup is more than 48 hours old');
        }
      } else {
        results.backupHealth = 'critical';
        results.recommendations.push('No backup files found');
      }
    } else {
      results.backupHealth = 'critical';
      results.recommendations.push('Backup directory does not exist');
    }

    return results;
  }

  /**
   * Perform daily health checks
   */
  private async performHealthChecks(): Promise<void> {
    const healthTasks = [
      {
        name: 'Database Connection Check',
        type: 'database',
        action: 'checkDatabaseHealth',
      },
      {
        name: 'Disk Space Check',
        type: 'filesystem',
        action: 'checkDiskSpace',
      },
      {
        name: 'Log Files Check',
        type: 'filesystem',
        action: 'checkLogFiles',
      },
    ];

    for (const taskConfig of healthTasks) {
      try {
        await this.executeMaintenanceAction(taskConfig.action);
      } catch (error) {
        this.logger.error(`Health check failed: ${taskConfig.name}`, error);
      }
    }
  }

  /**
   * Calculate maintenance summary
   */
  private calculateMaintenanceSummary(window: MaintenanceWindow): any {
    const totalTasks = window.tasks.length;
    const completedTasks = window.tasks.filter(t => t.status === 'completed').length;
    const failedTasks = window.tasks.filter(t => t.status === 'failed').length;
    const skippedTasks = window.tasks.filter(t => t.status === 'skipped').length;
    
    const duration = window.endTime ? 
      window.endTime.getTime() - window.startTime.getTime() : 0;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      skippedTasks,
      duration,
    };
  }

  /**
   * Get maintenance history
   */
  getMaintenanceHistory(): MaintenanceWindow[] {
    return this.maintenanceWindows
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, this.maxHistoryRecords);
  }

  /**
   * Get maintenance window by ID
   */
  getMaintenanceWindow(windowId: string): MaintenanceWindow | undefined {
    return this.maintenanceWindows.find(w => w.id === windowId);
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<any> {
    const healthChecks = {
      database: await this.checkDatabaseHealth(),
      diskSpace: await this.checkDiskSpace(),
      security: await this.performSecurityScan(),
    };

    const issues: string[] = [];
    let overallStatus = 'healthy';

    // Check for issues
    if (!healthChecks.database.connectionTest) {
      issues.push('Database connection failed');
      overallStatus = 'critical';
    }

    if (healthChecks.diskSpace.warnings.length > 0) {
      issues.push(...healthChecks.diskSpace.warnings);
      if (overallStatus !== 'critical') overallStatus = 'warning';
    }

    if (healthChecks.security.vulnerabilities.length > 0) {
      issues.push(...healthChecks.security.vulnerabilities);
      if (overallStatus !== 'critical') overallStatus = 'warning';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: healthChecks,
      issues,
      lastMaintenance: this.maintenanceWindows.length > 0 ? 
        this.maintenanceWindows[this.maintenanceWindows.length - 1].startTime : null,
    };
  }

  /**
   * Helper methods
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        totalSize += await this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}