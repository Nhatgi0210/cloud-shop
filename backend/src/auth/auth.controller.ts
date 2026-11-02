import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, cookieToken, sessionCookie } from './auth.service.js';
import { ConvexService } from '../convex/convex.service.js';

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/api',
  maxAge: 3_600_000,
});
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: ConvexService,
  ) {}
  @Post('register')
  async register(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.auth.limit(request.ip ?? 'unknown');
    const result = await this.auth.authenticate(body, true);
    response.cookie(sessionCookie, result.token, cookieOptions());
    return result.user;
  }
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.auth.limit(request.ip ?? 'unknown');
    const result = await this.auth.authenticate(body, false);
    response.cookie(sessionCookie, result.token, cookieOptions());
    return result.user;
  }
  @Get('me')
  async me(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    const token = cookieToken(request.headers.cookie);
    if (!token) return null;
    await this.auth.verify(token);
    return this.db.query('users:current', {}, token);
  }
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = cookieToken(request.headers.cookie);
    response.clearCookie(sessionCookie, cookieOptions());
    if (token) {
      try {
        await this.auth.verify(token);
      } catch {
        return { ok: true };
      }
      // Revoke existing tokens as well as clearing the browser cookie.
      await this.db.mutation('users:logout', {}, token);
    }
    return { ok: true };
  }
}
