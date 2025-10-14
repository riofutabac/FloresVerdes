import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'cpu' | 'database' | 'storage' | 'response_time';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

export interface MonitoringMetrics {
  timestamp: Date;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    systemUsed: number;
    systemTotal: number;
  };
  cpu: {
    loadAverage: number[];
    usage: number;
  };
  database: {
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    queryCount: number;
    averageQueryTime: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  storage: {
    uploadsSize: number;
    tempSize: number;
    availableSpace: number;
  };
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private alerts: PerformanceAlert[] = [];
  private metrics: MonitoringMetrics[] = [];
  private readonly maxMetricsHistory = 1000; // Keep last 1000 metrics
  private readonly maxAlertsHistory = 500; // Keep last 500 alerts
  
  // Performance thresholds
  private readonly thresholds = {
    memory: {
      heapUsage: 85, // percentage
      systemUsage: 90, // percentage
    },
    cpu: {
      loadAverage: 2.0,
      usage: 80, // percentage
    },
    database: {
      activeConnections: 50,
      waitingClients: 10,
      averageQueryTime: 1000, // milliseconds
    },
    responseTime: {
      average: 2000, // milliseconds
      p95: 5000, // milliseconds
    },
    storage: {
      availableSpace: 1024 * 1024 * 1024, // 1GB
      uploadsSize: 10 * 1024 * 1024 * 1024, // 10GB
    },
  };

  // Request tracking
  private requestStats = {
    total: 0,
    successful: 0,
    failed: 0,
    responseTimes: [] as number[],
    lastReset: new Date(),
  };

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.logger.log('Monitoring service initialized');
  }

  /**
   * Collect system metrics every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherMetrics();
      this.metrics.push(metrics);
      
      // Keep only recent metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // Check for alerts
      await this.checkAlerts(metrics);
      
      this.logger.debug('Metrics collected successfully');
    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
    }
  }

  /**
   * Generate performance report every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async generatePerformanceReport(): Promise<void> {
    try {
      const report = await this.generateHourlyReport();
      await this.saveReport('hourly', report);
      
      this.logger.log('Hourly performance report generated');
    } catch (error) {
      this.logger.error('Failed to generate hourly report', error);
    }
  }

  /**
   * Clean up old data every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldData(): Promise<void> {
    try {
      // Clean up old alerts
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep 7 days
      
      this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate);
      
      // Clean up old report files
      await this.cleanupOldReports();
      
      this.logger.log('Old monitoring data cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup old data', error);
    }
  }

  /**
   * Gather comprehensive system metrics
   */
  private async gatherMetrics(): Promise<MonitoringMetrics> {
    const memoryUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    };

    // Database metrics
    const dbMetrics = await this.getDatabaseMetrics();
    
    // Storage metrics
    const storageMetrics = await this.getStorageMetrics();

    // Request metrics
    const requestMetrics = this.getRequestMetrics();

    return {
      timestamp: new Date(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
        systemUsed: systemMemory.used,
        systemTotal: systemMemory.total,
      },
      cpu: {
        loadAverage: os.loadavg(),
        usage: Math.round((1 - (os.freemem() / os.totalmem())) * 100),
      },
      database: dbMetrics,
      requests: requestMetrics,
      storage: storageMetrics,
    };
  }

  /**
   * Get database performance metrics
   */
  private async getDatabaseMetrics(): Promise<any> {
    try {
      const poolStatus = await this.getPoolCounts();

      // Simple query to test response time
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const queryTime = Date.now() - startTime;

      return {
        ...poolStatus,
        queryCount: 1, // This would be tracked separately in a real implementation
        averageQueryTime: queryTime,
      };
    } catch (error) {
      this.logger.error('Failed to get database metrics', error);
      return {
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        queryCount: 0,
        averageQueryTime: 0,
      };
    }
  }

  /**
   * Get storage metrics
   */
  private async getStorageMetrics(): Promise<any> {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const tempDir = path.join(process.cwd(), 'temp');

      const uploadsSize = await this.getDirectorySize(uploadsDir);
      const tempSize = await this.getDirectorySize(tempDir);
      
      // Approximate available space (this would need platform-specific implementation)
      const availableSpace = os.freemem(); // Approximation

      return {
        uploadsSize,
        tempSize,
        availableSpace,
      };
    } catch (error) {
      this.logger.error('Failed to get storage metrics', error);
      return {
        uploadsSize: 0,
        tempSize: 0,
        availableSpace: 0,
      };
    }
  }

  /**
   * Get request metrics
   */
  private getRequestMetrics(): any {
    const averageResponseTime = this.requestStats.responseTimes.length > 0
      ? this.requestStats.responseTimes.reduce((a, b) => a + b, 0) / this.requestStats.responseTimes.length
      : 0;

    const metrics = {
      total: this.requestStats.total,
      successful: this.requestStats.successful,
      failed: this.requestStats.failed,
      averageResponseTime: Math.round(averageResponseTime),
    };

    // Reset stats for next collection
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      responseTimes: [],
      lastReset: new Date(),
    };

    return metrics;
  }

  /**
   * Check metrics against thresholds and generate alerts
   */
  private async checkAlerts(metrics: MonitoringMetrics): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // Memory alerts
    const heapUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
    if (heapUsagePercent > this.thresholds.memory.heapUsage) {
      alerts.push({
        id: `memory-heap-${Date.now()}`,
        type: 'memory',
        severity: heapUsagePercent > 95 ? 'critical' : 'high',
        message: `High heap memory usage: ${heapUsagePercent.toFixed(2)}%`,
        value: heapUsagePercent,
        threshold: this.thresholds.memory.heapUsage,
        timestamp: new Date(),
        resolved: false,
      });
    }

    const systemUsagePercent = (metrics.memory.systemUsed / metrics.memory.systemTotal) * 100;
    if (systemUsagePercent > this.thresholds.memory.systemUsage) {
      alerts.push({
        id: `memory-system-${Date.now()}`,
        type: 'memory',
        severity: systemUsagePercent > 95 ? 'critical' : 'high',
        message: `High system memory usage: ${systemUsagePercent.toFixed(2)}%`,
        value: systemUsagePercent,
        threshold: this.thresholds.memory.systemUsage,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // CPU alerts
    const loadAverage = metrics.cpu.loadAverage[0];
    if (loadAverage > this.thresholds.cpu.loadAverage) {
      alerts.push({
        id: `cpu-load-${Date.now()}`,
        type: 'cpu',
        severity: loadAverage > 4 ? 'critical' : 'high',
        message: `High CPU load average: ${loadAverage.toFixed(2)}`,
        value: loadAverage,
        threshold: this.thresholds.cpu.loadAverage,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Database alerts
    if (metrics.database.activeConnections > this.thresholds.database.activeConnections) {
      alerts.push({
        id: `db-connections-${Date.now()}`,
        type: 'database',
        severity: 'medium',
        message: `High database connections: ${metrics.database.activeConnections}`,
        value: metrics.database.activeConnections,
        threshold: this.thresholds.database.activeConnections,
        timestamp: new Date(),
        resolved: false,
      });
    }

    if (metrics.database.averageQueryTime > this.thresholds.database.averageQueryTime) {
      alerts.push({
        id: `db-query-time-${Date.now()}`,
        type: 'database',
        severity: 'high',
        message: `Slow database queries: ${metrics.database.averageQueryTime}ms`,
        value: metrics.database.averageQueryTime,
        threshold: this.thresholds.database.averageQueryTime,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Response time alerts
    if (metrics.requests.averageResponseTime > this.thresholds.responseTime.average) {
      alerts.push({
        id: `response-time-${Date.now()}`,
        type: 'response_time',
        severity: 'medium',
        message: `Slow response times: ${metrics.requests.averageResponseTime}ms`,
        value: metrics.requests.averageResponseTime,
        threshold: this.thresholds.responseTime.average,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Storage alerts
    if (metrics.storage.availableSpace < this.thresholds.storage.availableSpace) {
      alerts.push({
        id: `storage-space-${Date.now()}`,
        type: 'storage',
        severity: 'high',
        message: `Low available storage space: ${(metrics.storage.availableSpace / 1024 / 1024).toFixed(2)}MB`,
        value: metrics.storage.availableSpace,
        threshold: this.thresholds.storage.availableSpace,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Add new alerts
    this.alerts.push(...alerts);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }

    // Log critical alerts
    alerts.filter(alert => alert.severity === 'critical').forEach(alert => {
      this.logger.error(`CRITICAL ALERT: ${alert.message}`);
    });
  }

  /**
   * Track request for monitoring
   */
  trackRequest(responseTime: number, success: boolean): void {
    this.requestStats.total++;
    if (success) {
      this.requestStats.successful++;
    } else {
      this.requestStats.failed++;
    }
    this.requestStats.responseTimes.push(responseTime);

    // Keep only recent response times for memory efficiency
    if (this.requestStats.responseTimes.length > 1000) {
      this.requestStats.responseTimes = this.requestStats.responseTimes.slice(-1000);
    }
  }

  /**
   * Get current alerts
   */
  getAlerts(severity?: string): PerformanceAlert[] {
    let alerts = this.alerts.filter(alert => !alert.resolved);
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent metrics
   */
  getMetrics(limit: number = 100): MonitoringMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Generate hourly performance report
   */
  private async generateHourlyReport(): Promise<any> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(
      metric => metric.timestamp > oneHourAgo
    );

    if (recentMetrics.length === 0) {
      return { message: 'No metrics available for the last hour' };
    }

    // Calculate averages and peaks
    const memoryUsage = recentMetrics.map(m => (m.memory.heapUsed / m.memory.heapTotal) * 100);
    const cpuUsage = recentMetrics.map(m => m.cpu.usage);
    const responseTime = recentMetrics.map(m => m.requests.averageResponseTime);
    const dbConnections = recentMetrics.map(m => m.database.activeConnections);

    return {
      timestamp: now,
      period: 'hourly',
      summary: {
        totalRequests: recentMetrics.reduce((sum, m) => sum + m.requests.total, 0),
        successfulRequests: recentMetrics.reduce((sum, m) => sum + m.requests.successful, 0),
        failedRequests: recentMetrics.reduce((sum, m) => sum + m.requests.failed, 0),
        averageMemoryUsage: this.calculateAverage(memoryUsage),
        peakMemoryUsage: Math.max(...memoryUsage),
        averageCpuUsage: this.calculateAverage(cpuUsage),
        peakCpuUsage: Math.max(...cpuUsage),
        averageResponseTime: this.calculateAverage(responseTime),
        peakResponseTime: Math.max(...responseTime),
        averageDbConnections: this.calculateAverage(dbConnections),
        peakDbConnections: Math.max(...dbConnections),
      },
      alerts: this.alerts.filter(alert => alert.timestamp > oneHourAgo),
      recommendations: this.generateRecommendations(recentMetrics),
    };
  }

  /**
   * Save performance report to file
   */
  private async saveReport(type: string, report: any): Promise<void> {
    try {
      const reportsDir = path.join(process.cwd(), 'monitoring-reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${type}-report-${timestamp}.json`;
      const filepath = path.join(reportsDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      
      this.logger.log(`Performance report saved: ${filename}`);
    } catch (error) {
      this.logger.error('Failed to save performance report', error);
    }
  }

  /**
   * Clean up old report files
   */
  private async cleanupOldReports(): Promise<void> {
    try {
      const reportsDir = path.join(process.cwd(), 'monitoring-reports');
      if (!fs.existsSync(reportsDir)) {
        return;
      }

      const files = fs.readdirSync(reportsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days

      for (const file of files) {
        const filepath = path.join(reportsDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filepath);
          this.logger.log(`Deleted old report: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old reports', error);
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: MonitoringMetrics[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.length === 0) {
      return recommendations;
    }

    const avgMemoryUsage = this.calculateAverage(
      metrics.map(m => (m.memory.heapUsed / m.memory.heapTotal) * 100)
    );
    
    const avgResponseTime = this.calculateAverage(
      metrics.map(m => m.requests.averageResponseTime)
    );

    const avgDbConnections = this.calculateAverage(
      metrics.map(m => m.database.activeConnections)
    );

    if (avgMemoryUsage > 70) {
      recommendations.push('Consider optimizing memory usage or increasing heap size');
    }

    if (avgResponseTime > 1000) {
      recommendations.push('Response times are high - consider optimizing queries or adding caching');
    }

    if (avgDbConnections > 30) {
      recommendations.push('High database connection usage - consider connection pooling optimization');
    }

    const failureRate = metrics.reduce((sum, m) => sum + m.requests.failed, 0) / 
                       Math.max(metrics.reduce((sum, m) => sum + m.requests.total, 0), 1);
    
    if (failureRate > 0.05) { // 5% failure rate
      recommendations.push('High error rate detected - investigate application errors');
    }

    return recommendations;
  }

  /**
   * Calculate average of array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100;
  }

  /**
   * Get directory size recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      if (!fs.existsSync(dirPath)) {
        return 0;
      }

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
    } catch (error) {
      this.logger.error(`Failed to get directory size for ${dirPath}`, error);
      return 0;
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.log(`Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData(): any {
    const recentMetrics = this.metrics.slice(-60); // Last hour (assuming 1 metric per minute)
    const activeAlerts = this.getAlerts();
    const criticalAlerts = this.getAlerts('critical');

    return {
      timestamp: new Date(),
      status: criticalAlerts.length > 0 ? 'critical' : activeAlerts.length > 0 ? 'warning' : 'healthy',
      metrics: {
        current: this.metrics[this.metrics.length - 1] || null,
        recent: recentMetrics,
      },
      alerts: {
        active: activeAlerts.length,
        critical: criticalAlerts.length,
        recent: activeAlerts.slice(0, 10),
      },
      summary: {
        uptime: process.uptime(),
        totalRequests: this.requestStats.total,
        memoryUsage: process.memoryUsage(),
        cpuUsage: os.loadavg(),
      },
    };
  }

  /**
   * Get database pool connection counts (TypeORM 0.3+ compatible)
   */
  private async getPoolCounts(): Promise<{
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
  }> {
    try {
      // Fallback using pg_stat_activity (robust, doesn't depend on private driver APIs)
      const result = await this.dataSource.query(`
        SELECT 
          COUNT(*) FILTER (WHERE state = 'active') AS active,
          COUNT(*) FILTER (WHERE state = 'idle') AS idle,
          COUNT(*) FILTER (WHERE wait_event IS NOT NULL) AS waiting
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      const row = result[0] || {};
      return {
        activeConnections: Number(row.active || 0),
        idleConnections: Number(row.idle || 0),
        waitingClients: Number(row.waiting || 0),
      };
    } catch (error) {
      // Fallback to zeros if query fails
      return {
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
      };
    }
  }
}