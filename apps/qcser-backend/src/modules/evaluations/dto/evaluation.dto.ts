import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { EvaluationStatus } from '../../../entities/evaluation.entity';

export class CreateEvaluationDetailDto {
  @ApiProperty({ description: 'ID del parámetro' })
  @IsNumber()
  parameterId: number;

  @ApiProperty({ description: 'Indica si cumple con el parámetro' })
  @IsBoolean()
  isCompliant: boolean;

  @ApiProperty({ description: 'Peso aplicado del parámetro' })
  @IsNumber()
  weightApplied: number;

  @ApiProperty({ description: 'Observaciones del parámetro', required: false })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreateEvaluationPhotoDto {
  @ApiProperty({ description: 'ID del subproceso' })
  @IsNumber()
  subprocessId: number;

  @ApiProperty({ description: 'Ruta del archivo' })
  @IsString()
  filePath: string;

  @ApiProperty({ description: 'Nombre del archivo' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes', required: false })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiProperty({ description: 'Tipo MIME del archivo', required: false })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ description: 'Descripción de la foto', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Orden de carga', required: false })
  @IsOptional()
  @IsNumber()
  uploadOrder?: number;
}

export class CreateEvaluationDto {
  @ApiProperty({ description: 'ID del operario evaluado' })
  @IsNumber()
  operatorId: number;

  @ApiProperty({ description: 'ID del área' })
  @IsNumber()
  areaId: number;

  @ApiProperty({ description: 'Código del cuadrante' })
  @IsString()
  quadrantCode: string;

  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduleId: number;

  @ApiProperty({ description: 'Fecha de evaluación' })
  @IsDateString()
  evaluationDate: string;

  @ApiProperty({ description: 'Hora de evaluación' })
  @IsString()
  evaluationTime: string;

  @ApiProperty({ description: 'Semana de trabajo' })
  @IsNumber()
  workWeek: number;

  @ApiProperty({ description: 'Año de trabajo' })
  @IsNumber()
  workYear: number;

  @ApiProperty({ description: 'Puntaje inicial', required: false })
  @IsOptional()
  @IsNumber()
  initialScore?: number;

  @ApiProperty({ description: 'Puntaje final' })
  @IsNumber()
  finalScore: number;

  @ApiProperty({ description: 'Porcentaje de cumplimiento' })
  @IsNumber()
  compliancePercentage: number;

  @ApiProperty({ description: 'Observaciones generales', required: false })
  @IsOptional()
  @IsString()
  generalObservations?: string;

  @ApiProperty({ description: 'Estado de la evaluación', enum: EvaluationStatus, required: false })
  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;

  @ApiProperty({ description: 'ID local para sincronización offline', required: false })
  @IsOptional()
  @IsUUID()
  localId?: string;

  @ApiProperty({ description: 'Detalles de la evaluación', type: [CreateEvaluationDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationDetailDto)
  details: CreateEvaluationDetailDto[];

  @ApiProperty({ description: 'Fotos de la evaluación', type: [CreateEvaluationPhotoDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationPhotoDto)
  photos?: CreateEvaluationPhotoDto[];
}

export class UpdateEvaluationDto {
  @ApiProperty({ description: 'Puntaje final', required: false })
  @IsOptional()
  @IsNumber()
  finalScore?: number;

  @ApiProperty({ description: 'Porcentaje de cumplimiento', required: false })
  @IsOptional()
  @IsNumber()
  compliancePercentage?: number;

  @ApiProperty({ description: 'Observaciones generales', required: false })
  @IsOptional()
  @IsString()
  generalObservations?: string;

  @ApiProperty({ description: 'Estado de la evaluación', enum: EvaluationStatus, required: false })
  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;

  @ApiProperty({ description: 'Detalles de la evaluación', type: [CreateEvaluationDetailDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationDetailDto)
  details?: CreateEvaluationDetailDto[];

  @ApiProperty({ description: 'Fotos de la evaluación', type: [CreateEvaluationPhotoDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationPhotoDto)
  photos?: CreateEvaluationPhotoDto[];
}

export class EvaluationFilterDto {
  @ApiProperty({ description: 'ID del operario', required: false })
  @IsOptional()
  @IsNumber()
  operatorId?: number;

  @ApiProperty({ description: 'ID del área', required: false })
  @IsOptional()
  @IsNumber()
  areaId?: number;

  @ApiProperty({ description: 'ID del módulo', required: false })
  @IsOptional()
  @IsNumber()
  moduleId?: number;

  @ApiProperty({ description: 'Código del cuadrante', required: false })
  @IsOptional()
  @IsString()
  quadrantCode?: string;

  @ApiProperty({ description: 'Semana de trabajo', required: false })
  @IsOptional()
  @IsNumber()
  workWeek?: number;

  @ApiProperty({ description: 'Año de trabajo', required: false })
  @IsOptional()
  @IsNumber()
  workYear?: number;

  @ApiProperty({ description: 'Estado de la evaluación', enum: EvaluationStatus, required: false })
  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;

  @ApiProperty({ description: 'Fecha de inicio', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Fecha de fin', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Porcentaje mínimo de cumplimiento', required: false })
  @IsOptional()
  @IsNumber()
  minCompliance?: number;

  @ApiProperty({ description: 'Porcentaje máximo de cumplimiento', required: false })
  @IsOptional()
  @IsNumber()
  maxCompliance?: number;

  @ApiProperty({ description: 'Solo evaluaciones no sincronizadas', required: false })
  @IsOptional()
  @IsBoolean()
  notSynced?: boolean;
}

export class CloseEvaluationDto {
  @ApiProperty({ description: 'Observaciones finales', required: false })
  @IsOptional()
  @IsString()
  finalObservations?: string;
}