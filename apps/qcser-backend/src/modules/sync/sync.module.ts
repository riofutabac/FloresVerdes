import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncLog } from '../../entities/sync-log.entity';
import { Evaluation } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../entities/evaluation-photo.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SyncLog,
      Evaluation,
      EvaluationDetail,
      EvaluationPhoto,
    ]),
    ScheduleModule.forRoot(),
    forwardRef(() => AuthModule),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}