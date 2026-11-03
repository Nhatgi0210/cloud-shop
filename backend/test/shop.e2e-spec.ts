import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AuthService } from '../src/auth/auth.service.js';
import { ConvexService } from '../src/convex/convex.service.js';
import { configureApplication } from '../src/http-policy.js';

describe('Nest shop HTTP authentication boundary', () => {
  let app: INestApplication;
  const mutation = vi.fn().mockResolvedValue(null);
  beforeEach(async () => {
    mutation.mockClear();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConvexService)
      .useValue({ query: vi.fn(), mutation })
      .overrideProvider(AuthService)
      .useValue({ verify: vi.fn(async (token: string) => token) })
      .compile();
    app = module.createNestApplication();
    configureApplication(app);
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });

  it('requires a session before reading a cart', async () => {
    await request(app.getHttpServer()).get('/api/cart').expect(401);
  });
  it('accepts a JSON DELETE without a request body and forwards only the route ID', async () => {
    await request(app.getHttpServer())
      .delete('/api/cart/cart-row')
      .set('Content-Type', 'application/json')
      .set('Cookie', 'cloudkicks_session=verified-token')
      .expect(200);
    expect(mutation).toHaveBeenCalledWith(
      'cart:remove',
      { id: 'cart-row' },
      'verified-token',
    );
  });
  it('rejects cross-origin state changes before calling the database', async () => {
    await request(app.getHttpServer())
      .delete('/api/products/product-row')
      .set('Origin', 'https://untrusted.example')
      .set('Content-Type', 'application/json')
      .set('Cookie', 'cloudkicks_session=verified-token')
      .expect(403);
    expect(mutation).not.toHaveBeenCalled();
  });
  it('rejects browser form submissions to JSON authentication endpoints', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .type('form')
      .send({ email: 'demo@example.com', password: 'password-123' })
      .expect(415);
  });
});
