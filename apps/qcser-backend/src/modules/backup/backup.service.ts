import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupJob {
  id: string;
  type: 'database' | 'files' | 'full';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  size?: number;
  filePath?: string;
  error?: string;
  metadata?: any;
}

export interface BackupConfig {
  database: {
    enabled: boolean;
    schedule: string;
    retention: number; // days
    compression: boolean;
  };
  files: {
    enabled: boolean;
    schedule: string;
    retention: number; // days
    directories: string[];
  };
  storage: {
    local: {
      enabled: boolean;
      path: string;
    };
    cloud: {
      enabled: boolean;
      bucket: string;
    };
  };
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private supabaseClient: SupabaseClient;
  private backupJobs: BackupJob[] = [];
  private readonly maxJobHistory = 100;
  
  private readonly config: BackupConfig = {
    database: {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 30, // 30 days
      compression: true,
    },
    files: {
      enabled: true,
      schedule: '0 3 * * *', // Daily at 3 AM
      retention: 7, // 7 days
      directories: ['uploads', 'logs', 'monitoring-reports'],
    },
    storage: {
      local: {
        enabled: true,
        path: path.join(process.cwd(), 'backups'),
      },
      cloud: {
        enabled: false,
        bucket: 'qcser-backups',
      },
    },
  };

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    // Initialize Supabase client for cloud backups
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.serviceKey');
    
    if (supabaseUrl && supabaseKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
      this.config.storage.cloud.enabled = true;
    }

    this.ensureBackupDirectory();
    this.logger.log('Backup service initialized');
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.config.storage.local.path)) {
      fs.mkdirSync(this.config.storage.local.path, { recursive: true });
    }
  }

  /**
   * Daily database backup
   */
  @Cron('0 2 * * *') // Daily at 2 AM
  async scheduledDatabaseBackup(): Promise<void> {
    if (!this.config.database.enabled) {
      return;
    }

    try {
      await this.createDatabaseBackup();
      this.logger.log('Scheduled database backup completed');
    } catch (error) {
      this.logger.error('Scheduled database backup failed', error);
    }
  }

  /**
   * Daily file backup
   */
  @Cron('0 3 * * *') // Daily at 3 AM
  async scheduledFileBackup(): Promise<void> {
    if (!this.config.files.enabled) {
      return;
    }

    try {
      await this.createFileBackup();
      this.logger.log('Scheduled file backup completed');
    } catch (error) {
      this.logger.error('Scheduled file backup failed', error);
    }
  }

  /**
   * Weekly cleanup of old backups
   */
  @Cron('0 4 * * 0') // Weekly on Sunday at 4 AM
  async scheduledCleanup(): Promise<void> {
    try {
      await this.cleanupOldBackups();
      this.logger.log('Scheduled backup cleanup completed');
    } catch (error) {
      this.logger.error('Scheduled backup cleanup failed', error);
    }
  }

  /**
   * Create database backup
   */
  async createDatabaseBackup(): Promise<BackupJob> {
    const job: BackupJob = {
      id: `db-backup-${Date.now()}`,
      type: 'database',
      status: 'pending',
      startTime: new Date(),
    };

    this.backupJobs.push(job);
    job.status = 'running';

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `database-backup-${timestamp}.sql`;
      const filePath = path.join(this.config.storage.local.path, filename);

      // Get database connection details
      const dbConfig = this.dataSource.options as any;
      
      // Create pg_dump command
      const dumpCommand = [
        'pg_dump',
        `-h ${dbConfig.host}`,
        `-p ${dbConfig.port}`,
        `-U ${dbConfig.username}`,
        `-d ${dbConfig.database}`,
        `--file="${filePath}"`,
        '--verbose',
        '--no-password',
      ].join(' ');

      // Set PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      // Execute backup
      await execAsync(dumpCommand, { env });

      // Get file size
      const stats = fs.statSync(filePath);
      job.size = stats.size;
      job.filePath = filePath;

      // Compress if enabled
      if (this.config.database.compression) {
        const compressedPath = await this.compressFile(filePath);
        fs.unlinkSync(filePath); // Remove uncompressed file
        job.filePath = compressedPath;
        job.size = fs.statSync(compressedPath).size;
      }

      // Upload to cloud storage if enabled
      if (this.config.storage.cloud.enabled) {
        await this.uploadToCloud(job.filePath, `database/${path.basename(job.filePath)}`);
      }

      job.status = 'completed';
      job.endTime = new Date();
      job.metadata = {
        tables: await this.getTableCount(),
        records: await this.getRecordCount(),
      };

      this.logger.log(`Database backup completed: ${filename} (${this.formatFileSize(job.size)})`);
      return job;

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.error = error.message;
      
      this.logger.error('Database backup failed', error);
      throw error;
    }
  }

  /**
   * Create file backup
   */
  async createFileBackup(): Promise<BackupJob> {
    const job: BackupJob = {
      id: `file-backup-${Date.now()}`,
      type: 'files',
      status: 'pending',
      startTime: new Date(),
    };

    this.backupJobs.push(job);
    job.status = 'running';

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `files-backup-${timestamp}.zip`;
      const filePath = path.join(this.config.storage.local.path, filename);

      // Create zip archive
      const output = fs.createWriteStream(filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', async () => {
          try {
            job.size = archive.pointer();
            job.filePath = filePath;

            // Upload to cloud storage if enabled
            if (this.config.storage.cloud.enabled) {
              await this.uploadToCloud(filePath, `files/${filename}`);
            }

            job.status = 'completed';
            job.endTime = new Date();
            job.metadata = {
              directories: this.config.files.directories,
              totalFiles: archive.pointer(),
            };

            this.logger.log(`File backup completed: ${filename} (${this.formatFileSize(job.size)})`);
            resolve(job);
          } catch (error) {
            job.status = 'failed';
            job.endTime = new Date();
            job.error = error.message;
            reject(error);
          }
        });

        archive.on('error', (error) => {
          job.status = 'failed';
          job.endTime = new Date();
          job.error = error.message;
          reject(error);
        });

        archive.pipe(output);

        // Add directories to archive
        for (const dir of this.config.files.directories) {
          const dirPath = path.join(process.cwd(), dir);
          if (fs.existsSync(dirPath)) {
            archive.directory(dirPath, dir);
          }
        }

        archive.finalize();
      });

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.error = error.message;
      
      this.logger.error('File backup failed', error);
      throw error;
    }
  }

  /**
   * Create full backup (database + files)
   */
  async createFullBackup(): Promise<BackupJob[]> {
    const job: BackupJob = {
      id: `full-backup-${Date.now()}`,
      type: 'full',
      status: 'pending',
      startTime: new Date(),
    };

    this.backupJobs.push(job);
    job.status = 'running';

    try {
      const dbJob = await this.createDatabaseBackup();
      const fileJob = await this.createFileBackup();

      job.status = 'completed';
      job.endTime = new Date();
      job.size = (dbJob.size || 0) + (fileJob.size || 0);
      job.metadata = {
        databaseBackup: dbJob.id,
        fileBackup: fileJob.id,
      };

      this.logger.log('Full backup completed');
      return [job, dbJob, fileJob];

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.error = error.message;
      
      this.logger.error('Full backup failed', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(backupFilePath: string): Promise<void> {
    try {
      this.logger.log(`Starting database restore from: ${backupFilePath}`);

      // Check if file exists
      if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup file not found: ${backupFilePath}`);
      }

      // Decompress if needed
      let sqlFilePath = backupFilePath;
      if (backupFilePath.endsWith('.gz')) {
        sqlFilePath = await this.decompressFile(backupFilePath);
      }

      // Get database connection details
      const dbConfig = this.dataSource.options as any;
      
      // Create psql restore command
      const restoreCommand = [
        'psql',
        `-h ${dbConfig.host}`,
        `-p ${dbConfig.port}`,
        `-U ${dbConfig.username}`,
        `-d ${dbConfig.database}`,
        `-f "${sqlFilePath}"`,
        '--quiet',
      ].join(' ');

      // Set PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      // Execute restore
      await execAsync(restoreCommand, { env });

      // Clean up decompressed file if it was created
      if (sqlFilePath !== backupFilePath) {
        fs.unlinkSync(sqlFilePath);
      }

      this.logger.log('Database restore completed successfully');

    } catch (error) {
      this.logger.error('Database restore failed', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  getAvailableBackups(): BackupJob[] {
    return this.backupJobs
      .filter(job => job.status === 'completed')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Get backup job by ID
   */
  getBackupJob(jobId: string): BackupJob | undefined {
    return this.backupJobs.find(job => job.id === jobId);
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      const backupDir = this.config.storage.local.path;
      const files = fs.readdirSync(backupDir);
      
      const now = new Date();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        const ageInDays = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        let shouldDelete = false;
        if (file.includes('database-backup') && ageInDays > this.config.database.retention) {
          shouldDelete = true;
        } else if (file.includes('files-backup') && ageInDays > this.config.files.retention) {
          shouldDelete = true;
        }

        if (shouldDelete) {
          fs.unlinkSync(filePath);
          deletedCount++;
          this.logger.log(`Deleted old backup: ${file}`);
        }
      }

      // Clean up old job records
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Math.max(this.config.database.retention, this.config.files.retention));
      
      this.backupJobs = this.backupJobs.filter(job => job.startTime > cutoffDate);

      this.logger.log(`Cleanup completed: ${deletedCount} old backups deleted`);

    } catch (error) {
      this.logger.error('Backup cleanup failed', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStatistics(): any {
    const completedJobs = this.backupJobs.filter(job => job.status === 'completed');
    const failedJobs = this.backupJobs.filter(job => job.status === 'failed');
    
    const totalSize = completedJobs.reduce((sum, job) => sum + (job.size || 0), 0);
    
    const lastDatabaseBackup = completedJobs
      .filter(job => job.type === 'database')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];
    
    const lastFileBackup = completedJobs
      .filter(job => job.type === 'files')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalBackups: completedJobs.length,
        failedBackups: failedJobs.length,
        totalSize: this.formatFileSize(totalSize),
        successRate: this.backupJobs.length > 0 ? 
          ((completedJobs.length / this.backupJobs.length) * 100).toFixed(2) : 0,
      },
      lastBackups: {
        database: lastDatabaseBackup ? {
          date: lastDatabaseBackup.startTime,
          size: this.formatFileSize(lastDatabaseBackup.size || 0),
          duration: lastDatabaseBackup.endTime ? 
            lastDatabaseBackup.endTime.getTime() - lastDatabaseBackup.startTime.getTime() : 0,
        } : null,
        files: lastFileBackup ? {
          date: lastFileBackup.startTime,
          size: this.formatFileSize(lastFileBackup.size || 0),
          duration: lastFileBackup.endTime ? 
            lastFileBackup.endTime.getTime() - lastFileBackup.startTime.getTime() : 0,
        } : null,
      },
      configuration: this.config,
    };
  }

  /**
   * Compress file using gzip
   */
  private async compressFile(filePath: string): Promise<string> {
    const compressedPath = `${filePath}.gz`;
    const command = `gzip -c "${filePath}" > "${compressedPath}"`;
    
    await execAsync(command);
    return compressedPath;
  }

  /**
   * Decompress file using gzip
   */
  private async decompressFile(filePath: string): Promise<string> {
    const decompressedPath = filePath.replace('.gz', '');
    const command = `gunzip -c "${filePath}" > "${decompressedPath}"`;
    
    await execAsync(command);
    return decompressedPath;
  }

  /**
   * Upload file to cloud storage
   */
  private async uploadToCloud(filePath: string, cloudPath: string): Promise<void> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not configured');
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    const { error } = await this.supabaseClient.storage
      .from(this.config.storage.cloud.bucket)
      .upload(cloudPath, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      throw new Error(`Cloud upload failed: ${error.message}`);
    }

    this.logger.log(`File uploaded to cloud: ${cloudPath}`);
  }

  /**
   * Get table count from database
   */
  private async getTableCount(): Promise<number> {
    const result = await this.dataSource.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
    );
    return parseInt(result[0].count);
  }

  /**
   * Get approximate record count from database
   */
  private async getRecordCount(): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT SUM(n_tup_ins + n_tup_upd) as total_records 
      FROM pg_stat_user_tables
    `);
    return parseInt(result[0].total_records || 0);
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Update backup configuration
   */
  updateConfig(newConfig: Partial<BackupConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('Backup configuration updated');
  }

  /**
   * Test backup system
   */
  async testBackupSystem(): Promise<any> {
    const results = {
      timestamp: new Date().toISOString(),
      tests: {
        databaseConnection: false,
        backupDirectory: false,
        cloudStorage: false,
        pgDumpAvailable: false,
      },
      errors: [] as string[],
    };

    try {
      // Test database connection
      await this.dataSource.query('SELECT 1');
      results.tests.databaseConnection = true;
    } catch (error) {
      results.errors.push(`Database connection failed: ${error.message}`);
    }

    try {
      // Test backup directory
      this.ensureBackupDirectory();
      const testFile = path.join(this.config.storage.local.path, '.test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      results.tests.backupDirectory = true;
    } catch (error) {
      results.errors.push(`Backup directory test failed: ${error.message}`);
    }

    try {
      // Test cloud storage
      if (this.config.storage.cloud.enabled && this.supabaseClient) {
        const { data } = await this.supabaseClient.storage.listBuckets();
        results.tests.cloudStorage = true;
      }
    } catch (error) {
      results.errors.push(`Cloud storage test failed: ${error.message}`);
    }

    try {
      // Test pg_dump availability
      await execAsync('pg_dump --version');
      results.tests.pgDumpAvailable = true;
    } catch (error) {
      results.errors.push(`pg_dump not available: ${error.message}`);
    }

    return results;
  }
}