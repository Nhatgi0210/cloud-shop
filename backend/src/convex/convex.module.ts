import { Module } from '@nestjs/common';
import { ConvexService } from './convex.service.js';

@Module({
  providers: [ConvexService],
  exports: [ConvexService],
})
export class ConvexModule {}
