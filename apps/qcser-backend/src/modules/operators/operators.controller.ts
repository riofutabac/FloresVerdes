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
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto, UpdateOperatorDto, OperatorFilterDto } from './dto/operator.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { Operator } from '../../entities/operator.entity';

@ApiTags('Operarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo operario' })
  @ApiResponse({ status: 201, description: 'Operario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un operario con este ID de empleado' })
  @Roles(UserRole.ADMINISTRADOR)
  async create(@Body() createOperatorDto: CreateOperatorDto): Promise<Operator> {
    try {
      return await this.operatorsService.create(createOperatorDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error creando operario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los operarios con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Lista de operarios obtenida exitosamente' })
  @ApiQuery({ name: 'moduleId', required: false, type: Number })
  @ApiQuery({ name: 'areaId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['activo', 'inactivo', 'baja'] })
  @ApiQuery({ name: 'quadrantCode', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async findAll(@Query() filters: OperatorFilterDto): Promise<Operator[]> {
    try {
      return await this.operatorsService.findAll(filters);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo operarios',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de operarios' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    terminated: number;
    byModule: { moduleId: number; moduleName: string; count: number }[];
    byArea: { areaId: number; areaName: string; count: number }[];
  }> {
    try {
      return await this.operatorsService.getStatistics();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo estadísticas',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pending-evaluations')
  @ApiOperation({ summary: 'Obtener operarios con evaluaciones pendientes' })
  @ApiResponse({ status: 200, description: 'Operarios con evaluaciones pendientes obtenidos exitosamente' })
  @ApiQuery({ name: 'workWeek', required: true, type: Number })
  @ApiQuery({ name: 'workYear', required: true, type: Number })
  @Roles(UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getOperatorsWithPendingEvaluations(
    @Query('workWeek') workWeek: number,
    @Query('workYear') workYear: number,
  ): Promise<Operator[]> {
    try {
      return await this.operatorsService.getOperatorsWithPendingEvaluations(workWeek, workYear);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo operarios con evaluaciones pendientes',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar operarios por texto' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda obtenidos exitosamente' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async search(@Query('q') searchTerm: string): Promise<Operator[]> {
    try {
      return await this.operatorsService.search(searchTerm);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error en la búsqueda',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('by-area-quadrant')
  @ApiOperation({ summary: 'Obtener operarios por área y cuadrante' })
  @ApiResponse({ status: 200, description: 'Operarios obtenidos exitosamente' })
  @ApiQuery({ name: 'areaId', required: true, type: Number })
  @ApiQuery({ name: 'quadrantCode', required: true, type: String })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async findByAreaAndQuadrant(
    @Query('areaId') areaId: number,
    @Query('quadrantCode') quadrantCode: string,
  ): Promise<Operator[]> {
    try {
      return await this.operatorsService.findByAreaAndQuadrant(areaId, quadrantCode);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo operarios por área y cuadrante',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Obtener operario por ID de empleado' })
  @ApiResponse({ status: 200, description: 'Operario obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Operario no encontrado' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async findByEmployeeId(@Param('employeeId') employeeId: string): Promise<Operator> {
    try {
      return await this.operatorsService.findByEmployeeId(employeeId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo operario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un operario por ID' })
  @ApiResponse({ status: 200, description: 'Operario obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Operario no encontrado' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async findOne(@Param('id') id: string): Promise<Operator> {
    try {
      return await this.operatorsService.findOne(+id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo operario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un operario' })
  @ApiResponse({ status: 200, description: 'Operario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Operario no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya existe un operario con este ID de empleado' })
  @Roles(UserRole.ADMINISTRADOR)
  async update(@Param('id') id: string, @Body() updateOperatorDto: UpdateOperatorDto): Promise<Operator> {
    try {
      return await this.operatorsService.update(+id, updateOperatorDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error actualizando operario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar un operario' })
  @ApiResponse({ status: 200, description: 'Operario activado exitosamente' })
  @ApiResponse({ status: 404, description: 'Operario no encontrado' })
  @Roles(UserRole.ADMINISTRADOR)
  async activate(@Param('id') id: string): Promise<Operator> {
    try {
      return await this.operatorsService.activate(+id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error activando operario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar un operario' })
  @ApiResponse({ status: 200, description: 'Operario desactivado exitosamente' })
  @ApiResponse({ status: 404, description: 'Operario no encontrado' })
  @Roles(UserRole.ADMINISTRADOR)
  async deactivate(@Param('id') id: string): Promise<Operator> {
    try {
      return await this.operatorsService.deactivate(+id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error desactivando operario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un operario (cambiar estado a BAJA)' })
  @ApiResponse({ status: 200, description: 'Operario eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Operario no encontrado' })
  @Roles(UserRole.ADMINISTRADOR)
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      await this.operatorsService.remove(+id);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error eliminando operario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}