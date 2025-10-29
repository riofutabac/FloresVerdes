import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { Area } from '../../entities/area.entity';
import { Module as ModuleEntity } from '../../entities/module.entity';
import { Subprocess } from '../../entities/subprocess.entity';
import { RoseVariety } from '../../entities/rose-variety.entity';
import { Supervisor } from '../../entities/supervisor.entity';
import { EvaluationParameter } from '../../entities/evaluation-parameter.entity';
import { Operator } from '../../entities/operator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Area,
      ModuleEntity,
      Subprocess,
      RoseVariety,
      Supervisor,
      EvaluationParameter,
      Operator,
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}