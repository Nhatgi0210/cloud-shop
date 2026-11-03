// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import schema from './schema';
import { api } from './_generated/api';
const modules = import.meta.glob('./**/*.ts');
describe('Nest credential boundary and session revocation', () => {
  it('prevents credential queries and registration without the backend secret', async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.query(api.users.findForLogin, {
        secret: 'wrong',
        email: 'x@example.com',
      }),
    ).rejects.toThrow();
    expect(await t.query(api.users.current, {})).toBeNull();
  });
  it('returns public account fields and rejects a logged-out token', async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) =>
      ctx.db.insert('users', {
        tokenIdentifier: 'test|alice',
        email: 'alice@example.com',
        name: 'Alice',
        role: 'customer',
        passwordHash: 'private-password-hash',
        sessionVersion: 0,
      }),
    );
    const alice = t.withIdentity({
      tokenIdentifier: 'test|alice',
      sessionVersion: 0,
    });
    const user = await alice.query(api.users.current, {});
    expect(user?.email).toBe('alice@example.com');
    expect(user).not.toHaveProperty('passwordHash');
    await alice.mutation(api.users.logout, {});
    expect(await alice.query(api.users.current, {})).toBeNull();
    await expect(alice.query(api.cart.list, {})).rejects.toThrow();
  });
});
