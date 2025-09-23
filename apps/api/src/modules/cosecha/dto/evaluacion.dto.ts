import { IsString, IsNumber, IsBoolean, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateEvaluacionDto {
  @ApiProperty({ description: 'Nombre del operario' })
  @IsString()
  operario: string;

  @ApiProperty({ description: 'Variedad de la flor' })
  @IsString()
  variedad: string;

  @ApiProperty({ description: 'Número de lote' })
  @IsString()
  lote: string;

  @ApiProperty({ description: 'Calidad (1-10)', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  calidad: number;

  @ApiProperty({ description: 'Cantidad evaluada' })
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ description: 'Indica si tiene defectos' })
  @IsBoolean()
  tieneDefectos: boolean;

  @ApiPropertyOptional({ description: 'UUID del registro (para sync)' })
  @IsOptional()
  @IsString()
  uuid?: string;

  @ApiPropertyOptional({ description: 'Fecha de creación' })
  @IsOptional()
  @IsDateString()
  fechaCreacion?: string;
}

export class UpdateEvaluacionDto extends PartialType(CreateEvaluacionDto) {}

export class EvaluacionFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por operario' })
  @IsOptional()
  @IsString()
  operario?: string;

  @ApiPropertyOptional({ description: 'Filtrar por variedad' })
  @IsOptional()
  @IsString()
  variedad?: string;

  @ApiPropertyOptional({ description: 'Filtrar por lote' })
  @IsOptional()
  @IsString()
  lote?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio' })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad por página', default: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}