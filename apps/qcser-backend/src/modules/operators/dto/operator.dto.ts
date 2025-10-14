import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { OperatorStatus } from '../../../entities/operator.entity';

export class CreateOperatorDto {
  @ApiProperty({ description: 'ID de empleado del operario' })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Nombre completo del operario' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Fecha de contratación' })
  @IsDateString()
  hireDate: string;

  @ApiProperty({ description: 'Tiene discapacidad', required: false })
  @IsOptional()
  @IsBoolean()
  hasDisability?: boolean;

  @ApiProperty({ description: 'Descripción de la discapacidad', required: false })
  @IsOptional()
  @IsString()
  disabilityDescription?: string;

  @ApiProperty({ description: 'ID del módulo asignado' })
  @IsNumber()
  moduleId: number;

  @ApiProperty({ description: 'ID del área asignada' })
  @IsNumber()
  areaId: number;

  @ApiProperty({ description: 'Código del cuadrante asignado' })
  @IsString()
  quadrantCode: string;

  @ApiProperty({ description: 'ID de la variedad de rosa asignada', required: false })
  @IsOptional()
  @IsNumber()
  roseVarietyId?: number;

  @ApiProperty({ description: 'Estado del operario', enum: OperatorStatus, required: false })
  @IsOptional()
  @IsEnum(OperatorStatus)
  status?: OperatorStatus;
}

export class UpdateOperatorDto {
  @ApiProperty({ description: 'ID de empleado del operario', required: false })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ description: 'Nombre completo del operario', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ description: 'Fecha de contratación', required: false })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiProperty({ description: 'Tiene discapacidad', required: false })
  @IsOptional()
  @IsBoolean()
  hasDisability?: boolean;

  @ApiProperty({ description: 'Descripción de la discapacidad', required: false })
  @IsOptional()
  @IsString()
  disabilityDescription?: string;

  @ApiProperty({ description: 'ID del módulo asignado', required: false })
  @IsOptional()
  @IsNumber()
  moduleId?: number;

  @ApiProperty({ description: 'ID del área asignada', required: false })
  @IsOptional()
  @IsNumber()
  areaId?: number;

  @ApiProperty({ description: 'Código del cuadrante asignado', required: false })
  @IsOptional()
  @IsString()
  quadrantCode?: string;

  @ApiProperty({ description: 'ID de la variedad de rosa asignada', required: false })
  @IsOptional()
  @IsNumber()
  roseVarietyId?: number;

  @ApiProperty({ description: 'Estado del operario', enum: OperatorStatus, required: false })
  @IsOptional()
  @IsEnum(OperatorStatus)
  status?: OperatorStatus;
}

export class OperatorFilterDto {
  @ApiProperty({ description: 'ID del módulo', required: false })
  @IsOptional()
  @IsNumber()
  moduleId?: number;

  @ApiProperty({ description: 'ID del área', required: false })
  @IsOptional()
  @IsNumber()
  areaId?: number;

  @ApiProperty({ description: 'Estado del operario', enum: OperatorStatus, required: false })
  @IsOptional()
  @IsEnum(OperatorStatus)
  status?: OperatorStatus;

  @ApiProperty({ description: 'Código del cuadrante', required: false })
  @IsOptional()
  @IsString()
  quadrantCode?: string;

  @ApiProperty({ description: 'Búsqueda por nombre', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}