import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  required?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = {}) {
    // Default options
    this.options = {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      allowedExtensions: ['.jpg', '.jpeg', '.png'],
      required: false,
      ...options,
    };
  }

  transform(file: Express.Multer.File | Express.Multer.File[], metadata: ArgumentMetadata) {
    if (!file) {
      if (this.options.required) {
        throw new BadRequestException('Archivo requerido');
      }
      return file;
    }

    // Handle single file
    if (!Array.isArray(file)) {
      return this.validateSingleFile(file);
    }

    // Handle multiple files
    return file.map(f => this.validateSingleFile(f));
  }

  private validateSingleFile(file: Express.Multer.File): Express.Multer.File {
    // Check file size
    if (this.options.maxSize && file.size > this.options.maxSize) {
      throw new BadRequestException(
        `El archivo ${file.originalname} es demasiado grande. Tamaño máximo: ${this.formatBytes(this.options.maxSize)}`
      );
    }

    // Check MIME type
    if (this.options.allowedMimeTypes && !this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: ${this.options.allowedMimeTypes.join(', ')}`
      );
    }

    // Check file extension
    if (this.options.allowedExtensions) {
      const fileExtension = this.getFileExtension(file.originalname);
      if (!this.options.allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `Extensión de archivo no permitida: ${fileExtension}. Extensiones permitidas: ${this.options.allowedExtensions.join(', ')}`
        );
      }
    }

    // Additional security checks
    this.performSecurityChecks(file);

    return file;
  }

  private performSecurityChecks(file: Express.Multer.File): void {
    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.sh$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.html$/i,
      /\.htm$/i,
    ];

    const fileName = file.originalname.toLowerCase();
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileName)) {
        throw new BadRequestException(
          `Nombre de archivo sospechoso detectado: ${file.originalname}`
        );
      }
    }

    // Check for null bytes (potential path traversal)
    if (file.originalname.includes('\0')) {
      throw new BadRequestException('Nombre de archivo contiene caracteres no válidos');
    }

    // Check for path traversal attempts
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      throw new BadRequestException('Nombre de archivo contiene caracteres de ruta no válidos');
    }

    // Basic magic number validation for images
    if (file.mimetype.startsWith('image/')) {
      this.validateImageMagicNumbers(file);
    }
  }

  private validateImageMagicNumbers(file: Express.Multer.File): void {
    if (!file.buffer || file.buffer.length < 4) {
      return; // Can't validate without buffer
    }

    const buffer = file.buffer;
    const magicNumbers = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
    };

    const expectedMagic = magicNumbers[file.mimetype as keyof typeof magicNumbers];
    if (expectedMagic) {
      for (let i = 0; i < expectedMagic.length; i++) {
        if (buffer[i] !== expectedMagic[i]) {
          throw new BadRequestException(
            `El archivo ${file.originalname} no parece ser un ${file.mimetype} válido`
          );
        }
      }
    }
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex).toLowerCase() : '';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Predefined validation pipes for common use cases
export const ImageValidationPipe = new FileValidationPipe({
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  allowedExtensions: ['.jpg', '.jpeg', '.png'],
});

export const DocumentValidationPipe = new FileValidationPipe({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  allowedExtensions: ['.pdf', '.doc', '.docx'],
});

export const ReportValidationPipe = new FileValidationPipe({
  maxSize: 20 * 1024 * 1024, // 20MB
  allowedMimeTypes: [
    'application/json',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf'
  ],
  allowedExtensions: ['.json', '.csv', '.xlsx', '.pdf'],
});