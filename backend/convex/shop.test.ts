// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';

const modules = import.meta.glob('./**/*.ts');
async function setup() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  const alice = t.withIdentity({
    tokenIdentifier: 'test|alice',
    name: 'Alice',
    email: 'alice@example.com',
  });
  const bob = t.withIdentity({
    tokenIdentifier: 'test|bob',
    name: 'Bob',
    email: 'bob@example.com',
  });
  await t.run(async (ctx) => {
    await ctx.db.insert('users', {
      tokenIdentifier: 'test|alice',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'customer',
    });
    await ctx.db.insert('users', {
      tokenIdentifier: 'test|bob',
      name: 'Bob',
      email: 'bob@example.com',
      role: 'customer',
    });
  });
  const product = (await t.query(api.products.list, {}))[0];
  const variant = product.variants[0];
  return { t, alice, bob, product, variant };
}
const shipping = {
  shippingName: 'Nguyen Van A',
  shippingPhone: '0901234567',
  shippingAddress: '123 Nguyen Trai, Quan 1, TP HCM',
};

describe('shoe shop transactions and authorization', () => {
  it('requires authentication and administrator role', async () => {
    const { t, alice, product } = await setup();
    await expect(t.query(api.cart.list, {})).rejects.toThrow();
    await expect(
      alice.mutation(api.products.hide, { id: product._id }),
    ).rejects.toThrow();
    await expect(t.query(api.users.current, {})).resolves.toBeNull();
  });
  it('rejects sold-out sizes and quantities beyond available stock', async () => {
    const { alice, variant } = await setup();
    await expect(
      alice.mutation(api.cart.add, {
        variantId: variant._id,
        size: 39,
        quantity: 1,
      }),
    ).rejects.toThrow();
    await expect(
      alice.mutation(api.cart.add, {
        variantId: variant._id,
        size: 40,
        quantity: 6,
      }),
    ).rejects.toThrow();
  });
  it('prices orders server-side, snapshots items, empties cart and restores stock only once', async () => {
    const { t, alice, bob, variant } = await setup();
    await alice.mutation(api.cart.add, {
      variantId: variant._id,
      size: 40,
      quantity: 2,
    });
    const orderId = await alice.mutation(api.orders.place, shipping);
    const order = (await alice.query(api.orders.list, {}))[0];
    expect(order.totalAmount).toBe(variant.price * 2);
    expect(order.items[0].unitPrice).toBe(variant.price);
    expect(await alice.query(api.cart.list, {})).toHaveLength(0);
    expect(await bob.query(api.orders.list, {})).toHaveLength(0);
    await expect(
      bob.mutation(api.orders.cancel, { id: orderId }),
    ).rejects.toThrow();
    let updated = await t.run((ctx) => ctx.db.get(variant._id));
    expect(updated?.sizes.find((s) => s.size === 40)?.stock).toBe(3);
    await alice.mutation(api.orders.cancel, { id: orderId });
    updated = await t.run((ctx) => ctx.db.get(variant._id));
    expect(updated?.sizes.find((s) => s.size === 40)?.stock).toBe(5);
    expect(updated?.sold).toBe(variant.sold);
    await expect(
      alice.mutation(api.orders.cancel, { id: orderId }),
    ).rejects.toThrow();
  });
  it('rejects a second purchase when the last pair is gone, without partial writes', async () => {
    const { t, alice, bob, variant } = await setup();
    await t.run((ctx) =>
      ctx.db.patch(variant._id, { sizes: [{ size: 40, stock: 1 }] }),
    );
    await alice.mutation(api.cart.add, {
      variantId: variant._id,
      size: 40,
      quantity: 1,
    });
    await bob.mutation(api.cart.add, {
      variantId: variant._id,
      size: 40,
      quantity: 1,
    });
    await alice.mutation(api.orders.place, shipping);
    await expect(bob.mutation(api.orders.place, shipping)).rejects.toThrow();
    expect(await bob.query(api.orders.list, {})).toHaveLength(0);
    expect(await bob.query(api.cart.list, {})).toHaveLength(1);
    const updated = await t.run((ctx) => ctx.db.get(variant._id));
    expect(updated?.sizes[0].stock).toBe(0);
  });
  it('rolls back earlier inventory writes when a later cart item is unavailable', async () => {
    const { t, alice, variant } = await setup();
    await alice.mutation(api.cart.add, {
      variantId: variant._id,
      size: 40,
      quantity: 1,
    });
    await alice.mutation(api.cart.add, {
      variantId: variant._id,
      size: 41,
      quantity: 1,
    });
    await t.run((ctx) =>
      ctx.db.patch(variant._id, {
        sizes: variant.sizes.map((s) =>
          s.size === 41 ? { ...s, stock: 0 } : s,
        ),
      }),
    );
    await expect(alice.mutation(api.orders.place, shipping)).rejects.toThrow();
    expect(await alice.query(api.cart.list, {})).toHaveLength(2);
    expect(await alice.query(api.orders.list, {})).toHaveLength(0);
    const unchanged = await t.run((ctx) => ctx.db.get(variant._id));
    expect(unchanged?.sizes.find((s) => s.size === 40)?.stock).toBe(5);
  });
  it('requires sequential fulfillment and marks a delivered COD order paid', async () => {
    const { t, alice, variant } = await setup();
    await t.mutation(internal.users.setAdmin, {
      email: 'alice@example.com',
    });
    await alice.mutation(api.cart.add, {
      variantId: variant._id,
      size: 40,
      quantity: 1,
    });
    const id = await alice.mutation(api.orders.place, shipping);
    await expect(
      alice.mutation(api.orders.updateStatus, { id, status: 'delivered' }),
    ).rejects.toThrow();
    for (const status of ['confirmed', 'shipping', 'delivered'] as const)
      await alice.mutation(api.orders.updateStatus, { id, status });
    const order = (await alice.query(api.orders.list, {}))[0];
    expect(order.paymentStatus).toBe('paid');
    await expect(alice.mutation(api.orders.cancel, { id })).rejects.toThrow();
  });
});
