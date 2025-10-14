import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService, SyncData, SyncResult } from './sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export class SyncDataDto {
  evaluations: any[];
  evaluationDetails: any[];
  evaluationPhotos: any[];
}

export class ConflictResolutionDto {
  conflicts: any[];
}

@ApiTags('Sincronización')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Sincronizar datos offline con el servidor' })
  @ApiResponse({ status: 200, description: 'Datos sincronizados exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en los datos de sincronización' })
  async syncOfflineData(
    @Body() syncData: SyncDataDto,
    @Request() req: any,
  ): Promise<SyncResult> {
    try {
      const userId = req.user.sub;
      return await this.syncService.syncOfflineData(syncData as SyncData, userId);
    } catch (error) {
      throw new HttpException(
        `Error during sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pending')
  @ApiOperation({ summary: 'Obtener datos pendientes de sincronización' })
  @ApiResponse({ status: 200, description: 'Datos pendientes obtenidos exitosamente' })
  async getPendingSyncData(@Request() req: any): Promise<SyncData> {
    try {
      const userId = req.user.sub;
      return await this.syncService.getPendingSyncData(userId);
    } catch (error) {
      throw new HttpException(
        `Error getting pending sync data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Obtener estado de sincronización del usuario' })
  @ApiResponse({ status: 200, description: 'Estado de sincronización obtenido exitosamente' })
  async getSyncStatus(@Request() req: any): Promise<{
    pendingCount: number;
    lastSyncDate: Date | null;
    errorCount: number;
  }> {
    try {
      const userId = req.user.sub;
      return await this.syncService.getSyncStatus(userId);
    } catch (error) {
      throw new HttpException(
        `Error getting sync status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('resolve-conflicts')
  @ApiOperation({ summary: 'Resolver conflictos de sincronización' })
  @ApiResponse({ status: 200, description: 'Conflictos resueltos exitosamente' })
  @ApiResponse({ status: 400, description: 'Error resolviendo conflictos' })
  async resolveConflicts(
    @Body() conflictData: ConflictResolutionDto,
    @Request() req: any,
  ): Promise<SyncResult> {
    try {
      const userId = req.user.sub;
      return await this.syncService.resolveConflicts(conflictData.conflicts, userId);
    } catch (error) {
      throw new HttpException(
        `Error resolving conflicts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('mark-synced')
  @ApiOperation({ summary: 'Marcar evaluaciones como sincronizadas' })
  @ApiResponse({ status: 200, description: 'Evaluaciones marcadas como sincronizadas' })
  async markAsSynced(
    @Body() data: { evaluationIds: number[] },
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    try {
      await this.syncService.markAsSynced(data.evaluationIds);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        `Error marking as synced: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('force-sync')
  @ApiOperation({ summary: 'Forzar sincronización inmediata para el usuario' })
  @ApiResponse({ status: 200, description: 'Sincronización forzada completada' })
  @ApiResponse({ status: 503, description: 'Sin conectividad disponible' })
  async forceSync(@Request() req: any): Promise<any> {
    try {
      const userId = req.user.sub;
      const result = await this.syncService.forceSyncForUser(userId);
      return {
        success: true,
        result,
      };
    } catch (error) {
      if (error.message.includes('no connectivity')) {
        throw new HttpException(
          error.message,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        `Error forcing sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('connectivity')
  @ApiOperation({ summary: 'Obtener estado de conectividad del sistema' })
  @ApiResponse({ status: 200, description: 'Estado de conectividad obtenido exitosamente' })
  async getConnectivityStatus(): Promise<any> {
    try {
      const status = this.syncService.getConnectivityStatus();
      const currentCheck = await this.syncService.checkConnectivity();
      
      return {
        ...status,
        currentStatus: currentCheck ? 'online' : 'offline',
      };
    } catch (error) {
      throw new HttpException(
        `Error getting connectivity status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate-integrity')
  @ApiOperation({ summary: 'Validar integridad de datos del usuario' })
  @ApiResponse({ status: 200, description: 'Validación de integridad completada' })
  async validateDataIntegrity(@Request() req: any): Promise<any> {
    try {
      const userId = req.user.sub;
      const result = await this.syncService.validateDataIntegrity(userId);
      return result;
    } catch (error) {
      throw new HttpException(
        `Error validating data integrity: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}