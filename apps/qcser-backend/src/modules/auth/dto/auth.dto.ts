import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class LoginDto {
  @ApiProperty({ description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Nombre completo del usuario' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Rol del usuario', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: 'Contraseña actual' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateProfileDto {
  @ApiProperty({ description: 'Nombre completo del usuario', required: false })
  @IsString()
  fullName?: string;
}

export class AuthResponse {
  @ApiProperty({ description: 'Token de acceso JWT' })
  access_token: string;

  @ApiProperty({ description: 'Información del usuario' })
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
  };
}