import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ConvexError } from 'convex/values';
import type { Response } from 'express';

@Catch(ConvexError)
export class ConvexExceptionFilter implements ExceptionFilter {
  catch(error: ConvexError<string>, host: ArgumentsHost) {
    const message =
      typeof error.data === 'string'
        ? error.data
        : 'Không thể thực hiện yêu cầu.';
    const status = message.includes('quyền')
      ? 403
      : message.includes('đăng nhập')
        ? 401
        : 400;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ message });
  }
}
