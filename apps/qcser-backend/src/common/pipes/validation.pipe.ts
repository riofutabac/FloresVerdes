import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CustomValidationPipe extends NestValidationPipe implements PipeTransform<any> {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints).join(', ');
          }
          return 'Validation failed';
        });
        
        return new BadRequestException({
          message: messages,
          error: 'Validation Error',
          statusCode: 400,
        });
      },
    });
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    // Apply input sanitization
    if (value && typeof value === 'object') {
      value = this.sanitizeInput(value);
    }

    // Apply the parent validation
    return super.transform(value, metadata);
  }

  private sanitizeInput(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeInput(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Skip prototype pollution attempts
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }

        if (typeof value === 'string') {
          // Basic XSS prevention - remove script tags and javascript: protocols
          sanitized[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        } else if (value && typeof value === 'object') {
          sanitized[key] = this.sanitizeInput(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }

    return obj;
  }
}