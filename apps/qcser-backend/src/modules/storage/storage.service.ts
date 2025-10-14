import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  url?: string;
  publicUrl?: string;
}

@Injectable()
export class StorageService {
  private supabase: SupabaseClient | null;
  private localStoragePath: string;

  constructor(private configService: ConfigService) {
    // Solo crear cliente Supabase si las variables están configuradas
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co') {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.log('Supabase not configured, using local storage only');
      this.supabase = null;
    }
    
    this.localStoragePath = path.join(process.cwd(), 'storage');
    
    // Crear directorios de almacenamiento local si no existen
    this.ensureDirectoryExists(this.localStoragePath);
    this.ensureDirectoryExists(path.join(this.localStoragePath, 'photos'));
    this.ensureDirectoryExists(path.join(this.localStoragePath, 'reports'));
    this.ensureDirectoryExists(path.join(this.localStoragePath, 'temp'));
  }

  /**
   * Subir archivo a Supabase Storage
   */
  async uploadToSupabase(
    file: Express.Multer.File,
    bucket: string = 'qcser-files',
    folder: string = 'photos',
  ): Promise<UploadResult> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase no está configurado');
    }

    try {
      const fileName = this.generateFileName(file.originalname);
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          duplex: 'half',
        });

      if (error) {
        throw new BadRequestException(`Error subiendo archivo: ${error.message}`);
      }

      // Obtener URL pública
      const { data: publicUrlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        fileName,
        filePath: data.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        url: data.path,
        publicUrl: publicUrlData.publicUrl,
      };
    } catch (error) {
      throw new BadRequestException(`Error subiendo archivo: ${error.message}`);
    }
  }

  /**
   * Guardar archivo localmente
   */
  async saveLocally(
    file: Express.Multer.File,
    folder: string = 'photos',
  ): Promise<UploadResult> {
    try {
      const fileName = this.generateFileName(file.originalname);
      const folderPath = path.join(this.localStoragePath, folder);
      const filePath = path.join(folderPath, fileName);

      this.ensureDirectoryExists(folderPath);

      // Guardar archivo
      fs.writeFileSync(filePath, file.buffer);

      return {
        fileName,
        filePath: path.relative(process.cwd(), filePath),
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException(`Error guardando archivo localmente: ${error.message}`);
    }
  }

  /**
   * Subir archivo con fallback (intenta Supabase, si falla usa almacenamiento local)
   */
  async uploadWithFallback(
    file: Express.Multer.File,
    folder: string = 'photos',
  ): Promise<UploadResult> {
    try {
      // Intentar subir a Supabase primero
      return await this.uploadToSupabase(file, 'qcser-files', folder);
    } catch (error) {
      console.warn('Supabase upload failed, falling back to local storage:', error.message);
      // Si falla, usar almacenamiento local
      return await this.saveLocally(file, folder);
    }
  }

  /**
   * Eliminar archivo de Supabase
   */
  async deleteFromSupabase(
    filePath: string,
    bucket: string = 'qcser-files',
  ): Promise<void> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase no está configurado');
    }

    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new BadRequestException(`Error eliminando archivo: ${error.message}`);
      }
    } catch (error) {
      throw new BadRequestException(`Error eliminando archivo: ${error.message}`);
    }
  }

  /**
   * Eliminar archivo local
   */
  async deleteLocally(filePath: string): Promise<void> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      throw new BadRequestException(`Error eliminando archivo local: ${error.message}`);
    }
  }

  /**
   * Obtener archivo local
   */
  async getLocalFile(filePath: string): Promise<Buffer> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundException('Archivo no encontrado');
      }

      return fs.readFileSync(fullPath);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error leyendo archivo: ${error.message}`);
    }
  }

  /**
   * Sincronizar archivos locales con Supabase
   */
  async syncLocalFilesToSupabase(folder: string = 'photos'): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const folderPath = path.join(this.localStoragePath, folder);
    const results: { synced: number; failed: number; errors: string[] } = { synced: 0, failed: 0, errors: [] };

    if (!fs.existsSync(folderPath)) {
      return results;
    }

    const files = fs.readdirSync(folderPath);

    for (const fileName of files) {
      try {
        const filePath = path.join(folderPath, fileName);
        const fileBuffer = fs.readFileSync(filePath);
        const stats = fs.statSync(filePath);

        // Crear objeto similar a Multer.File
        const file = {
          originalname: fileName,
          buffer: fileBuffer,
          size: stats.size,
          mimetype: this.getMimeType(fileName),
        } as Express.Multer.File;

        await this.uploadToSupabase(file, 'qcser-files', folder);
        
        // Opcional: eliminar archivo local después de sincronizar
        // fs.unlinkSync(filePath);
        
        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${fileName}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Validar archivo
   */
  validateFile(file: Express.Multer.File, options?: {
    maxSize?: number;
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
  }): void {
    const defaultOptions = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    };

    const config = { ...defaultOptions, ...options };

    // Validar tamaño
    if (file.size > config.maxSize) {
      throw new BadRequestException(`Archivo demasiado grande. Máximo: ${config.maxSize / 1024 / 1024}MB`);
    }

    // Validar tipo MIME
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de archivo no permitido. Permitidos: ${config.allowedMimeTypes.join(', ')}`);
    }

    // Validar extensión
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
      throw new BadRequestException(`Extensión no permitida. Permitidas: ${config.allowedExtensions.join(', ')}`);
    }
  }

  /**
   * Generar nombre único para archivo
   */
  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}${ext}`;
  }

  /**
   * Asegurar que el directorio existe
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Obtener tipo MIME basado en extensión
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Obtener información de almacenamiento
   */
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
    const localInfo = this.getLocalStorageInfo();
    
    let supabaseInfo;
    try {
      if (this.supabase) {
        const { data: buckets } = await this.supabase.storage.listBuckets();
        supabaseInfo = {
          available: true,
          buckets: buckets?.map(b => b.name) || [],
        };
      } else {
        supabaseInfo = {
          available: false,
          buckets: [],
        };
      }
    } catch (error) {
      supabaseInfo = {
        available: false,
        buckets: [],
      };
    }

    return {
      local: localInfo,
      supabase: supabaseInfo,
    };
  }

  /**
   * Obtener información de almacenamiento local
   */
  private getLocalStorageInfo(): {
    totalFiles: number;
    totalSize: number;
    folders: Record<string, { files: number; size: number }>;
  } {
    const info = {
      totalFiles: 0,
      totalSize: 0,
      folders: {} as Record<string, { files: number; size: number }>,
    };

    const folders = ['photos', 'reports', 'temp'];

    for (const folder of folders) {
      const folderPath = path.join(this.localStoragePath, folder);
      const folderInfo = { files: 0, size: 0 };

      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        folderInfo.files = files.length;

        for (const file of files) {
          const filePath = path.join(folderPath, file);
          const stats = fs.statSync(filePath);
          folderInfo.size += stats.size;
        }
      }

      info.folders[folder] = folderInfo;
      info.totalFiles += folderInfo.files;
      info.totalSize += folderInfo.size;
    }

    return info;
  }
}