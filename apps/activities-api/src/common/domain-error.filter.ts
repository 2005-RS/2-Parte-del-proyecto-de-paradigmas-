import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { MulterError } from 'multer';
import type { Response } from 'express';
import { DomainError } from './domain-error';

@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof DomainError) {
      response.status(exception.status).json({ code: exception.code, message: exception.message });
      return;
    }
    if (exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json({ code: 'IMAGE_TOO_LARGE', message: 'La imagen supera el máximo de 2 MB.' });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw.join(' ') : raw || 'Solicitud inválida.';
      response.status(status).json({
        code: status === 401 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : 'VALIDATION',
        message,
      });
      return;
    }
    this.logger.error(exception);
    response.status(500).json({ code: 'INTERNAL', message: 'Error interno del servicio de actividades.' });
  }
}
