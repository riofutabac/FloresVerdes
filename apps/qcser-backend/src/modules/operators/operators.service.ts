import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Operator, OperatorStatus } from '../../entities/operator.entity';
import { CreateOperatorDto, UpdateOperatorDto, OperatorFilterDto } from './dto/operator.dto';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private operatorRepository: Repository<Operator>,
  ) {}

  /**
   * Crear un nuevo operario
   */
  async create(createOperatorDto: CreateOperatorDto): Promise<Operator> {
    // Verificar si ya existe un operario con el mismo employeeId
    const existingOperator = await this.operatorRepository.findOne({
      where: { employeeId: createOperatorDto.employeeId },
    });

    if (existingOperator) {
      throw new ConflictException('Ya existe un operario con este ID de empleado');
    }

    const operator = this.operatorRepository.create(createOperatorDto);
    return await this.operatorRepository.save(operator);
  }

  /**
   * Obtener todos los operarios con filtros opcionales
   */
  async findAll(filters?: OperatorFilterDto): Promise<Operator[]> {
    const queryBuilder = this.operatorRepository.createQueryBuilder('operator')
      .leftJoinAndSelect('operator.module', 'module')
      .leftJoinAndSelect('operator.area', 'area')
      .leftJoinAndSelect('operator.roseVariety', 'roseVariety');

    if (filters?.moduleId) {
      queryBuilder.andWhere('operator.moduleId = :moduleId', { moduleId: filters.moduleId });
    }

    if (filters?.areaId) {
      queryBuilder.andWhere('operator.areaId = :areaId', { areaId: filters.areaId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('operator.status = :status', { status: filters.status });
    }

    if (filters?.quadrantCode) {
      queryBuilder.andWhere('operator.quadrantCode = :quadrantCode', { quadrantCode: filters.quadrantCode });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(operator.fullName ILIKE :search OR operator.employeeId ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return await queryBuilder.orderBy('operator.fullName', 'ASC').getMany();
  }

  /**
   * Obtener un operario por ID
   */
  async findOne(id: number): Promise<Operator> {
    const operator = await this.operatorRepository.findOne({
      where: { id },
      relations: ['module', 'area', 'roseVariety', 'evaluations'],
    });

    if (!operator) {
      throw new NotFoundException('Operario no encontrado');
    }

    return operator;
  }

  /**
   * Obtener un operario por employeeId
   */
  async findByEmployeeId(employeeId: string): Promise<Operator> {
    const operator = await this.operatorRepository.findOne({
      where: { employeeId },
      relations: ['module', 'area', 'roseVariety'],
    });

    if (!operator) {
      throw new NotFoundException('Operario no encontrado');
    }

    return operator;
  }

  /**
   * Obtener operarios por área y cuadrante
   */
  async findByAreaAndQuadrant(areaId: number, quadrantCode: string): Promise<Operator[]> {
    return await this.operatorRepository.find({
      where: { 
        areaId, 
        quadrantCode,
        status: OperatorStatus.ACTIVO 
      },
      relations: ['module', 'area', 'roseVariety'],
    });
  }

  /**
   * Actualizar un operario
   */
  async update(id: number, updateOperatorDto: UpdateOperatorDto): Promise<Operator> {
    const operator = await this.findOne(id);

    // Si se está actualizando el employeeId, verificar que no exista otro operario con el mismo
    if (updateOperatorDto.employeeId && updateOperatorDto.employeeId !== operator.employeeId) {
      const existingOperator = await this.operatorRepository.findOne({
        where: { employeeId: updateOperatorDto.employeeId },
      });

      if (existingOperator) {
        throw new ConflictException('Ya existe un operario con este ID de empleado');
      }
    }

    Object.assign(operator, updateOperatorDto);
    return await this.operatorRepository.save(operator);
  }

  /**
   * Eliminar un operario (soft delete - cambiar estado a BAJA)
   */
  async remove(id: number): Promise<void> {
    const operator = await this.findOne(id);
    operator.status = OperatorStatus.BAJA;
    await this.operatorRepository.save(operator);
  }

  /**
   * Activar un operario
   */
  async activate(id: number): Promise<Operator> {
    const operator = await this.findOne(id);
    operator.status = OperatorStatus.ACTIVO;
    return await this.operatorRepository.save(operator);
  }

  /**
   * Desactivar un operario
   */
  async deactivate(id: number): Promise<Operator> {
    const operator = await this.findOne(id);
    operator.status = OperatorStatus.INACTIVO;
    return await this.operatorRepository.save(operator);
  }

  /**
   * Obtener estadísticas de operarios
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    terminated: number;
    byModule: { moduleId: number; moduleName: string; count: number }[];
    byArea: { areaId: number; areaName: string; count: number }[];
  }> {
    const total = await this.operatorRepository.count();
    const active = await this.operatorRepository.count({ where: { status: OperatorStatus.ACTIVO } });
    const inactive = await this.operatorRepository.count({ where: { status: OperatorStatus.INACTIVO } });
    const terminated = await this.operatorRepository.count({ where: { status: OperatorStatus.BAJA } });

    const byModule = await this.operatorRepository
      .createQueryBuilder('operator')
      .leftJoin('operator.module', 'module')
      .select('operator.moduleId', 'moduleId')
      .addSelect('module.name', 'moduleName')
      .addSelect('COUNT(*)', 'count')
      .where('operator.status = :status', { status: OperatorStatus.ACTIVO })
      .groupBy('operator.moduleId, module.name')
      .getRawMany();

    const byArea = await this.operatorRepository
      .createQueryBuilder('operator')
      .leftJoin('operator.area', 'area')
      .select('operator.areaId', 'areaId')
      .addSelect('area.name', 'areaName')
      .addSelect('COUNT(*)', 'count')
      .where('operator.status = :status', { status: OperatorStatus.ACTIVO })
      .groupBy('operator.areaId, area.name')
      .getRawMany();

    return {
      total,
      active,
      inactive,
      terminated,
      byModule: byModule.map(item => ({
        moduleId: parseInt(item.moduleId),
        moduleName: item.moduleName,
        count: parseInt(item.count),
      })),
      byArea: byArea.map(item => ({
        areaId: parseInt(item.areaId),
        areaName: item.areaName,
        count: parseInt(item.count),
      })),
    };
  }

  /**
   * Obtener operarios con evaluaciones pendientes
   */
  async getOperatorsWithPendingEvaluations(workWeek: number, workYear: number): Promise<Operator[]> {
    return await this.operatorRepository
      .createQueryBuilder('operator')
      .leftJoin('operator.evaluations', 'evaluation', 
        'evaluation.workWeek = :workWeek AND evaluation.workYear = :workYear',
        { workWeek, workYear }
      )
      .where('operator.status = :status', { status: OperatorStatus.ACTIVO })
      .andWhere('evaluation.id IS NULL')
      .getMany();
  }

  /**
   * Buscar operarios por texto
   */
  async search(searchTerm: string): Promise<Operator[]> {
    return await this.operatorRepository.find({
      where: [
        { fullName: Like(`%${searchTerm}%`) },
        { employeeId: Like(`%${searchTerm}%`) },
      ],
      relations: ['module', 'area', 'roseVariety'],
      take: 20, // Limitar resultados
    });
  }
}