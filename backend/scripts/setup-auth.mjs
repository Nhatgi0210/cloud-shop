import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const envPath = new URL('../.env.local', import.meta.url);
let source = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const values = Object.fromEntries(
  source
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf('=');
      return [
        line.slice(0, index),
        line
          .slice(index + 1)
          .trim()
          .replace(/^["']|["']$/g, ''),
      ];
    }),
);
const add = (name, value) => {
  if (values[name]) return;
  source = source.replace(new RegExp(`^${name}=.*(?:\\r?\\n|$)`, 'm'), '');
  source += `\n${name}=${value}\n`;
  values[name] = value;
};
if (!values.JWT_PRIVATE_KEY_BASE64) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  add(
    'JWT_PRIVATE_KEY_BASE64',
    Buffer.from(privateKey.export({ format: 'pem', type: 'pkcs8' })).toString(
      'base64',
    ),
  );
  add(
    'NEST_JWKS_BASE64',
    Buffer.from(
      JSON.stringify({
        keys: [
          {
            ...publicKey.export({ format: 'jwk' }),
            kid: 'cloudkicks-1',
            alg: 'RS256',
            use: 'sig',
          },
        ],
      }),
    ).toString('base64'),
  );
}
if (!values.NEST_JWKS_BASE64)
  throw new Error(
    'JWT private key exists without its public JWKS; restore the matching keys before continuing.',
  );
add('NEST_AUTH_SECRET', randomBytes(32).toString('hex'));
add('FRONTEND_ORIGIN', 'http://localhost:3000');
add('PORT', '3001');
writeFileSync(envPath, source, 'utf8');
console.log(
  'Nest authentication keys configured in backend/.env.local (values hidden).',
);
if (process.argv.includes('--sync')) {
  for (const name of ['NEST_AUTH_SECRET', 'NEST_JWKS_BASE64']) {
    const result = spawnSync(
      process.execPath,
      ['node_modules/convex/bin/main.js', 'env', 'set', name],
      { cwd: root, input: values[name] + '\n', encoding: 'utf8' },
    );
    if (result.status !== 0) {
      console.error(
        `Could not configure ${name} on Convex. Check your Convex CLI login and development deployment.`,
      );
      process.exit(1);
    }
    console.log(`Convex development environment configured: ${name}`);
  }
}
