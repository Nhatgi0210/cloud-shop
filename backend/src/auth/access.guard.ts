import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, cookieToken } from './auth.service.js';

export type AuthRequest = Request & { authToken: string };
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = cookieToken(request.headers.cookie);
    if (!token)
      throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục.');
    request.authToken = await this.auth.verify(token);
    return true;
  }
}
