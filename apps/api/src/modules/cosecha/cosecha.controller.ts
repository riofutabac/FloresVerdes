import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CosechaService } from './cosecha.service';
import { CreateEvaluacionDto, UpdateEvaluacionDto, EvaluacionFilterDto } from './dto/evaluacion.dto';

@ApiTags('Cosecha')
@Controller('evaluaciones')
export class CosechaController {
  constructor(private readonly cosechaService: CosechaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva evaluación' })
  @ApiResponse({ status: 201, description: 'Evaluación creada exitosamente.' })
  async create(@Body() createEvaluacionDto: CreateEvaluacionDto) {
    return this.cosechaService.create(createEvaluacionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener evaluaciones' })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones.' })
  async findAll(@Query() filter: EvaluacionFilterDto) {
    return this.cosechaService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener evaluación por ID' })
  @ApiResponse({ status: 200, description: 'Evaluación encontrada.' })
  async findOne(@Param('id') id: string) {
    return this.cosechaService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar evaluación' })
  @ApiResponse({ status: 200, description: 'Evaluación actualizada.' })
  async update(@Param('id') id: string, @Body() updateEvaluacionDto: UpdateEvaluacionDto) {
    return this.cosechaService.update(id, updateEvaluacionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar evaluación' })
  @ApiResponse({ status: 200, description: 'Evaluación eliminada.' })
  async remove(@Param('id') id: string) {
    return this.cosechaService.remove(id);
  }
}