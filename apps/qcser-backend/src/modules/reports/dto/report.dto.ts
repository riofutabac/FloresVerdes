import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, IsArray, IsBoolean } from 'class-validator';

export enum ReportType {
  EVALUATIONS_SUMMARY = 'evaluations_summary',
  OPERATOR_PERFORMANCE = 'operator_performance',
  COMPLIANCE_TRENDS = 'compliance_trends',
  AREA_COMPARISON = 'area_comparison',
  MODULE_COMPARISON = 'module_comparison',
  WEEKLY_REPORT = 'weekly_report',
  MONTHLY_REPORT = 'monthly_report',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export class GenerateReportDto {
  @ApiProperty({ description: 'Tipo de reporte', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Formato del reporte', enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiProperty({ description: 'Fecha de inicio' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'IDs de áreas a incluir', required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  areaIds?: number[];

  @ApiProperty({ description: 'IDs de módulos a incluir', required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  moduleIds?: number[];

  @ApiProperty({ description: 'IDs de operarios a incluir', required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  operatorIds?: number[];

  @ApiProperty({ description: 'Incluir fotos en el reporte', required: false })
  @IsOptional()
  @IsBoolean()
  includePhotos?: boolean;

  @ApiProperty({ description: 'Incluir detalles de parámetros', required: false })
  @IsOptional()
  @IsBoolean()
  includeParameterDetails?: boolean;

  @ApiProperty({ description: 'Porcentaje mínimo de cumplimiento', required: false })
  @IsOptional()
  @IsNumber()
  minCompliance?: number;

  @ApiProperty({ description: 'Porcentaje máximo de cumplimiento', required: false })
  @IsOptional()
  @IsNumber()
  maxCompliance?: number;
}

export class ReportFilterDto {
  @ApiProperty({ description: 'Tipo de reporte', enum: ReportType, required: false })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiProperty({ description: 'Formato del reporte', enum: ReportFormat, required: false })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiProperty({ description: 'Fecha de inicio', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Fecha de fin', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'ID del usuario que generó el reporte', required: false })
  @IsOptional()
  @IsString()
  generatedBy?: string;
}

export class KPIDto {
  @ApiProperty({ description: 'Fecha de inicio para KPIs' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin para KPIs' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'IDs de áreas a incluir', required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  areaIds?: number[];

  @ApiProperty({ description: 'IDs de módulos a incluir', required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  moduleIds?: number[];
}