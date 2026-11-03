import './tracing';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { DomainErrorFilter } from './common/domain-error.filter';
import { countRequest } from './telemetry';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  app.enableCors({ origin: origins.length ? origins : true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DomainErrorFilter());
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => countRequest('auth-api', req.method, res.statusCode));
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('ProfeLink Auth')
    .setDescription(
      'Servicio de identidad. Emite JWT RS256 con audiencia activities-api para el servicio de actividades.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const http = app.getHttpAdapter().getInstance();
  http.get('/openapi.json', (_req: Request, res: Response) => res.json(document));
  http.use('/docs', apiReference({ content: document }));

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
