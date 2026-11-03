import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { KeyStore } from './key-store';

describe('KeyStore', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'profelink-keys-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function store(): Promise<KeyStore> {
    const created = new KeyStore({
      dir,
      issuer: 'profelink-auth',
      audience: 'activities-api',
      expiresIn: '1h',
    });
    await created.init();
    return created;
  }

  it('emite un JWT RS256 cuya audiencia es el API de actividades', async () => {
    const keys = await store();
    const token = await keys.sign({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'demo@profelink.dev',
      displayName: 'Profe Demo',
    });
    const payload = jwt.verify(token, keys.publicPem, {
      issuer: 'profelink-auth',
      audience: 'activities-api',
    });
    if (typeof payload === 'string') throw new Error('payload');
    expect(payload.aud).toBe('activities-api');
    expect(payload.sub).toBe('11111111-1111-4111-8111-111111111111');
    expect(payload.name).toBe('Profe Demo');
  });

  it('rechaza el token cuando la audiencia no es activities-api', async () => {
    const keys = await store();
    const token = await keys.sign({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'demo@profelink.dev',
      displayName: 'Profe Demo',
    });
    expect(() =>
      jwt.verify(token, keys.publicPem, {
        issuer: 'profelink-auth',
        audience: 'otro-servicio',
      }),
    ).toThrow();
  });

  it('reutiliza el mismo par de llaves al reiniciar el proceso', async () => {
    const first = await store();
    const token = await first.sign({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'demo@profelink.dev',
      displayName: 'Profe Demo',
    });
    const second = new KeyStore({
      dir,
      issuer: 'profelink-auth',
      audience: 'activities-api',
      expiresIn: '1h',
    });
    await second.init();
    expect(() =>
      jwt.verify(token, second.publicPem, {
        issuer: 'profelink-auth',
        audience: 'activities-api',
      }),
    ).not.toThrow();
  });
});
