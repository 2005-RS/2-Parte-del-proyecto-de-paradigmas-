import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import jwt from 'jsonwebtoken';
import { DomainError } from '../common/domain-error.filter';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';

@ApiTags('identidad')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/register')
  @ApiOkResponse({ description: 'Perfil creado y token emitido para activities-api.' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('auth/login')
  @ApiOkResponse({ description: 'Token de acceso con audiencia activities-api.' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('auth/me')
  @ApiBearerAuth()
  async me(@Headers('authorization') authorization = '') {
    const user = await this.readUser(authorization);
    return this.auth.me(user.id);
  }

  @Get('.well-known/jwks.json')
  @ApiOkResponse({ description: 'Llave pública para que activities-api valide la firma.' })
  jwks() {
    return this.auth.keys.jwks();
  }

  private async readUser(authorization: string) {
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) throw new DomainError('UNAUTHORIZED', 'Inicia sesión para continuar.', 401);
    try {
      const payload = jwt.verify(token, this.auth.keys.publicPem, {
        algorithms: ['RS256'],
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      });
      if (typeof payload === 'string' || !payload.sub) throw new Error('payload');
      return { id: payload.sub };
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError('UNAUTHORIZED', 'La sesión no es válida o expiró.', 401);
    }
  }
}
