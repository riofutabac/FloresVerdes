import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Evaluation, EvaluationStatus } from '../../entities/evaluation.entity';
import { EvaluationDetail } from '../../entities/evaluation-detail.entity';
import { EvaluationPhoto } from '../../entities/evaluation-photo.entity';
import { CreateEvaluationDto, UpdateEvaluationDto, EvaluationFilterDto, CloseEvaluationDto } from './dto/evaluation.dto';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(EvaluationDetail)
    private evaluationDetailRepository: Repository<EvaluationDetail>,
    @InjectRepository(EvaluationPhoto)
    private evaluationPhotoRepository: Repository<EvaluationPhoto>,
  ) {}

  /**
   * Crear una nueva evaluación
   */
  async create(createEvaluationDto: CreateEvaluationDto, evaluatorId: string): Promise<Evaluation> {
    // Verificar si ya existe una evaluación para el mismo operario, cuadrante, semana y año
    const existingEvaluation = await this.evaluationRepository.findOne({
      where: {
        operatorId: createEvaluationDto.operatorId,
        quadrantCode: createEvaluationDto.quadrantCode,
        workWeek: createEvaluationDto.workWeek,
        workYear: createEvaluationDto.workYear,
      },
    });

    if (existingEvaluation) {
      throw new ConflictException('Ya existe una evaluación para este operario en esta semana');
    }

    // Crear la evaluación
    const evaluation = this.evaluationRepository.create({
      ...createEvaluationDto,
      evaluatorId,
      initialScore: createEvaluationDto.initialScore || 100.00,
    });

    const savedEvaluation = await this.evaluationRepository.save(evaluation);

    // Crear los detalles de la evaluación
    if (createEvaluationDto.details && createEvaluationDto.details.length > 0) {
      const details = createEvaluationDto.details.map(detail => 
        this.evaluationDetailRepository.create({
          ...detail,
          evaluationId: savedEvaluation.id,
        })
      );
      await this.evaluationDetailRepository.save(details);
    }

    // Crear las fotos de la evaluación
    if (createEvaluationDto.photos && createEvaluationDto.photos.length > 0) {
      const photos = createEvaluationDto.photos.map(photo => 
        this.evaluationPhotoRepository.create({
          ...photo,
          evaluationId: savedEvaluation.id,
        })
      );
      await this.evaluationPhotoRepository.save(photos);
    }

    return await this.findOne(savedEvaluation.id);
  }

  /**
   * Obtener todas las evaluaciones con filtros opcionales
   */
  async findAll(filters?: EvaluationFilterDto): Promise<Evaluation[]> {
    const queryBuilder = this.evaluationRepository.createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.operator', 'operator')
      .leftJoinAndSelect('evaluation.evaluator', 'evaluator')
      .leftJoinAndSelect('evaluation.area', 'area')
      .leftJoinAndSelect('evaluation.module', 'module')
      .leftJoinAndSelect('evaluation.details', 'details')
      .leftJoinAndSelect('evaluation.photos', 'photos')
      .leftJoinAndSelect('details.parameter', 'parameter');

    if (filters?.operatorId) {
      queryBuilder.andWhere('evaluation.operatorId = :operatorId', { operatorId: filters.operatorId });
    }

    if (filters?.areaId) {
      queryBuilder.andWhere('evaluation.areaId = :areaId', { areaId: filters.areaId });
    }

    if (filters?.moduleId) {
      queryBuilder.andWhere('evaluation.moduleId = :moduleId', { moduleId: filters.moduleId });
    }

    if (filters?.quadrantCode) {
      queryBuilder.andWhere('evaluation.quadrantCode = :quadrantCode', { quadrantCode: filters.quadrantCode });
    }

    if (filters?.workWeek) {
      queryBuilder.andWhere('evaluation.workWeek = :workWeek', { workWeek: filters.workWeek });
    }

    if (filters?.workYear) {
      queryBuilder.andWhere('evaluation.workYear = :workYear', { workYear: filters.workYear });
    }

    if (filters?.status) {
      queryBuilder.andWhere('evaluation.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('evaluation.evaluationDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters?.minCompliance !== undefined) {
      queryBuilder.andWhere('evaluation.compliancePercentage >= :minCompliance', { minCompliance: filters.minCompliance });
    }

    if (filters?.maxCompliance !== undefined) {
      queryBuilder.andWhere('evaluation.compliancePercentage <= :maxCompliance', { maxCompliance: filters.maxCompliance });
    }

    if (filters?.notSynced) {
      queryBuilder.andWhere('evaluation.isSynced = :isSynced', { isSynced: false });
    }

    return await queryBuilder
      .orderBy('evaluation.evaluationDate', 'DESC')
      .addOrderBy('evaluation.evaluationTime', 'DESC')
      .getMany();
  }

  /**
   * Obtener una evaluación por ID
   */
  async findOne(id: number): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: [
        'operator',
        'operator.module',
        'operator.area',
        'operator.roseVariety',
        'evaluator',
        'area',
        'module',
        'details',
        'details.parameter',
        'details.parameter.subprocess',
        'photos',
        'photos.subprocess',
      ],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    return evaluation;
  }

  /**
   * Actualizar una evaluación
   */
  async update(id: number, updateEvaluationDto: UpdateEvaluationDto, evaluatorId: string): Promise<Evaluation> {
    const evaluation = await this.findOne(id);

    // Verificar que la evaluación esté en estado borrador
    if (evaluation.status === EvaluationStatus.CERRADA) {
      throw new BadRequestException('No se puede modificar una evaluación cerrada');
    }

    // Verificar que el evaluador sea el mismo que creó la evaluación
    if (evaluation.evaluatorId !== evaluatorId) {
      throw new BadRequestException('Solo el evaluador que creó la evaluación puede modificarla');
    }

    // Actualizar los campos básicos
    Object.assign(evaluation, updateEvaluationDto);

    // Actualizar detalles si se proporcionan
    if (updateEvaluationDto.details) {
      // Eliminar detalles existentes
      await this.evaluationDetailRepository.delete({ evaluationId: id });
      
      // Crear nuevos detalles
      const details = updateEvaluationDto.details.map(detail => 
        this.evaluationDetailRepository.create({
          ...detail,
          evaluationId: id,
        })
      );
      await this.evaluationDetailRepository.save(details);
    }

    // Actualizar fotos si se proporcionan
    if (updateEvaluationDto.photos) {
      // Eliminar fotos existentes
      await this.evaluationPhotoRepository.delete({ evaluationId: id });
      
      // Crear nuevas fotos
      const photos = updateEvaluationDto.photos.map(photo => 
        this.evaluationPhotoRepository.create({
          ...photo,
          evaluationId: id,
        })
      );
      await this.evaluationPhotoRepository.save(photos);
    }

    await this.evaluationRepository.save(evaluation);
    return await this.findOne(id);
  }

  /**
   * Cerrar una evaluación
   */
  async close(id: number, closeEvaluationDto: CloseEvaluationDto, evaluatorId: string): Promise<Evaluation> {
    const evaluation = await this.findOne(id);

    // Verificar que la evaluación esté en estado borrador
    if (evaluation.status === EvaluationStatus.CERRADA) {
      throw new BadRequestException('La evaluación ya está cerrada');
    }

    // Verificar que el evaluador sea el mismo que creó la evaluación
    if (evaluation.evaluatorId !== evaluatorId) {
      throw new BadRequestException('Solo el evaluador que creó la evaluación puede cerrarla');
    }

    // Actualizar estado y observaciones finales
    evaluation.status = EvaluationStatus.CERRADA;
    if (closeEvaluationDto.finalObservations) {
      evaluation.generalObservations = closeEvaluationDto.finalObservations;
    }

    await this.evaluationRepository.save(evaluation);
    return await this.findOne(id);
  }

  /**
   * Eliminar una evaluación
   */
  async remove(id: number, evaluatorId: string): Promise<void> {
    const evaluation = await this.findOne(id);

    // Verificar que la evaluación esté en estado borrador
    if (evaluation.status === EvaluationStatus.CERRADA) {
      throw new BadRequestException('No se puede eliminar una evaluación cerrada');
    }

    // Verificar que el evaluador sea el mismo que creó la evaluación
    if (evaluation.evaluatorId !== evaluatorId) {
      throw new BadRequestException('Solo el evaluador que creó la evaluación puede eliminarla');
    }

    await this.evaluationRepository.remove(evaluation);
  }

  /**
   * Calcular porcentaje de cumplimiento basado en parámetros no cumplidos
   */
  calculateCompliancePercentage(details: { isCompliant: boolean; weightApplied: number }[]): number {
    const totalDeduction = details
      .filter(detail => !detail.isCompliant)
      .reduce((sum, detail) => sum + detail.weightApplied, 0);

    const compliance = Math.max(0, 100 - totalDeduction);
    return Math.round(compliance * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Obtener estadísticas de evaluaciones
   */
  async getStatistics(filters?: {
    startDate?: string;
    endDate?: string;
    areaId?: number;
    moduleId?: number;
  }): Promise<{
    total: number;
    draft: number;
    closed: number;
    averageCompliance: number;
    byArea: { areaId: number; areaName: string; count: number; avgCompliance: number }[];
    byModule: { moduleId: number; moduleName: string; count: number; avgCompliance: number }[];
    complianceDistribution: { range: string; count: number }[];
  }> {
    const queryBuilder = this.evaluationRepository.createQueryBuilder('evaluation')
      .leftJoin('evaluation.area', 'area')
      .leftJoin('evaluation.module', 'module');

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('evaluation.evaluationDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters?.areaId) {
      queryBuilder.andWhere('evaluation.areaId = :areaId', { areaId: filters.areaId });
    }

    if (filters?.moduleId) {
      queryBuilder.andWhere('evaluation.moduleId = :moduleId', { moduleId: filters.moduleId });
    }

    const total = await queryBuilder.getCount();
    const draft = await queryBuilder.clone().andWhere('evaluation.status = :status', { status: EvaluationStatus.BORRADOR }).getCount();
    const closed = await queryBuilder.clone().andWhere('evaluation.status = :status', { status: EvaluationStatus.CERRADA }).getCount();

    const avgResult = await queryBuilder.clone()
      .select('AVG(evaluation.compliancePercentage)', 'avg')
      .getRawOne();
    const averageCompliance = parseFloat(avgResult.avg) || 0;

    // Estadísticas por área
    const byArea = await queryBuilder.clone()
      .select('evaluation.areaId', 'areaId')
      .addSelect('area.name', 'areaName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(evaluation.compliancePercentage)', 'avgCompliance')
      .groupBy('evaluation.areaId, area.name')
      .getRawMany();

    // Estadísticas por módulo
    const byModule = await queryBuilder.clone()
      .select('evaluation.moduleId', 'moduleId')
      .addSelect('module.name', 'moduleName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(evaluation.compliancePercentage)', 'avgCompliance')
      .groupBy('evaluation.moduleId, module.name')
      .getRawMany();

    // Distribución de cumplimiento
    const complianceRanges = [
      { range: '90-100%', min: 90, max: 100 },
      { range: '80-89%', min: 80, max: 89.99 },
      { range: '70-79%', min: 70, max: 79.99 },
      { range: '60-69%', min: 60, max: 69.99 },
      { range: '<60%', min: 0, max: 59.99 },
    ];

    const complianceDistribution = await Promise.all(
      complianceRanges.map(async (range) => {
        const count = await queryBuilder.clone()
          .andWhere('evaluation.compliancePercentage BETWEEN :min AND :max', {
            min: range.min,
            max: range.max,
          })
          .getCount();
        return { range: range.range, count };
      })
    );

    return {
      total,
      draft,
      closed,
      averageCompliance: Math.round(averageCompliance * 100) / 100,
      byArea: byArea.map(item => ({
        areaId: parseInt(item.areaId),
        areaName: item.areaName,
        count: parseInt(item.count),
        avgCompliance: Math.round(parseFloat(item.avgCompliance) * 100) / 100,
      })),
      byModule: byModule.map(item => ({
        moduleId: parseInt(item.moduleId),
        moduleName: item.moduleName,
        count: parseInt(item.count),
        avgCompliance: Math.round(parseFloat(item.avgCompliance) * 100) / 100,
      })),
      complianceDistribution,
    };
  }

  /**
   * Obtener evaluaciones por operario
   */
  async findByOperator(operatorId: number, filters?: {
    startDate?: string;
    endDate?: string;
    status?: EvaluationStatus;
  }): Promise<Evaluation[]> {
    const queryBuilder = this.evaluationRepository.createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.operator', 'operator')
      .leftJoinAndSelect('evaluation.area', 'area')
      .leftJoinAndSelect('evaluation.module', 'module')
      .leftJoinAndSelect('evaluation.details', 'details')
      .leftJoinAndSelect('details.parameter', 'parameter')
      .where('evaluation.operatorId = :operatorId', { operatorId });

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('evaluation.evaluationDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('evaluation.status = :status', { status: filters.status });
    }

    return await queryBuilder
      .orderBy('evaluation.evaluationDate', 'DESC')
      .addOrderBy('evaluation.evaluationTime', 'DESC')
      .getMany();
  }

  /**
   * Obtener evaluaciones pendientes de sincronización
   */
  async findPendingSync(evaluatorId: string): Promise<Evaluation[]> {
    return await this.evaluationRepository.find({
      where: { 
        evaluatorId, 
        isSynced: false 
      },
      relations: ['details', 'photos'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Marcar evaluaciones como sincronizadas
   */
  async markAsSynced(evaluationIds: number[]): Promise<void> {
    await this.evaluationRepository.update(
      evaluationIds,
      { isSynced: true }
    );
  }
}