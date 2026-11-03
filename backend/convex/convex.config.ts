import { defineApp } from 'convex/server';
import { v } from 'convex/values';

export default defineApp({
  env: {
    NEST_AUTH_SECRET: v.string(),
    NEST_JWKS_BASE64: v.string(),
  },
});
