import {
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createLocalJWKSet, importPKCS8, jwtVerify, SignJWT } from 'jose';
import { ConvexService } from '../convex/convex.service.js';

const derive = promisify(scrypt);
const issuer = 'https://cloudkicks.local';
export const sessionCookie = 'cloudkicks_session';
export type UserRecord = {
  _id: string;
  _creationTime: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  tokenIdentifier: string;
  passwordHash?: string;
  sessionVersion?: number;
};
export type PublicUser = Pick<
  UserRecord,
  '_id' | '_creationTime' | 'name' | 'email' | 'role'
>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await derive(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [scheme, salt, expected] = hash.split('$');
  if (
    scheme !== 'scrypt' ||
    !/^[a-f0-9]{32}$/.test(salt ?? '') ||
    !/^[a-f0-9]{128}$/.test(expected ?? '')
  )
    return false;
  const actual = (await derive(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export function publicUser(user: UserRecord): PublicUser {
  return {
    _id: user._id,
    _creationTime: user._creationTime,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
export function cookieToken(cookie?: string) {
  return cookie
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(sessionCookie + '='))
    ?.slice(sessionCookie.length + 1);
}

@Injectable()
export class AuthService {
  private attempts = new Map<string, { count: number; until: number }>();
  constructor(private readonly db: ConvexService) {}

  limit(ip: string) {
    const now = Date.now();
    for (const [key, value] of this.attempts)
      if (value.until < now) this.attempts.delete(key);
    const current = this.attempts.get(ip) ?? { count: 0, until: now + 60_000 };
    if (current.count >= 10 || this.attempts.size >= 10_000)
      throw new HttpException('Thử quá nhiều lần. Vui lòng đợi một phút.', 429);
    current.count++;
    this.attempts.set(ip, current);
  }

  async authenticate(body: unknown, register: boolean) {
    if (!body || typeof body !== 'object')
      throw new BadRequestException('Thông tin tài khoản không hợp lệ.');
    const input = body as Record<string, unknown>;
    const email =
      typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      password.length < 8 ||
      password.length > 128 ||
      (register && (!name || name.length > 100))
    )
      throw new BadRequestException(
        'Nhập email hợp lệ, mật khẩu 8–128 ký tự và họ tên khi đăng ký.',
      );
    const secret = process.env.NEST_AUTH_SECRET;
    if (!secret)
      throw new ServiceUnavailableException('Chưa cấu hình dịch vụ tài khoản.');
    let user: UserRecord | null;
    if (register) {
      user = await this.db.mutation<UserRecord>('users:register', {
        secret,
        email,
        name,
        subject: randomUUID(),
        passwordHash: await hashPassword(password),
      });
    } else {
      user = await this.db.query<UserRecord | null>('users:findForLogin', {
        secret,
        email,
      });
      // Use the same password derivation even when an account doesn't exist.
      const dummy = 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128);
      const valid = await verifyPassword(password, user?.passwordHash ?? dummy);
      if (!user || !valid)
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }
    if (!user) throw new UnauthorizedException();
    const pem = process.env.JWT_PRIVATE_KEY_BASE64;
    if (!pem)
      throw new ServiceUnavailableException('Chưa cấu hình khóa đăng nhập.');
    const key = await importPKCS8(
      Buffer.from(pem, 'base64').toString('utf8'),
      'RS256',
    );
    const subject = user.tokenIdentifier.slice((issuer + '|').length);
    const token = await new SignJWT({
      sessionVersion: user.sessionVersion ?? 0,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'cloudkicks-1', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience('cloud-shop')
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key);
    return { token, user: publicUser(user) };
  }

  async verify(token: string) {
    try {
      const jwks = JSON.parse(
        Buffer.from(process.env.NEST_JWKS_BASE64 ?? '', 'base64').toString(
          'utf8',
        ),
      );
      await jwtVerify(token, createLocalJWKSet(jwks), {
        issuer,
        audience: 'cloud-shop',
        algorithms: ['RS256'],
      });
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      );
    }
    return token;
  }
}
