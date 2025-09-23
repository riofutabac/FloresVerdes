import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getUsuarios() {
    // TODO: Implementar lógica de usuarios
    return {
      message: 'Lista de usuarios - Pendiente implementación',
      data: []
    };
  }

  async getParametros() {
    // TODO: Implementar lógica de parámetros
    return {
      message: 'Parámetros del sistema - Pendiente implementación',
      data: {}
    };
  }
}