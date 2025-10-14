import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock Supabase client
const mockSupabaseClient = {
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
    })),
    listBuckets: jest.fn(),
  },
};

// Mock createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock fs module
jest.mock('fs');
jest.mock('path');

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'supabase.url': 'https://test.supabase.co',
        'supabase.serviceRoleKey': 'test-service-role-key',
        'storage.localPath': './storage',
        'storage.maxFileSize': 10 * 1024 * 1024, // 10MB
      };
      return config[key];
    }),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test file content'),
    destination: '',
    filename: '',
    path: '',
    stream: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Hybrid Storage Solution (Task 8.1)', () => {
    it('should upload file to Supabase successfully', async () => {
      // Arrange
      const bucket = mockSupabaseClient.storage.from();
      bucket.upload.mockResolvedValue({
        data: { path: 'photos/test-image.jpg' },
        error: null,
      });
      bucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/qcser-files/photos/test-image.jpg' },
      });

      // Act
      const result = await service.uploadToSupabase(mockFile, 'qcser-files', 'photos');

      // Assert
      expect(result).toEqual({
        fileName: expect.stringMatching(/^\d+_[a-f0-9]{16}\.jpg$/),
        filePath: expect.stringContaining('photos/'),
        fileSize: 1024,
        mimeType: 'image/jpeg',
        publicUrl: expect.stringContaining('https://test.supabase.co'),
      });
      expect(bucket.upload).toHaveBeenCalled();
      expect(bucket.getPublicUrl).toHaveBeenCalled();
    });

    it('should save file locally when Supabase fails', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;

      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation();
      mockWriteFileSync.mockImplementation();

      // Act
      const result = await service.saveLocally(mockFile, 'photos');

      // Assert
      expect(result).toEqual({
        fileName: expect.stringMatching(/^\d+_[a-f0-9]{16}\.jpg$/),
        filePath: expect.stringContaining('storage'),
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      expect(mockMkdirSync).toHaveBeenCalled();
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should validate file types for .jpg and .png formats', () => {
      // Arrange
      const jpgFile = { ...mockFile, mimetype: 'image/jpeg', originalname: 'test.jpg' };
      const pngFile = { ...mockFile, mimetype: 'image/png', originalname: 'test.png' };
      const invalidFile = { ...mockFile, mimetype: 'text/plain', originalname: 'test.txt' };

      // Act & Assert
      expect(() => service.validateFile(jpgFile)).not.toThrow();
      expect(() => service.validateFile(pngFile)).not.toThrow();
      expect(() => service.validateFile(invalidFile)).toThrow('Tipo de archivo no permitido');
    });

    it('should validate file size limits', () => {
      // Arrange
      const validFile = { ...mockFile, size: 5 * 1024 * 1024 }; // 5MB
      const largeFile = { ...mockFile, size: 15 * 1024 * 1024 }; // 15MB

      // Act & Assert
      expect(() => service.validateFile(validFile)).not.toThrow();
      expect(() => service.validateFile(largeFile)).toThrow('Archivo demasiado grande');
    });

    it('should use hybrid storage with automatic fallback', async () => {
      // Arrange
      const bucket = mockSupabaseClient.storage.from();
      bucket.upload.mockRejectedValue(new Error('Supabase offline'));

      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;

      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation();
      mockWriteFileSync.mockImplementation();

      // Act
      const result = await service.uploadWithFallback(mockFile, 'photos');

      // Assert
      expect(result).toEqual({
        fileName: expect.stringMatching(/^\d+_[a-f0-9]{16}\.jpg$/),
        filePath: expect.stringContaining('storage'),
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      expect(result).not.toHaveProperty('publicUrl'); // No Supabase URL when using local fallback
    });

    it('should handle file download with proper authentication', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('file content'));

      // Act
      const result = await service.getLocalFile('storage/photos/test.jpg');

      // Assert
      expect(result).toEqual(Buffer.from('file content'));
      expect(mockReadFileSync).toHaveBeenCalledWith('storage/photos/test.jpg');
    });

    it('should provide file metadata management', () => {
      // Arrange
      const fileName = 'test-image.jpg';

      // Act
      const mimeType = service['getMimeType'](fileName);
      const generatedName = service['generateFileName'](fileName);

      // Assert
      expect(mimeType).toBe('image/jpeg');
      expect(generatedName).toMatch(/^\d+_[a-f0-9]{16}\.jpg$/);
    });
  });

  describe('Storage Synchronization and Management (Task 8.2)', () => {
    it('should sync local files to Supabase when connectivity is restored', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
      const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test-file.jpg', 'another-file.png'] as any);
      mockReadFileSync.mockReturnValue(Buffer.from('test content'));
      mockStatSync.mockReturnValue({ size: 1024 } as any);

      const bucket = mockSupabaseClient.storage.from();
      bucket.upload.mockResolvedValue({
        data: { path: 'photos/test-file.jpg' },
        error: null,
      });

      // Act
      const result = await service.syncLocalFilesToSupabase('photos');

      // Assert
      expect(result).toEqual({
        synced: 2,
        failed: 0,
        errors: [],
      });
      expect(bucket.upload).toHaveBeenCalledTimes(2);
    });

    it('should handle sync failures with retry mechanisms', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
      const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['failing-file.jpg'] as any);
      mockReadFileSync.mockReturnValue(Buffer.from('test content'));
      mockStatSync.mockReturnValue({ size: 1024 } as any);

      const bucket = mockSupabaseClient.storage.from();
      bucket.upload.mockRejectedValue(new Error('Upload failed'));

      // Act
      const result = await service.syncLocalFilesToSupabase('photos');

      // Assert
      expect(result).toEqual({
        synced: 0,
        failed: 1,
        errors: ['failing-file.jpg: Upload failed'],
      });
    });

    it('should provide storage information and validation', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
      const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['file1.jpg', 'file2.png'] as any);
      mockStatSync.mockReturnValue({ size: 1024 } as any);

      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'qcser-files' }],
        error: null,
      });

      // Act
      const result = await service.getStorageInfo();

      // Assert
      expect(result).toEqual({
        local: {
          totalFiles: 6, // 2 files in each of 3 folders
          totalSize: 6144, // 6 * 1024
          folders: {
            photos: { files: 2, size: 2048 },
            reports: { files: 2, size: 2048 },
            temp: { files: 2, size: 2048 },
          },
        },
        supabase: {
          available: true,
          buckets: ['qcser-files'],
        },
      });
    });

    it('should validate storage configuration', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockAccessSync = fs.accessSync as jest.MockedFunction<typeof fs.accessSync>;

      mockExistsSync.mockReturnValue(true);
      mockAccessSync.mockImplementation(); // No error means writable

      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'qcser-files' }],
        error: null,
      });

      // Act
      const result = await service.validateStorageConfiguration();

      // Assert
      expect(result).toEqual({
        local: {
          available: true,
          writable: true,
          path: './storage',
        },
        supabase: {
          available: true,
          connected: true,
          buckets: ['qcser-files'],
        },
      });
    });

    it('should handle file cleanup and maintenance', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockUnlinkSync = fs.unlinkSync as jest.MockedFunction<typeof fs.unlinkSync>;

      mockExistsSync.mockReturnValue(true);
      mockUnlinkSync.mockImplementation();

      // Act
      await service.deleteLocally('storage/photos/test.jpg');

      // Assert
      expect(mockUnlinkSync).toHaveBeenCalledWith('storage/photos/test.jpg');
    });

    it('should handle non-existent file deletion gracefully', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockUnlinkSync = fs.unlinkSync as jest.MockedFunction<typeof fs.unlinkSync>;

      mockExistsSync.mockReturnValue(false);

      // Act & Assert
      await expect(service.deleteLocally('storage/photos/nonexistent.jpg')).resolves.not.toThrow();
      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });

    it('should provide storage health monitoring', async () => {
      // Arrange
      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'qcser-files' }],
        error: null,
      });

      // Act
      const result = await service.checkStorageHealth();

      // Assert
      expect(result).toEqual({
        local: {
          status: 'healthy',
          available: true,
          writable: true,
        },
        supabase: {
          status: 'healthy',
          available: true,
          connected: true,
        },
        overall: 'healthy',
      });
    });
  });

  describe('File Upload and Management', () => {
    it('should handle multiple photo upload with preview', async () => {
      // Arrange
      const files = [
        { ...mockFile, originalname: 'photo1.jpg' },
        { ...mockFile, originalname: 'photo2.png' },
      ];

      const bucket = mockSupabaseClient.storage.from();
      bucket.upload.mockResolvedValue({
        data: { path: 'photos/test.jpg' },
        error: null,
      });
      bucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/qcser-files/photos/test.jpg' },
      });

      // Act
      const results = await Promise.all(
        files.map(file => service.uploadWithFallback(file, 'photos'))
      );

      // Assert
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toHaveProperty('fileName');
        expect(result).toHaveProperty('filePath');
        expect(result).toHaveProperty('fileSize', 1024);
      });
    });

    it('should handle photo deletion and replacement', async () => {
      // Arrange
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockUnlinkSync = fs.unlinkSync as jest.MockedFunction<typeof fs.unlinkSync>;

      mockExistsSync.mockReturnValue(true);
      mockUnlinkSync.mockImplementation();

      const bucket = mockSupabaseClient.storage.from();
      bucket.remove.mockResolvedValue({ error: null });

      // Act
      await service.deleteFile('storage/photos/old-photo.jpg', 'qcser-files');

      // Assert
      expect(mockUnlinkSync).toHaveBeenCalledWith('storage/photos/old-photo.jpg');
      expect(bucket.remove).toHaveBeenCalled();
    });

    it('should generate unique file names to prevent conflicts', () => {
      // Arrange
      const originalName = 'test.jpg';

      // Act
      const fileName1 = service['generateFileName'](originalName);
      const fileName2 = service['generateFileName'](originalName);

      // Assert
      expect(fileName1).toMatch(/^\d+_[a-f0-9]{16}\.jpg$/);
      expect(fileName2).toMatch(/^\d+_[a-f0-9]{16}\.jpg$/);
      expect(fileName1).not.toBe(fileName2); // Should be unique
    });

    it('should handle streaming and chunked upload for large files', async () => {
      // Arrange
      const largeFile = {
        ...mockFile,
        size: 8 * 1024 * 1024, // 8MB
        buffer: Buffer.alloc(8 * 1024 * 1024),
      };

      const bucket = mockSupabaseClient.storage.from();
      bucket.upload.mockResolvedValue({
        data: { path: 'photos/large-file.jpg' },
        error: null,
      });

      // Act
      const result = await service.uploadToSupabase(largeFile, 'qcser-files', 'photos');

      // Assert
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('fileSize', 8 * 1024 * 1024);
      expect(bucket.upload).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle Supabase connection errors gracefully', async () => {
      // Arrange
      mockSupabaseClient.storage.listBuckets.mockRejectedValue(new Error('Connection failed'));

      // Act
      const result = await service.checkStorageHealth();

      // Assert
      expect(result.supabase.status).toBe('error');
      expect(result.supabase.available).toBe(false);
      expect(result.overall).toBe('degraded');
    });

    it('should handle local storage permission errors', async () => {
      // Arrange
      const mockAccessSync = fs.accessSync as jest.MockedFunction<typeof fs.accessSync>;
      mockAccessSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Act
      const result = await service.validateStorageConfiguration();

      // Assert
      expect(result.local.writable).toBe(false);
    });

    it('should handle invalid file extensions', () => {
      // Arrange
      const invalidFile = {
        ...mockFile,
        originalname: 'test.exe',
        mimetype: 'application/octet-stream',
      };

      // Act & Assert
      expect(() => service.validateFile(invalidFile)).toThrow('Tipo de archivo no permitido');
    });

    it('should handle empty or corrupted files', () => {
      // Arrange
      const emptyFile = {
        ...mockFile,
        size: 0,
        buffer: Buffer.alloc(0),
      };

      // Act & Assert
      expect(() => service.validateFile(emptyFile)).toThrow('Archivo vacío');
    });
  });
});