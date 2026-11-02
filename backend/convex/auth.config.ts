import type { AuthConfig } from 'convex/server';
import { env } from './_generated/server';

export default {
  providers: [
    {
      type: 'customJwt',
      issuer: 'https://cloudkicks.local',
      applicationID: 'cloud-shop',
      algorithm: 'RS256',
      jwks: `data:text/plain;charset=utf-8;base64,${env.NEST_JWKS_BASE64}`,
    },
  ],
} satisfies AuthConfig;
