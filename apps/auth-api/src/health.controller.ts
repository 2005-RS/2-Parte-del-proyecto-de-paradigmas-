import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('salud')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ schema: { example: { status: 'ok', service: 'auth-api' } } })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'auth-api' };
  }
}
