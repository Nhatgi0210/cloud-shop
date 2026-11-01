import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';
import { orderItemFields } from './schema';
import {
  definedFields,
  optionalText,
  requirePrice,
  requireQuantity,
  requireText,
} from './shared.helpers';

export const getById = query({
  args: { id: v.id('orders') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.optional(v.string()),
    items: v.array(v.object(orderItemFields)),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const items = args.items.map((item) =>
      definedFields({
        productId: requireText(item.productId, 'Product id'),
        name: requireText(item.name, 'Item name'),
        price: requirePrice(item.price),
        quantity: requireQuantity(item.quantity),
        size: optionalText(item.size),
        color: optionalText(item.color),
      }),
    );

    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return await ctx.db.insert(
      'orders',
      definedFields({
        userId: optionalText(args.userId),
        items,
        totalPrice,
        status: optionalText(args.status) ?? 'pending',
        createdAt: Date.now(),
      }),
    );
  },
});
