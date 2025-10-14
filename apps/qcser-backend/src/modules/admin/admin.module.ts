import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { EvaluationParameter } from '../../entities/evaluation-parameter.entity';
import { Subprocess } from '../../entities/subprocess.entity';
import { Supervisor } from '../../entities/supervisor.entity';
import { RoseVariety } from '../../entities/rose-variety.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EvaluationParameter,
      Subprocess,
      Supervisor,
      RoseVariety,
    ]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}