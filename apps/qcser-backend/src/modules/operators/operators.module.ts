import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';
import { Operator } from '../../entities/operator.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operator]),
    forwardRef(() => AuthModule),
  ],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}