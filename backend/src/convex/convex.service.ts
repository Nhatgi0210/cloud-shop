import { Injectable } from '@nestjs/common';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { loadEnv } from '../config/load-env.js';

@Injectable()
export class ConvexService {
  query<Result>(
    name: string,
    args: Record<string, unknown> = {},
    token?: string,
  ): Promise<Result> {
    return this.client(token).query(
      makeFunctionReference<'query'>(name),
      args,
    ) as Promise<Result>;
  }
  mutation<Result>(
    name: string,
    args: Record<string, unknown> = {},
    token?: string,
  ): Promise<Result> {
    return this.client(token).mutation(
      makeFunctionReference<'mutation'>(name),
      args,
    ) as Promise<Result>;
  }
  private client(token?: string) {
    loadEnv();
    if (!process.env.CONVEX_URL)
      throw new Error('CONVEX_URL is not configured.');
    // Each request gets its own client so concurrent users never share auth.
    const client = new ConvexHttpClient(process.env.CONVEX_URL);
    if (token) client.setAuth(token);
    return client;
  }
}
