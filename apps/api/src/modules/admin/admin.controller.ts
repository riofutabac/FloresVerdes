import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('usuarios')
  @ApiOperation({ summary: 'Obtener lista de usuarios' })
  async getUsuarios() {
    return this.adminService.getUsuarios();
  }

  @Get('parametros')
  @ApiOperation({ summary: 'Obtener parámetros del sistema' })
  async getParametros() {
    return this.adminService.getParametros();
  }
}