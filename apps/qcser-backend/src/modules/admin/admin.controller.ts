import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { AdminService } from './admin.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserStatisticsDto,
  AvailableRolesDto,
  EmailValidationDto,
  EmailValidationResponseDto,
  OperationResponseDto,
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
  RoseVarietyValidationDto,
  RoseVarietyValidationResponseDto,
} from './dto/admin.dto';

@ApiTags('Administración')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Crear nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema. Solo administradores pueden crear usuarios. (ADM-01)'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuario creado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El email ya está registrado en el sistema',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para crear usuarios',
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    return await this.adminService.createUser(createUserDto, req.user.sub);
  }

  @Get('users')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener lista de usuarios',
    description: 'Obtiene la lista de usuarios del sistema. Administradores ven todos, otros roles solo usuarios activos. (ADM-03)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de usuarios obtenida exitosamente',
    type: [UserResponseDto],
  })
  async getAllUsers(@Request() req: any): Promise<UserResponseDto[]> {
    return await this.adminService.getAllUsers(req.user.sub);
  }

  @Get('users/search')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Buscar usuarios',
    description: 'Busca usuarios por email o nombre'
  })
  @ApiQuery({
    name: 'q',
    description: 'Término de búsqueda (email o nombre)',
    example: 'juan',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultados de búsqueda obtenidos exitosamente',
    type: [UserResponseDto],
  })
  async searchUsers(
    @Query('q') searchTerm: string,
    @Request() req: any,
  ): Promise<UserResponseDto[]> {
    return await this.adminService.searchUsers(searchTerm, req.user.sub);
  }

  @Get('users/statistics')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Obtener estadísticas de usuarios',
    description: 'Obtiene estadísticas generales de usuarios del sistema. Solo administradores.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
    type: UserStatisticsDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para ver estadísticas',
  })
  async getUserStatistics(@Request() req: any): Promise<UserStatisticsDto> {
    return await this.adminService.getUserStatistics(req.user.sub);
  }

  @Get('users/roles')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener roles disponibles',
    description: 'Obtiene la lista de roles disponibles en el sistema con sus descripciones. (ADM-02)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roles disponibles obtenidos exitosamente',
    type: AvailableRolesDto,
  })
  getAvailableRoles(): AvailableRolesDto {
    return this.adminService.getAvailableRoles();
  }

  @Post('users/validate-email')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Validar unicidad de email',
    description: 'Valida si un email es único en el sistema. (ADM-14, ADM-21)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validación completada',
    type: EmailValidationResponseDto,
  })
  async validateEmailUniqueness(
    @Body() emailValidationDto: EmailValidationDto,
  ): Promise<EmailValidationResponseDto> {
    return await this.adminService.validateEmailUniqueness(emailValidationDto.email);
  }

  @Get('users/:id')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener usuario por ID',
    description: 'Obtiene los detalles de un usuario específico por su ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario obtenido exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado',
  })
  async getUserById(
    @Param('id') userId: string,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    return await this.adminService.getUserById(userId, req.user.sub);
  }

  @Put('users/:id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Actualizar usuario',
    description: 'Actualiza los datos de un usuario existente. Solo administradores pueden actualizar usuarios. (ADM-04)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El email ya está registrado por otro usuario',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para actualizar usuarios',
  })
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    return await this.adminService.updateUser(userId, updateUserDto, req.user.sub);
  }

  @Patch('users/:id/deactivate')
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Desactivar usuario',
    description: 'Desactiva un usuario del sistema. Solo administradores pueden desactivar usuarios. (ADM-05)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a desactivar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario desactivado exitosamente',
    type: OperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El usuario ya está desactivado o no puedes desactivar tu propia cuenta',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para desactivar usuarios',
  })
  async deactivateUser(
    @Param('id') userId: string,
    @Request() req: any,
  ): Promise<OperationResponseDto> {
    return await this.adminService.deactivateUser(userId, req.user.sub);
  }

  @Patch('users/:id/reactivate')
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reactivar usuario',
    description: 'Reactiva un usuario previamente desactivado. Solo administradores pueden reactivar usuarios.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a reactivar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario reactivado exitosamente',
    type: OperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El usuario ya está activo',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para reactivar usuarios',
  })
  async reactivateUser(
    @Param('id') userId: string,
    @Request() req: any,
  ): Promise<OperationResponseDto> {
    return await this.adminService.reactivateUser(userId, req.user.sub);
  }

  // ==================== PARAMETER MANAGEMENT ENDPOINTS ====================

  @Post('parameters')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Crear parámetro de evaluación',
    description: 'Crea un nuevo parámetro de evaluación para un subproceso. Solo administradores pueden crear parámetros. (ADM-10)'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parámetro creado exitosamente',
    type: ParameterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un parámetro activo con este código en el subproceso',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para crear parámetros',
  })
  async createParameter(
    @Body() createParameterDto: CreateParameterDto,
    @Request() req: any,
  ): Promise<ParameterResponseDto> {
    return await this.adminService.createParameter(createParameterDto, req.user.sub);
  }

  @Get('parameters')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener parámetros de evaluación',
    description: 'Obtiene parámetros organizados por módulo y subproceso. (ADM-11)'
  })
  @ApiQuery({
    name: 'moduleId',
    description: 'ID del módulo para filtrar parámetros',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'subprocessId',
    description: 'ID del subproceso para filtrar parámetros',
    required: false,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parámetros obtenidos exitosamente',
    type: [ParameterResponseDto],
  })
  async getParameters(
    @Query('moduleId') moduleId?: number,
    @Query('subprocessId') subprocessId?: number,
    @Request() req?: any,
  ): Promise<ParameterResponseDto[]> {
    return await this.adminService.getParametersByModule(moduleId, subprocessId, req?.user?.sub);
  }

  @Get('parameters/:id')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener parámetro por ID',
    description: 'Obtiene los detalles de un parámetro específico por su ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del parámetro',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parámetro obtenido exitosamente',
    type: ParameterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parámetro no encontrado',
  })
  async getParameterById(
    @Param('id') parameterId: number,
    @Request() req: any,
  ): Promise<ParameterResponseDto> {
    return await this.adminService.getParameterById(parameterId, req.user.sub);
  }

  @Put('parameters/:id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Actualizar parámetro de evaluación',
    description: 'Actualiza un parámetro existente. Si se cambia el peso, se crea una nueva versión para trazabilidad. Solo administradores pueden actualizar parámetros. (ADM-17)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del parámetro a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parámetro actualizado exitosamente',
    type: ParameterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parámetro no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para actualizar parámetros',
  })
  async updateParameter(
    @Param('id') parameterId: number,
    @Body() updateParameterDto: UpdateParameterDto,
    @Request() req: any,
  ): Promise<ParameterResponseDto> {
    return await this.adminService.updateParameter(parameterId, updateParameterDto, req.user.sub);
  }

  @Patch('parameters/:id/deactivate')
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Desactivar parámetro de evaluación',
    description: 'Desactiva un parámetro del sistema. Solo administradores pueden desactivar parámetros.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del parámetro a desactivar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parámetro desactivado exitosamente',
    type: OperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parámetro no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El parámetro ya está desactivado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para desactivar parámetros',
  })
  async deactivateParameter(
    @Param('id') parameterId: number,
    @Request() req: any,
  ): Promise<OperationResponseDto> {
    return await this.adminService.deactivateParameter(parameterId, req.user.sub);
  }

  @Get('parameters/:subprocessId/:code/versions')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener historial de versiones de parámetro',
    description: 'Obtiene todas las versiones de un parámetro para trazabilidad histórica. (ADM-17)'
  })
  @ApiParam({
    name: 'subprocessId',
    description: 'ID del subproceso',
    example: 1,
  })
  @ApiParam({
    name: 'code',
    description: 'Código del parámetro',
    example: 'PARAM_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de versiones obtenido exitosamente',
    type: [ParameterResponseDto],
  })
  async getParameterVersionHistory(
    @Param('subprocessId') subprocessId: number,
    @Param('code') code: string,
    @Request() req: any,
  ): Promise<ParameterResponseDto[]> {
    return await this.adminService.getParameterVersionHistory(subprocessId, code, req.user.sub);
  }

  // ==================== SUBPROCESS MANAGEMENT ENDPOINTS ====================

  @Post('subprocesses')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Crear subproceso',
    description: 'Crea un nuevo subproceso para un módulo. Solo administradores pueden crear subprocesos. (ADM-18)'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subproceso creado exitosamente',
    type: SubprocessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un subproceso con este código en el módulo',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para crear subprocesos',
  })
  async createSubprocess(
    @Body() createSubprocessDto: CreateSubprocessDto,
    @Request() req: any,
  ): Promise<SubprocessResponseDto> {
    return await this.adminService.createSubprocess(createSubprocessDto, req.user.sub);
  }

  @Get('subprocesses')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener subprocesos',
    description: 'Obtiene subprocesos organizados por módulo. (ADM-18)'
  })
  @ApiQuery({
    name: 'moduleId',
    description: 'ID del módulo para filtrar subprocesos',
    required: false,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subprocesos obtenidos exitosamente',
    type: [SubprocessResponseDto],
  })
  async getSubprocesses(
    @Query('moduleId') moduleId?: number,
  ): Promise<SubprocessResponseDto[]> {
    return await this.adminService.getSubprocessesByModule(moduleId);
  }

  @Put('subprocesses/:id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Actualizar subproceso',
    description: 'Actualiza un subproceso existente. Solo administradores pueden actualizar subprocesos. (ADM-18)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del subproceso a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subproceso actualizado exitosamente',
    type: SubprocessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subproceso no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para actualizar subprocesos',
  })
  async updateSubprocess(
    @Param('id') subprocessId: number,
    @Body() updateSubprocessDto: UpdateSubprocessDto,
    @Request() req: any,
  ): Promise<SubprocessResponseDto> {
    return await this.adminService.updateSubprocess(subprocessId, updateSubprocessDto, req.user.sub);
  }

  // ==================== SUPERVISOR MANAGEMENT ENDPOINTS ====================

  @Post('supervisors')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Crear supervisor',
    description: 'Crea un nuevo supervisor asignado a un área. Solo administradores pueden crear supervisores. (ADM-19)'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Supervisor creado exitosamente',
    type: SupervisorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un supervisor con este ID de empleado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para crear supervisores',
  })
  async createSupervisor(
    @Body() createSupervisorDto: CreateSupervisorDto,
    @Request() req: any,
  ): Promise<SupervisorResponseDto> {
    return await this.adminService.createSupervisor(createSupervisorDto, req.user.sub);
  }

  @Get('supervisors')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener supervisores',
    description: 'Obtiene supervisores organizados por área. (ADM-19)'
  })
  @ApiQuery({
    name: 'areaId',
    description: 'ID del área para filtrar supervisores',
    required: false,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supervisores obtenidos exitosamente',
    type: [SupervisorResponseDto],
  })
  async getSupervisors(
    @Query('areaId') areaId?: number,
  ): Promise<SupervisorResponseDto[]> {
    return await this.adminService.getSupervisorsByArea(areaId);
  }

  @Put('supervisors/:id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Actualizar supervisor',
    description: 'Actualiza un supervisor existente. Solo administradores pueden actualizar supervisores. (ADM-19)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del supervisor a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supervisor actualizado exitosamente',
    type: SupervisorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supervisor no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un supervisor con este ID de empleado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para actualizar supervisores',
  })
  async updateSupervisor(
    @Param('id') supervisorId: number,
    @Body() updateSupervisorDto: UpdateSupervisorDto,
    @Request() req: any,
  ): Promise<SupervisorResponseDto> {
    return await this.adminService.updateSupervisor(supervisorId, updateSupervisorDto, req.user.sub);
  }

  // ==================== ROSE VARIETY MANAGEMENT ENDPOINTS ====================

  @Post('rose-varieties')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Crear variedad de rosa',
    description: 'Crea una nueva variedad de rosa para asignación a operarios. Solo administradores pueden crear variedades. (ADM-12)'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Variedad de rosa creada exitosamente',
    type: RoseVarietyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe una variedad de rosa con este código',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para crear variedades de rosa',
  })
  async createRoseVariety(
    @Body() createRoseVarietyDto: CreateRoseVarietyDto,
    @Request() req: any,
  ): Promise<RoseVarietyResponseDto> {
    return await this.adminService.createRoseVariety(createRoseVarietyDto, req.user.sub);
  }

  @Get('rose-varieties')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener variedades de rosa',
    description: 'Obtiene todas las variedades de rosa registradas para asignación en evaluaciones. (ADM-13)'
  })
  @ApiQuery({
    name: 'includeInactive',
    description: 'Incluir variedades inactivas en los resultados',
    required: false,
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variedades de rosa obtenidas exitosamente',
    type: [RoseVarietyResponseDto],
  })
  async getRoseVarieties(
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<RoseVarietyResponseDto[]> {
    return await this.adminService.getAllRoseVarieties(includeInactive === true);
  }

  @Get('rose-varieties/search')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Buscar variedades de rosa',
    description: 'Busca variedades de rosa por código o nombre'
  })
  @ApiQuery({
    name: 'q',
    description: 'Término de búsqueda (código o nombre)',
    example: 'freedom',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultados de búsqueda obtenidos exitosamente',
    type: [RoseVarietyResponseDto],
  })
  async searchRoseVarieties(
    @Query('q') searchTerm: string,
  ): Promise<RoseVarietyResponseDto[]> {
    return await this.adminService.searchRoseVarieties(searchTerm);
  }

  @Get('rose-varieties/statistics')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Obtener estadísticas de variedades de rosa',
    description: 'Obtiene estadísticas generales de variedades de rosa del sistema. Solo administradores.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para ver estadísticas',
  })
  async getRoseVarietyStatistics(@Request() req: any): Promise<{
    total: number;
    active: number;
    inactive: number;
    withOperators: number;
    withoutOperators: number;
    averageOperatorsPerVariety: number;
  }> {
    return await this.adminService.getRoseVarietyStatistics(req.user.sub);
  }

  @Post('rose-varieties/validate-code')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Validar unicidad de código de variedad',
    description: 'Valida si un código de variedad es único en el sistema. (ADM-14, ADM-21)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validación completada',
    type: RoseVarietyValidationResponseDto,
  })
  async validateRoseVarietyCodeUniqueness(
    @Body() roseVarietyValidationDto: RoseVarietyValidationDto,
  ): Promise<RoseVarietyValidationResponseDto> {
    return await this.adminService.validateRoseVarietyCodeUniqueness(roseVarietyValidationDto.code);
  }

  @Get('rose-varieties/:id')
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  @ApiOperation({ 
    summary: 'Obtener variedad de rosa por ID',
    description: 'Obtiene los detalles de una variedad de rosa específica por su ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la variedad de rosa',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variedad de rosa obtenida exitosamente',
    type: RoseVarietyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Variedad de rosa no encontrada',
  })
  async getRoseVarietyById(
    @Param('id') varietyId: number,
  ): Promise<RoseVarietyResponseDto> {
    return await this.adminService.getRoseVarietyById(varietyId);
  }

  @Put('rose-varieties/:id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Actualizar variedad de rosa',
    description: 'Actualiza una variedad de rosa existente. Solo administradores pueden actualizar variedades. (ADM-12)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la variedad de rosa a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variedad de rosa actualizada exitosamente',
    type: RoseVarietyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Variedad de rosa no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe una variedad de rosa con este código',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para actualizar variedades de rosa',
  })
  async updateRoseVariety(
    @Param('id') varietyId: number,
    @Body() updateRoseVarietyDto: UpdateRoseVarietyDto,
    @Request() req: any,
  ): Promise<RoseVarietyResponseDto> {
    return await this.adminService.updateRoseVariety(varietyId, updateRoseVarietyDto, req.user.sub);
  }

  @Patch('rose-varieties/:id/deactivate')
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Desactivar variedad de rosa',
    description: 'Desactiva una variedad de rosa del sistema. Solo administradores pueden desactivar variedades. (ADM-16)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la variedad de rosa a desactivar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variedad de rosa desactivada exitosamente',
    type: OperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Variedad de rosa no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'La variedad ya está desactivada o tiene operarios activos asignados',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para desactivar variedades de rosa',
  })
  async deactivateRoseVariety(
    @Param('id') varietyId: number,
    @Request() req: any,
  ): Promise<OperationResponseDto> {
    return await this.adminService.deactivateRoseVariety(varietyId, req.user.sub);
  }

  @Patch('rose-varieties/:id/reactivate')
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reactivar variedad de rosa',
    description: 'Reactiva una variedad de rosa previamente desactivada. Solo administradores pueden reactivar variedades. (ADM-16)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la variedad de rosa a reactivar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variedad de rosa reactivada exitosamente',
    type: OperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Variedad de rosa no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'La variedad ya está activa',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para reactivar variedades de rosa',
  })
  async reactivateRoseVariety(
    @Param('id') varietyId: number,
    @Request() req: any,
  ): Promise<OperationResponseDto> {
    return await this.adminService.reactivateRoseVariety(varietyId, req.user.sub);
  }
}