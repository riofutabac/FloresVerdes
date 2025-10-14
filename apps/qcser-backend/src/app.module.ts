import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { StorageModule } from './modules/storage/storage.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SyncModule } from './modules/sync/sync.module';
import { HealthModule } from './modules/health/health.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { LoggingModule } from './modules/logging/logging.module';
import { BackupModule } from './modules/backup/backup.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import databaseConfig from './config/database.config';
import supabaseConfig from './config/supabase.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, supabaseConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    OperatorsModule,
    EvaluationsModule,
    StorageModule,
    ReportsModule,
    SyncModule,
    HealthModule,
    MonitoringModule,
    LoggingModule,
    BackupModule,
    MaintenanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
