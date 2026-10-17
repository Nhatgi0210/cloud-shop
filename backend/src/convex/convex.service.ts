import { Injectable } from '@nestjs/common';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { loadEnv } from '../config/load-env.js';

export const convexApi = anyApi;

type ConvexCall = (
  reference: unknown,
  args: Record<string, unknown>,
) => Promise<unknown>;

@Injectable()
export class ConvexService {
  private client: ConvexHttpClient | null = null;

  query<Result>(
    reference: unknown,
    args: Record<string, unknown> = {},
  ): Promise<Result> {
    return this.call('query', reference, args);
  }

  mutation<Result>(
    reference: unknown,
    args: Record<string, unknown> = {},
  ): Promise<Result> {
    return this.call('mutation', reference, args);
  }

  private call<Result>(
    kind: 'query' | 'mutation',
    reference: unknown,
    args: Record<string, unknown>,
  ): Promise<Result> {
    const client = this.getClient();
    const run = client[kind].bind(client) as ConvexCall;
    return run(reference, args) as Promise<Result>;
  }

  private getClient(): ConvexHttpClient {
    if (this.client) {
      return this.client;
    }
    loadEnv();
    const url = process.env.CONVEX_URL;
    if (!url) {
      throw new Error(
        'CONVEX_URL is not set. From backend/, run `npm run convex:dev` and leave that terminal open.',
      );
    }
    this.client = new ConvexHttpClient(url);
    return this.client;
  }
}
