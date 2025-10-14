import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../entities/user.entity';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { LoginDto, RegisterDto, AuthResponse } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private supabase;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') || '',
      this.configService.get<string>('supabase.serviceRoleKey') || '',
    );
  }

  /**
   * Autentica un usuario con email y contraseña
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Buscar usuario en la base de datos local
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña con Supabase Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Registra un nuevo usuario (solo para administradores)
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, fullName, role } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new ConflictException(`Error creando usuario: ${error?.message}`);
    }

    // Crear usuario en la base de datos local
    const newUser = this.userRepository.create({
      id: data.user.id,
      email,
      fullName,
      role,
      isActive: true,
    });

    await this.userRepository.save(newUser);

    // Generar JWT token
    const payload: JwtPayload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    };
  }

  /**
   * Valida un token JWT y retorna el payload
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id, isActive: true },
    });
  }

  /**
   * Actualiza la contraseña de un usuario
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    // Actualizar contraseña en Supabase Auth
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new ConflictException(`Error actualizando contraseña: ${error.message}`);
    }
  }

  /**
   * Desactiva un usuario
   */
  async deactivateUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isActive: false });

    // Opcional: También desactivar en Supabase Auth
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      ban_duration: 'none', // Banear indefinidamente
    });

    if (error) {
      console.warn(`Warning: Could not deactivate user in Supabase: ${error.message}`);
    }
  }

  /**
   * Reactiva un usuario
   */
  async reactivateUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isActive: true });

    // Opcional: También reactivar en Supabase Auth
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      ban_duration: '0s', // Remover ban
    });

    if (error) {
      console.warn(`Warning: Could not reactivate user in Supabase: ${error.message}`);
    }
  }

  /**
   * Verifica si un usuario tiene un rol específico
   */
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.role === role;
  }

  /**
   * Verifica si un usuario tiene permisos para una acción específica
   */
  async hasPermission(userId: string, action: string, resource?: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    // Definir permisos por rol
    const permissions = {
      [UserRole.ADMINISTRADOR]: ['*'], // Todos los permisos
      [UserRole.JEFA_CALIDAD]: [
        'evaluations:create',
        'evaluations:read',
        'evaluations:update',
        'evaluations:delete',
        'operators:read',
        'parameters:read',
        'reports:read',
      ],
      [UserRole.GERENTE_GENERAL]: [
        'evaluations:read',
        'operators:read',
        'parameters:read',
        'reports:read',
        'reports:export',
      ],
    };

    const userPermissions = permissions[user.role] || [];
    
    // Administrador tiene todos los permisos
    if (userPermissions.includes('*')) {
      return true;
    }

    // Verificar permiso específico
    const fullAction = resource ? `${resource}:${action}` : action;
    return userPermissions.includes(fullAction);
  }

  /**
   * Obtiene el perfil completo de un usuario
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return user;
  }

  /**
   * Actualiza el perfil de un usuario
   */
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    // Remover campos que no se pueden actualizar directamente
    const { id, email, createdAt, updatedAt, ...allowedUpdates } = updateData;

    await this.userRepository.update(userId, allowedUpdates);
    
    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return updatedUser;
  }

  /**
   * Cierra sesión (invalidar token en el cliente)
   */
  async logout(userId: string): Promise<{ success: boolean }> {
    // En JWT stateless, el logout se maneja en el cliente
    // Aquí podríamos registrar el evento de logout
    console.log(`User ${userId} logged out at ${new Date().toISOString()}`);
    
    return { success: true };
  }

  /**
   * Refresca un token JWT
   */
  async refreshToken(userId: string): Promise<{ access_token: string }> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);
    
    return { access_token };
  }

  /**
   * Valida si un email ya existe en el sistema (ADM-14, ADM-21)
   */
  async validateUniqueEmail(email: string, excludeUserId?: string): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (!existingUser) {
      return true; // Email is unique
    }

    // If we're updating a user, exclude their own ID from the check
    if (excludeUserId && existingUser.id === excludeUserId) {
      return true;
    }

    return false; // Email already exists
  }

  /**
   * Obtiene todos los usuarios activos (para administración)
   */
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca usuarios por email o nombre
   */
  async searchUsers(searchTerm: string): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(user.email) LIKE LOWER(:searchTerm) OR LOWER(user.fullName) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Valida permisos de usuario para operaciones específicas (COS-26, KPI-12)
   */
  async validateUserPermissions(userId: string, operation: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    const rolePermissions = {
      [UserRole.ADMINISTRADOR]: {
        canManageUsers: true,
        canManageOperators: true,
        canManageParameters: true,
        canManageSubprocesses: true,
        canManageSupervisors: true,
        canCreateEvaluations: true,
        canViewReports: true,
        canExportReports: true,
        canManageSystem: true,
      },
      [UserRole.JEFA_CALIDAD]: {
        canManageUsers: false,
        canManageOperators: false,
        canManageParameters: false,
        canManageSubprocesses: false,
        canManageSupervisors: false,
        canCreateEvaluations: true,
        canViewReports: true,
        canExportReports: true,
        canManageSystem: false,
      },
      [UserRole.GERENTE_GENERAL]: {
        canManageUsers: false,
        canManageOperators: false,
        canManageParameters: false,
        canManageSubprocesses: false,
        canManageSupervisors: false,
        canCreateEvaluations: false,
        canViewReports: true,
        canExportReports: true,
        canManageSystem: false,
      },
    };

    const permissions = rolePermissions[user.role];
    return permissions[operation] || false;
  }

  /**
   * Actualiza el email de un usuario con validación de duplicados
   */
  async updateUserEmail(userId: string, newEmail: string): Promise<User> {
    // Validar que el email sea único
    const isUnique = await this.validateUniqueEmail(newEmail, userId);
    if (!isUnique) {
      throw new ConflictException('El email ya está en uso por otro usuario');
    }

    // Actualizar en la base de datos local
    await this.userRepository.update(userId, { email: newEmail });

    // Actualizar en Supabase Auth
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      email: newEmail,
    });

    if (error) {
      // Revertir cambio local si falla en Supabase
      const user = await this.getUserById(userId);
      if (user) {
        await this.userRepository.update(userId, { email: user.email });
      }
      throw new ConflictException(`Error actualizando email en Supabase: ${error.message}`);
    }

    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return updatedUser;
  }

  /**
   * Obtiene estadísticas de usuarios por rol
   */
  async getUserStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  }> {
    const allUsers = await this.userRepository.find();
    const activeUsers = allUsers.filter(user => user.isActive);
    const inactiveUsers = allUsers.filter(user => !user.isActive);

    const byRole = {
      [UserRole.ADMINISTRADOR]: allUsers.filter(user => user.role === UserRole.ADMINISTRADOR).length,
      [UserRole.JEFA_CALIDAD]: allUsers.filter(user => user.role === UserRole.JEFA_CALIDAD).length,
      [UserRole.GERENTE_GENERAL]: allUsers.filter(user => user.role === UserRole.GERENTE_GENERAL).length,
    };

    return {
      total: allUsers.length,
      active: activeUsers.length,
      inactive: inactiveUsers.length,
      byRole,
    };
  }
}