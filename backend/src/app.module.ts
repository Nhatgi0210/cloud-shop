import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConvexModule } from './convex/convex.module.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { AccessGuard } from './auth/access.guard.js';
import { ShopController } from './shop/shop.controller.js';

@Module({
  imports: [ConvexModule],
  controllers: [AppController, AuthController, ShopController],
  providers: [AppService, AuthService, AccessGuard],
})
export class AppModule {}
