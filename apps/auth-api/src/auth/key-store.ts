import { generateKeyPairSync, createPublicKey, createPrivateKey } from 'crypto';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import jwt from 'jsonwebtoken';

export const DEMO_USER_ID = '11111111-1111-4111-8111-111111111111';

export type KeyOptions = {
  dir: string;
  issuer: string;
  audience: string;
  expiresIn: string;
};

export class KeyStore {
  private privatePem = '';
  private publicPemValue = '';
  private jwk: Record<string, unknown> = {};

  constructor(private readonly options: KeyOptions) {}

  async init(): Promise<void> {
    await mkdir(this.options.dir, { recursive: true });
    const privatePath = `${this.options.dir}/private.pem`;
    const publicPath = `${this.options.dir}/public.pem`;
    const exists = await access(privatePath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
      await writeFile(privatePath, pair.privateKey.export({ type: 'pkcs8', format: 'pem' }));
      await writeFile(publicPath, pair.publicKey.export({ type: 'spki', format: 'pem' }));
    }

    this.privatePem = await readFile(privatePath, 'utf8');
    this.publicPemValue = await readFile(publicPath, 'utf8');
    const exported = createPublicKey(this.publicPemValue).export({ format: 'jwk' });
    this.jwk = { ...exported, alg: 'RS256', use: 'sig', kid: 'profelink-auth-1' };
    createPrivateKey(this.privatePem);
  }

  jwks(): { keys: Array<Record<string, unknown>> } {
    return { keys: [this.jwk] };
  }

  get publicPem(): string {
    return this.publicPemValue;
  }

  async sign(user: { id: string; email: string; displayName: string }): Promise<string> {
    return jwt.sign({ email: user.email, name: user.displayName }, this.privatePem, {
      algorithm: 'RS256',
      issuer: this.options.issuer,
      audience: this.options.audience,
      subject: user.id,
      expiresIn: this.options.expiresIn as jwt.SignOptions['expiresIn'],
      keyid: 'profelink-auth-1',
    });
  }
}
