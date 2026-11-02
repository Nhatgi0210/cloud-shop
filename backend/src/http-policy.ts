import type { INestApplication } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ConvexExceptionFilter } from './convex/convex.filter.js';

export function configureApplication(app: INestApplication) {
  app.useGlobalFilters(new ConvexExceptionFilter());
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const allowed = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
      if (req.headers.origin && req.headers.origin !== allowed)
        return res
          .status(403)
          .json({ message: 'Nguồn yêu cầu không được phép.' });
      // req.is() returns null for a bodyless DELETE, even with this header.
      const contentType = req.headers['content-type']
        ?.split(';')[0]
        ?.trim()
        .toLowerCase();
      if (contentType !== 'application/json')
        return res.status(415).json({ message: 'Yêu cầu phải dùng JSON.' });
    }
    next();
  });
}
