import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleGuard } from '../../common/guards/role.guard';
import type { CreateEvaluationDto, UpdateEvaluationDto } from '@flores-verdes/shared-types';

@Controller('evaluaciones')
@UseGuards(RoleGuard)
export class EvaluacionesController {
  @Get()
  @Roles('admin', 'gerente', 'operario')
  async findAll() {
    return { message: 'Lista de evaluaciones' };
  }

  @Get(':id')
  @Roles('admin', 'gerente', 'operario')
  async findOne(@Param('id') id: string) {
    return { message: `Evaluación ${id}` };
  }

  @Post()
  @Roles('admin', 'operario')
  async create(@Body() createEvaluationDto: CreateEvaluationDto) {
    return { message: 'Evaluación creada', data: createEvaluationDto };
  }

  @Put(':id')
  @Roles('admin', 'operario')
  async update(@Param('id') id: string, @Body() updateEvaluationDto: UpdateEvaluationDto) {
    return { message: `Evaluación ${id} actualizada`, data: updateEvaluationDto };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return { message: `Evaluación ${id} eliminada` };
  }
}