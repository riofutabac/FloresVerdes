import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe with security enhancements
  app.useGlobalPipes(new CustomValidationPipe());

  // Global security headers interceptor
  app.useGlobalInterceptors(new SecurityHeadersInterceptor());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('QCSER API')
    .setDescription('Sistema de Control de Calidad para Florícola - API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Autenticación', 'Endpoints para autenticación y gestión de usuarios')
    .addTag('Operarios', 'Gestión de operarios y asignaciones')
    .addTag('Evaluaciones', 'Sistema de evaluaciones de calidad')
    .addTag('Administración', 'Gestión de parámetros y configuración del sistema')
    .addTag('Reportes', 'Generación de reportes y KPIs')
    .addTag('Almacenamiento', 'Gestión de archivos y fotos')
    .addTag('Sincronización', 'Sincronización offline/online')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger documentation available at: http://0.0.0.0:${port}/api/docs`);
}
bootstrap();
