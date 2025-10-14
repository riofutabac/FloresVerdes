import { Injectable, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  metadata?: any;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export interface LogAnalysis {
  period: string;
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  topContexts: Array<{ context: string; count: number }>;
  errorPatterns: Array<{ pattern: string; count: number; examples: string[] }>;
  performanceIssues: Array<{ issue: string; count: number; severity: string }>;
  securityEvents: Array<{ issue: string; count: number; severity: string }>;
  recommendations: string[];
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private logs: LogEntry[] = [];
  private readonly maxLogsInMemory = 10000;
  private readonly logDirectory: string;
  private readonly logRetentionDays = 30;

  constructor(private configService: ConfigService) {
    this.logDirectory = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.logger.log('Logging service initialized');
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  /**
   * Add a log entry
   */
  addLog(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Add to in-memory logs
    this.logs.push(logEntry);

    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // Write to file immediately for important logs
    if (entry.level === 'error' || entry.level === 'fatal') {
      this.writeLogToFile(logEntry);
    }
  }

  /**
   * Write logs to file every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async flushLogsToFile(): Promise<void> {
    try {
      if (this.logs.length === 0) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDirectory, `app-${today}.log`);
      
      // Get logs that haven't been written to file yet
      const logsToWrite = this.logs.filter(log => !log.metadata?.written);
      
      if (logsToWrite.length === 0) {
        return;
      }

      const logLines = logsToWrite.map(log => JSON.stringify(log)).join('\n') + '\n';
      
      fs.appendFileSync(logFile, logLines);
      
      // Mark logs as written
      logsToWrite.forEach(log => {
        if (!log.metadata) log.metadata = {};
        log.metadata.written = true;
      });

      this.logger.debug(`Flushed ${logsToWrite.length} logs to file`);
    } catch (error) {
      this.logger.error('Failed to flush logs to file', error);
    }
  }

  /**
   * Clean up old log files daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs(): Promise<void> {
    try {
      const files = fs.readdirSync(this.logDirectory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);

      let deletedCount = 0;
      
      for (const file of files) {
        if (!file.startsWith('app-') || !file.endsWith('.log')) {
          continue;
        }

        const filePath = path.join(this.logDirectory, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          this.logger.log(`Deleted old log file: ${file}`);
        }
      }

      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} old log files`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old logs', error);
    }
  }

  /**
   * Generate daily log analysis
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateDailyAnalysis(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const analysis = await this.analyzeLogsForDate(yesterday);
      await this.saveAnalysis('daily', analysis);
      
      this.logger.log('Daily log analysis completed');
    } catch (error) {
      this.logger.error('Failed to generate daily analysis', error);
    }
  }

  /**
   * Write a single log entry to file immediately
   */
  private writeLogToFile(entry: LogEntry): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDirectory, `app-${today}.log`);
      
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(logFile, logLine);
      
      if (!entry.metadata) entry.metadata = {};
      entry.metadata.written = true;
    } catch (error) {
      this.logger.error('Failed to write log to file', error);
    }
  }

  /**
   * Get recent logs from memory
   */
  getRecentLogs(limit: number = 100, level?: LogLevel): LogEntry[] {
    let logs = [...this.logs];
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Search logs by criteria
   */
  searchLogs(criteria: {
    level?: LogLevel;
    context?: string;
    message?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): LogEntry[] {
    let logs = [...this.logs];
    
    if (criteria.level) {
      logs = logs.filter(log => log.level === criteria.level);
    }
    
    if (criteria.context && criteria.context.length > 0) {
      logs = logs.filter(log => log.context.includes(criteria.context!));
    }
    
    if (criteria.message && criteria.message.length > 0) {
      logs = logs.filter(log => log.message.toLowerCase().includes(criteria.message!.toLowerCase()));
    }
    
    if (criteria.userId) {
      logs = logs.filter(log => log.userId === criteria.userId);
    }
    
    if (criteria.startDate) {
      logs = logs.filter(log => log.timestamp >= criteria.startDate!);
    }
    
    if (criteria.endDate) {
      logs = logs.filter(log => log.timestamp <= criteria.endDate!);
    }
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, criteria.limit || 100);
  }

  /**
   * Analyze logs for a specific date
   */
  async analyzeLogsForDate(date: Date): Promise<LogAnalysis> {
    const dateStr = date.toISOString().split('T')[0];
    const logFile = path.join(this.logDirectory, `app-${dateStr}.log`);
    
    let logs: LogEntry[] = [];
    
    // Read logs from file if it exists
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      logs = lines.map(line => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch (error) {
          return null;
        }
      }).filter(log => log !== null);
    }
    
    // Add in-memory logs for today
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) {
      const todayLogs = this.logs.filter(log => 
        log.timestamp.toISOString().split('T')[0] === dateStr
      );
      logs = [...logs, ...todayLogs];
    }

    return this.performLogAnalysis(logs, `date-${dateStr}`);
  }

  /**
   * Perform comprehensive log analysis
   */
  private performLogAnalysis(logs: LogEntry[], period: string): LogAnalysis {
    const logsByLevel: Record<LogLevel, number> = {
      'error': 0,
      'warn': 0,
      'log': 0,
      'debug': 0,
      'verbose': 0,
      'fatal': 0,
    };

    const contextCounts: Record<string, number> = {};
    const errorPatterns: Record<string, { count: number; examples: string[] }> = {};
    const performanceIssues: Array<{ issue: string; count: number; severity: string }> = [];
    const securityEvents: Array<{ issue: string; count: number; severity: string }> = [];

    // Analyze each log entry
    logs.forEach(log => {
      // Count by level
      logsByLevel[log.level]++;

      // Count by context
      contextCounts[log.context] = (contextCounts[log.context] || 0) + 1;

      // Analyze error patterns
      if (log.level === 'error' || log.level === 'fatal') {
        const errorType = this.extractErrorType(log.message);
        if (!errorPatterns[errorType]) {
          errorPatterns[errorType] = { count: 0, examples: [] };
        }
        errorPatterns[errorType].count++;
        if (errorPatterns[errorType].examples.length < 3) {
          errorPatterns[errorType].examples.push(log.message);
        }
      }

      // Detect performance issues
      this.detectPerformanceIssues(log, performanceIssues);

      // Detect security events
      this.detectSecurityEvents(log, securityEvents);
    });

    // Convert context counts to sorted array
    const topContexts = Object.entries(contextCounts)
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Convert error patterns to array
    const errorPatternsArray = Object.entries(errorPatterns)
      .map(([pattern, data]) => ({ pattern, count: data.count, examples: data.examples }))
      .sort((a, b) => b.count - a.count);

    // Generate recommendations
    const recommendations = this.generateLogRecommendations(logs, logsByLevel, errorPatternsArray);

    return {
      period,
      totalLogs: logs.length,
      logsByLevel,
      topContexts,
      errorPatterns: errorPatternsArray,
      performanceIssues,
      securityEvents,
      recommendations,
    };
  }

  /**
   * Extract error type from error message
   */
  private extractErrorType(message: string): string {
    // Common error patterns
    if (message.includes('Database')) return 'Database Error';
    if (message.includes('Connection')) return 'Connection Error';
    if (message.includes('Timeout')) return 'Timeout Error';
    if (message.includes('Authentication')) return 'Authentication Error';
    if (message.includes('Authorization')) return 'Authorization Error';
    if (message.includes('Validation')) return 'Validation Error';
    if (message.includes('File')) return 'File System Error';
    if (message.includes('Network')) return 'Network Error';
    if (message.includes('Memory')) return 'Memory Error';
    if (message.includes('Sync')) return 'Synchronization Error';
    
    return 'General Error';
  }

  /**
   * Detect performance issues in logs
   */
  private detectPerformanceIssues(log: LogEntry, issues: Array<{ issue: string; count: number; severity: string }>): void {
    const message = log.message.toLowerCase();
    
    if (message.includes('slow query') || message.includes('query timeout')) {
      this.incrementIssue(issues, 'Slow Database Queries', 'high');
    }
    
    if (message.includes('high memory') || message.includes('memory leak')) {
      this.incrementIssue(issues, 'Memory Issues', 'high');
    }
    
    if (message.includes('response time') && message.includes('exceeded')) {
      this.incrementIssue(issues, 'Slow Response Times', 'medium');
    }
    
    if (message.includes('connection pool') && message.includes('exhausted')) {
      this.incrementIssue(issues, 'Connection Pool Exhaustion', 'high');
    }
    
    if (message.includes('cpu') && message.includes('high')) {
      this.incrementIssue(issues, 'High CPU Usage', 'medium');
    }
  }

  /**
   * Detect security events in logs
   */
  private detectSecurityEvents(log: LogEntry, events: Array<{ issue: string; count: number; severity: string }>): void {
    const message = log.message.toLowerCase();
    
    if (message.includes('failed login') || message.includes('authentication failed')) {
      this.incrementIssue(events, 'Failed Authentication Attempts', 'medium');
    }
    
    if (message.includes('unauthorized') || message.includes('access denied')) {
      this.incrementIssue(events, 'Unauthorized Access Attempts', 'high');
    }
    
    if (message.includes('sql injection') || message.includes('malicious query')) {
      this.incrementIssue(events, 'SQL Injection Attempts', 'critical');
    }
    
    if (message.includes('suspicious') && message.includes('activity')) {
      this.incrementIssue(events, 'Suspicious Activity', 'medium');
    }
    
    if (message.includes('rate limit') && message.includes('exceeded')) {
      this.incrementIssue(events, 'Rate Limit Violations', 'low');
    }
  }

  /**
   * Helper to increment issue count
   */
  private incrementIssue(issues: Array<{ issue: string; count: number; severity: string }>, issueName: string, severity: string): void {
    const existing = issues.find(i => i.issue === issueName);
    if (existing) {
      existing.count++;
    } else {
      issues.push({ issue: issueName, count: 1, severity });
    }
  }

  /**
   * Generate recommendations based on log analysis
   */
  private generateLogRecommendations(logs: LogEntry[], logsByLevel: Record<LogLevel, number>, errorPatterns: any[]): string[] {
    const recommendations: string[] = [];
    
    // Error rate recommendations
    const errorRate = (logsByLevel.error + logsByLevel.fatal) / logs.length;
    if (errorRate > 0.05) { // 5% error rate
      recommendations.push('High error rate detected - investigate and fix recurring errors');
    }
    
    // Warning rate recommendations
    const warningRate = logsByLevel.warn / logs.length;
    if (warningRate > 0.1) { // 10% warning rate
      recommendations.push('High warning rate - review warnings to prevent potential issues');
    }
    
    // Top error patterns
    if (errorPatterns.length > 0) {
      const topError = errorPatterns[0];
      if (topError.count > 10) {
        recommendations.push(`Address recurring ${topError.pattern} (${topError.count} occurrences)`);
      }
    }
    
    // Database errors
    const dbErrors = errorPatterns.filter(p => p.pattern.includes('Database'));
    if (dbErrors.length > 0) {
      recommendations.push('Database errors detected - check connection stability and query performance');
    }
    
    // Authentication errors
    const authErrors = errorPatterns.filter(p => p.pattern.includes('Authentication'));
    if (authErrors.length > 0) {
      recommendations.push('Authentication issues detected - review authentication configuration');
    }
    
    // Log volume recommendations
    if (logs.length > 50000) { // High log volume
      recommendations.push('High log volume - consider adjusting log levels or implementing log rotation');
    }
    
    return recommendations;
  }

  /**
   * Save analysis to file
   */
  private async saveAnalysis(type: string, analysis: LogAnalysis): Promise<void> {
    try {
      const analysisDir = path.join(this.logDirectory, 'analysis');
      if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${type}-analysis-${timestamp}.json`;
      const filepath = path.join(analysisDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));
      
      this.logger.log(`Log analysis saved: ${filename}`);
    } catch (error) {
      this.logger.error('Failed to save log analysis', error);
    }
  }

  /**
   * Get log statistics
   */
  getLogStatistics(): any {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentLogs = this.logs.filter(log => log.timestamp > oneHourAgo);
    const dailyLogs = this.logs.filter(log => log.timestamp > oneDayAgo);

    const recentErrors = recentLogs.filter(log => log.level === 'error' || log.level === 'fatal');
    const dailyErrors = dailyLogs.filter(log => log.level === 'error' || log.level === 'fatal');

    return {
      timestamp: now.toISOString(),
      recent: {
        total: recentLogs.length,
        errors: recentErrors.length,
        errorRate: recentLogs.length > 0 ? (recentErrors.length / recentLogs.length) * 100 : 0,
      },
      daily: {
        total: dailyLogs.length,
        errors: dailyErrors.length,
        errorRate: dailyLogs.length > 0 ? (dailyErrors.length / dailyLogs.length) * 100 : 0,
      },
      memory: {
        logsInMemory: this.logs.length,
        maxCapacity: this.maxLogsInMemory,
        utilizationPercent: (this.logs.length / this.maxLogsInMemory) * 100,
      },
    };
  }

  /**
   * Export logs for external analysis
   */
  async exportLogs(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = this.searchLogs({ startDate, endDate, limit: 10000 });
    
    const exportDir = path.join(this.logDirectory, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `logs-export-${timestamp}.${format}`;
    const filepath = path.join(exportDir, filename);

    if (format === 'json') {
      fs.writeFileSync(filepath, JSON.stringify(logs, null, 2));
    } else if (format === 'csv') {
      const csvHeader = 'timestamp,level,context,message,userId,requestId,ip\n';
      const csvRows = logs.map(log => 
        `"${log.timestamp.toISOString()}","${log.level}","${log.context}","${log.message.replace(/"/g, '""')}","${log.userId || ''}","${log.requestId || ''}","${log.ip || ''}"`
      ).join('\n');
      
      fs.writeFileSync(filepath, csvHeader + csvRows);
    }

    return filepath;
  }
}