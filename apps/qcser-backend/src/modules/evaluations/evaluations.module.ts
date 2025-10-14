import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { Evaluation } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../entities/evaluation-photo.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluation,
      EvaluationDetail,
      EvaluationPhoto,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}