import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { MediaService } from './media.service';

const types: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

@ApiTags('imagenes')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get(':file')
  @ApiOkResponse({ description: 'Imagen pública con nombre no adivinable. Sirve para otros dispositivos.' })
  send(@Param('file') file: string, @Res() response: Response) {
    const full = this.media.resolve(file);
    const extension = full.slice(full.lastIndexOf('.')).toLowerCase();
    response.setHeader('Content-Type', types[extension] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'public, max-age=86400');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.sendFile(full);
  }
}
