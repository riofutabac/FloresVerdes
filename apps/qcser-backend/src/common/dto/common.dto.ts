import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsString, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ 
    description: 'Número de página (empezando desde 1)',
    example: 1,
    minimum: 1,
    required: false,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @ApiProperty({ 
    description: 'Número de elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 10
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(100, { message: 'El límite no puede ser mayor a 100' })
  limit?: number = 10;
}

export class DateRangeDto {
  @ApiProperty({ 
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser válida (YYYY-MM-DD)' })
  startDate?: string;

  @ApiProperty({ 
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2024-12-31',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser válida (YYYY-MM-DD)' })
  endDate?: string;
}

export class SearchDto {
  @ApiProperty({ 
    description: 'Término de búsqueda',
    example: 'juan',
    required: false,
    minLength: 2,
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser texto' })
  @Transform(({ value }) => value?.trim())
  search?: string;
}

export class SortDto {
  @ApiProperty({ 
    description: 'Campo por el cual ordenar',
    example: 'createdAt',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El campo de ordenamiento debe ser texto' })
  sortBy?: string;

  @ApiProperty({ 
    description: 'Dirección del ordenamiento',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
    default: 'DESC'
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser ASC o DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class IdParamDto {
  @ApiProperty({ 
    description: 'ID del recurso',
    example: 1
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'El ID debe ser un número válido' })
  @Min(1, { message: 'El ID debe ser mayor a 0' })
  id: number;
}

export class UuidParamDto {
  @ApiProperty({ 
    description: 'UUID del recurso',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString({ message: 'El UUID debe ser una cadena válida' })
  id: string;
}

export class BooleanQueryDto {
  @ApiProperty({ 
    description: 'Valor booleano',
    example: true,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return Boolean(value);
  })
  @IsBoolean({ message: 'El valor debe ser verdadero o falso' })
  value?: boolean;
}

export class SuccessResponseDto {
  @ApiProperty({ 
    description: 'Indica si la operación fue exitosa',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Mensaje descriptivo',
    example: 'Operación completada exitosamente'
  })
  message: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Datos de la página actual' })
  data: T[];

  @ApiProperty({ description: 'Información de paginación' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ErrorDetailDto {
  @ApiProperty({ description: 'Campo que causó el error' })
  field: string;

  @ApiProperty({ description: 'Mensaje de error' })
  message: string;

  @ApiProperty({ description: 'Valor que causó el error', required: false })
  value?: any;
}