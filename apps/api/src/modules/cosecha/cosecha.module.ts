import { Module } from '@nestjs/common';
import { CosechaController } from './cosecha.controller';
import { CosechaService } from './cosecha.service';
import { EvaluacionRepository } from './repositories/evaluacion.repository';

@Module({
  controllers: [CosechaController],
  providers: [CosechaService, EvaluacionRepository],
  exports: [CosechaService],
})
export class CosechaModule {}