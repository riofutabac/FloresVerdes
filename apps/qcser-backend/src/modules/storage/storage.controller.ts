import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { StorageService, UploadResult } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Almacenamiento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Subir archivo' })
  @ApiResponse({ status: 201, description: 'Archivo subido exitosamente' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Carpeta de destino (photos, reports, temp)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.JEFA_CALIDAD)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'photos',
  ): Promise<UploadResult> {
    try {
      if (!file) {
        throw new HttpException('No se proporcionó archivo', HttpStatus.BAD_REQUEST);
      }

      // Validar archivo
      this.storageService.validateFile(file);

      // Subir con fallback
      return await this.storageService.uploadWithFallback(file, folder);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error subiendo archivo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Subir múltiples archivos' })
  @ApiResponse({ status: 201, description: 'Archivos subidos exitosamente' })
  @ApiResponse({ status: 400, description: 'Archivos inválidos' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
  @Roles(UserRole.JEFA_CALIDAD)
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: string = 'photos',
  ): Promise<UploadResult[]> {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('No se proporcionaron archivos', HttpStatus.BAD_REQUEST);
      }

      const results: UploadResult[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          this.storageService.validateFile(file);
          const result = await this.storageService.uploadWithFallback(file, folder);
          results.push(result);
        } catch (error) {
          errors.push(`${file.originalname}: ${error.message}`);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        throw new HttpException(`Errores subiendo archivos: ${errors.join(', ')}`, HttpStatus.BAD_REQUEST);
      }

      return results;
    } catch (error) {
      throw new HttpException(
        error.message || 'Error subiendo archivos',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('file/:folder/:fileName')
  @ApiOperation({ summary: 'Obtener archivo' })
  @ApiResponse({ status: 200, description: 'Archivo obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD, UserRole.GERENTE_GENERAL)
  async getFile(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filePath = `storage/${folder}/${fileName}`;
      const fileBuffer = await this.storageService.getLocalFile(filePath);

      // Determinar tipo de contenido
      const mimeType = this.getMimeType(fileName);
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(fileBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo archivo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('file/:folder/:fileName')
  @ApiOperation({ summary: 'Eliminar archivo' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.JEFA_CALIDAD)
  async deleteFile(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
  ): Promise<{ success: boolean }> {
    try {
      const filePath = `storage/${folder}/${fileName}`;
      
      // Intentar eliminar de Supabase primero
      try {
        await this.storageService.deleteFromSupabase(`${folder}/${fileName}`);
      } catch (error) {
        console.warn('Could not delete from Supabase:', error.message);
      }

      // Eliminar archivo local
      await this.storageService.deleteLocally(filePath);

      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error eliminando archivo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar archivos locales con Supabase' })
  @ApiResponse({ status: 200, description: 'Sincronización completada' })
  @Roles(UserRole.ADMINISTRADOR)
  async syncFiles(@Query('folder') folder: string = 'photos'): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    try {
      return await this.storageService.syncLocalFilesToSupabase(folder);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error sincronizando archivos',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('info')
  @ApiOperation({ summary: 'Obtener información de almacenamiento' })
  @ApiResponse({ status: 200, description: 'Información obtenida exitosamente' })
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL)
  async getStorageInfo(): Promise<{
    local: {
      totalFiles: number;
      totalSize: number;
      folders: Record<string, { files: number; size: number }>;
    };
    supabase?: {
      available: boolean;
      buckets: string[];
    };
  }> {
    try {
      return await this.storageService.getStorageInfo();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error obteniendo información de almacenamiento',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validar configuración de almacenamiento' })
  @ApiResponse({ status: 200, description: 'Validación completada' })
  @Roles(UserRole.ADMINISTRADOR)
  async validateStorage(): Promise<{
    local: { available: boolean; writable: boolean };
    supabase: { available: boolean; configured: boolean };
  }> {
    try {
      const result = {
        local: { available: false, writable: false },
        supabase: { available: false, configured: false },
      };

      // Validar almacenamiento local
      try {
        const info = await this.storageService.getStorageInfo();
        result.local.available = true;
        result.local.writable = true; // Si llegamos aquí, es escribible
      } catch (error) {
        console.warn('Local storage validation failed:', error.message);
      }

      // Validar Supabase
      try {
        const info = await this.storageService.getStorageInfo();
        result.supabase.configured = true;
        result.supabase.available = info.supabase?.available || false;
      } catch (error) {
        console.warn('Supabase validation failed:', error.message);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Error validando almacenamiento',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener tipo MIME basado en extensión
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'json': 'application/json',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}