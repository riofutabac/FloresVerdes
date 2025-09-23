import { Injectable } from '@nestjs/common';
import { EvaluacionRepository } from './repositories/evaluacion.repository';
import { CreateEvaluacionDto, UpdateEvaluacionDto, EvaluacionFilterDto } from './dto/evaluacion.dto';

@Injectable()
export class CosechaService {
  constructor(private readonly evaluacionRepository: EvaluacionRepository) {}

  async create(createEvaluacionDto: CreateEvaluacionDto) {
    return this.evaluacionRepository.create(createEvaluacionDto);
  }

  async findAll(filter: EvaluacionFilterDto) {
    return this.evaluacionRepository.findAll(filter);
  }

  async findOne(id: string) {
    return this.evaluacionRepository.findOne(id);
  }

  async update(id: string, updateEvaluacionDto: UpdateEvaluacionDto) {
    return this.evaluacionRepository.update(id, updateEvaluacionDto);
  }

  async remove(id: string) {
    return this.evaluacionRepository.remove(id);
  }

  // Business logic methods
  async getEvaluacionesByOperario(operarioId: string) {
    return this.evaluacionRepository.findByOperario(operarioId);
  }

  async getEvaluacionesByVariedad(variedad: string) {
    return this.evaluacionRepository.findByVariedad(variedad);
  }

  async getPromedioCalidadPorPeriodo(fechaInicio: Date, fechaFin: Date) {
    return this.evaluacionRepository.getPromedioCalidad(fechaInicio, fechaFin);
  }
}