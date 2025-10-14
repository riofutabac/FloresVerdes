import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const DEFAULT_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
};

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get rate limit options from decorator or use defaults
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      'rateLimit',
      context.getHandler(),
    ) || DEFAULT_RATE_LIMIT;

    // Create a unique key for the client (IP + User ID if authenticated)
    const clientKey = this.getClientKey(request);
    
    // Check rate limit
    if (!this.checkRateLimit(clientKey, rateLimitOptions)) {
      throw new HttpException(
        {
          message: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
          error: 'Rate Limit Exceeded',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientKey(request: Request): string {
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const userId = (request as any).user?.sub || 'anonymous';
    return `${ip}:${userId}`;
  }

  private checkRateLimit(clientKey: string, options: RateLimitOptions): boolean {
    const now = Date.now();
    const clientData = requestCounts.get(clientKey);

    if (!clientData || now > clientData.resetTime) {
      // First request or window expired
      requestCounts.set(clientKey, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return true;
    }

    if (clientData.count >= options.maxRequests) {
      return false;
    }

    // Increment count
    clientData.count++;
    requestCounts.set(clientKey, clientData);
    
    return true;
  }

  // Cleanup expired entries periodically
  static cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
      if (now > data.resetTime) {
        requestCounts.delete(key);
      }
    }
  }
}

// Decorator for setting custom rate limits
export const RateLimit = (options: RateLimitOptions) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata('rateLimit', options, descriptor.value);
    } else {
      Reflect.defineMetadata('rateLimit', options, target);
    }
  };
};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  RateLimitGuard.cleanupExpiredEntries();
}, 5 * 60 * 1000);