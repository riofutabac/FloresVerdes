import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponse, UpdatePasswordDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, User } from '../../entities/user.entity';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error durante el login',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario (solo administradores)' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error durante el registro',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any): Promise<User> {
    try {
      const userId = req.user.sub;
      return await this.authService.getProfile(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo perfil',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('profile')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Request() req: any,
  ): Promise<User> {
    try {
      const userId = req.user.sub;
      return await this.authService.updateProfile(userId, updateProfileDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error actualizando perfil',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('password')
  @ApiOperation({ summary: 'Actualizar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    try {
      const userId = req.user.sub;
      
      // Verificar contraseña actual
      const loginResult = await this.authService.login({
        email: req.user.email,
        password: updatePasswordDto.currentPassword,
      });

      if (!loginResult) {
        throw new HttpException('Contraseña actual incorrecta', HttpStatus.BAD_REQUEST);
      }

      // Actualizar contraseña
      await this.authService.updatePassword(userId, updatePasswordDto.newPassword);
      
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error actualizando contraseña',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token refrescado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req: any): Promise<{ access_token: string }> {
    try {
      const userId = req.user.sub;
      return await this.authService.refreshToken(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error refrescando token',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any): Promise<{ success: boolean }> {
    try {
      const userId = req.user.sub;
      return await this.authService.logout(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error cerrando sesión',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token válido' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async validateToken(@Request() req: any): Promise<{
    valid: boolean;
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
  }> {
    return {
      valid: true,
      user: {
        id: req.user.sub,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }
}