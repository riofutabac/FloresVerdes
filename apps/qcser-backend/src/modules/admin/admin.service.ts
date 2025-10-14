import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { EvaluationParameter } from '../../entities/evaluation-parameter.entity';
import { Subprocess } from '../../entities/subprocess.entity';
import { Supervisor } from '../../entities/supervisor.entity';
import { RoseVariety } from '../../entities/rose-variety.entity';
import { OperatorStatus } from '../../entities/operator.entity';
import { AuthService } from '../auth/auth.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  CreateParameterDto,
  UpdateParameterDto,
  ParameterResponseDto,
  CreateSubprocessDto,
  UpdateSubprocessDto,
  SubprocessResponseDto,
  CreateSupervisorDto,
  UpdateSupervisorDto,
  SupervisorResponseDto,
  CreateRoseVarietyDto,
  UpdateRoseVarietyDto,
  RoseVarietyResponseDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EvaluationParameter)
    private readonly parameterRepository: Repository<EvaluationParameter>,
    @InjectRepository(Subprocess)
    private readonly subprocessRepository: Repository<Subprocess>,
    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,
    @InjectRepository(RoseVariety)
    private readonly roseVarietyRepository: Repository<RoseVariety>,
    private readonly authService: AuthService,
  ) {}

  /**
   * Crea un nuevo usuario (ADM-01)
   * Solo administradores pueden crear usuarios
   */
  async createUser(
    createUserDto: CreateUserDto,
    adminUserId: string,
  ): Promise<UserResponseDto> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageUsers',
    );
    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos para crear usuarios');
    }

    // Validar email único (ADM-14, ADM-21)
    const isEmailUnique = await this.authService.validateUniqueEmail(
      createUserDto.email,
    );
    if (!isEmailUnique) {
      throw new ConflictException('El email ya está registrado en el sistema');
    }

    // Crear usuario usando el servicio de autenticación
    const authResponse = await this.authService.register({
      email: createUserDto.email,
      password: createUserDto.password,
      fullName: createUserDto.fullName,
      role: createUserDto.role,
    });

    return {
      id: authResponse.user.id,
      email: authResponse.user.email,
      fullName: authResponse.user.fullName,
      role: authResponse.user.role,
      isActive: authResponse.user.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Obtiene la lista de todos los usuarios (ADM-03)
   * Administradores ven todos, otros roles ven solo usuarios activos
   */
  async getAllUsers(requestingUserId: string): Promise<UserResponseDto[]> {
    const requestingUser = await this.authService.getUserById(requestingUserId);
    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    let users: User[];

    // Administradores pueden ver todos los usuarios, otros solo activos
    if (requestingUser.role === UserRole.ADMINISTRADOR) {
      users = await this.userRepository.find({
        order: { createdAt: 'DESC' },
      });
    } else {
      users = await this.authService.getAllUsers();
    }

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUserById(
    userId: string,
    requestingUserId: string,
  ): Promise<UserResponseDto> {
    const requestingUser = await this.authService.getUserById(requestingUserId);
    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Solo administradores pueden ver usuarios inactivos
    if (!user.isActive && requestingUser.role !== UserRole.ADMINISTRADOR) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Actualiza los datos de un usuario (ADM-04)
   * Solo administradores pueden actualizar usuarios
   */
  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    adminUserId: string,
  ): Promise<UserResponseDto> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageUsers',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar usuarios',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar email único si se está actualizando (ADM-14, ADM-21)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const isEmailUnique = await this.authService.validateUniqueEmail(
        updateUserDto.email,
        userId,
      );
      if (!isEmailUnique) {
        throw new ConflictException(
          'El email ya está registrado por otro usuario',
        );
      }

      // Actualizar email usando el servicio de autenticación
      await this.authService.updateUserEmail(userId, updateUserDto.email);
    }

    // Actualizar otros campos
    const updateData: Partial<User> = {};
    if (updateUserDto.fullName) updateData.fullName = updateUserDto.fullName;
    if (updateUserDto.role) updateData.role = updateUserDto.role;
    if (updateUserDto.isActive !== undefined)
      updateData.isActive = updateUserDto.isActive;

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(userId, updateData);
    }

    // Actualizar contraseña si se proporciona
    if (updateUserDto.password) {
      await this.authService.updatePassword(userId, updateUserDto.password);
    }

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!updatedUser) {
      throw new NotFoundException(
        'Usuario no encontrado después de la actualización',
      );
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  /**
   * Desactiva un usuario (ADM-05)
   * Solo administradores pueden desactivar usuarios
   */
  async deactivateUser(
    userId: string,
    adminUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageUsers',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para desactivar usuarios',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new ConflictException('El usuario ya está desactivado');
    }

    // No permitir que un administrador se desactive a sí mismo
    if (userId === adminUserId) {
      throw new ConflictException('No puedes desactivar tu propia cuenta');
    }

    await this.authService.deactivateUser(userId);

    return {
      success: true,
      message: `Usuario ${user.fullName} desactivado exitosamente`,
    };
  }

  /**
   * Reactiva un usuario
   * Solo administradores pueden reactivar usuarios
   */
  async reactivateUser(
    userId: string,
    adminUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageUsers',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para reactivar usuarios',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.isActive) {
      throw new ConflictException('El usuario ya está activo');
    }

    await this.authService.reactivateUser(userId);

    return {
      success: true,
      message: `Usuario ${user.fullName} reactivado exitosamente`,
    };
  }

  /**
   * Busca usuarios por email o nombre
   */
  async searchUsers(
    searchTerm: string,
    requestingUserId: string,
  ): Promise<UserResponseDto[]> {
    const requestingUser = await this.authService.getUserById(requestingUserId);
    if (!requestingUser) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    const users = await this.authService.searchUsers(searchTerm);

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  /**
   * Obtiene estadísticas de usuarios
   * Solo administradores pueden ver estadísticas completas
   */
  async getUserStatistics(requestingUserId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  }> {
    const hasPermission = await this.authService.validateUserPermissions(
      requestingUserId,
      'canManageUsers',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para ver estadísticas de usuarios',
      );
    }

    return await this.authService.getUserStatistics();
  }

  /**
   * Valida si un email es único en el sistema
   */
  async validateEmailUniqueness(
    email: string,
    excludeUserId?: string,
  ): Promise<{ isUnique: boolean }> {
    const isUnique = await this.authService.validateUniqueEmail(
      email,
      excludeUserId,
    );
    return { isUnique };
  }

  /**
   * Obtiene los roles disponibles en el sistema (ADM-02)
   */
  getAvailableRoles(): {
    roles: UserRole[];
    descriptions: Record<UserRole, string>;
  } {
    return {
      roles: [
        UserRole.ADMINISTRADOR,
        UserRole.JEFA_CALIDAD,
        UserRole.GERENTE_GENERAL,
      ],
      descriptions: {
        [UserRole.ADMINISTRADOR]:
          'Acceso completo al sistema, gestión de usuarios y configuración',
        [UserRole.JEFA_CALIDAD]:
          'Creación y gestión de evaluaciones, consulta de reportes',
        [UserRole.GERENTE_GENERAL]:
          'Consulta de reportes y análisis, sin permisos de modificación',
      },
    };
  }

  // ==================== PARAMETER MANAGEMENT (ADM-10, ADM-11, ADM-17) ====================

  /**
   * Crea un nuevo parámetro de evaluación (ADM-10)
   * Solo administradores pueden crear parámetros
   */
  async createParameter(
    createParameterDto: CreateParameterDto,
    adminUserId: string,
  ): Promise<ParameterResponseDto> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageParameters',
    );
    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos para crear parámetros');
    }

    // Verificar que el subproceso existe
    const subprocess = await this.subprocessRepository.findOne({
      where: { id: createParameterDto.subprocessId },
      relations: ['module'],
    });

    if (!subprocess) {
      throw new NotFoundException('Subproceso no encontrado');
    }

    // Verificar que no existe un parámetro con el mismo código en el subproceso
    const existingParameter = await this.parameterRepository.findOne({
      where: {
        subprocessId: createParameterDto.subprocessId,
        code: createParameterDto.code,
        isActive: true,
      },
    });

    if (existingParameter) {
      throw new ConflictException(
        'Ya existe un parámetro activo con este código en el subproceso',
      );
    }

    // Crear el parámetro con versioning (ADM-17)
    const parameter = this.parameterRepository.create({
      ...createParameterDto,
      version: 1,
      effectiveFrom: createParameterDto.effectiveFrom
        ? new Date(createParameterDto.effectiveFrom)
        : new Date(),
      isActive: true,
    });

    const savedParameter = await this.parameterRepository.save(parameter);

    return this.mapParameterToResponse(savedParameter, subprocess);
  }

  /**
   * Obtiene parámetros por módulo y subproceso (ADM-11)
   */
  async getParametersByModule(
    moduleId?: number,
    subprocessId?: number,
    requestingUserId?: string,
  ): Promise<ParameterResponseDto[]> {
    const queryBuilder = this.parameterRepository
      .createQueryBuilder('parameter')
      .leftJoinAndSelect('parameter.subprocess', 'subprocess')
      .leftJoinAndSelect('subprocess.module', 'module')
      .where('parameter.isActive = :isActive', { isActive: true })
      .orderBy('subprocess.orderIndex', 'ASC')
      .addOrderBy('parameter.code', 'ASC');

    if (moduleId) {
      queryBuilder.andWhere('module.id = :moduleId', { moduleId });
    }

    if (subprocessId) {
      queryBuilder.andWhere('subprocess.id = :subprocessId', { subprocessId });
    }

    const parameters = await queryBuilder.getMany();

    return parameters.map((parameter) =>
      this.mapParameterToResponse(parameter),
    );
  }

  /**
   * Obtiene un parámetro por ID
   */
  async getParameterById(
    parameterId: number,
    requestingUserId: string,
  ): Promise<ParameterResponseDto> {
    const parameter = await this.parameterRepository.findOne({
      where: { id: parameterId },
      relations: ['subprocess', 'subprocess.module'],
    });

    if (!parameter) {
      throw new NotFoundException('Parámetro no encontrado');
    }

    return this.mapParameterToResponse(parameter);
  }

  /**
   * Actualiza un parámetro existente con versioning (ADM-17)
   * Solo administradores pueden actualizar parámetros
   */
  async updateParameter(
    parameterId: number,
    updateParameterDto: UpdateParameterDto,
    adminUserId: string,
  ): Promise<ParameterResponseDto> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageParameters',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar parámetros',
      );
    }

    const parameter = await this.parameterRepository.findOne({
      where: { id: parameterId },
      relations: ['subprocess', 'subprocess.module'],
    });

    if (!parameter) {
      throw new NotFoundException('Parámetro no encontrado');
    }

    // Si se está cambiando el peso, crear nueva versión (ADM-17)
    if (
      updateParameterDto.weightPercentage &&
      updateParameterDto.weightPercentage !== parameter.weightPercentage
    ) {
      // Cerrar la versión actual
      parameter.effectiveTo = new Date();
      parameter.isActive = false;
      await this.parameterRepository.save(parameter);

      // Crear nueva versión
      const newVersion = this.parameterRepository.create({
        subprocessId: parameter.subprocessId,
        code: parameter.code,
        name: updateParameterDto.name || parameter.name,
        description: updateParameterDto.description || parameter.description,
        weightPercentage: updateParameterDto.weightPercentage,
        version: parameter.version + 1,
        effectiveFrom: new Date(),
        isActive: true,
      });

      const savedParameter = await this.parameterRepository.save(newVersion);
      return this.mapParameterToResponse(savedParameter, parameter.subprocess);
    } else {
      // Actualización simple sin cambio de peso
      const updateData: Partial<EvaluationParameter> = {};
      if (updateParameterDto.name) updateData.name = updateParameterDto.name;
      if (updateParameterDto.description)
        updateData.description = updateParameterDto.description;
      if (updateParameterDto.isActive !== undefined)
        updateData.isActive = updateParameterDto.isActive;
      if (updateParameterDto.effectiveTo)
        updateData.effectiveTo = new Date(updateParameterDto.effectiveTo);

      if (Object.keys(updateData).length > 0) {
        await this.parameterRepository.update(parameterId, updateData);
      }

      const updatedParameter = await this.parameterRepository.findOne({
        where: { id: parameterId },
        relations: ['subprocess', 'subprocess.module'],
      });

      return this.mapParameterToResponse(updatedParameter!);
    }
  }

  /**
   * Desactiva un parámetro
   * Solo administradores pueden desactivar parámetros
   */
  async deactivateParameter(
    parameterId: number,
    adminUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageParameters',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para desactivar parámetros',
      );
    }

    const parameter = await this.parameterRepository.findOne({
      where: { id: parameterId },
    });

    if (!parameter) {
      throw new NotFoundException('Parámetro no encontrado');
    }

    if (!parameter.isActive) {
      throw new ConflictException('El parámetro ya está desactivado');
    }

    parameter.isActive = false;
    parameter.effectiveTo = new Date();
    await this.parameterRepository.save(parameter);

    return {
      success: true,
      message: `Parámetro ${parameter.name} desactivado exitosamente`,
    };
  }

  /**
   * Obtiene el historial de versiones de un parámetro (ADM-17)
   */
  async getParameterVersionHistory(
    subprocessId: number,
    code: string,
    requestingUserId: string,
  ): Promise<ParameterResponseDto[]> {
    const parameters = await this.parameterRepository.find({
      where: { subprocessId, code },
      relations: ['subprocess', 'subprocess.module'],
      order: { version: 'DESC' },
    });

    return parameters.map((parameter) =>
      this.mapParameterToResponse(parameter),
    );
  }

  // ==================== SUBPROCESS MANAGEMENT (ADM-18) ====================

  /**
   * Crea un nuevo subproceso (ADM-18)
   * Solo administradores pueden crear subprocesos
   */
  async createSubprocess(
    createSubprocessDto: CreateSubprocessDto,
    adminUserId: string,
  ): Promise<SubprocessResponseDto> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageSubprocesses',
    );
    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos para crear subprocesos');
    }

    // Verificar que no existe un subproceso con el mismo código en el módulo
    const existingSubprocess = await this.subprocessRepository.findOne({
      where: {
        moduleId: createSubprocessDto.moduleId,
        code: createSubprocessDto.code,
      },
    });

    if (existingSubprocess) {
      throw new ConflictException(
        'Ya existe un subproceso con este código en el módulo',
      );
    }

    const subprocess = this.subprocessRepository.create({
      ...createSubprocessDto,
      orderIndex: createSubprocessDto.orderIndex || 0,
      isActive: true,
    });

    const savedSubprocess = await this.subprocessRepository.save(subprocess);

    return this.mapSubprocessToResponse(savedSubprocess);
  }

  /**
   * Obtiene subprocesos por módulo (ADM-18)
   */
  async getSubprocessesByModule(
    moduleId?: number,
  ): Promise<SubprocessResponseDto[]> {
    const queryBuilder = this.subprocessRepository
      .createQueryBuilder('subprocess')
      .leftJoinAndSelect('subprocess.module', 'module')
      .leftJoinAndSelect(
        'subprocess.parameters',
        'parameters',
        'parameters.isActive = :isActive',
        { isActive: true },
      )
      .where('subprocess.isActive = :isActive', { isActive: true })
      .orderBy('subprocess.orderIndex', 'ASC')
      .addOrderBy('subprocess.code', 'ASC');

    if (moduleId) {
      queryBuilder.andWhere('module.id = :moduleId', { moduleId });
    }

    const subprocesses = await queryBuilder.getMany();

    return subprocesses.map((subprocess) =>
      this.mapSubprocessToResponse(subprocess),
    );
  }

  /**
   * Actualiza un subproceso existente (ADM-18)
   * Solo administradores pueden actualizar subprocesos
   */
  async updateSubprocess(
    subprocessId: number,
    updateSubprocessDto: UpdateSubprocessDto,
    adminUserId: string,
  ): Promise<SubprocessResponseDto> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageSubprocesses',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar subprocesos',
      );
    }

    const subprocess = await this.subprocessRepository.findOne({
      where: { id: subprocessId },
      relations: ['module'],
    });

    if (!subprocess) {
      throw new NotFoundException('Subproceso no encontrado');
    }

    const updateData: Partial<Subprocess> = {};
    if (updateSubprocessDto.name) updateData.name = updateSubprocessDto.name;
    if (updateSubprocessDto.description)
      updateData.description = updateSubprocessDto.description;
    if (updateSubprocessDto.orderIndex !== undefined)
      updateData.orderIndex = updateSubprocessDto.orderIndex;
    if (updateSubprocessDto.isActive !== undefined)
      updateData.isActive = updateSubprocessDto.isActive;

    if (Object.keys(updateData).length > 0) {
      await this.subprocessRepository.update(subprocessId, updateData);
    }

    const updatedSubprocess = await this.subprocessRepository.findOne({
      where: { id: subprocessId },
      relations: ['module'],
    });

    return this.mapSubprocessToResponse(updatedSubprocess!);
  }

  // ==================== SUPERVISOR MANAGEMENT (ADM-19) ====================

  /**
   * Crea un nuevo supervisor (ADM-19)
   * Solo administradores pueden crear supervisores
   */
  async createSupervisor(
    createSupervisorDto: CreateSupervisorDto,
    adminUserId: string,
  ): Promise<SupervisorResponseDto> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageSupervisors',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para crear supervisores',
      );
    }

    // Verificar que no existe un supervisor con el mismo employeeId
    const existingSupervisor = await this.supervisorRepository.findOne({
      where: { employeeId: createSupervisorDto.employeeId },
    });

    if (existingSupervisor) {
      throw new ConflictException(
        'Ya existe un supervisor con este ID de empleado',
      );
    }

    const supervisor = this.supervisorRepository.create({
      ...createSupervisorDto,
      isActive: true,
    });

    const savedSupervisor = await this.supervisorRepository.save(supervisor);

    return this.mapSupervisorToResponse(savedSupervisor);
  }

  /**
   * Obtiene supervisores por área (ADM-19)
   */
  async getSupervisorsByArea(
    areaId?: number,
  ): Promise<SupervisorResponseDto[]> {
    const queryBuilder = this.supervisorRepository
      .createQueryBuilder('supervisor')
      .leftJoinAndSelect('supervisor.area', 'area')
      .where('supervisor.isActive = :isActive', { isActive: true })
      .orderBy('supervisor.fullName', 'ASC');

    if (areaId) {
      queryBuilder.andWhere('area.id = :areaId', { areaId });
    }

    const supervisors = await queryBuilder.getMany();

    return supervisors.map((supervisor) =>
      this.mapSupervisorToResponse(supervisor),
    );
  }

  /**
   * Actualiza un supervisor existente (ADM-19)
   * Solo administradores pueden actualizar supervisores
   */
  async updateSupervisor(
    supervisorId: number,
    updateSupervisorDto: UpdateSupervisorDto,
    adminUserId: string,
  ): Promise<SupervisorResponseDto> {
    // Verificar permisos de administrador
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageSupervisors',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar supervisores',
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: supervisorId },
      relations: ['area'],
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor no encontrado');
    }

    // Verificar employeeId único si se está actualizando
    if (
      updateSupervisorDto.employeeId &&
      updateSupervisorDto.employeeId !== supervisor.employeeId
    ) {
      const existingSupervisor = await this.supervisorRepository.findOne({
        where: { employeeId: updateSupervisorDto.employeeId },
      });

      if (existingSupervisor) {
        throw new ConflictException(
          'Ya existe un supervisor con este ID de empleado',
        );
      }
    }

    const updateData: Partial<Supervisor> = {};
    if (updateSupervisorDto.fullName)
      updateData.fullName = updateSupervisorDto.fullName;
    if (updateSupervisorDto.employeeId)
      updateData.employeeId = updateSupervisorDto.employeeId;
    if (updateSupervisorDto.areaId)
      updateData.areaId = updateSupervisorDto.areaId;
    if (updateSupervisorDto.isActive !== undefined)
      updateData.isActive = updateSupervisorDto.isActive;

    if (Object.keys(updateData).length > 0) {
      await this.supervisorRepository.update(supervisorId, updateData);
    }

    const updatedSupervisor = await this.supervisorRepository.findOne({
      where: { id: supervisorId },
      relations: ['area'],
    });

    return this.mapSupervisorToResponse(updatedSupervisor!);
  }

  // ==================== ROSE VARIETY MANAGEMENT (ADM-12, ADM-13, ADM-14, ADM-21) ====================

  /**
   * Crea una nueva variedad de rosa (ADM-12)
   * Solo administradores pueden crear variedades
   */
  async createRoseVariety(
    createRoseVarietyDto: CreateRoseVarietyDto,
    adminUserId: string,
  ): Promise<RoseVarietyResponseDto> {
    // Verificar permisos de administrador (ADM-22)
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageVarieties',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para crear variedades de rosa',
      );
    }

    // Validar código único (ADM-14, ADM-21)
    const existingVariety = await this.roseVarietyRepository.findOne({
      where: { code: createRoseVarietyDto.code },
    });

    if (existingVariety) {
      throw new ConflictException(
        'Ya existe una variedad de rosa con este código',
      );
    }

    // Validar que stemLengthMax >= stemLengthMin si ambos están definidos
    if (
      createRoseVarietyDto.stemLengthMin &&
      createRoseVarietyDto.stemLengthMax
    ) {
      if (
        createRoseVarietyDto.stemLengthMax < createRoseVarietyDto.stemLengthMin
      ) {
        throw new ConflictException(
          'La longitud máxima del tallo no puede ser menor que la mínima',
        );
      }
    }

    const roseVariety = this.roseVarietyRepository.create({
      ...createRoseVarietyDto,
      isActive: true,
    });

    const savedVariety = await this.roseVarietyRepository.save(roseVariety);

    return this.mapRoseVarietyToResponse(savedVariety);
  }

  /**
   * Obtiene todas las variedades de rosa para asignación en evaluaciones (ADM-13)
   * Todos los roles pueden consultar variedades
   */
  async getAllRoseVarieties(
    includeInactive: boolean = false,
  ): Promise<RoseVarietyResponseDto[]> {
    const queryBuilder = this.roseVarietyRepository
      .createQueryBuilder('variety')
      .leftJoinAndSelect(
        'variety.operators',
        'operators',
        'operators.status = :operatorStatus',
        { operatorStatus: OperatorStatus.ACTIVO },
      )
      .orderBy('variety.name', 'ASC');

    if (!includeInactive) {
      queryBuilder.where('variety.isActive = :isActive', { isActive: true });
    }

    const varieties = await queryBuilder.getMany();

    return varieties.map((variety) => this.mapRoseVarietyToResponse(variety));
  }

  /**
   * Obtiene una variedad de rosa por ID
   */
  async getRoseVarietyById(varietyId: number): Promise<RoseVarietyResponseDto> {
    const variety = await this.roseVarietyRepository.findOne({
      where: { id: varietyId },
      relations: ['operators'],
    });

    if (!variety) {
      throw new NotFoundException('Variedad de rosa no encontrada');
    }

    return this.mapRoseVarietyToResponse(variety);
  }

  /**
   * Busca variedades de rosa por código o nombre
   */
  async searchRoseVarieties(
    searchTerm: string,
  ): Promise<RoseVarietyResponseDto[]> {
    const varieties = await this.roseVarietyRepository
      .createQueryBuilder('variety')
      .leftJoinAndSelect(
        'variety.operators',
        'operators',
        'operators.status = :operatorStatus',
        { operatorStatus: OperatorStatus.ACTIVO },
      )
      .where('variety.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(variety.code) LIKE LOWER(:searchTerm) OR LOWER(variety.name) LIKE LOWER(:searchTerm))',
        {
          searchTerm: `%${searchTerm}%`,
        },
      )
      .orderBy('variety.name', 'ASC')
      .getMany();

    return varieties.map((variety) => this.mapRoseVarietyToResponse(variety));
  }

  /**
   * Actualiza una variedad de rosa existente (ADM-12)
   * Solo administradores pueden actualizar variedades
   */
  async updateRoseVariety(
    varietyId: number,
    updateRoseVarietyDto: UpdateRoseVarietyDto,
    adminUserId: string,
  ): Promise<RoseVarietyResponseDto> {
    // Verificar permisos de administrador (ADM-22)
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageVarieties',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar variedades de rosa',
      );
    }

    const variety = await this.roseVarietyRepository.findOne({
      where: { id: varietyId },
      relations: ['operators'],
    });

    if (!variety) {
      throw new NotFoundException('Variedad de rosa no encontrada');
    }

    // Validar código único si se está actualizando (ADM-14, ADM-21)
    if (
      updateRoseVarietyDto.code &&
      updateRoseVarietyDto.code !== variety.code
    ) {
      const existingVariety = await this.roseVarietyRepository.findOne({
        where: { code: updateRoseVarietyDto.code },
      });

      if (existingVariety) {
        throw new ConflictException(
          'Ya existe una variedad de rosa con este código',
        );
      }
    }

    // Validar que stemLengthMax >= stemLengthMin si ambos están definidos
    const newMinLength =
      updateRoseVarietyDto.stemLengthMin ?? variety.stemLengthMin;
    const newMaxLength =
      updateRoseVarietyDto.stemLengthMax ?? variety.stemLengthMax;

    if (newMinLength && newMaxLength && newMaxLength < newMinLength) {
      throw new ConflictException(
        'La longitud máxima del tallo no puede ser menor que la mínima',
      );
    }

    const updateData: Partial<RoseVariety> = {};
    if (updateRoseVarietyDto.code) updateData.code = updateRoseVarietyDto.code;
    if (updateRoseVarietyDto.name) updateData.name = updateRoseVarietyDto.name;
    if (updateRoseVarietyDto.description !== undefined)
      updateData.description = updateRoseVarietyDto.description;
    if (updateRoseVarietyDto.color !== undefined)
      updateData.color = updateRoseVarietyDto.color;
    if (updateRoseVarietyDto.stemLengthMin !== undefined)
      updateData.stemLengthMin = updateRoseVarietyDto.stemLengthMin;
    if (updateRoseVarietyDto.stemLengthMax !== undefined)
      updateData.stemLengthMax = updateRoseVarietyDto.stemLengthMax;
    if (updateRoseVarietyDto.isActive !== undefined)
      updateData.isActive = updateRoseVarietyDto.isActive;

    if (Object.keys(updateData).length > 0) {
      await this.roseVarietyRepository.update(varietyId, updateData);
    }

    const updatedVariety = await this.roseVarietyRepository.findOne({
      where: { id: varietyId },
      relations: ['operators'],
    });

    return this.mapRoseVarietyToResponse(updatedVariety!);
  }

  /**
   * Desactiva una variedad de rosa
   * Solo administradores pueden desactivar variedades
   */
  async deactivateRoseVariety(
    varietyId: number,
    adminUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verificar permisos de administrador (ADM-22)
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageVarieties',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para desactivar variedades de rosa',
      );
    }

    const variety = await this.roseVarietyRepository.findOne({
      where: { id: varietyId },
      relations: ['operators'],
    });

    if (!variety) {
      throw new NotFoundException('Variedad de rosa no encontrada');
    }

    if (!variety.isActive) {
      throw new ConflictException('La variedad de rosa ya está desactivada');
    }

    // Verificar si hay operarios activos asignados a esta variedad
    const activeOperators =
      variety.operators?.filter((op) => op.status === OperatorStatus.ACTIVO) ||
      [];
    if (activeOperators.length > 0) {
      throw new ConflictException(
        `No se puede desactivar la variedad porque tiene ${activeOperators.length} operario(s) activo(s) asignado(s)`,
      );
    }

    variety.isActive = false;
    await this.roseVarietyRepository.save(variety);

    return {
      success: true,
      message: `Variedad de rosa ${variety.name} desactivada exitosamente`,
    };
  }

  /**
   * Reactiva una variedad de rosa
   * Solo administradores pueden reactivar variedades
   */
  async reactivateRoseVariety(
    varietyId: number,
    adminUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verificar permisos de administrador (ADM-22)
    const hasPermission = await this.authService.validateUserPermissions(
      adminUserId,
      'canManageVarieties',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para reactivar variedades de rosa',
      );
    }

    const variety = await this.roseVarietyRepository.findOne({
      where: { id: varietyId },
    });

    if (!variety) {
      throw new NotFoundException('Variedad de rosa no encontrada');
    }

    if (variety.isActive) {
      throw new ConflictException('La variedad de rosa ya está activa');
    }

    variety.isActive = true;
    await this.roseVarietyRepository.save(variety);

    return {
      success: true,
      message: `Variedad de rosa ${variety.name} reactivada exitosamente`,
    };
  }

  /**
   * Valida si un código de variedad es único en el sistema (ADM-14, ADM-21)
   */
  async validateRoseVarietyCodeUniqueness(
    code: string,
    excludeVarietyId?: number,
  ): Promise<{ isUnique: boolean }> {
    const queryBuilder = this.roseVarietyRepository
      .createQueryBuilder('variety')
      .where('variety.code = :code', { code });

    if (excludeVarietyId) {
      queryBuilder.andWhere('variety.id != :excludeVarietyId', {
        excludeVarietyId,
      });
    }

    const existingVariety = await queryBuilder.getOne();

    return { isUnique: !existingVariety };
  }

  /**
   * Obtiene estadísticas de variedades de rosa
   * Solo administradores pueden ver estadísticas completas
   */
  async getRoseVarietyStatistics(requestingUserId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    withOperators: number;
    withoutOperators: number;
    averageOperatorsPerVariety: number;
  }> {
    const hasPermission = await this.authService.validateUserPermissions(
      requestingUserId,
      'canManageVarieties',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para ver estadísticas de variedades',
      );
    }

    const [total, active, withOperators] = await Promise.all([
      this.roseVarietyRepository.count(),
      this.roseVarietyRepository.count({ where: { isActive: true } }),
      this.roseVarietyRepository
        .createQueryBuilder('variety')
        .leftJoin(
          'variety.operators',
          'operators',
          'operators.status = :operatorStatus',
          { operatorStatus: OperatorStatus.ACTIVO },
        )
        .where('variety.isActive = :isActive', { isActive: true })
        .andWhere('operators.id IS NOT NULL')
        .getCount(),
    ]);

    const varietiesWithOperatorCounts = await this.roseVarietyRepository
      .createQueryBuilder('variety')
      .leftJoin(
        'variety.operators',
        'operators',
        'operators.status = :operatorStatus',
        { operatorStatus: OperatorStatus.ACTIVO },
      )
      .select('variety.id', 'varietyId')
      .addSelect('COUNT(operators.id)', 'operatorCount')
      .where('variety.isActive = :isActive', { isActive: true })
      .groupBy('variety.id')
      .getRawMany();

    const totalOperators = varietiesWithOperatorCounts.reduce(
      (sum, item) => sum + parseInt(item.operatorCount),
      0,
    );
    const averageOperatorsPerVariety = active > 0 ? totalOperators / active : 0;

    return {
      total,
      active,
      inactive: total - active,
      withOperators,
      withoutOperators: active - withOperators,
      averageOperatorsPerVariety:
        Math.round(averageOperatorsPerVariety * 100) / 100,
    };
  }

  // ==================== HELPER METHODS ====================

  private mapParameterToResponse(
    parameter: EvaluationParameter,
    subprocess?: Subprocess,
  ): ParameterResponseDto {
    const subprocessData = subprocess || parameter.subprocess;
    return {
      id: parameter.id,
      subprocessId: parameter.subprocessId,
      code: parameter.code,
      name: parameter.name,
      description: parameter.description,
      weightPercentage: parameter.weightPercentage,
      version: parameter.version,
      effectiveFrom: parameter.effectiveFrom,
      effectiveTo: parameter.effectiveTo,
      isActive: parameter.isActive,
      createdAt: parameter.createdAt,
      updatedAt: parameter.updatedAt,
      subprocess: subprocessData
        ? {
            id: subprocessData.id,
            code: subprocessData.code,
            name: subprocessData.name,
            module: subprocessData.module
              ? {
                  id: subprocessData.module.id,
                  code: subprocessData.module.code,
                  name: subprocessData.module.name,
                }
              : undefined,
          }
        : undefined,
    };
  }

  private mapSubprocessToResponse(
    subprocess: Subprocess,
  ): SubprocessResponseDto {
    return {
      id: subprocess.id,
      moduleId: subprocess.moduleId,
      code: subprocess.code,
      name: subprocess.name,
      description: subprocess.description,
      orderIndex: subprocess.orderIndex,
      isActive: subprocess.isActive,
      createdAt: subprocess.createdAt,
      updatedAt: subprocess.updatedAt,
      module: subprocess.module
        ? {
            id: subprocess.module.id,
            code: subprocess.module.code,
            name: subprocess.module.name,
          }
        : undefined,
      parameters: subprocess.parameters
        ? subprocess.parameters.map((param) =>
            this.mapParameterToResponse(param),
          )
        : undefined,
    };
  }

  private mapSupervisorToResponse(
    supervisor: Supervisor,
  ): SupervisorResponseDto {
    return {
      id: supervisor.id,
      fullName: supervisor.fullName,
      employeeId: supervisor.employeeId,
      areaId: supervisor.areaId,
      isActive: supervisor.isActive,
      createdAt: supervisor.createdAt,
      updatedAt: supervisor.updatedAt,
      area: supervisor.area
        ? {
            id: supervisor.area.id,
            code: supervisor.area.code,
            name: supervisor.area.name,
          }
        : undefined,
    };
  }

  private mapRoseVarietyToResponse(
    variety: RoseVariety,
  ): RoseVarietyResponseDto {
    const activeOperators =
      variety.operators?.filter((op) => op.status === OperatorStatus.ACTIVO) ||
      [];

    return {
      id: variety.id,
      code: variety.code,
      name: variety.name,
      description: variety.description,
      color: variety.color,
      stemLengthMin: variety.stemLengthMin,
      stemLengthMax: variety.stemLengthMax,
      isActive: variety.isActive,
      createdAt: variety.createdAt,
      updatedAt: variety.updatedAt,
      operatorCount: activeOperators.length,
    };
  }
}
