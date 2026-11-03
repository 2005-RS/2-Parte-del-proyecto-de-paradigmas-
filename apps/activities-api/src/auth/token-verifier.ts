import { createPublicKey, type JsonWebKey as CryptoJwk } from 'crypto';

type AuthJwk = CryptoJwk & { kid?: string };
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { DomainError } from '../common/domain-error';
import type { AuthUser } from './auth-user';

@Injectable()
export class TokenVerifier {
  private pem = '';
  private cachedUntil = 0;
  private readonly jwksUrl: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(config: ConfigService) {
    this.jwksUrl = config.getOrThrow<string>('AUTH_JWKS_URL');
    this.issuer = config.getOrThrow<string>('JWT_ISSUER');
    this.audience = config.getOrThrow<string>('JWT_AUDIENCE');
  }

  async verify(token: string): Promise<AuthUser> {
    try {
      const key = await this.publicKey();
      const payload = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: this.issuer,
        audience: this.audience,
      });
      if (typeof payload === 'string' || !payload.sub || typeof payload.name !== 'string') {
        throw new Error('payload');
      }
      return {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : '',
        displayName: payload.name,
      };
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError('UNAUTHORIZED', 'La sesión no es válida o expiró.', 401);
    }
  }

  private async publicKey(): Promise<string> {
    if (this.pem && Date.now() < this.cachedUntil) return this.pem;
    const response = await fetch(this.jwksUrl);
    if (!response.ok) throw new DomainError('UNAUTHORIZED', 'No se pudo validar la sesión.', 401);
    const body = (await response.json()) as { keys?: AuthJwk[] };
    const jwk = body.keys?.find((key) => key.kid === 'profelink-auth-1') ?? body.keys?.[0];
    if (!jwk) throw new DomainError('UNAUTHORIZED', 'No se pudo validar la sesión.', 401);
    const exported = createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
    this.pem = typeof exported === 'string' ? exported : exported.toString();
    this.cachedUntil = Date.now() + 60_000;
    return this.pem;
  }
}
