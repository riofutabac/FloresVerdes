import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        // Security headers
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader('X-XSS-Protection', '1; mode=block');
        response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';",
        );
        
        // Remove server information
        response.removeHeader('X-Powered-By');
        response.removeHeader('Server');
        
        // Cache control for API responses
        if (response.req.url?.includes('/api/')) {
          response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
          response.setHeader('Pragma', 'no-cache');
          response.setHeader('Expires', '0');
        }
      }),
    );
  }
}