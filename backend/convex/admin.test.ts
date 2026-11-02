// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';
const modules = import.meta.glob('./**/*.ts');
async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => ({
    admin: await ctx.db.insert('users', { tokenIdentifier: 'test|admin', name: 'Admin', email: 'admin@example.com', role: 'admin', passwordHash: 'private-hash', sessionVersion: 0 }),
    customer: await ctx.db.insert('users', { tokenIdentifier: 'test|customer', name: 'Customer', email: 'customer@example.com', role: 'customer', passwordHash: 'private-hash', sessionVersion: 0 }),
  }));
  return { t, ids, admin: t.withIdentity({ tokenIdentifier: 'test|admin', sessionVersion: 0 }), customer: t.withIdentity({ tokenIdentifier: 'test|customer', sessionVersion: 0 }) };
}
describe('admin management permissions', () => {
  it('blocks anonymous/customer access to accounts and role changes', async () => {
    const { t, ids, customer } = await setup();
    await expect(t.query(api.users.list, {})).rejects.toThrow();
    await expect(customer.query(api.users.list, {})).rejects.toThrow();
    await expect(customer.mutation(api.users.updateRole, { id: ids.customer, role: 'admin' })).rejects.toThrow();
    await expect(customer.query(api.products.adminList, {})).rejects.toThrow();
  });
  it('returns only public account fields to admins', async () => {
    const { admin } = await setup();
    const users = await admin.query(api.users.list, {});
    expect(users).toHaveLength(2);
    for (const user of users) {
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('tokenIdentifier');
      expect(user).not.toHaveProperty('sessionVersion');
    }
  });
  it('prevents self-demotion and revokes old sessions after another account role changes', async () => {
    const { admin, customer, ids, t } = await setup();
    await expect(admin.mutation(api.users.updateRole, { id: ids.admin, role: 'customer' })).rejects.toThrow();
    await admin.mutation(api.users.updateRole, { id: ids.customer, role: 'admin' });
    expect(await customer.query(api.users.current, {})).toBeNull();
    const user = await t.run(ctx => ctx.db.get(ids.customer));
    expect(user?.role).toBe('admin');
    expect(user?.sessionVersion).toBe(1);
  });
  it('lists hidden products for admins and can restore them without deleting history', async () => {
    const { t, admin, customer } = await setup();
    await t.mutation(internal.seed.run, {});
    const product = (await admin.query(api.products.adminList, {}))[0];
    await admin.mutation(api.products.hide, { id: product._id });
    expect((await t.query(api.products.list, {})).some(p => p._id === product._id)).toBe(false);
    expect((await admin.query(api.products.adminList, {})).find(p => p._id === product._id)?.isActive).toBe(false);
    await expect(customer.mutation(api.products.restore, { id: product._id })).rejects.toThrow();
    await admin.mutation(api.products.restore, { id: product._id });
    expect((await t.query(api.products.list, {})).some(p => p._id === product._id)).toBe(true);
  });
});
