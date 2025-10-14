import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const userId = (request as any).user?.sub || 'anonymous';
    
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const { statusCode } = response;

        // Log successful requests
        this.logger.log(
          `${method} ${url} ${statusCode} - ${duration}ms`,
          JSON.stringify({
            method,
            url,
            statusCode,
            duration,
            ip,
            userAgent,
            userId,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const statusCode = error.status || 500;

        // Log error requests
        this.logger.error(
          `${method} ${url} ${statusCode} - ${duration}ms - ${error.message}`,
          JSON.stringify({
            method,
            url,
            statusCode,
            duration,
            ip,
            userAgent,
            userId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          }),
        );

        return throwError(() => error);
      }),
    );
  }
}