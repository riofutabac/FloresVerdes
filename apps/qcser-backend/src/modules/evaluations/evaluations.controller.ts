import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto, UpdateEvaluationDto, EvaluationFilterDto, CloseEvaluationDto } from './dto/evaluation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { Evaluation, EvaluationStatus } from '../../entities/evaluation.entity';

@ApiTags('Evaluaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva evaluación' })
  @ApiResponse({ status: 201, description: 'Evaluación creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe una evaluación para este operario en esta semana' })
  @Roles(UserRole.JEFA_CALIDAD)
  async create(@Body() createEvaluationDto: CreateEvaluationDto, @Request() req: any): Promise<Evaluation> {
    try {
      const evaluatorId = req.user.sub;
      return await this.evaluationsService.create(createEvaluationDto, evaluatorId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error creando evaluación',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las evaluaciones con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones obtenida exitosamente' })
  @ApiQuery({ name: 'operatorId', required: false, type: Number })
  @ApiQuery({ name: 'areaId', required: false, type: Number })
  @ApiQuery({ name: 'moduleId', required: false, type: Number })
  @ApiQuery({ name: 'quadrantCode', required: false, type: String })
  @ApiQuery({ name: 'workWeek', required: false, type: Number })
  @ApiQuery({ name: 'workYear', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: EvaluationStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'minCompliance', required: false, type: Number })
  @ApiQuery({ name: 'maxCompliance', required: false, type: Number })
  @ApiQuery({ name: 'notSynced', required: false, type: Boolean })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async findAll(@Query() filters: EvaluationFilterDto): Promise<Evaluation[]> {
    try {
      return await this.evaluationsService.findAll(filters);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo evaluaciones',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de evaluaciones' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'areaId', required: false, type: Number })
  @ApiQuery({ name: 'moduleId', required: false, type: Number })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getStatistics(@Query() filters: {
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
    try {
      return await this.evaluationsService.getStatistics(filters);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo estadísticas',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pending-sync')
  @ApiOperation({ summary: 'Obtener evaluaciones pendientes de sincronización' })
  @ApiResponse({ status: 200, description: 'Evaluaciones pendientes obtenidas exitosamente' })
  @Roles(UserRole.JEFA_CALIDAD)
  async findPendingSync(@Request() req: any): Promise<Evaluation[]> {
    try {
      const evaluatorId = req.user.sub;
      return await this.evaluationsService.findPendingSync(evaluatorId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo evaluaciones pendientes',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('by-operator/:operatorId')
  @ApiOperation({ summary: 'Obtener evaluaciones por operario' })
  @ApiResponse({ status: 200, description: 'Evaluaciones del operario obtenidas exitosamente' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: EvaluationStatus })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async findByOperator(
    @Param('operatorId') operatorId: string,
    @Query() filters: {
      startDate?: string;
      endDate?: string;
      status?: EvaluationStatus;
    },
  ): Promise<Evaluation[]> {
    try {
      return await this.evaluationsService.findByOperator(+operatorId, filters);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo evaluaciones del operario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una evaluación por ID' })
  @ApiResponse({ status: 200, description: 'Evaluación obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async findOne(@Param('id') id: string): Promise<Evaluation> {
    try {
      return await this.evaluationsService.findOne(+id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo evaluación',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una evaluación' })
  @ApiResponse({ status: 200, description: 'Evaluación actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede modificar una evaluación cerrada' })
  @Roles(UserRole.JEFA_CALIDAD)
  async update(
    @Param('id') id: string,
    @Body() updateEvaluationDto: UpdateEvaluationDto,
    @Request() req: any,
  ): Promise<Evaluation> {
    try {
      const evaluatorId = req.user.sub;
      return await this.evaluationsService.update(+id, updateEvaluationDto, evaluatorId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error actualizando evaluación',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Cerrar una evaluación' })
  @ApiResponse({ status: 200, description: 'Evaluación cerrada exitosamente' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  @ApiResponse({ status: 400, description: 'La evaluación ya está cerrada' })
  @Roles(UserRole.JEFA_CALIDAD)
  async close(
    @Param('id') id: string,
    @Body() closeEvaluationDto: CloseEvaluationDto,
    @Request() req: any,
  ): Promise<Evaluation> {
    try {
      const evaluatorId = req.user.sub;
      return await this.evaluationsService.close(+id, closeEvaluationDto, evaluatorId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error cerrando evaluación',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('mark-synced')
  @ApiOperation({ summary: 'Marcar evaluaciones como sincronizadas' })
  @ApiResponse({ status: 200, description: 'Evaluaciones marcadas como sincronizadas' })
  @Roles(UserRole.JEFA_CALIDAD)
  async markAsSynced(@Body() data: { evaluationIds: number[] }): Promise<{ success: boolean }> {
    try {
      await this.evaluationsService.markAsSynced(data.evaluationIds);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error marcando evaluaciones como sincronizadas',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una evaluación' })
  @ApiResponse({ status: 200, description: 'Evaluación eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar una evaluación cerrada' })
  @Roles(UserRole.JEFA_CALIDAD)
  async remove(@Param('id') id: string, @Request() req: any): Promise<{ success: boolean }> {
    try {
      const evaluatorId = req.user.sub;
      await this.evaluationsService.remove(+id, evaluatorId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error eliminando evaluación',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}