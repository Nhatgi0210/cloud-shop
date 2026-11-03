import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/load-env.js';
import { configureApplication } from './http-policy.js';

loadEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
