import { randomUUID } from 'crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DomainError } from '../common/domain-error.filter';
import { PrismaService } from '../prisma/prisma.service';
import { KeyStore } from './key-store';
import { LoginDto, RegisterDto } from './dto';

export type PublicUser = { id: string; email: string; displayName: string };

@Injectable()
export class AuthService implements OnModuleInit {
  readonly keys: KeyStore;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.keys = new KeyStore({
      dir: config.get<string>('KEY_DIR') || './keys',
      issuer: config.getOrThrow<string>('JWT_ISSUER'),
      audience: config.getOrThrow<string>('JWT_AUDIENCE'),
      expiresIn: config.get<string>('JWT_EXPIRES_IN') || '8h',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.keys.init();
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new DomainError('EMAIL_TAKEN', 'Ese correo ya tiene un perfil.', 409);
    }
    const user = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        displayName: dto.displayName.trim(),
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
    });
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new DomainError('UNAUTHORIZED', 'Correo o contraseña incorrectos.', 401);
    }
    return this.issue(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new DomainError('UNAUTHORIZED', 'La sesión no es válida.', 401);
    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  private async issue(user: { id: string; email: string; displayName: string }) {
    const accessToken = await this.keys.sign(user);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      user: { id: user.id, email: user.email, displayName: user.displayName },
    };
  }
}
