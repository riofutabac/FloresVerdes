import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;

  beforeEach(() => {
    pipe = new FileValidationPipe({
      maxSize: 1024 * 1024, // 1MB
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      allowedExtensions: ['.jpg', '.jpeg', '.png'],
      required: false,
    });
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should pass valid file', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 500 * 1024, // 500KB
      buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG magic numbers
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    expect(() => pipe.transform(mockFile, { type: 'body' })).not.toThrow();
  });

  it('should reject file that is too large', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'large.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 2 * 1024 * 1024, // 2MB (exceeds 1MB limit)
      buffer: Buffer.from([]),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    expect(() => pipe.transform(mockFile, { type: 'body' })).toThrow(BadRequestException);
  });

  it('should reject file with invalid MIME type', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 500 * 1024,
      buffer: Buffer.from([]),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    expect(() => pipe.transform(mockFile, { type: 'body' })).toThrow(BadRequestException);
  });

  it('should reject file with invalid extension', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.gif',
      encoding: '7bit',
      mimetype: 'image/jpeg', // MIME type is allowed but extension is not
      size: 500 * 1024,
      buffer: Buffer.from([]),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    expect(() => pipe.transform(mockFile, { type: 'body' })).toThrow(BadRequestException);
  });

  it('should reject suspicious file names', () => {
    const suspiciousFiles = [
      'malicious.php',
      'script.js',
      'virus.exe',
      'backdoor.asp',
    ];

    suspiciousFiles.forEach(filename => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: filename,
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 500 * 1024,
        buffer: Buffer.from([]),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      expect(() => pipe.transform(mockFile, { type: 'body' })).toThrow(BadRequestException);
    });
  });

  it('should reject files with path traversal attempts', () => {
    const maliciousFiles = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\config\\sam',
      'normal.jpg/../../../malicious.php',
    ];

    maliciousFiles.forEach(filename => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: filename,
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 500 * 1024,
        buffer: Buffer.from([]),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      expect(() => pipe.transform(mockFile, { type: 'body' })).toThrow(BadRequestException);
    });
  });

  it('should handle multiple files', () => {
    const mockFiles: Express.Multer.File[] = [
      {
        fieldname: 'files',
        originalname: 'test1.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 500 * 1024,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      },
      {
        fieldname: 'files',
        originalname: 'test2.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 300 * 1024,
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      },
    ];

    expect(() => pipe.transform(mockFiles, { type: 'body' })).not.toThrow();
  });

  it('should handle null file when not required', () => {
    expect(() => pipe.transform(null as any, { type: 'body' })).not.toThrow();
  });

  it('should reject null file when required', () => {
    const requiredPipe = new FileValidationPipe({ required: true });
    expect(() => requiredPipe.transform(null as any, { type: 'body' })).toThrow(BadRequestException);
  });

  it('should validate PNG magic numbers', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 500 * 1024,
      buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG magic numbers
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    expect(() => pipe.transform(mockFile, { type: 'body' })).not.toThrow();
  });

  it('should reject file with invalid magic numbers', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'fake.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 500 * 1024,
      buffer: Buffer.from([0x00, 0x00, 0x00, 0x00]), // Invalid magic numbers
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    expect(() => pipe.transform(mockFile, { type: 'body' })).toThrow(BadRequestException);
  });
});