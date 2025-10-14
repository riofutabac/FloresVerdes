import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Evaluation } from '../../entities/evaluation.entity';
import { Operator } from '../../entities/operator.entity';
import { Area } from '../../entities/area.entity';
import { Module as ModuleEntity } from '../../entities/module.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluation, Operator, Area, ModuleEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}