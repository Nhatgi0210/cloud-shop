import { generateKeyPairSync } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import {
  AuthService,
  hashPassword,
  verifyPassword,
  type UserRecord,
} from './auth.service.js';
import type { ConvexService } from '../convex/convex.service.js';

const record: UserRecord = {
  _id: 'user-1',
  _creationTime: 0,
  name: 'Khách',
  email: 'user@example.com',
  role: 'customer',
  tokenIdentifier:
    'https://cloudkicks.local|12345678-1234-1234-1234-123456789abc',
  sessionVersion: 0,
};
const db = { query: vi.fn(), mutation: vi.fn() };
const service = () => new AuthService(db as unknown as ConvexService);
beforeAll(() => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  vi.stubEnv(
    'JWT_PRIVATE_KEY_BASE64',
    Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString(
      'base64',
    ),
  );
  vi.stubEnv(
    'NEST_JWKS_BASE64',
    Buffer.from(
      JSON.stringify({
        keys: [
          {
            ...publicKey.export({ format: 'jwk' }),
            kid: 'cloudkicks-1',
            alg: 'RS256',
          },
        ],
      }),
    ).toString('base64'),
  );
  vi.stubEnv('NEST_AUTH_SECRET', 'test-backend-secret');
});
afterAll(() => vi.unstubAllEnvs());
describe('email and password authentication', () => {
  it('salts passwords and verifies only the original password', async () => {
    const a = await hashPassword('password-123');
    const b = await hashPassword('password-123');
    expect(a).not.toBe(b);
    expect(a).not.toContain('password-123');
    expect(await verifyPassword('password-123', a)).toBe(true);
    expect(await verifyPassword('different-password', a)).toBe(false);
    expect(await verifyPassword('password-123', 'malformed')).toBe(false);
  });
  it('registers with a server-generated identity and omits password hashes from responses', async () => {
    db.mutation.mockResolvedValue({
      ...record,
      passwordHash: await hashPassword('password-123'),
    });
    const result = await service().authenticate(
      {
        name: 'Khách',
        email: ' USER@example.com ',
        password: 'password-123',
        role: 'admin',
      },
      true,
    );
    expect(result.user.role).toBe('customer');
    expect(result.user).not.toHaveProperty('passwordHash');
    const args = db.mutation.mock.calls.at(-1)?.[1];
    expect(args.email).toBe('user@example.com');
    expect(args).not.toHaveProperty('role');
    expect(args.subject).toMatch(/^[a-f0-9-]{36}$/);
    expect(await service().verify(result.token)).toBe(result.token);
    await expect(service().verify(result.token + 'tampered')).rejects.toThrow();
  });
  it('uses the same login error for a missing account and incorrect password', async () => {
    db.query.mockResolvedValue(null);
    await expect(
      service().authenticate(
        { email: record.email, password: 'password-123' },
        false,
      ),
    ).rejects.toThrow('Email hoặc mật khẩu không đúng.');
    db.query.mockResolvedValue({
      ...record,
      passwordHash: await hashPassword('another-password'),
    });
    await expect(
      service().authenticate(
        { email: record.email, password: 'password-123' },
        false,
      ),
    ).rejects.toThrow('Email hoặc mật khẩu không đúng.');
  });
  it('rejects weak passwords and limits repeated authentication attempts', async () => {
    await expect(
      service().authenticate({ email: record.email, password: 'short' }, false),
    ).rejects.toThrow();
    const auth = service();
    for (let index = 0; index < 10; index++) auth.limit('test-ip');
    expect(() => auth.limit('test-ip')).toThrow('Thử quá nhiều lần');
  });
});
