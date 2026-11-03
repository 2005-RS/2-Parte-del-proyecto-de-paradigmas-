import { existsSync } from 'fs';
import { resolve } from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainError } from '../common/domain-error';

@Injectable()
export class MediaService {
  readonly uploadDir: string;

  constructor(config: ConfigService) {
    this.uploadDir = resolve(config.get<string>('UPLOAD_DIR') || './uploads');
  }

  resolve(file: string): string {
    if (!/^[a-zA-Z0-9.-]+$/.test(file) || file.includes('..')) {
      throw new DomainError('NOT_FOUND', 'No encontramos esa imagen.', 404);
    }
    const full = resolve(this.uploadDir, file);
    if (!full.startsWith(this.uploadDir) || !existsSync(full)) {
      throw new DomainError('NOT_FOUND', 'No encontramos esa imagen.', 404);
    }
    return full;
  }
}
