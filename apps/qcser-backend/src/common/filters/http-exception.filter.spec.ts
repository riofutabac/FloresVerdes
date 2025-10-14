import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException correctly', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Test error',
        }),
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
      }),
    );
  });

  it('should handle validation errors with details', () => {
    const validationError = new HttpException(
      {
        message: ['field1 is required', 'field2 must be a string'],
        error: 'Bad Request',
        statusCode: 400,
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(validationError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Errores de validación',
          details: ['field1 is required', 'field2 must be a string'],
        }),
      }),
    );
  });

  it('should handle unexpected errors', () => {
    const unexpectedError = new Error('Unexpected error');

    filter.catch(unexpectedError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error interno del servidor',
        }),
      }),
    );
  });

  it('should handle unauthorized errors', () => {
    const unauthorizedError = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(unauthorizedError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        }),
      }),
    );
  });

  it('should handle forbidden errors', () => {
    const forbiddenError = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(forbiddenError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'Forbidden',
        }),
      }),
    );
  });

  it('should handle not found errors', () => {
    const notFoundError = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(notFoundError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Not Found',
        }),
      }),
    );
  });

  it('should handle conflict errors', () => {
    const conflictError = new HttpException('Conflict', HttpStatus.CONFLICT);

    filter.catch(conflictError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'CONFLICT',
          message: 'Conflict',
        }),
      }),
    );
  });

  it('should handle rate limit errors', () => {
    const rateLimitError = new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);

    filter.catch(rateLimitError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too Many Requests',
        }),
      }),
    );
  });
});