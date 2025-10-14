import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, MinLength, IsOptional, IsBoolean, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ 
    description: 'Correo electrónico del usuario',
    example: 'usuario@empresa.com'
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @ApiProperty({ 
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'password123'
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ 
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez García'
  })
  @IsString()
  fullName: string;

  @ApiProperty({ 
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    example: UserRole.JEFA_CALIDAD
  })
  @IsEnum(UserRole, { message: 'Debe ser un rol válido' })
  role: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ 
    description: 'Correo electrónico del usuario',
    example: 'nuevo.email@empresa.com'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Nueva contraseña del usuario (mínimo 6 caracteres)',
    example: 'newpassword123'
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({ 
    description: 'Nombre completo del usuario',
    example: 'Juan Carlos Pérez García'
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ 
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    example: UserRole.GERENTE_GENERAL
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Debe ser un rol válido' })
  role?: UserRole;

  @ApiPropertyOptional({ 
    description: 'Estado activo del usuario',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UserResponseDto {
  @ApiProperty({ description: 'ID único del usuario' })
  id: string;

  @ApiProperty({ description: 'Correo electrónico del usuario' })
  email: string;

  @ApiProperty({ description: 'Nombre completo del usuario' })
  fullName: string;

  @ApiProperty({ description: 'Rol del usuario', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'Estado activo del usuario' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;
}

export class UserStatisticsDto {
  @ApiProperty({ description: 'Total de usuarios en el sistema' })
  total: number;

  @ApiProperty({ description: 'Usuarios activos' })
  active: number;

  @ApiProperty({ description: 'Usuarios inactivos' })
  inactive: number;

  @ApiProperty({ 
    description: 'Distribución de usuarios por rol',
    type: 'object',
    additionalProperties: { type: 'number' }
  })
  byRole: Record<UserRole, number>;
}

export class AvailableRolesDto {
  @ApiProperty({ 
    description: 'Lista de roles disponibles',
    enum: UserRole,
    isArray: true
  })
  roles: UserRole[];

  @ApiProperty({ 
    description: 'Descripciones de cada rol',
    type: 'object',
    additionalProperties: { type: 'string' }
  })
  descriptions: Record<UserRole, string>;
}

export class EmailValidationDto {
  @ApiProperty({ 
    description: 'Email a validar',
    example: 'test@empresa.com'
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;
}

export class EmailValidationResponseDto {
  @ApiProperty({ description: 'Indica si el email es único en el sistema' })
  isUnique: boolean;
}

export class OperationResponseDto {
  @ApiProperty({ description: 'Indica si la operación fue exitosa' })
  success: boolean;

  @ApiProperty({ description: 'Mensaje descriptivo del resultado' })
  message: string;
}

// Parameter Management DTOs (ADM-10, ADM-11, ADM-17)
export class CreateParameterDto {
  @ApiProperty({ 
    description: 'ID del subproceso al que pertenece el parámetro',
    example: 1
  })
  @IsNumber({}, { message: 'El ID del subproceso debe ser un número' })
  subprocessId: number;

  @ApiProperty({ 
    description: 'Código único del parámetro',
    example: 'PARAM_001'
  })
  @IsString()
  code: string;

  @ApiProperty({ 
    description: 'Nombre del parámetro',
    example: 'Calidad de corte'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Descripción detallada del parámetro',
    example: 'Evaluación de la calidad del corte en el tallo'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Porcentaje de peso del parámetro (0-100)',
    example: 15.5
  })
  @IsNumber({}, { message: 'El peso debe ser un número' })
  @Min(0, { message: 'El peso no puede ser negativo' })
  @Max(100, { message: 'El peso no puede ser mayor a 100' })
  weightPercentage: number;

  @ApiPropertyOptional({ 
    description: 'Fecha de vigencia desde (YYYY-MM-DD)',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Debe ser una fecha válida en formato YYYY-MM-DD' })
  effectiveFrom?: string;
}

export class UpdateParameterDto {
  @ApiPropertyOptional({ 
    description: 'Nombre del parámetro',
    example: 'Calidad de corte mejorada'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Descripción detallada del parámetro',
    example: 'Evaluación mejorada de la calidad del corte en el tallo'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Porcentaje de peso del parámetro (0-100)',
    example: 20.0
  })
  @IsOptional()
  @IsNumber({}, { message: 'El peso debe ser un número' })
  @Min(0, { message: 'El peso no puede ser negativo' })
  @Max(100, { message: 'El peso no puede ser mayor a 100' })
  weightPercentage?: number;

  @ApiPropertyOptional({ 
    description: 'Estado activo del parámetro',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'Fecha de vigencia hasta (YYYY-MM-DD)',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Debe ser una fecha válida en formato YYYY-MM-DD' })
  effectiveTo?: string;
}

export class ParameterResponseDto {
  @ApiProperty({ description: 'ID del parámetro' })
  id: number;

  @ApiProperty({ description: 'ID del subproceso' })
  subprocessId: number;

  @ApiProperty({ description: 'Código del parámetro' })
  code: string;

  @ApiProperty({ description: 'Nombre del parámetro' })
  name: string;

  @ApiProperty({ description: 'Descripción del parámetro' })
  description: string;

  @ApiProperty({ description: 'Porcentaje de peso del parámetro' })
  weightPercentage: number;

  @ApiProperty({ description: 'Versión del parámetro' })
  version: number;

  @ApiProperty({ description: 'Fecha de vigencia desde' })
  effectiveFrom: Date;

  @ApiProperty({ description: 'Fecha de vigencia hasta' })
  effectiveTo: Date;

  @ApiProperty({ description: 'Estado activo del parámetro' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Información del subproceso' })
  subprocess?: {
    id: number;
    code: string;
    name: string;
    module?: {
      id: number;
      code: string;
      name: string;
    };
  };
}

// Subprocess Management DTOs (ADM-18)
export class CreateSubprocessDto {
  @ApiProperty({ 
    description: 'ID del módulo al que pertenece el subproceso',
    example: 1
  })
  @IsNumber({}, { message: 'El ID del módulo debe ser un número' })
  moduleId: number;

  @ApiProperty({ 
    description: 'Código único del subproceso',
    example: 'ENMALLADO'
  })
  @IsString()
  code: string;

  @ApiProperty({ 
    description: 'Nombre del subproceso',
    example: 'Enmallado'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Descripción del subproceso',
    example: 'Proceso de enmallado de flores'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Índice de orden para mostrar el subproceso',
    example: 1
  })
  @IsOptional()
  @IsNumber({}, { message: 'El índice de orden debe ser un número' })
  orderIndex?: number;
}

export class UpdateSubprocessDto {
  @ApiPropertyOptional({ 
    description: 'Nombre del subproceso',
    example: 'Enmallado Mejorado'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Descripción del subproceso',
    example: 'Proceso mejorado de enmallado de flores'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Índice de orden para mostrar el subproceso',
    example: 2
  })
  @IsOptional()
  @IsNumber({}, { message: 'El índice de orden debe ser un número' })
  orderIndex?: number;

  @ApiPropertyOptional({ 
    description: 'Estado activo del subproceso',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SubprocessResponseDto {
  @ApiProperty({ description: 'ID del subproceso' })
  id: number;

  @ApiProperty({ description: 'ID del módulo' })
  moduleId: number;

  @ApiProperty({ description: 'Código del subproceso' })
  code: string;

  @ApiProperty({ description: 'Nombre del subproceso' })
  name: string;

  @ApiProperty({ description: 'Descripción del subproceso' })
  description: string;

  @ApiProperty({ description: 'Índice de orden' })
  orderIndex: number;

  @ApiProperty({ description: 'Estado activo del subproceso' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Información del módulo' })
  module?: {
    id: number;
    code: string;
    name: string;
  };

  @ApiPropertyOptional({ description: 'Parámetros del subproceso' })
  parameters?: ParameterResponseDto[];
}

// Supervisor Management DTOs (ADM-19)
export class CreateSupervisorDto {
  @ApiProperty({ 
    description: 'Nombre completo del supervisor',
    example: 'María González López'
  })
  @IsString()
  fullName: string;

  @ApiProperty({ 
    description: 'ID de empleado del supervisor',
    example: 'SUP001'
  })
  @IsString()
  employeeId: string;

  @ApiProperty({ 
    description: 'ID del área asignada',
    example: 1
  })
  @IsNumber({}, { message: 'El ID del área debe ser un número' })
  areaId: number;
}

export class UpdateSupervisorDto {
  @ApiPropertyOptional({ 
    description: 'Nombre completo del supervisor',
    example: 'María Elena González López'
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ 
    description: 'ID de empleado del supervisor',
    example: 'SUP001_NEW'
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ 
    description: 'ID del área asignada',
    example: 2
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID del área debe ser un número' })
  areaId?: number;

  @ApiPropertyOptional({ 
    description: 'Estado activo del supervisor',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SupervisorResponseDto {
  @ApiProperty({ description: 'ID del supervisor' })
  id: number;

  @ApiProperty({ description: 'Nombre completo del supervisor' })
  fullName: string;

  @ApiProperty({ description: 'ID de empleado del supervisor' })
  employeeId: string;

  @ApiProperty({ description: 'ID del área asignada' })
  areaId: number;

  @ApiProperty({ description: 'Estado activo del supervisor' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Información del área' })
  area?: {
    id: number;
    code: string;
    name: string;
  };
}

// Rose Variety Management DTOs (ADM-12, ADM-13, ADM-14, ADM-21)
export class CreateRoseVarietyDto {
  @ApiProperty({ 
    description: 'Código único de la variedad de rosa',
    example: 'RV001'
  })
  @IsString()
  code: string;

  @ApiProperty({ 
    description: 'Nombre de la variedad de rosa',
    example: 'Freedom'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Descripción de la variedad',
    example: 'Rosa roja de tallo largo, ideal para exportación'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Color de la rosa',
    example: 'Rojo'
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ 
    description: 'Longitud mínima del tallo en centímetros',
    example: 40
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitud mínima debe ser un número' })
  @Min(0, { message: 'La longitud mínima no puede ser negativa' })
  stemLengthMin?: number;

  @ApiPropertyOptional({ 
    description: 'Longitud máxima del tallo en centímetros',
    example: 80
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitud máxima debe ser un número' })
  @Min(0, { message: 'La longitud máxima no puede ser negativa' })
  stemLengthMax?: number;
}

export class UpdateRoseVarietyDto {
  @ApiPropertyOptional({ 
    description: 'Código único de la variedad de rosa',
    example: 'RV001_NEW'
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ 
    description: 'Nombre de la variedad de rosa',
    example: 'Freedom Premium'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Descripción de la variedad',
    example: 'Rosa roja premium de tallo largo, ideal para exportación'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Color de la rosa',
    example: 'Rojo Intenso'
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ 
    description: 'Longitud mínima del tallo en centímetros',
    example: 45
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitud mínima debe ser un número' })
  @Min(0, { message: 'La longitud mínima no puede ser negativa' })
  stemLengthMin?: number;

  @ApiPropertyOptional({ 
    description: 'Longitud máxima del tallo en centímetros',
    example: 85
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitud máxima debe ser un número' })
  @Min(0, { message: 'La longitud máxima no puede ser negativa' })
  stemLengthMax?: number;

  @ApiPropertyOptional({ 
    description: 'Estado activo de la variedad',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RoseVarietyResponseDto {
  @ApiProperty({ description: 'ID de la variedad de rosa' })
  id: number;

  @ApiProperty({ description: 'Código de la variedad' })
  code: string;

  @ApiProperty({ description: 'Nombre de la variedad' })
  name: string;

  @ApiProperty({ description: 'Descripción de la variedad' })
  description: string;

  @ApiProperty({ description: 'Color de la rosa' })
  color: string;

  @ApiProperty({ description: 'Longitud mínima del tallo (cm)' })
  stemLengthMin: number;

  @ApiProperty({ description: 'Longitud máxima del tallo (cm)' })
  stemLengthMax: number;

  @ApiProperty({ description: 'Estado activo de la variedad' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Número de operarios asignados a esta variedad' })
  operatorCount?: number;
}

export class RoseVarietyValidationDto {
  @ApiProperty({ 
    description: 'Código de la variedad a validar',
    example: 'RV001'
  })
  @IsString()
  code: string;
}

export class RoseVarietyValidationResponseDto {
  @ApiProperty({ description: 'Indica si el código es único en el sistema' })
  isUnique: boolean;
}