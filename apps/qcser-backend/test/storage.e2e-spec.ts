import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../src/modules/storage/storage.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test/path' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test/path' },
        }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        listBuckets: jest.fn().mockResolvedValue({
          data: [{ name: 'qcser-files' }],
          error: null,
        }),
      })),
      listBuckets: jest.fn().mockResolvedValue({
        data: [{ name: 'qcser-files' }],
        error: null,
      }),
    },
  })),
}));

// Mock fs module
jest.mock('fs');

describe('Storage Integration Tests - File Upload and Sync (COS-13, COS-14, COS-15)', () => {
  let storageService: StorageService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'supabase.url': 'https://test.supabase.co',
        'supabase.serviceRoleKey': 'test-key',
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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    storageService = moduleFixture.get<StorageService>(StorageService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Hybrid Storage Solution (Task 8.1)', () => {
    it('should upload file to Supabase successfully (COS-13)', async () => {
      const result = await storageService.uploadToSupabase(mockFile, 'qcser-files', 'photos');

      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileSize', 1024);
      expect(result).toHaveProperty('mimeType', 'image/jpeg');
      expect(result).toHaveProperty('publicUrl');
      expect(result.fileName).toMatch(/\.jpg$/);
    });

    it('should save file locally when Supabase fails (COS-14)', async () => {
      // Mock fs operations
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;

      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation();
      mockWriteFileSync.mockImplementation();

      const result = await storageService.saveLocally(mockFile, 'photos');

      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileSize', 1024);
      expect(result).toHaveProperty('mimeType', 'image/jpeg');
      expect(result.fileName).toMatch(/\.jpg$/);
      expect(result.filePath).toMatch(/storage[\/\\]photos/);
    });

    it('should validate photo formats for enmallado and cuadrante subprocesses (COS-13)', () => {
      const jpgFile = { ...mockFile, mimetype: 'image/jpeg', originalname: 'enmallado.jpg' };
      const pngFile = { ...mockFile, mimetype: 'image/png', originalname: 'cuadrante.png' };

      expect(() => storageService.validateFile(jpgFile)).not.toThrow();
      expect(() => storageService.validateFile(pngFile)).not.toThrow();
    });

    it('should reject invalid file types', () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain', originalname: 'invalid.txt' };

      expect(() => storageService.validateFile(invalidFile)).toThrow('Tipo de archivo no permitido');
    });

    it('should reject files that are too large', () => {
      const largeFile = { ...mockFile, size: 15 * 1024 * 1024 }; // 15MB

      expect(() => storageService.validateFile(largeFile)).toThrow('Archivo demasiado grande');
    });

    it('should use hybrid storage with fallback (COS-14)', async () => {
      // Mock Supabase to fail
      jest.spyOn(storageService, 'uploadToSupabase').mockRejectedValue(new Error('Supabase offline'));
      
      // Mock fs operations for local storage
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
      const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;

      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation();
      mockWriteFileSync.mockImplementation();

      const result = await storageService.uploadWithFallback(mockFile, 'photos');

      expect(result.filePath).toMatch(/storage[\/\\]photos/);
      expect(result).not.toHaveProperty('publicUrl'); // No Supabase URL
    });
  });

  describe('File Management and Deletion (COS-15)', () => {
    it('should delete local file successfully (COS-15)', async () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockUnlinkSync = fs.unlinkSync as jest.MockedFunction<typeof fs.unlinkSync>;

      mockExistsSync.mockReturnValue(true);
      mockUnlinkSync.mockImplementation();

      await storageService.deleteLocally('storage/photos/test.jpg');

      expect(mockUnlinkSync).toHaveBeenCalled();
    });

    it('should handle non-existent file deletion gracefully', async () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockUnlinkSync = fs.unlinkSync as jest.MockedFunction<typeof fs.unlinkSync>;

      mockExistsSync.mockReturnValue(false);

      await expect(storageService.deleteLocally('storage/photos/nonexistent.jpg')).resolves.not.toThrow();
      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });

    it('should read local file successfully', async () => {
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('file content'));

      const result = await storageService.getLocalFile('storage/photos/test.jpg');

      expect(result).toEqual(Buffer.from('file content'));
      expect(mockReadFileSync).toHaveBeenCalled();
    });
  });

  describe('Storage Synchronization and Management (Task 8.2)', () => {
    it('should get storage information', async () => {
      // Mock fs operations for storage info
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
      const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['file1.jpg', 'file2.png'] as any);
      mockStatSync.mockReturnValue({ size: 1024 } as any);

      const result = await storageService.getStorageInfo();

      expect(result).toHaveProperty('local');
      expect(result.local).toHaveProperty('totalFiles');
      expect(result.local).toHaveProperty('totalSize');
      expect(result.local).toHaveProperty('folders');
      expect(result.local.folders).toHaveProperty('photos');
      expect(result.local.folders).toHaveProperty('reports');
      expect(result.local.folders).toHaveProperty('temp');
      expect(result).toHaveProperty('supabase');
      expect(result.supabase).toHaveProperty('available');
      expect(result.supabase).toHaveProperty('buckets');
    });

    it('should sync local files to Supabase when connectivity is restored', async () => {
      // Mock fs operations for sync
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
      const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test-file.jpg'] as any);
      mockReadFileSync.mockReturnValue(Buffer.from('test content'));
      mockStatSync.mockReturnValue({ size: 1024 } as any);

      const result = await storageService.syncLocalFilesToSupabase('photos');

      expect(result).toHaveProperty('synced');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('errors');
      expect(typeof result.synced).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle sync failures with retry mechanisms', async () => {
      // Mock fs operations
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
      const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
      const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['failing-file.jpg'] as any);
      mockReadFileSync.mockReturnValue(Buffer.from('test content'));
      mockStatSync.mockReturnValue({ size: 1024 } as any);

      // Mock Supabase to fail
      jest.spyOn(storageService, 'uploadToSupabase').mockRejectedValue(new Error('Upload failed'));

      const result = await storageService.syncLocalFilesToSupabase('photos');

      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('failing-file.jpg');
    });

    it('should provide storage health monitoring', async () => {
      const result = await storageService.getStorageInfo();

      // Verify health monitoring data is available
      expect(result.supabase).toHaveProperty('available');
      expect(typeof result.supabase.available).toBe('boolean');
      expect(result.local).toHaveProperty('totalFiles');
      expect(result.local).toHaveProperty('totalSize');
    });
  });

  describe('File Cleanup and Maintenance', () => {
    it('should handle file cleanup operations', async () => {
      // Mock fs operations for cleanup
      const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
      const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
      const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['old-file.jpg', 'temp-file.png'] as any);
      mockStatSync.mockReturnValue({ size: 1024 } as any);

      const storageInfo = await storageService.getStorageInfo();

      expect(storageInfo.local.folders.photos.files).toBeGreaterThan(0);
      expect(storageInfo.local.folders.temp.files).toBeGreaterThan(0);
    });

    it('should validate file metadata management', () => {
      const fileName = 'test-image.jpg';
      const mimeType = storageService['getMimeType'](fileName);

      expect(mimeType).toBe('image/jpeg');
    });

    it('should generate unique file names', () => {
      const originalName = 'test.jpg';
      const fileName1 = storageService['generateFileName'](originalName);
      const fileName2 = storageService['generateFileName'](originalName);

      expect(fileName1).toMatch(/^\d+_[a-f0-9]{16}\.jpg$/);
      expect(fileName2).toMatch(/^\d+_[a-f0-9]{16}\.jpg$/);
      expect(fileName1).not.toBe(fileName2); // Should be unique
    });
  });
});